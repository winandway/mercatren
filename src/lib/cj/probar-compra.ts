"use server";

import { eq } from "drizzle-orm";

import {
  slugDeLaUrl,
  pasoFlete,
  pasoVariantes,
  type Diagnostico,
  type PasoDiagnostico,
} from "@/lib/cj/diagnostico";
import {
  LLAVE_ULTIMA_PRUEBA,
  type DireccionDePrueba,
  type UltimaCompraDePrueba,
} from "@/lib/cj/diagnostico-puro";
import { destinoDeEnvio } from "@/lib/cj/destino-fiscal";
import { almacenDeEntrega, plazaDelMercado } from "@/lib/cj/plazas";
import {
  candidatosDeCodigoCj,
  elegirLogisticaConStock,
  esFalloDeInventario,
  esPedidoYaCreado,
  idsParaPagar,
  leerEstadoDeCj,
  type OpcionLogisticaCj,
} from "@/lib/cj/reconciliar";
import { llamarCjConRitmo } from "@/lib/cj/ritmo";
import { getDb } from "@/lib/db";
import { configuracion, productos, tiendas } from "@/lib/db/schema";
import { mercadoPorCodigo } from "@/lib/mercado/mercados";
import { esSoporteDeVerdad, obtenerUsuario } from "@/lib/autorizacion";

/**
 * PROBAR EL TRAMO DE CJ PEGANDO UN ENLACE (5 sep 2026).
 *
 * Lo pidió el dueño después de la tercera compra fallida: «no puedo estar
 * probando en Stripe cada rato». Y es lo correcto — el cobro con tarjeta ya
 * está probado; lo que falla una y otra vez es el proveedor.
 *
 * Se pega el enlace del producto, se pulsa el botón, y devuelve **lo que CJ
 * contestó en cada paso, entero**. Sin cobrar, sin crear una venta y sin
 * tocar el catálogo.
 */
export async function probarCompraDeCj(entrada: {
  enlace: string;
  /** Adónde se entregaría, para cotizar el envío como en una venta real. */
  estado?: string;
  codigoPostal?: string;
}): Promise<Diagnostico & { ok: boolean; mensaje: string }> {
  /* Solo soporte DE VERDAD: esto le habla al proveedor y gasta puntos de CJ.
     Con el disfraz de «ver su panel» no se prueban compras. */
  if (!(await esSoporteDeVerdad())) {
    return {
      ok: false,
      mensaje: "No tienes permiso para esto.",
      pasos: [],
      seDetuvoEn: "permiso",
    };
  }

  const pasos: PasoDiagnostico[] = [];
  const parar = (donde: string, mensaje: string) => ({
    ok: false,
    mensaje,
    pasos,
    seDetuvoEn: donde,
  });

  const slug = slugDeLaUrl(entrada.enlace);
  if (!slug) {
    return parar(
      "enlace",
      "Pega el enlace de un producto (…/producto/loquesea) o su slug.",
    );
  }

  /* 1 · El producto, con lo que guardamos nosotros. */
  const [ficha] = await getDb()
    .select({
      id: productos.id,
      titulo: productos.tituloEs,
      pid: productos.externoId,
      estado: productos.estado,
      precioCentavos: productos.precioCentavos,
      costoCentavos: productos.precioBaseCentavos,
      existencias: productos.existencias,
      pais: tiendas.paisOrigen,
      tienda: tiendas.nombre,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(eq(productos.slug, slug))
    .limit(1);

  if (!ficha) {
    return parar(
      "producto",
      `No existe ningún producto con el slug «${slug}».`,
    );
  }
  if (!ficha.pid) {
    pasos.push({
      numero: 1,
      titulo: "El producto en nuestro catálogo",
      estado: "fallo",
      resumen: `«${ficha.titulo}» no tiene identificador de CJ guardado, así que no se le puede comprar a nadie.`,
    });
    return parar("producto", "El producto no tiene identificador de CJ.");
  }

  const plaza = plazaDelMercado(mercadoPorCodigo(ficha.pais ?? "US"));
  const almacen = almacenDeEntrega(plaza.paisEntrega);

  pasos.push({
    numero: 1,
    titulo: "El producto en nuestro catálogo",
    estado: ficha.estado === "publicado" ? "ok" : "aviso",
    resumen: `«${ficha.titulo}» · ${ficha.estado} · lo vendemos a ${(ficha.precioCentavos / 100).toFixed(2)} y nos cuesta ${
      ficha.costoCentavos ? (ficha.costoCentavos / 100).toFixed(2) : "—"
    } · stock guardado ${ficha.existencias} · tienda ${ficha.tienda} (${ficha.pais}) · almacén de salida ${almacen}`,
    crudo: ficha,
  });

  /* 2 · Las variantes con existencia EN ESE ALMACÉN. */
  const variantes = await pasoVariantes(ficha.pid, almacen);
  pasos.push(variantes);
  if (variantes.estado === "fallo") {
    return parar("variantes", variantes.resumen);
  }

  const lista = (
    Array.isArray(variantes.crudo) ? variantes.crudo : []
  ) as Array<{
    vid?: string;
    variantSku?: string;
  }>;
  const primera = lista.find((v) => v.vid);
  if (!primera?.vid) {
    return parar("variantes", "CJ devolvió variantes sin identificador.");
  }

  /* 3 · El envío de verdad, con TODAS las opciones y sus campos. */
  const flete = await pasoFlete(primera.vid, 1, {
    desde: almacen,
    hasta: plaza.paisEntrega,
    zip: entrada.codigoPostal || plaza.cotizacion.zip,
    provincia: entrada.estado || plaza.cotizacion.provincia,
  });
  pasos.push(flete);
  if (flete.estado === "fallo") return parar("flete", flete.resumen);

  return {
    ok: true,
    mensaje:
      "Diagnóstico terminado. Mira los almacenes de cada paso: si el transporte más barato sale de un almacén distinto al que tiene existencia, ahí muere el pago.",
    pasos,
    seDetuvoEn: null,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPRAR DE VERDAD A CJ, PAGANDO DEL SALDO — SIN PASAR POR STRIPE (5 sep 2026)
   ═══════════════════════════════════════════════════════════════════════════

   Es el botón que pidió el dueño con esas palabras: «agarro el link, lo pongo
   ahí, le doy un botón, y ahí vemos qué está pasando». Crea un pedido REAL en
   CJ con la dirección que se escriba, lo confirma y lo paga del saldo. CJ lo
   va a despachar. Es dinero de verdad — el suyo, de su saldo de $150.

   ══ LO QUE HACE Y LO QUE NO ══

   Hace, en este orden y enseñando lo que CJ contesta en cada uno:
     4. crear el pedido (`createOrderV2`, payType 1 — el enlace de tarjeta de
        respaldo llega igual),
     5. confirmarlo — y si CJ dice «almacén sin inventario», CAMBIAR el
        transporte a uno con stock y volver a intentar UNA vez (es el arreglo
        del 2 sep, que las tres compras fallidas nunca llegaron a usar),
     6. pagarlo con el saldo (`payBalanceV2` con el `shipmentOrderId`).

   NO crea una venta de Mercatren ni una fila en `pedidos_proveedor`: aquello
   tiene llave foránea a un pedido de un cliente, y esto no es una venta. Lo
   que queda de rastro va en `configuracion` (`cj_ultima_compra_de_prueba`),
   y se enseña en la misma pantalla.

   ══ EL NÚMERO EMPIEZA POR «PRUEBA-» ══

   Nunca por «MT-». Así en el panel de CJ se distingue a simple vista, y no
   puede chocar ni confundirse con la serie de los pedidos de clientes.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Con qué se guarda cada paso de la compra, para que la pantalla lo enseñe. */
function paso(
  numero: number,
  titulo: string,
  estado: PasoDiagnostico["estado"],
  resumen: string,
  crudo?: unknown,
): PasoDiagnostico {
  return { numero, titulo, estado, resumen, crudo };
}

async function guardarUltimaPrueba(valor: UltimaCompraDePrueba) {
  const texto = JSON.stringify(valor);
  await getDb()
    .insert(configuracion)
    .values({ clave: LLAVE_ULTIMA_PRUEBA, valor: texto })
    .onConflictDoUpdate({ target: configuracion.clave, set: { valor: texto } })
    .catch(() => undefined);
}

/** La última compra de prueba, para enseñarla al abrir la pantalla. */
export async function leerUltimaCompraDePrueba(): Promise<UltimaCompraDePrueba | null> {
  if (!(await esSoporteDeVerdad())) return null;
  const [fila] = await getDb()
    .select({ valor: configuracion.valor })
    .from(configuracion)
    .where(eq(configuracion.clave, LLAVE_ULTIMA_PRUEBA))
    .limit(1)
    .catch(() => []);
  if (!fila?.valor) return null;
  try {
    return JSON.parse(fila.valor) as UltimaCompraDePrueba;
  } catch {
    return null;
  }
}

export async function comprarDeVerdadACj(entrada: {
  enlace: string;
  direccion: DireccionDePrueba;
}): Promise<Diagnostico & { ok: boolean; mensaje: string }> {
  if (!(await esSoporteDeVerdad())) {
    return {
      ok: false,
      mensaje: "No tienes permiso para esto.",
      pasos: [],
      seDetuvoEn: "permiso",
    };
  }
  const usuario = await obtenerUsuario();
  const quien = usuario?.name || usuario?.email || "soporte";

  /* Primero el diagnóstico de siempre: producto, variantes con stock, flete.
     Si eso no pasa, no se crea nada — comprar a ciegas es lo que ya se hizo
     tres veces. */
  const previo = await probarCompraDeCj({
    enlace: entrada.enlace,
    estado: entrada.direccion.estado,
    codigoPostal: entrada.direccion.codigoPostal,
  });
  const pasos = [...previo.pasos];
  if (!previo.ok) {
    return { ...previo, pasos, mensaje: `No se compró: ${previo.mensaje}` };
  }

  const ficha = pasos[0]?.crudo as
    { titulo: string; pais: string | null } | undefined;
  const variantes = (pasos[1]?.crudo ?? []) as Array<{ vid?: string }>;
  const vid = variantes.find((v) => v.vid)?.vid;
  const fletes = (pasos[2]?.crudo ?? []) as Array<{
    logisticName?: string;
    logisticPrice?: number | string;
  }>;
  const masBarato = [...fletes]
    .filter((o) => o.logisticName?.trim())
    .sort((a, b) => Number(a.logisticPrice) - Number(b.logisticPrice))[0];

  if (!ficha || !vid || !masBarato?.logisticName) {
    return {
      ok: false,
      mensaje: "El diagnóstico no dejó con qué comprar.",
      pasos,
      seDetuvoEn: "datos",
    };
  }

  const destino = destinoDeEnvio(ficha.pais || "US");
  if (!destino) {
    return {
      ok: false,
      mensaje: `Todavía no despachamos a «${ficha.pais}».`,
      pasos,
      seDetuvoEn: "destino",
    };
  }
  const almacen = almacenDeEntrega(destino.codigo);
  const d = entrada.direccion;
  const faltan = [
    !d.nombre.trim() && "el nombre de quien recibe",
    !d.direccion.trim() && "la dirección",
    !d.ciudad.trim() && "la ciudad",
    !d.estado.trim() && "el estado",
    destino.codigo === "US" && !d.codigoPostal.trim() && "el código postal",
  ].filter(Boolean);
  if (faltan.length) {
    return {
      ok: false,
      mensaje: `Falta ${faltan.join(", ")}.`,
      pasos,
      seDetuvoEn: "direccion",
    };
  }

  const ahora = new Date();
  const numero = `PRUEBA-${ahora.toISOString().replace(/[-:T]/g, "").slice(0, 14)}`;
  const anotar = async (
    estado: UltimaCompraDePrueba["estado"],
    detalle: string,
    ids: string[],
  ) =>
    guardarUltimaPrueba({
      numero,
      producto: ficha.titulo,
      estado,
      detalle,
      ids,
      enMs: Date.now(),
      quien,
    });

  /* 4 · Crear el pedido en CJ. */
  const creacion = await llamarCjConRitmo<{
    orderId?: string;
    shipmentOrderId?: string;
    cjPayUrl?: string;
    orderAmount?: number | string;
    postageAmount?: number | string;
    orderStatus?: string;
  }>("/shopping/order/createOrderV2", {
    metodo: "POST",
    cuerpo: {
      orderNumber: numero,
      shippingCountryCode: destino.codigo,
      shippingCountry: destino.nombre,
      taxId: destino.taxId,
      shippingProvince: d.estado.trim(),
      shippingZip: d.codigoPostal.trim(),
      shippingCity: d.ciudad.trim(),
      shippingAddress: d.direccion.trim(),
      shippingAddress2: d.direccion2?.trim() || "",
      shippingCustomerName: d.nombre.trim(),
      shippingPhone: d.telefono?.trim() || "",
      logisticName: masBarato.logisticName.trim(),
      fromCountryCode: almacen,
      /* 1 = con enlace de tarjeta de respaldo. Con 2 haría falta que el saldo
         alcance en ese instante; con 3 se crea sin pagar y sin enlace. */
      payType: 1,
      products: [{ vid, quantity: 1 }],
    },
  });
  if (!creacion.ok && !esPedidoYaCreado(creacion.motivo)) {
    pasos.push(
      paso(4, `Crear el pedido ${numero} en CJ`, "fallo", creacion.motivo),
    );
    await anotar("fallo", `No se pudo crear: ${creacion.motivo}`, []);
    return {
      ok: false,
      mensaje: `CJ no creó el pedido: ${creacion.motivo}`,
      pasos,
      seDetuvoEn: "crear",
    };
  }
  pasos.push(
    paso(
      4,
      `Crear el pedido ${numero} en CJ`,
      "ok",
      creacion.ok
        ? `Creado. Costo ${creacion.datos?.orderAmount ?? "?"} (envío ${creacion.datos?.postageAmount ?? "?"}), estado ${creacion.datos?.orderStatus ?? "?"}.`
        : "CJ dice que ya existía: se adopta.",
      creacion.ok ? creacion.datos : creacion.motivo,
    ),
  );

  /* 5 · Confirmar, reparando el transporte si el almacén no tiene stock. */
  const leer = async () => {
    const r = await llamarCjConRitmo<{
      orderId?: string;
      shipmentOrderId?: string;
      cjOrderId?: string;
      orderNum?: string;
      orderStatus?: string;
      storageName?: string;
    }>(`/shopping/order/getOrderDetail?orderId=${encodeURIComponent(numero)}`);
    return r.ok ? r.datos : null;
  };
  let detalle = await leer();
  let confirmacion = await llamarCjConRitmo<unknown>(
    "/shopping/order/confirmOrder",
    {
      metodo: "PATCH",
      cuerpo: { orderId: detalle?.orderId ?? numero },
    },
  );
  let transporteNuevo: string | null = null;
  if (!confirmacion.ok && esFalloDeInventario(confirmacion.motivo) && detalle) {
    /* ══ AQUÍ ES DONDE MURIERON LAS TRES COMPRAS ══ El transporte más barato
       salía de un almacén sin el producto. Se le pregunta a CJ cuáles SÍ
       tienen stock (`hasStock`) y se cambia. */
    let opciones: OpcionLogisticaCj[] = [];
    let codigo: string | null = null;
    for (const c of candidatosDeCodigoCj(detalle, numero)) {
      const r = await llamarCjConRitmo<
        OpcionLogisticaCj[] | { list?: OpcionLogisticaCj[] }
      >(
        `/shopping/order/getOrderLogisticsInfo?orderCode=${encodeURIComponent(c)}`,
      );
      if (r.ok) {
        opciones = Array.isArray(r.datos) ? r.datos : (r.datos?.list ?? []);
        codigo = c;
        break;
      }
    }
    pasos.push(
      paso(
        5,
        "Transportes con stock, según CJ",
        opciones.length ? "ok" : "fallo",
        opciones.length
          ? opciones
              .map(
                (o) =>
                  `${o.logisticsName ?? "?"}${o.hasStock === true || o.hasStock === "true" || o.hasStock === 1 ? " ✓ con stock" : " (sin stock)"}`,
              )
              .join(" · ")
          : "CJ no devolvió la lista de transportes del pedido.",
        opciones,
      ),
    );
    const conStock = elegirLogisticaConStock(opciones);
    if (conStock && codigo) {
      for (const from of [2, 1, 0]) {
        const cambio = await llamarCjConRitmo<unknown>(
          "/shopping/order/updateLogistics",
          {
            metodo: "POST",
            cuerpo: {
              id: conStock.id,
              orderCode: codigo,
              logisticsName: conStock.logisticsName,
              from,
            },
          },
        );
        if (cambio.ok) {
          transporteNuevo = conStock.logisticsName ?? null;
          break;
        }
      }
      if (transporteNuevo) {
        confirmacion = await llamarCjConRitmo<unknown>(
          "/shopping/order/confirmOrder",
          {
            metodo: "PATCH",
            cuerpo: { orderId: detalle.orderId ?? numero },
          },
        );
      }
    }
  }
  if (!confirmacion.ok) {
    pasos.push(paso(6, "Confirmar el pedido", "fallo", confirmacion.motivo));
    await anotar(
      "creado_sin_pagar",
      `Creado pero no confirmado: ${confirmacion.motivo}`,
      idsParaPagar(detalle ?? {}),
    );
    return {
      ok: false,
      mensaje: `CJ no dejó confirmar: ${confirmacion.motivo}`,
      pasos,
      seDetuvoEn: "confirmar",
    };
  }
  pasos.push(
    paso(
      6,
      "Confirmar el pedido",
      "ok",
      transporteNuevo
        ? `Confirmado tras cambiar el transporte a ${transporteNuevo}.`
        : "Confirmado con el transporte elegido.",
      confirmacion.datos,
    ),
  );

  /* 6 · Pagar con el saldo. El `shipmentOrderId` nace al confirmar: se relee. */
  detalle = (await leer()) ?? detalle;
  const lectura = leerEstadoDeCj(detalle?.orderStatus);
  const ids = idsParaPagar(detalle ?? {});
  if (lectura.pagado) {
    pasos.push(
      paso(
        7,
        "Pagar del saldo",
        "ok",
        `CJ ya lo tiene como pagado (${detalle?.orderStatus}).`,
        detalle,
      ),
    );
    await anotar("pagado", `Pagado (${detalle?.orderStatus}).`, ids);
    return {
      ok: true,
      mensaje: `Comprado y pagado: ${numero}. Mira tu saldo en CJ.`,
      pasos,
      seDetuvoEn: null,
    };
  }
  const motivos: string[] = [];
  let pago: Awaited<ReturnType<typeof llamarCjConRitmo<unknown>>> = {
    ok: false,
    motivo: "sin identificador",
  };
  for (const shipmentOrderId of ids) {
    pago = await llamarCjConRitmo<unknown>("/shopping/pay/payBalanceV2", {
      metodo: "POST",
      cuerpo: { shipmentOrderId },
    });
    if (pago.ok) break;
    motivos.push(`${shipmentOrderId}: ${pago.motivo}`);
  }
  if (!pago.ok) {
    const motivo = motivos.join(" · ") || pago.motivo;
    pasos.push(paso(7, "Pagar del saldo", "fallo", motivo, detalle));
    await anotar(
      "creado_sin_pagar",
      `Confirmado pero sin pagar: ${motivo}`,
      ids,
    );
    return {
      ok: false,
      mensaje: `El pago del saldo no salió: ${motivo}`,
      pasos,
      seDetuvoEn: "pagar",
    };
  }
  pasos.push(
    paso(7, "Pagar del saldo", "ok", "Pagado del saldo de CJ.", pago.datos),
  );
  await anotar("pagado", "Pagado del saldo.", ids);
  return {
    ok: true,
    mensaje: `Comprado y pagado: ${numero}. Mira tu saldo en CJ: tiene que haber bajado.`,
    pasos,
    seDetuvoEn: null,
  };
}
