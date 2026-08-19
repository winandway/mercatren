import "server-only";

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { llamarCj, cjConfigurado } from "@/lib/cj/cliente";
import { FUENTE_CJ } from "@/lib/cj/constantes";
import {
  elegirVariante,
  nombreDeVariante,
  ordenarVariantes,
  variantesDeCj,
  type VarianteCj,
  type VarianteElegida,
} from "@/lib/cj/variantes";
import { getDb } from "@/lib/db";
import {
  itemsPedido,
  pedidos,
  pedidosProveedor,
  productos,
  renglonesProveedor,
} from "@/lib/db/schema";

/**
 * COMPRARLE AL PROVEEDOR LO QUE UN CLIENTE NOS COMPRÓ.
 *
 * ══ POR QUÉ NO SE PAGA SOLO, Y POR QUÉ IGUAL VALE LA PENA ══
 *
 * Comprobado en la documentación de CJ el 16 ago 2026: **su API no puede
 * cobrar una tarjeta guardada.** Sus formas de pago son `payBalance`,
 * `payBalanceV2` y `payType=2`, y las tres descuentan del saldo de la
 * billetera — que solo se recarga por Payoneer o transferencia, con tres días
 * de espera. No existe tokenización de tarjeta.
 *
 * Pero con `payType=1` CJ devuelve un **enlace de pago** (`cjPayUrl`). Y ahí
 * está la salida: todo lo pesado se automatiza —crear el pedido con la
 * dirección del comprador, sus renglones, sus cantidades— y lo único humano es
 * abrir ese enlace y pagar con tarjeta. Diez segundos, sin buscar el producto,
 * sin copiar direcciones, sin equivocarse de variante y **sin cargar
 * billetera**.
 *
 * La diferencia con «comprar a mano» no es de matiz: a mano hay que encontrar
 * el producto entre miles, transcribir una dirección —que es donde se pierden
 * los paquetes— y elegir la variante correcta. Aquí eso ya está hecho.
 *
 * ══ SE PIDE POR VARIANTE, Y ESTO COSTÓ LA PRIMERA COMPRA ══
 *
 * Aquí decía que bastaba con el SKU que guarda el importador. **Era falso**, y
 * por eso MT-000004 —pagada de verdad— murió en CJ con «No variants found for
 * provided SKUs»: CJ tiene `productSku` (`CJJT05843`) y `variantSku`
 * (`CJJT05843-Black`), guardábamos el primero y `createOrderV3` pide el
 * segundo. Su documentación lo dice con esas palabras: «CJ variant SKU».
 *
 * Y como el enlace de pago lo devuelve CJ **al crear** el pedido, sin pedido no
 * había dónde pagar. No faltaba una pantalla: faltaba el pedido.
 *
 * Ahora se le pregunta a CJ por las variantes del producto justo antes de
 * comprar y se manda el `vid`. Ver `src/lib/cj/variantes.ts`.
 *
 * ══ ESTO NUNCA TUMBA UNA VENTA ══
 *
 * Si CJ no contesta, el pedido de nuestro cliente sigue pagado y entregado a
 * su suerte: se anota el error, se ve en el panel y se reintenta. Un fallo del
 * proveedor no puede deshacer un cobro que ya ocurrió.
 */

/** Lo que CJ devuelve al crear un pedido. */
type RespuestaPedidoCj = {
  orderId?: string;
  orderNumber?: string;
  cjPayUrl?: string;
  orderAmount?: number | string;
  /** Lo que CJ cobra de ENVÍO. Es el número que hoy entra como cero al fijar
      el precio de venta, así que se guarda en cuanto CJ lo dice. */
  postageAmount?: number | string;
  productAmount?: number | string;
  orderStatus?: string;
};

export type ResultadoCompra =
  | { ok: true; id: string; urlPago: string | null; externoId: string | null }
  | { ok: false; motivo: string };

/** Dólares a centavos enteros, sin perder el centavo en coma flotante. */
function aCentavos(valor: number | string | undefined): number | null {
  if (valor === undefined || valor === null) return null;
  const n = Number(valor);
  if (!Number.isFinite(n)) return null;
  return Math.round(Number((n * 100).toPrecision(12)));
}

/**
 * El transporte de respaldo.
 *
 * `USPS+` sale de la propia documentación de CJ como opción doméstica de EE.
 * UU., pero **no está disponible para todo producto ni toda ruta**, y un nombre
 * que no exista hace que CJ rechace el pedido entero. Por eso se le pregunta
 * primero cuáles hay de verdad (ver `transporteReal`) y esto queda solo para
 * cuando esa consulta no conteste: **es mucho mejor intentarlo con un nombre
 * plausible que no crear el pedido.**
 */
const TRANSPORTE_RESPALDO = "USPS+";

/** Desde dónde despacha. El almacén de EE. UU. es el que hace el plazo corto. */
const DESDE = "US";

/**
 * Le pregunta a CJ qué variantes tiene un producto y elige cuál se compra.
 *
 * ══ SE PREGUNTA POR `pid` Y SE CAE AL `productSku` ══
 *
 * Su endpoint acepta los dos. Se prefiere el `pid` porque es el identificador
 * de verdad; el `productSku` queda de respaldo para cualquier producto viejo
 * que se haya importado sin él. Sin ese respaldo, un hueco en un dato del
 * catálogo se convertiría en una venta que no se puede despachar.
 */
async function leerVariantes(
  pid: string | null,
  productSku: string | null,
): Promise<VarianteCj[]> {
  const parametros = pid?.trim()
    ? `pid=${encodeURIComponent(pid.trim())}`
    : productSku?.trim()
      ? `productSku=${encodeURIComponent(productSku.trim())}`
      : null;

  if (!parametros) return [];

  const respuesta = await llamarCj<unknown>(
    `/product/variant/query?${parametros}`,
  );

  if (!respuesta.ok) {
    console.error("[cj] no se pudieron leer las variantes:", respuesta.motivo);
    return [];
  }

  return variantesDeCj(respuesta.datos);
}

async function resolverVariante(
  pid: string | null,
  productSku: string | null,
  /** El `vid` que una persona ya eligió en el panel. Manda sobre el automático. */
  vidElegido?: string,
): Promise<VarianteElegida | null> {
  const variantes = await leerVariantes(pid, productSku);
  return elegirVariante(variantes, vidElegido);
}

/**
 * LAS VARIANTES DE UNA VENTA, PARA ELEGIR ANTES DE COMPRAR.
 *
 * Se llama desde el panel **antes** de crear el pedido. Sin esto, la talla se
 * elegía sola y solo se veía después, con el pedido ya creado en CJ y sin forma
 * de cambiarla.
 */
export type VariantesDeUnaVenta = {
  productoId: string;
  titulo: string | null;
  cantidad: number;
  opciones: Array<{
    vid: string;
    nombre: string;
    precioCentavos: number | null;
  }>;
};

export async function variantesParaElegir(
  pedidoId: string,
): Promise<VariantesDeUnaVenta[]> {
  if (!cjConfigurado()) return [];

  const db = getDb();

  const renglones = await db
    .select({
      productoId: productos.id,
      externoId: productos.externoId,
      sku: productos.sku,
      titulo: productos.tituloEs,
      cantidad: itemsPedido.cantidad,
    })
    .from(itemsPedido)
    .innerJoin(productos, eq(productos.id, itemsPedido.productoId))
    .where(eq(itemsPedido.pedidoId, pedidoId))
    .catch(() => []);

  const salida: VariantesDeUnaVenta[] = [];

  for (const r of renglones) {
    if (!r.externoId && !r.sku) continue;

    const variantes = await leerVariantes(r.externoId, r.sku);

    /* Se ordenan igual que las elige el sistema —por precio y luego por SKU—
       para que la primera de la lista sea exactamente la que saldría sola. Si
       el orden fuera otro, el panel enseñaría una cosa y el pedido pediría
       otra. */
    const opciones = ordenarVariantes(variantes)
      .filter((v) => v.vid?.trim())
      .map((v) => ({
        vid: v.vid!.trim(),
        nombre: nombreDeVariante(v) ?? v.vid!.trim(),
        precioCentavos: (() => {
          const n = Number(v.variantSellPrice);
          return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
        })(),
      }));

    salida.push({
      productoId: r.productoId,
      titulo: r.titulo,
      cantidad: Math.max(1, Math.round(Number(r.cantidad))),
      opciones,
    });
  }

  return salida;
}

/**
 * QUÉ TRANSPORTE HAY DE VERDAD PARA ESTE PEDIDO, Y CUÁNTO CUESTA.
 *
 * ══ POR QUÉ SE PREGUNTA EN VEZ DE FIJARLO ══
 *
 * `logisticName` es obligatorio en `createOrderV3` y CJ lo compara contra su
 * tabla: un nombre que no exista para esa ruta tumba el pedido entero. Tenerlo
 * escrito a mano significaba que el día que un producto no admitiera USPS,
 * la venta se caía y había que adivinar por qué.
 *
 * ══ Y DE PASO SE VE LO QUE CUESTA EL ENVÍO ══
 *
 * Hoy el envío entra como **cero** al calcular el precio de venta, así que
 * cada venta con flete de $4 o más pierde dinero sin que ninguna pantalla lo
 * diga. Esto no lo arregla —eso es recalcular los precios publicados, y es
 * decisión del dueño— pero al menos deja el número a la vista.
 *
 * ══ SI NO CONTESTA, SE SIGUE ══
 *
 * Con el respaldo. Quedarse sin crear el pedido porque una consulta de apoyo
 * falló sería cambiar un problema chico por uno grande: el comprador ya pagó.
 */
async function transporteReal(
  variantes: readonly { vid: string; cantidad: number }[],
  entrega: {
    pais?: string;
    estado?: string | null;
    codigoPostal?: string | null;
  },
): Promise<{ nombre: string; costoCentavos: number | null }> {
  const respuesta = await llamarCj<unknown>("/logistic/freightCalculate", {
    metodo: "POST",
    cuerpo: {
      startCountryCode: DESDE,
      endCountryCode: "US",
      products: variantes.map((v) => ({ quantity: v.cantidad, vid: v.vid })),
      zip: entrega.codigoPostal ?? undefined,
      province: entrega.estado ?? undefined,
    },
  }).catch(() => ({ ok: false as const, motivo: "no contestó" }));

  if (!respuesta.ok) {
    console.error("[cj] no se pudo calcular el flete:", respuesta.motivo);
    return { nombre: TRANSPORTE_RESPALDO, costoCentavos: null };
  }

  const opciones = (
    Array.isArray(respuesta.datos) ? respuesta.datos : []
  ) as Array<{ logisticName?: string; logisticPrice?: number | string }>;

  const utiles = opciones.filter((o) => o.logisticName?.trim());
  if (utiles.length === 0) {
    return { nombre: TRANSPORTE_RESPALDO, costoCentavos: null };
  }

  /* La más barata. El plazo lo promete la ficha en días y todas las de esta
     ruta son domésticas: pagar de más por un día no compensa cuando el envío
     ya está dentro del precio publicado. */
  const elegida = [...utiles].sort((a, b) => {
    const pa = Number(a.logisticPrice);
    const pb = Number(b.logisticPrice);
    if (!Number.isFinite(pa)) return 1;
    if (!Number.isFinite(pb)) return -1;
    return pa - pb;
  })[0]!;

  const precio = Number(elegida.logisticPrice);

  return {
    nombre: elegida.logisticName!.trim(),
    costoCentavos: Number.isFinite(precio) ? Math.round(precio * 100) : null,
  };
}

/**
 * Crea en CJ la compra que corresponde a un pedido nuestro.
 *
 * Es idempotente por `pedidoId`: si ya hay una compra viva para ese pedido no
 * se crea otra. Sin eso, dos clics seguidos —o un reintento— comprarían el
 * producto dos veces, y eso es dinero de verdad saliendo dos veces.
 */
export async function comprarAlProveedor(
  pedidoId: string,
  /**
   * QUÉ VARIANTE SE COMPRA DE CADA PRODUCTO, SI ALGUIEN YA LA ELIGIÓ.
   *
   * ══ POR QUÉ EXISTE (18 ago 2026) ══
   *
   * El dueño estaba siguiendo el tutorial, pulsó «crear el pedido», y **la
   * talla elegida le apareció DESPUÉS**, con el pedido ya creado en CJ y sin
   * forma de cambiarla. Sus palabras: «no sé qué voy a cambiar, si ya le di a
   * enviar».
   *
   * Tenía razón y el orden estaba mal. Enseñar una decisión después de
   * tomarla no es enseñarla: es avisar de algo que ya no se puede tocar.
   *
   * Ahora el panel pregunta primero. Esto llega como `{ productoId: vid }` y
   * manda sobre la elección automática. Si viene vacío se sigue eligiendo la
   * más barata, que es la que se le cobró al comprador.
   */
  elegidas?: Record<string, string>,
): Promise<ResultadoCompra> {
  if (!cjConfigurado()) {
    return { ok: false, motivo: "Falta CJ_API_KEY en el panel del sitio." };
  }

  const db = getDb();

  const [yaHay] = await db
    .select({ id: pedidosProveedor.id, estado: pedidosProveedor.estado })
    .from(pedidosProveedor)
    .where(eq(pedidosProveedor.pedidoId, pedidoId))
    .limit(1);

  if (yaHay && yaHay.estado !== "con_error") {
    return {
      ok: false,
      motivo: "Este pedido ya se le compró al proveedor.",
    };
  }

  const [pedido] = await db
    .select({
      id: pedidos.id,
      numero: pedidos.numero,
      /* La entrega va como JSON en una sola columna desde el primer pedido.
         Se lee con cuidado: un pedido viejo puede no traer todos los campos. */
      entrega: pedidos.direccionEntrega,
      telefono: pedidos.telefonoContacto,
      pais: pedidos.paisDestino,
    })
    .from(pedidos)
    .where(eq(pedidos.id, pedidoId))
    .limit(1);

  if (!pedido) return { ok: false, motivo: "Ese pedido no existe." };

  const entrega = (pedido.entrega ?? {}) as Partial<{
    nombre: string;
    pais: string;
    ciudad: string;
    direccion: string;
    direccion2?: string | null;
    estado?: string | null;
    codigoPostal?: string | null;
    referencia: string | null;
  }>;

  /**
   * SIN DIRECCIÓN NO SE COMPRA, Y SE DICE CUÁL FALTA.
   *
   * El checkout de hoy está hecho para el retiro en depósito de Venezuela y
   * deja la calle opcional. Mandarle a CJ un pedido sin calle es pagar por un
   * paquete que no llega a ninguna parte — y eso no se recupera.
   */
  /* El estado y el código postal entran en la lista de lo que falta: sin
     estado CJ rechaza el pedido, y sin código postal el transportista entrega
     a ciegas. Antes ni se miraban porque no existían en el formulario. */
  const faltan = [
    !entrega.nombre && "el nombre de quien recibe",
    !entrega.direccion && "la dirección",
    !entrega.estado && "el estado",
    !entrega.codigoPostal && "el código postal",
    !entrega.ciudad && "la ciudad",
  ].filter(Boolean);

  if (faltan.length > 0) {
    return {
      ok: false,
      motivo: `A este pedido le falta ${faltan.join(", ")}. No se puede despachar así.`,
    };
  }

  /* Solo los renglones que surte CJ: un pedido podría mezclar, y lo de
     Venezuela lo despacha su propio comercio. */
  const renglones = await db
    .select({
      productoId: productos.id,
      /* El `pid` de CJ. Es con lo que se preguntan las variantes: el SKU que
         guardamos es el del producto y no sirve para comprar. */
      externoId: productos.externoId,
      sku: productos.sku,
      titulo: productos.tituloEs,
      cantidad: itemsPedido.cantidad,
    })
    .from(itemsPedido)
    .innerJoin(productos, eq(productos.id, itemsPedido.productoId))
    .where(eq(itemsPedido.pedidoId, pedidoId));

  const delProveedor = renglones.filter((r) => r.externoId ?? r.sku);
  if (delProveedor.length === 0) {
    return {
      ok: false,
      motivo: "Este pedido no tiene productos del proveedor.",
    };
  }

  /**
   * QUÉ VARIANTE SE COMPRA DE CADA UNO.
   *
   * Se resuelve aquí y no al importar: así los productos ya publicados quedan
   * arreglados sin recargarlos, y la existencia que se mira es la de hoy.
   */
  const aComprar: Array<{
    productoId: string;
    titulo: string | null;
    cantidad: number;
    variante: VarianteElegida;
  }> = [];

  for (const r of delProveedor) {
    const cantidad = Math.max(1, Math.round(Number(r.cantidad)));
    const variante = await resolverVariante(
      r.externoId,
      r.sku,
      elegidas?.[r.productoId],
    );

    if (!variante) {
      /* Se corta el pedido ENTERO, no se compra lo que sí se pudo. Media
         compra deja al cliente con una caja incompleta y a nosotros pagando
         dos envíos; y no hay forma de saberlo mirando el panel. */
      return {
        ok: false,
        motivo: `El proveedor no tiene variantes disponibles de «${r.titulo ?? r.sku ?? "un producto"}». Puede que lo haya descatalogado.`,
      };
    }

    aComprar.push({
      productoId: r.productoId,
      titulo: r.titulo,
      cantidad,
      variante,
    });
  }

  /**
   * UN REINTENTO REESCRIBE LA FILA QUE FALLÓ, NO APILA OTRA.
   *
   * Antes cada intento insertaba una fila nueva: tres reintentos dejaban tres
   * renglones del mismo pedido en el panel, y ninguno decía cuál era el bueno.
   * Con el id reutilizado, la cola enseña un solo estado por compra — que es lo
   * que hace falta para saber si hay que pagar o no.
   */
  const reintento = Boolean(yaHay);
  const id = yaHay?.id ?? `prov-${nanoid(12)}`;
  const ahora = new Date();

  const transporte = await transporteReal(
    aComprar.map((r) => ({ vid: r.variante.vid, cantidad: r.cantidad })),
    entrega,
  );

  /**
   * ══ V2 Y NO V3, Y ESO COSTÓ LA SEGUNDA PRUEBA (18 ago 2026) ══
   *
   * Con `createOrderV3` el pedido SE CREA bien —el arreglo de las variantes
   * funcionó— pero **CJ no devuelve el enlace de pago**: la fila quedaba en
   * «Por pagar» con el aviso «el proveedor no devolvió enlace de pago» y sin
   * ningún botón. Había que entrar al panel de CJ a buscarlo a mano, que es
   * exactamente lo que esto viene a evitar.
   *
   * Comprobado en su documentación: **solo `createOrderV2` documenta que
   * `payType=1` devuelve `cjPayUrl`.** V3 lo lista como campo de respuesta pero
   * sin decir cuándo llega, y en la práctica no llegó. V2 pide los mismos
   * campos obligatorios y trata `vid`/`sku` igual; lo único que suma V3 es la
   * elección de almacén, que aquí no se usa.
   *
   * Y V2 devuelve además **`postageAmount`**: lo que CJ cobra de envío. Ese es
   * el número que hoy entra como CERO al calcular el precio de venta.
   *
   * `payType: 1` es lo que pide la página de pago. Con 2 haría falta billetera
   * cargada; con 3 el pedido se crea sin pagar y sin enlace.
   */
  const respuesta = await llamarCj<RespuestaPedidoCj>(
    "/shopping/order/createOrderV2",
    {
      metodo: "POST",
      cuerpo: {
        /* NUESTRO número de pedido: es lo que permite atar su pedido con el
           nuestro cuando haya que reclamar algo semanas después. */
        orderNumber: pedido.numero,
        shippingCountryCode: "US",
        shippingCountry: pedido.pais || entrega.pais || "United States",
        /**
         * EL ESTADO, DE VERDAD (18 ago 2026).
         *
         * Hasta hoy iba `entrega.referencia` —una casilla prestada que va
         * vacía— porque el checkout no tenía dónde pedirlo. Y
         * `shippingProvince` es OBLIGATORIO en la API de CJ: el pedido se
         * habría rechazado aunque el comprador pagara.
         *
         * Ahora sale del formulario, elegido de una lista, en código de dos
         * letras — que es lo que CJ compara contra su tabla.
         */
        shippingProvince: entrega.estado || entrega.referencia || "",
        shippingZip: entrega.codigoPostal || "",
        shippingCity: entrega.ciudad!,
        shippingAddress: entrega.direccion!,
        shippingAddress2: entrega.direccion2 || "",
        shippingCustomerName: entrega.nombre!,
        shippingPhone: pedido.telefono || "",
        logisticName: transporte.nombre,
        fromCountryCode: DESDE,
        payType: 1,
        /**
         * VA EL `vid`, QUE ES LO ÚNICO SIN AMBIGÜEDAD.
         *
         * Su documentación: «vid and sku cannot both be null. When vid is
         * missing, sku will be used to query the CJ variant.» O sea que el SKU
         * es el camino largo, y encima tiene que ser el de la variante. Con el
         * `vid` no hay nada que buscar ni que confundir.
         */
        products: aComprar.map((r) => ({
          vid: r.variante.vid,
          quantity: r.cantidad,
        })),
      },
    },
  );

  if (!respuesta.ok) {
    /* El fallo se GUARDA, no solo se devuelve: un pedido que no se pudo
       comprar tiene que verse en el panel, o el comprador se queda esperando
       una caja que nadie pidió y nadie se entera. */
    if (reintento) {
      await db
        .update(pedidosProveedor)
        .set({
          estado: "con_error",
          ultimoError: respuesta.motivo.slice(0, 300),
          actualizadoEn: ahora,
        })
        .where(eq(pedidosProveedor.id, id))
        .catch(() => undefined);
    } else {
      await db
        .insert(pedidosProveedor)
        .values({
          id,
          pedidoId,
          proveedor: FUENTE_CJ,
          estado: "con_error",
          ultimoError: respuesta.motivo.slice(0, 300),
          creadoEn: ahora,
          actualizadoEn: ahora,
        })
        .onConflictDoNothing()
        .catch(() => undefined);
    }

    return { ok: false, motivo: respuesta.motivo };
  }

  const datos = respuesta.datos ?? {};
  const urlPago = datos.cjPayUrl?.trim() || null;

  const yaCreado = {
    estado: "por_pagar" as const,
    externoId: datos.orderId ?? null,
    externoNumero: datos.orderNumber ?? null,
    urlPago,
    costoCentavos: aCentavos(datos.orderAmount),
    /* Se limpia el error del intento anterior: dejarlo escrito al lado de un
       enlace de pago que sí funciona hace dudar de si se puede pagar. */
    ultimoError: null,
    actualizadoEn: ahora,
  };

  if (reintento) {
    await db
      .update(pedidosProveedor)
      .set(yaCreado)
      .where(eq(pedidosProveedor.id, id));

    /* Los renglones del intento fallido se van: si el producto cambió de
       variante entre un intento y otro, la lista vieja diría que se compró
       algo que no se compró. */
    await db
      .delete(renglonesProveedor)
      .where(eq(renglonesProveedor.pedidoProveedorId, id))
      .catch(() => undefined);
  } else {
    await db.insert(pedidosProveedor).values({
      id,
      pedidoId,
      proveedor: FUENTE_CJ,
      creadoEn: ahora,
      ...yaCreado,
    });
  }

  /**
   * QUEDA ESCRITO QUÉ VARIANTE SE PIDIÓ DE CADA COSA.
   *
   * Va en su propio `try`: la compra ya está creada y el enlace de pago ya
   * existe. Perder la anotación es molesto; perder el enlace por no poder
   * anotarla sería absurdo.
   */
  try {
    await db.insert(renglonesProveedor).values(
      aComprar.map((r) => ({
        id: `rprov-${nanoid(12)}`,
        pedidoProveedorId: id,
        productoId: r.productoId,
        titulo: r.titulo,
        vid: r.variante.vid,
        varianteSku: r.variante.sku,
        varianteNombre: r.variante.nombre,
        cantidad: r.cantidad,
        varianteAutomatica: r.variante.ambigua,
        variantesTotales: r.variante.deCuantas,
        creadoEn: ahora,
      })),
    );
  } catch (fallo) {
    console.error("[cj] compra creada; no se anotaron los renglones:", fallo);
  }

  /* El aviso va después de guardar y en su propio try: si el correo falla, la
     compra ya está creada y el enlace vive en el panel. */
  try {
    const { correoAvisoAlEquipo } = await import("@/lib/correo/correos");
    const { SITIO } = await import("@/lib/sitio");
    const costo = aCentavos(datos.orderAmount);

    /* Si el sistema tuvo que elegir talla o color, se dice EN EL CORREO y no
       solo en el panel: es lo que hay que mirar antes de pagar, y quien lee el
       aviso en el teléfono puede no abrir el panel. */
    const aOjo = aComprar.filter((r) => r.variante.ambigua);

    await correoAvisoAlEquipo({
      asunto: `Pagar al proveedor · ${pedido.numero}`,
      lineas: [
        `${pedido.numero} · ${aComprar.length} producto(s)${costo !== null ? ` · ${(costo / 100).toFixed(2)} USD` : ""}`,
        /* El flete, a la vista. Hoy entra como CERO al calcular el precio de
           venta, así que este número es el que dice si la venta gana o pierde
           dinero. Sin enseñarlo, esa pérdida no aparece en ninguna pantalla. */
        /**
         * EL ENVÍO, Y DE LA FUENTE MÁS FIABLE QUE HAYA.
         *
         * Se prefiere el `postageAmount` del pedido ya creado sobre el de la
         * cotización: el primero es lo que se va a pagar, el segundo una
         * estimación. Este número es el que decide si la venta gana o pierde
         * dinero, porque hoy el envío entra como CERO al fijar el precio.
         */
        (() => {
          const envio =
            aCentavos(datos.postageAmount) ?? transporte.costoCentavos;
          return `Transporte: ${transporte.nombre}${
            envio !== null
              ? ` · envío ${(envio / 100).toFixed(2)} USD (OJO: el envío NO está dentro del precio que se le cobró al comprador)`
              : ""
          }`;
        })(),
        ...aOjo.map(
          (r) =>
            `Ojo: de «${r.titulo ?? "un producto"}» había ${r.variante.deCuantas} variantes y se pidió «${r.variante.nombre ?? r.variante.vid}». Compruébalo antes de pagar.`,
        ),
        urlPago
          ? "Toca el botón, paga con tarjeta y CJ despacha. No hace falta saldo."
          : "CJ no devolvió enlace de pago. Hay que abrirlo en su panel.",
      ],
      url: urlPago ?? `${SITIO.url}/es/panel/proveedor`,
      boton: urlPago ? "Pagar este pedido" : "Ver en el panel",
    });
  } catch (fallo) {
    console.error("[cj] compra creada; el aviso no salio:", fallo);
  }

  return { ok: true, id, urlPago, externoId: datos.orderId ?? null };
}

/**
 * PREGUNTARLE A CJ CÓMO VA UN PEDIDO QUE YA EXISTE.
 *
 * ══ POR QUÉ ESTO Y NO «VOLVER A PEDIR EL ENLACE» (18 ago 2026) ══
 *
 * Cuando MT-000004 quedó creada sin enlace de pago, la salida obvia parecía ser
 * volver a pedirlo. **Es peligroso y no funciona:**
 *
 * 1. Comprobado en su documentación: **`cjPayUrl` solo llega al CREAR el
 *    pedido.** Ni `list`, ni `getOrderDetail`, ni el lote lo devuelven. Si no se
 *    capturó en ese momento, por API no se recupera — se paga en su panel.
 * 2. Y volver a crear no «vuelve a pedir el enlace»: **crea un SEGUNDO pedido**.
 *    Dos pedidos del mismo producto es pagar dos veces. Por eso el candado de
 *    idempotencia se queda como está.
 *
 * Lo que sí se puede es preguntar cómo va. Y eso trae justo lo que falta: el
 * costo real, **el envío** —el número que hoy entra como cero al fijar el precio
 * de venta— el estado, y la guía cuando despachen.
 *
 * Se pregunta por NUESTRO número de pedido: su endpoint acepta el propio del
 * comercio, así que no hace falta haber guardado el suyo.
 */
type DetalleCj = {
  orderId?: string;
  orderNum?: string;
  orderStatus?: string;
  orderAmount?: number | string;
  postageAmount?: number | string;
  logisticName?: string;
  trackNumber?: string;
};

export type ComoVaEnCj = {
  estado: string | null;
  costoCentavos: number | null;
  envioCentavos: number | null;
  guia: string | null;
  transportista: string | null;
};

export async function comoVaEnCj(
  numeroDePedido: string,
): Promise<{ ok: true; datos: ComoVaEnCj } | { ok: false; motivo: string }> {
  if (!cjConfigurado()) {
    return { ok: false, motivo: "Falta CJ_API_KEY en el panel del sitio." };
  }

  const respuesta = await llamarCj<DetalleCj>(
    `/shopping/order/getOrderDetail?orderId=${encodeURIComponent(numeroDePedido)}`,
  );

  if (!respuesta.ok) return { ok: false, motivo: respuesta.motivo };

  const d = respuesta.datos ?? {};

  return {
    ok: true,
    datos: {
      estado: d.orderStatus?.trim() || null,
      costoCentavos: aCentavos(d.orderAmount),
      envioCentavos: aCentavos(d.postageAmount),
      guia: d.trackNumber?.trim() || null,
      transportista: d.logisticName?.trim() || null,
    },
  };
}

/**
 * ¿Este pedido lo surte el proveedor de Estados Unidos?
 *
 * Se pregunta ANTES de intentar la compra para no llamar a CJ por cada venta
 * venezolana — que son la mayoría — y para que un fallo de red no aparezca en
 * el registro de pedidos que no tienen nada que ver con él.
 */
export async function esDeEstadosUnidos(pedidoId: string): Promise<boolean> {
  const { tiendas } = await import("@/lib/db/schema");
  const db = getDb();

  const [fila] = await db
    .select({ pais: tiendas.paisOrigen })
    .from(itemsPedido)
    .innerJoin(productos, eq(productos.id, itemsPedido.productoId))
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(eq(itemsPedido.pedidoId, pedidoId))
    .limit(1)
    .catch(() => []);

  /* En mayúsculas y sin espacios: el país se escribe a mano en el panel, y un
     « us » con espacio dejaría sin despachar una venta de verdad. */
  return (fila?.pais ?? "").trim().toUpperCase() === "US";
}
