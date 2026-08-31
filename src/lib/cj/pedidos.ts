import "server-only";

import { and, eq, sql } from "drizzle-orm";
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
import { destinoDeEnvio } from "@/lib/cj/destino-fiscal";
import type { Db } from "@/lib/db";
import { getDb } from "@/lib/db";
import {
  itemsPedido,
  pedidos,
  pedidosProveedor,
  productos,
  renglonesProveedor,
  itemsVariante,
  variantesProducto,
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

/**
 * DESDE DÓNDE DESPACHA CADA PEDIDO: EL ALMACÉN DE SU PLAZA (27 ago 2026).
 *
 * Era la constante `DESDE = "US"` para todo. Con Chile y Colombia surtidos
 * desde el almacén de CHINA (decisión del dueño), el origen se resuelve por
 * pedido con `almacenDeEntrega(destino)`: variantes, flete y `fromCountryCode`
 * usan EL MISMO valor — tenerlo en tres sitios es como uno se queda en «US» y
 * el pedido chileno intenta salir de un almacén donde el producto no está.
 */

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
  /* «Only variants with inventory in that country will be returned»: se mira
     el almacén del que va a salir la caja. */
  almacen: "US" | "CN" = "US",
): Promise<VarianteCj[]> {
  const parametros = pid?.trim()
    ? `pid=${encodeURIComponent(pid.trim())}`
    : productSku?.trim()
      ? `productSku=${encodeURIComponent(productSku.trim())}`
      : null;

  if (!parametros) return [];

  /**
   * ══ SOLO LAS QUE TIENEN EXISTENCIA EN EL ALMACÉN DE EE. UU. ══
   *
   * EL FALLO QUE ESTO ARREGLA (18 ago 2026): se elegía la variante por PRECIO
   * sin mirar si había stock. MT-000004 salió con «Black-S» —la más barata— y
   * al ir a pagarla CJ la rechazó:
   *
   *     (Elk Grove Village, IL, US) Insufficient inventory
   *
   * El pedido se creaba bien, se podía enviar a preparación, y **moría en la
   * pantalla del pago**. El dueño lo reintentó dos veces creyendo que era un
   * bucle de su navegador; no lo era: era la misma talla agotada una y otra vez.
   *
   * Su API lo resuelve con un parámetro, y lo dice con estas palabras: «Only
   * variants with inventory in that country will be returned». Sin él, el
   * catálogo de tallas que se ofrece incluye las que no se pueden comprar.
   */
  const respuesta = await llamarCj<unknown>(
    `/product/variant/query?${parametros}&countryCode=${almacen}`,
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
  almacen: "US" | "CN" = "US",
): Promise<VarianteElegida | null> {
  const variantes = await leerVariantes(pid, productSku, almacen);
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

  /* Las tallas que se ofrecen son las del almacén del que va a salir ESTA
     venta: enseñar el surtido de EE. UU. para un pedido chileno ofrecería
     tallas que en China no están. */
  const [cabecera] = await db
    .select({ pais: pedidos.paisDestino })
    .from(pedidos)
    .where(eq(pedidos.id, pedidoId))
    .limit(1);
  const { almacenDeEntrega } = await import("@/lib/cj/plazas");
  const almacenDeLaVenta = almacenDeEntrega(
    destinoDeEnvio(cabecera?.pais)?.codigo ?? "US",
  );

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

    const variantes = await leerVariantes(r.externoId, r.sku, almacenDeLaVenta);

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
  ruta: { desde: "US" | "CN"; hasta: string },
): Promise<{ nombre: string; costoCentavos: number | null }> {
  const respuesta = await llamarCj<unknown>("/logistic/freightCalculate", {
    metodo: "POST",
    cuerpo: {
      startCountryCode: ruta.desde,
      endCountryCode: ruta.hasta,
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
   * EL DESTINO SE RESUELVE ANTES QUE NADA.
   *
   * Si el país no está en la tabla, la compra no sale y queda en el panel con
   * su motivo — nunca cae en Estados Unidos por descarte, que sería mandar la
   * mercancía al otro lado del mundo y enterarse por el reclamo.
   */
  const destino = destinoDeEnvio(pedido.pais || entrega.pais);
  if (!destino) {
    return {
      ok: false,
      motivo: `Todavía no despachamos a «${pedido.pais || entrega.pais}». Ese pedido hay que resolverlo a mano.`,
    };
  }

  /* De qué almacén sale ESTE pedido: EE. UU. de su almacén local; Chile y
     Colombia, de China. El mismo valor manda en variantes, flete y
     `fromCountryCode`. */
  const { almacenDeEntrega } = await import("@/lib/cj/plazas");
  const almacen = almacenDeEntrega(destino.codigo);

  /**
   * SIN DIRECCIÓN NO SE COMPRA, Y SE DICE CUÁL FALTA.
   *
   * El checkout de hoy está hecho para el retiro en depósito de Venezuela y
   * deja la calle opcional. Mandarle a CJ un pedido sin calle es pagar por un
   * paquete que no llega a ninguna parte — y eso no se recupera.
   */
  /* El estado entra en la lista de lo que falta: sin él CJ rechaza el
     pedido. El código postal solo se exige en EE. UU. — su doc lo declara
     opcional (`shippingZip`) y en Chile/Colombia casi nadie se lo sabe;
     exigirlo aquí dejaría la compra pagada y sin poder comprarse al
     proveedor por un dato que CJ ni pide. */
  const faltan = [
    !entrega.nombre && "el nombre de quien recibe",
    !entrega.direccion && "la dirección",
    !entrega.estado && "el estado",
    destino.codigo === "US" && !entrega.codigoPostal && "el código postal",
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
      /* ══ LA TALLA QUE ELIGIÓ EL CLIENTE (30 ago 2026) ══
         Si la pidió, es la que se le compra a CJ — su SKU de variante es
         justo lo que CJ espera. Antes se elegía «la más barata» aunque el
         comprador hubiera marcado su talla: le llegaba otra cosa. */
      skuDeSuVariante: sql<string | null>`(
        SELECT ${variantesProducto.sku}
        FROM ${itemsVariante}
        JOIN ${variantesProducto}
          ON ${variantesProducto.id} = ${itemsVariante.varianteId}
        WHERE ${itemsVariante.itemPedidoId} = ${itemsPedido.id}
        LIMIT 1
      )`,
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
      /* Manda lo que el equipo eligió a mano; si no, LA TALLA DEL CLIENTE;
         y solo si no hay ninguna, el automático. */
      elegidas?.[r.productoId] ?? r.skuDeSuVariante ?? undefined,
      almacen,
    );

    if (!variante) {
      /* Se corta el pedido ENTERO, no se compra lo que sí se pudo. Media
         compra deja al cliente con una caja incompleta y a nosotros pagando
         dos envíos; y no hay forma de saberlo mirando el panel. */
      return {
        ok: false,
        /* El motivo nombra el ALMACÉN, no dice «no hay variantes» a secas: casi
           siempre el producto existe y lo que falta es existencia en Estados
           Unidos. Con el mensaje genérico uno va a buscar el producto y lo
           encuentra, y se queda sin entender nada. */
        motivo: `«${r.titulo ?? r.sku ?? "Un producto"}» no tiene ninguna talla ni color con existencia en el almacén de Estados Unidos. Sin eso el pedido se crea pero CJ no deja pagarlo.`,
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
    { desde: almacen, hasta: destino.codigo },
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
        /* EL PAÍS SALE DEL PEDIDO, NO DE UN LITERAL (26 ago 2026).
           Iba «US» escrito a mano, y con eso el primer pedido chileno se
           despacha al país equivocado con el comprador ya cobrado. Y `taxId`
           lleva el número del régimen simplificado del SII, que es lo que
           evita que a ese paquete le cobren el IVA otra vez en la aduana. */
        shippingCountryCode: destino.codigo,
        shippingCountry: destino.nombre,
        taxId: destino.taxId,
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
        fromCountryCode: almacen,
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

  /**
   * ══ EL PAGO AUTOMÁTICO CON EL SALDO (27 ago 2026) ══
   *
   * En su propio try, después de que la compra ya está creada y anotada: un
   * fallo aquí deja el pedido `por_pagar` con su enlace de tarjeta, que es
   * exactamente el flujo que ya funcionaba. Nunca puede dejarlo peor.
   */
  let pagoAutomatico: { pagado: boolean; motivo?: string } = { pagado: false };
  if (datos.orderId) {
    try {
      pagoAutomatico = await pagarConSaldo(db, id, datos.orderId);
    } catch (fallo) {
      console.error("[cj] el pago con saldo reventó; queda el enlace:", fallo);
    }
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
      /* El asunto dice la verdad de cómo quedó: un correo que pide pagar lo
         que ya se pagó enseña a ignorar los correos del sistema. */
      asunto: pagoAutomatico.pagado
        ? `Pedido al proveedor PAGADO con el saldo · ${pedido.numero}`
        : `Pagar al proveedor · ${pedido.numero}`,
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
        pagoAutomatico.pagado
          ? "Se pagó solo con el saldo de CJ. No hay que hacer nada: CJ despacha."
          : pagoAutomatico.motivo
            ? `El pago con saldo no salió (${pagoAutomatico.motivo.slice(0, 120)}). Toca el botón y paga con tarjeta.`
            : urlPago
              ? "Toca el botón, paga con tarjeta y CJ despacha. No hace falta saldo."
              : "CJ no devolvió enlace de pago. Hay que abrirlo en su panel.",
      ],
      url: pagoAutomatico.pagado
        ? `${SITIO.url}/es/panel/proveedor`
        : (urlPago ?? `${SITIO.url}/es/panel/proveedor`),
      boton: pagoAutomatico.pagado
        ? "Ver en el panel"
        : urlPago
          ? "Pagar este pedido"
          : "Ver en el panel",
    });
  } catch (fallo) {
    console.error("[cj] compra creada; el aviso no salio:", fallo);
  }

  return { ok: true, id, urlPago, externoId: datos.orderId ?? null };
}

/**
 * PAGAR EL PEDIDO CON EL SALDO DE CJ, SIN QUE NADIE TOQUE UN BOTÓN.
 *
 * ══ POR QUÉ AHORA SÍ (27 ago 2026) ══
 *
 * Hasta hoy el pago era un acto humano a la fuerza: la cuenta de CJ estaba en
 * cero y su API no puede cobrar una tarjeta guardada. Eso cambió — **el saldo
 * está cargado** (Payoneer → CJ, comprobado en su panel) y el dueño pidió el
 * circuito completo en automático: el cliente paga, el pedido se crea, y se
 * paga solo del saldo. El saldo es PREPAGO: lo máximo que puede salir mal es
 * lo que haya cargado, nunca una deuda sorpresa — la regla de la casa.
 *
 * ══ EL ENLACE DE TARJETA NO SE VA: ES EL RESPALDO ══
 *
 * El pedido se sigue creando con `payType: 1`, que devuelve `cjPayUrl`. Si el
 * saldo no alcanza —o CJ contesta cualquier cosa— el pedido queda `por_pagar`
 * con su enlace y su motivo exacto, que es el flujo que ya funcionaba. El
 * automático es una capa encima, no un reemplazo: fallar aquí NUNCA puede
 * dejar la compra peor de lo que estaba.
 *
 * ══ SIN AUTOR, A PROPÓSITO ══
 *
 * `pagadoPorId` queda en null: lo pagó el sistema. Ponerle el nombre de una
 * persona sería atribuirle algo que no hizo — la misma regla de los hitos.
 */
async function pagarConSaldo(
  db: Db,
  id: string,
  externoId: string,
): Promise<{ pagado: boolean; motivo?: string }> {
  const respuesta = await llamarCj<Record<string, unknown>>(
    "/shopping/pay/payBalanceV2",
    { metodo: "POST", cuerpo: { shipmentOrderId: externoId } },
  );

  if (!respuesta.ok) {
    /* El motivo se guarda ENTERO y diciendo que la tarjeta sigue sirviendo:
       un «ultimo_error» al lado de un enlace de pago válido hace dudar de si
       se puede pagar — por eso el texto lo aclara él mismo. */
    await db
      .update(pedidosProveedor)
      .set({
        ultimoError:
          `El pago con saldo no salió: ${respuesta.motivo}. ` +
          `El enlace de tarjeta sigue funcionando.`.slice(0, 300),
        actualizadoEn: new Date(),
      })
      .where(
        and(
          eq(pedidosProveedor.id, id),
          eq(pedidosProveedor.estado, "por_pagar"),
        ),
      )
      .catch(() => undefined);
    return { pagado: false, motivo: respuesta.motivo };
  }

  /* El estado se re-comprueba DENTRO del update: si una persona pagó con
     tarjeta en la ventana entre crear y cobrar el saldo, no se pisa. */
  await db
    .update(pedidosProveedor)
    .set({
      estado: "pagado",
      pagadoEn: new Date(),
      pagadoPorId: null,
      ultimoError: null,
      actualizadoEn: new Date(),
    })
    .where(
      and(
        eq(pedidosProveedor.id, id),
        eq(pedidosProveedor.estado, "por_pagar"),
      ),
    );

  return { pagado: true };
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
