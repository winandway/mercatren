import "server-only";

import { eq } from "drizzle-orm";

import {
  pasoFlete,
  pasoVariantes,
  slugDeLaUrl,
  type Diagnostico,
  type PasoDiagnostico,
} from "@/lib/cj/diagnostico";
import {
  LLAVE_ULTIMA_PRUEBA,
  rutaDeSondaPermitida,
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
  leerEstadoDeCj,
  type OpcionLogisticaCj,
} from "@/lib/cj/reconciliar";
import { llamarCjConRitmo } from "@/lib/cj/ritmo";
import { getDb } from "@/lib/db";
import { configuracion, productos, tiendas } from "@/lib/db/schema";
import { mercadoPorCodigo } from "@/lib/mercado/mercados";

/**
 * EL NÚCLEO DE «PROBAR UNA COMPRA A CJ» (5 sep 2026).
 *
 * Aquí vive lo que hacen los botones de Panel → Probar una compra, SIN mirar
 * la sesión. Lo llaman dos puertas: las acciones de `probar-compra.ts` (que
 * exigen soporte de verdad) y `/datos/probar-compra` (que exige la llave del
 * reloj y la dispara GitHub). Así la misma prueba la puede correr una persona
 * desde el panel o yo desde aquí, hasta que salga en verde.
 *
 * Va aparte porque un archivo `"use server"` solo puede exportar acciones, y
 * porque la puerta sin sesión no puede depender de la sesión de nadie.
 *
 * ══ EL CAMINO DE PAGO ES EL DOCUMENTADO POR CJ, EN CUATRO PASOS ══
 *
 * Tres compras de prueba con Stripe y una sin Stripe murieron en el pago, y
 * la causa estaba en su documentación (secciones 1.3, 1.4, 1.5 y 2.3) y en
 * un cliente de código abierto que sí paga:
 *
 *   1. `addCart { cjOrderIdList: [orderId] }`
 *   2. `addCartConfirm { cjOrderIdList: [orderId] }` → `data.shipmentsId`
 *      (el número del ENVÍO, «SD…»)
 *   3. `saveGenerateParentOrder { shipmentOrderId }` → `data.payId` y el
 *      importe real (`paymentInformation.actualPayment`)
 *   4. `payBalanceV2 { shipmentOrderId, payId }`
 *
 * Nosotros saltábamos al paso 4 mandando dentro de `shipmentOrderId` el
 * `orderId` numérico («Order not found») o el `cjOrderId` («pay fail»).
 * `getOrderDetail` NO devuelve el shipmentOrderId —su tabla de campos no lo
 * tiene—, así que releer el detalle nunca iba a traerlo. Y `confirmOrder`
 * (PATCH) es otro camino, que ni el cliente de referencia usa.
 *
 * La prueba de que se pagó no es que CJ diga «Success»: es que el saldo
 * (`getBalance`) baje. Se lee antes y después, y se enseña.
 */
export type ResultadoDePrueba = Diagnostico & { ok: boolean; mensaje: string };

/** Con qué se guarda cada paso, para que la pantalla lo enseñe. */
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
export async function leerUltimaCompraDePruebaNucleo(): Promise<UltimaCompraDePrueba | null> {
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

/* ═══════════════════════════════════════════════════════════════════════════
   1 · SOLO MIRAR: producto, variantes con stock, flete. No crea nada.
   ═══════════════════════════════════════════════════════════════════════════ */
export async function probarCompraDeCjNucleo(entrada: {
  enlace: string;
  /** Adónde se entregaría, para cotizar el envío como en una venta real. */
  estado?: string;
  codigoPostal?: string;
}): Promise<ResultadoDePrueba> {
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
   2 · LO QUE CJ DICE DE UN PEDIDO, EL SALDO, Y EL TRANSPORTE CON STOCK
   ═══════════════════════════════════════════════════════════════════════════ */
type DetalleCj = {
  orderId?: string;
  shipmentOrderId?: string;
  cjOrderId?: string;
  orderNum?: string;
  orderStatus?: string;
  storageName?: string;
  logisticName?: string;
  orderAmount?: number | string;
  postageAmount?: number | string;
  paymentDate?: string | null;
};

/** `getOrderDetail` acepta nuestro número (doc: «Custom order id, CJ order id»). */
async function leerDetalle(numero: string): Promise<DetalleCj | null> {
  const r = await llamarCjConRitmo<DetalleCj>(
    `/shopping/order/getOrderDetail?orderId=${encodeURIComponent(numero)}`,
  );
  return r.ok ? (r.datos ?? null) : null;
}

/** El saldo de la cuenta de CJ (`getBalance` → `data.amount`, en dólares). */
export async function saldoDeCj(): Promise<
  { ok: true; saldo: number; crudo: unknown } | { ok: false; motivo: string }
> {
  const r = await llamarCjConRitmo<{
    amount?: number | string;
    noWithdrawalAmount?: number | string | null;
    freezeAmount?: number | string | null;
  }>("/shopping/pay/getBalance");
  if (!r.ok) return r;
  const saldo = Number(r.datos?.amount);
  return {
    ok: true,
    saldo: Number.isFinite(saldo) ? saldo : Number.NaN,
    crudo: r.datos,
  };
}

const tieneStock = (o: OpcionLogisticaCj) =>
  o.hasStock === true || o.hasStock === "true" || o.hasStock === 1;

/**
 * CAMBIAR EL TRANSPORTE A UNO CON STOCK, COMO DICE CJ (arreglo del 2 sep).
 * Es donde murieron las tres compras: el transporte más barato salía de un
 * almacén sin el producto. Se le pregunta a CJ cuáles SÍ tienen (`hasStock`)
 * y se cambia. Devuelve el nombre del transporte nuevo, o null.
 */
async function repararTransporte(
  detalle: DetalleCj,
  numero: string,
  pasos: PasoDiagnostico[],
  n: number,
): Promise<string | null> {
  let opciones: OpcionLogisticaCj[] = [];
  let codigo: string | null = null;
  const intentos: string[] = [];
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
    intentos.push(`${c} → ${r.motivo}`);
  }
  const conStock = elegirLogisticaConStock(opciones);
  pasos.push(
    paso(
      n,
      "Transportes con stock, según CJ",
      conStock ? "ok" : "fallo",
      opciones.length
        ? opciones
            .map(
              (o) =>
                `${o.logisticsName ?? "?"}${tieneStock(o) ? " ✓ con stock" : " (sin stock)"}`,
            )
            .join(" · ")
        : `CJ no devolvió la lista de transportes del pedido (${intentos.join(" | ")}).`,
      opciones,
    ),
  );
  if (!conStock || !codigo) return null;

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
      pasos.push(
        paso(
          n,
          "Cambiar el transporte",
          "ok",
          `Cambiado a ${conStock.logisticsName} (from=${from}).`,
          cambio.datos,
        ),
      );
      return conStock.logisticsName ?? null;
    }
    if (from === 0) {
      pasos.push(paso(n, "Cambiar el transporte", "fallo", cambio.motivo));
    }
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · PAGAR UN PEDIDO QUE YA EXISTE EN CJ, POR SU CAMINO DOCUMENTADO
   ═══════════════════════════════════════════════════════════════════════════ */
type Intercepcion = {
  cjOrderId?: string;
  reason?: string;
  message?: string;
  [k: string]: unknown;
};
type ConfirmacionCarrito = {
  successCount?: number;
  submitSuccess?: boolean;
  shipmentsId?: string | null;
  result?: number;
  interceptOrders?: Array<Intercepcion | string> | null;
};
type PedidoPadre = {
  orderMoney?: number | string;
  payId?: string | null;
  submitSuccess?: boolean;
  unMatchOrderCodes?: string[] | null;
  successOrders?: string[] | null;
  interceptOrders?: Array<Intercepcion | string> | null;
  paymentInformation?: {
    actualPayment?: number | string;
    orderProductAmount?: number | string;
    freight?: number | string;
    payableAmount?: number | string;
    canDeduct?: boolean;
  } | null;
};

const razones = (lista: Array<Intercepcion | string> | null | undefined) =>
  (lista ?? [])
    .map((i) =>
      typeof i === "string"
        ? i
        : `${i.cjOrderId ?? "?"}: ${i.reason ?? i.message ?? JSON.stringify(i)}`,
    )
    .join(" · ");

const limpio = (v: unknown) => (v ?? "").toString().trim();

type Pago =
  | {
      ok: true;
      ids: string[];
      shipmentOrderId: string;
      saldoAntes: number | null;
      saldoDespues: number | null;
    }
  | {
      ok: false;
      donde: string;
      motivo: string;
      ids: string[];
      shipmentOrderId: string | null;
    };

async function pagarPedidoEnCj(entrada: {
  numero: string;
  detalle: DetalleCj | null;
  /** El `shipmentOrderId` que devolvió `createOrderV2`, si lo dio. */
  shipmentDeCreacion?: string | null;
  pasos: PasoDiagnostico[];
  /** Número del primer paso, para que la pantalla los numere seguidos. */
  desde: number;
}): Promise<Pago> {
  const { numero, pasos } = entrada;
  let detalle = entrada.detalle;
  let n = entrada.desde;
  let shipment: string | null = null;

  const idsDelPedido = Array.from(
    new Set(
      [detalle?.orderId, detalle?.cjOrderId, numero]
        .map(limpio)
        .filter(Boolean),
    ),
  );
  const idsVistos = () =>
    Array.from(
      new Set(
        [shipment, entrada.shipmentDeCreacion, ...idsDelPedido]
          .map(limpio)
          .filter(Boolean),
      ),
    );

  /* El saldo ANTES: la prueba de que se pagó es que baje. */
  const antes = await saldoDeCj();
  pasos.push(
    paso(
      n++,
      "Saldo en CJ antes de pagar",
      antes.ok ? "ok" : "aviso",
      antes.ok ? `$${antes.saldo.toFixed(2)}` : antes.motivo,
      antes.ok ? antes.crudo : undefined,
    ),
  );

  /* 1 · addCart. Si CJ lo rechaza (ya estaba en el carrito, o ya es UNPAID)
     se anota y se sigue: lo que de verdad hace falta es el paso 2. */
  const motivosCarrito: string[] = [];
  let idEnCarrito: string | null = null;
  let crudoCarrito: unknown;
  for (const id of idsDelPedido) {
    const r = await llamarCjConRitmo<{
      successCount?: number;
      addSuccessOrders?: string[];
      interceptOrders?: Array<Intercepcion | string> | null;
    }>("/shopping/order/addCart", {
      metodo: "POST",
      cuerpo: { cjOrderIdList: [id] },
    });
    if (r.ok) {
      idEnCarrito = id;
      crudoCarrito = r.datos;
      break;
    }
    motivosCarrito.push(`${id}: ${r.motivo}`);
  }
  pasos.push(
    paso(
      n++,
      "Meter el pedido al carrito de CJ (addCart)",
      idEnCarrito ? "ok" : "aviso",
      idEnCarrito
        ? `Aceptado con ${idEnCarrito}.`
        : `CJ no lo metió al carrito (${motivosCarrito.join(" · ")}). Puede que ya estuviera: se sigue.`,
      idEnCarrito ? crudoCarrito : motivosCarrito,
    ),
  );

  /* 2 · addCartConfirm → shipmentsId. Se prueba primero con el id que el
     carrito aceptó, y después con los demás. */
  const confirmar = async (): Promise<
    { ok: true; datos: ConfirmacionCarrito } | { ok: false; motivo: string }
  > => {
    const orden = idEnCarrito
      ? [idEnCarrito, ...idsDelPedido.filter((i) => i !== idEnCarrito)]
      : idsDelPedido;
    const motivos: string[] = [];
    for (const id of orden) {
      const r = await llamarCjConRitmo<ConfirmacionCarrito>(
        "/shopping/order/addCartConfirm",
        { metodo: "POST", cuerpo: { cjOrderIdList: [id] } },
      );
      if (r.ok) return { ok: true, datos: r.datos ?? {} };
      motivos.push(`${id}: ${r.motivo}`);
    }
    return { ok: false, motivo: motivos.join(" · ") || "sin identificador" };
  };
  const motivoDe = (
    c: Awaited<ReturnType<typeof confirmar>>,
  ): string | null => {
    if (!c.ok) return c.motivo;
    if (c.datos.submitSuccess === false) {
      return razones(c.datos.interceptOrders) || "submitSuccess=false";
    }
    return null;
  };

  let confirmacion = await confirmar();
  let motivoConfirmacion = motivoDe(confirmacion);
  if (
    motivoConfirmacion &&
    esFalloDeInventario(motivoConfirmacion) &&
    detalle
  ) {
    /* ══ AQUÍ ES DONDE MURIERON LAS TRES COMPRAS ══ */
    const transporte = await repararTransporte(detalle, numero, pasos, n++);
    if (transporte) {
      confirmacion = await confirmar();
      motivoConfirmacion = motivoDe(confirmacion);
    }
  }
  if (confirmacion.ok && !motivoConfirmacion) {
    shipment = limpio(confirmacion.datos.shipmentsId) || null;
  }
  pasos.push(
    paso(
      n++,
      "Confirmar el carrito (addCartConfirm)",
      confirmacion.ok && !motivoConfirmacion ? "ok" : "aviso",
      confirmacion.ok && !motivoConfirmacion
        ? `Confirmado. shipmentsId = ${shipment ?? "∅ (vacío)"}.`
        : `CJ no confirmó: ${motivoConfirmacion}.`,
      confirmacion.ok ? confirmacion.datos : motivoConfirmacion,
    ),
  );

  /* El número del envío: lo que CJ dio al confirmar, o lo que dio al crear.
     Si no hay, NO se llama a payBalanceV2 con otro id: eso es exactamente lo
     que devolvía «Order not found» y «pay fail». */
  shipment =
    shipment ||
    limpio(entrada.shipmentDeCreacion) ||
    limpio(detalle?.shipmentOrderId) ||
    null;
  if (!shipment) {
    const motivo = `CJ no entregó el shipmentOrderId (el número del envío que pide payBalanceV2): ni al confirmar el carrito${
      motivoConfirmacion ? ` (${motivoConfirmacion})` : ""
    }, ni al crear el pedido, ni en su detalle. Sin ese número no hay con qué pagar.`;
    pasos.push(
      paso(n++, "El número del envío (shipmentOrderId)", "fallo", motivo),
    );
    return {
      ok: false,
      donde: "shipment",
      motivo,
      ids: idsVistos(),
      shipmentOrderId: null,
    };
  }
  pasos.push(
    paso(
      n++,
      "El número del envío (shipmentOrderId)",
      "ok",
      `${shipment} ${
        confirmacion.ok && limpio(confirmacion.datos.shipmentsId)
          ? "(lo dio addCartConfirm)"
          : "(lo dio la creación del pedido)"
      }`,
    ),
  );

  /* 3 · saveGenerateParentOrder → payId e importe real. */
  const padre = await llamarCjConRitmo<PedidoPadre>(
    "/shopping/order/saveGenerateParentOrder",
    { metodo: "POST", cuerpo: { shipmentOrderId: shipment } },
  );
  let payId: string | null = null;
  if (padre.ok) {
    payId = limpio(padre.datos?.payId) || null;
    const info = padre.datos?.paymentInformation;
    const intercepcion = razones(padre.datos?.interceptOrders);
    const sinCuadrar = padre.datos?.unMatchOrderCodes ?? [];
    const paso3Ok = padre.datos?.submitSuccess !== false && !intercepcion;
    pasos.push(
      paso(
        n++,
        "Generar el pedido padre (saveGenerateParentOrder)",
        paso3Ok ? "ok" : "fallo",
        paso3Ok
          ? `payId ${payId ?? "∅"} · a pagar $${info?.actualPayment ?? info?.payableAmount ?? padre.datos?.orderMoney ?? "?"} (producto ${info?.orderProductAmount ?? "?"}, flete ${info?.freight ?? "?"})${
              sinCuadrar.length
                ? ` · sin cuadrar: ${sinCuadrar.join(", ")}`
                : ""
            }`
          : `CJ no lo dejó pasar: ${intercepcion || "submitSuccess=false"}${
              sinCuadrar.length
                ? ` · sin cuadrar: ${sinCuadrar.join(", ")}`
                : ""
            }`,
        padre.datos,
      ),
    );
    if (!paso3Ok) {
      return {
        ok: false,
        donde: "padre",
        motivo:
          intercepcion ||
          "CJ devolvió submitSuccess=false al generar el pedido padre.",
        ids: idsVistos(),
        shipmentOrderId: shipment,
      };
    }
  } else {
    pasos.push(
      paso(
        n++,
        "Generar el pedido padre (saveGenerateParentOrder)",
        "aviso",
        `${padre.motivo}. Se intenta pagar igual: su doc dice que el payId es opcional y CJ lo genera solo.`,
      ),
    );
  }

  /* 4 · payBalanceV2 con el shipmentOrderId (y el payId, si lo hubo). */
  const pago = await llamarCjConRitmo<unknown>("/shopping/pay/payBalanceV2", {
    metodo: "POST",
    cuerpo: payId
      ? { shipmentOrderId: shipment, payId }
      : { shipmentOrderId: shipment },
  });
  pasos.push(
    paso(
      n++,
      "Pagar del saldo (payBalanceV2)",
      pago.ok ? "ok" : "fallo",
      pago.ok
        ? `CJ aceptó el pago de ${shipment}${payId ? ` con payId ${payId}` : ""}.`
        : pago.motivo,
      pago.ok ? pago.datos : { shipmentOrderId: shipment, payId },
    ),
  );
  if (!pago.ok) {
    return {
      ok: false,
      donde: "pagar",
      motivo: pago.motivo,
      ids: idsVistos(),
      shipmentOrderId: shipment,
    };
  }

  /* 5 · El saldo DESPUÉS. Si no bajó, «Success» no significó nada. */
  const despues = await saldoDeCj();
  const bajo = antes.ok && despues.ok ? antes.saldo - despues.saldo : null;
  pasos.push(
    paso(
      n++,
      "Saldo en CJ después de pagar",
      despues.ok ? (bajo !== null && bajo > 0 ? "ok" : "aviso") : "aviso",
      despues.ok
        ? `$${despues.saldo.toFixed(2)}${
            bajo !== null
              ? bajo > 0
                ? ` (bajó $${bajo.toFixed(2)})`
                : " (NO bajó: mirar en el panel de CJ si de verdad se cobró)"
              : ""
          }`
        : despues.motivo,
      despues.ok ? despues.crudo : undefined,
    ),
  );

  /* 6 · Cómo quedó el pedido. */
  detalle = (await leerDetalle(numero)) ?? detalle;
  const lectura = leerEstadoDeCj(detalle?.orderStatus);
  pasos.push(
    paso(
      n++,
      "Cómo quedó el pedido en CJ",
      lectura.pagado ? "ok" : "aviso",
      `Estado ${detalle?.orderStatus ?? "?"}${
        detalle?.paymentDate ? ` · pagado el ${detalle.paymentDate}` : ""
      }${detalle?.logisticName ? ` · transporte ${detalle.logisticName}` : ""}.`,
      detalle,
    ),
  );

  return {
    ok: true,
    ids: idsVistos(),
    shipmentOrderId: shipment,
    saldoAntes: antes.ok ? antes.saldo : null,
    saldoDespues: despues.ok ? despues.saldo : null,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · COMPRAR DE VERDAD A CJ, PAGANDO DEL SALDO — SIN PASAR POR STRIPE
   ═══════════════════════════════════════════════════════════════════════════

   Es el botón que pidió el dueño: «agarro el link, lo pongo ahí, le doy un
   botón, y ahí vemos qué está pasando». Crea un pedido REAL en CJ con la
   dirección que se escriba y lo paga del saldo. CJ lo va a despachar. Es
   dinero de verdad — el suyo, de su saldo.

   NO crea una venta de Mercatren ni una fila en `pedidos_proveedor`: aquello
   tiene llave foránea a un pedido de un cliente, y esto no es una venta. El
   rastro va en `configuracion` (`cj_ultima_compra_de_prueba`).

   El número empieza por «PRUEBA-», nunca por «MT-»: en el panel de CJ se
   distingue a simple vista y no puede chocar con la serie de los clientes.
   ═══════════════════════════════════════════════════════════════════════════ */
export async function comprarDeVerdadACjNucleo(
  entrada: { enlace: string; direccion: DireccionDePrueba },
  quien: string,
): Promise<ResultadoDePrueba> {
  /* Primero el diagnóstico de siempre: producto, variantes con stock, flete.
     Si eso no pasa, no se crea nada — comprar a ciegas es lo que ya se hizo
     tres veces. */
  const previo = await probarCompraDeCjNucleo({
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
    shipmentOrderId: string | null,
  ) =>
    guardarUltimaPrueba({
      numero,
      producto: ficha.titulo,
      estado,
      detalle,
      ids,
      shipmentOrderId,
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
    await anotar("fallo", `No se pudo crear: ${creacion.motivo}`, [], null);
    return {
      ok: false,
      mensaje: `CJ no creó el pedido: ${creacion.motivo}`,
      pasos,
      seDetuvoEn: "crear",
    };
  }
  /* El shipmentOrderId que llega AL CREAR es el que pide el pago, y no se
     vuelve a ver en el detalle: se guarda desde ya. */
  const shipmentDeCreacion = creacion.ok
    ? limpio(creacion.datos?.shipmentOrderId) || null
    : null;
  pasos.push(
    paso(
      4,
      `Crear el pedido ${numero} en CJ`,
      "ok",
      creacion.ok
        ? `Creado. orderId ${creacion.datos?.orderId ?? "?"} · shipmentOrderId ${shipmentDeCreacion ?? "∅"} · costo ${creacion.datos?.orderAmount ?? "?"} (envío ${creacion.datos?.postageAmount ?? "?"}) · estado ${creacion.datos?.orderStatus ?? "?"}.`
        : "CJ dice que ya existía: se adopta.",
      creacion.ok ? creacion.datos : creacion.motivo,
    ),
  );

  /* 5 · Cómo lo ve CJ recién creado. */
  const detalle = await leerDetalle(numero);
  pasos.push(
    paso(
      5,
      "Cómo lo ve CJ recién creado",
      detalle ? "ok" : "aviso",
      detalle
        ? `Estado ${detalle.orderStatus ?? "?"} · orderId ${detalle.orderId ?? "∅"} · cjOrderId ${detalle.cjOrderId ?? "∅"} · transporte ${detalle.logisticName ?? "∅"} · envío ${detalle.postageAmount ?? "∅"} · almacén ${detalle.storageName ?? "∅"}.`
        : "CJ no devolvió el detalle del pedido recién creado.",
      detalle ?? undefined,
    ),
  );
  await anotar(
    "creado_sin_pagar",
    "Creado; pagando…",
    [
      shipmentDeCreacion,
      detalle?.orderId,
      detalle?.cjOrderId,
      creacion.ok ? creacion.datos?.orderId : null,
    ]
      .map(limpio)
      .filter(Boolean),
    shipmentDeCreacion,
  );

  /* 6… · Pagar por el camino documentado. */
  const pago = await pagarPedidoEnCj({
    numero,
    detalle,
    shipmentDeCreacion,
    pasos,
    desde: 6,
  });
  if (!pago.ok) {
    await anotar(
      "creado_sin_pagar",
      `Creado pero sin pagar (${pago.donde}): ${pago.motivo}`,
      pago.ids,
      pago.shipmentOrderId,
    );
    return {
      ok: false,
      mensaje: `El pago del saldo no salió: ${pago.motivo}`,
      pasos,
      seDetuvoEn: pago.donde,
    };
  }
  await anotar(
    "pagado",
    `Pagado del saldo${
      pago.saldoAntes !== null && pago.saldoDespues !== null
        ? ` ($${pago.saldoAntes.toFixed(2)} → $${pago.saldoDespues.toFixed(2)})`
        : ""
    }.`,
    pago.ids,
    pago.shipmentOrderId,
  );
  return {
    ok: true,
    mensaje: `Comprado y pagado: ${numero}${
      pago.saldoAntes !== null && pago.saldoDespues !== null
        ? ` — el saldo de CJ bajó de $${pago.saldoAntes.toFixed(2)} a $${pago.saldoDespues.toFixed(2)}`
        : ""
    }.`,
    pasos,
    seDetuvoEn: null,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · PAGAR LA ÚLTIMA PRUEBA QUE QUEDÓ CREADA SIN PAGAR
   ═══════════════════════════════════════════════════════════════════════════

   Cuando una compra de prueba se detiene entre crear y pagar, el pedido queda
   vivo en la cuenta de CJ esperando su dinero. Volver a pulsar «Comprar»
   crearía OTRO. Esto retoma el que está guardado, lo relee y lo paga por el
   mismo camino. Nunca crea uno.
   ═══════════════════════════════════════════════════════════════════════════ */
export async function pagarUltimaPruebaPendienteNucleo(): Promise<ResultadoDePrueba> {
  const ultima = await leerUltimaCompraDePruebaNucleo();
  const pasos: PasoDiagnostico[] = [];
  if (!ultima || ultima.estado !== "creado_sin_pagar") {
    return {
      ok: false,
      mensaje: "No hay ninguna prueba creada sin pagar.",
      pasos,
      seDetuvoEn: "nada",
    };
  }
  const numero = ultima.numero;
  const anotar = async (
    estado: UltimaCompraDePrueba["estado"],
    detalle: string,
    ids: string[],
    shipmentOrderId: string | null,
  ) =>
    guardarUltimaPrueba({
      ...ultima,
      estado,
      detalle,
      ids,
      shipmentOrderId,
      enMs: Date.now(),
    });

  const detalle = await leerDetalle(numero);
  if (!detalle) {
    pasos.push(
      paso(1, `Buscar ${numero} en CJ`, "fallo", "CJ no devolvió el pedido."),
    );
    return {
      ok: false,
      mensaje: `CJ no encuentra ${numero}.`,
      pasos,
      seDetuvoEn: "buscar",
    };
  }
  pasos.push(
    paso(
      1,
      `Buscar ${numero} en CJ`,
      "ok",
      `Está en ${detalle.orderStatus ?? "?"} · orderId ${detalle.orderId ?? "∅"} · cjOrderId ${detalle.cjOrderId ?? "∅"} · transporte ${detalle.logisticName ?? "∅"} · envío ${detalle.postageAmount ?? "∅"}.`,
      detalle,
    ),
  );

  const idsGuardados = ultima.ids ?? [];
  const lectura = leerEstadoDeCj(detalle.orderStatus);
  if (lectura.cancelado) {
    await anotar(
      "fallo",
      `CJ lo tiene cancelado (${detalle.orderStatus}).`,
      idsGuardados,
      ultima.shipmentOrderId ?? null,
    );
    return {
      ok: false,
      mensaje: `CJ tiene ${numero} cancelado.`,
      pasos,
      seDetuvoEn: "cancelado",
    };
  }
  if (lectura.pagado) {
    await anotar(
      "pagado",
      `Ya estaba pagado (${detalle.orderStatus}).`,
      idsGuardados,
      ultima.shipmentOrderId ?? null,
    );
    return {
      ok: true,
      mensaje: `${numero} ya está pagado en CJ.`,
      pasos,
      seDetuvoEn: null,
    };
  }

  const pago = await pagarPedidoEnCj({
    numero,
    detalle,
    shipmentDeCreacion:
      limpio(ultima.shipmentOrderId) ||
      idsGuardados.find((i) => /^SD/i.test(i)) ||
      null,
    pasos,
    desde: 2,
  });
  if (!pago.ok) {
    await anotar(
      "creado_sin_pagar",
      `Sigue sin pagar (${pago.donde}): ${pago.motivo}`,
      pago.ids,
      pago.shipmentOrderId,
    );
    return {
      ok: false,
      mensaje: `El pago del saldo no salió: ${pago.motivo}`,
      pasos,
      seDetuvoEn: pago.donde,
    };
  }
  await anotar(
    "pagado",
    `Pagado del saldo${
      pago.saldoAntes !== null && pago.saldoDespues !== null
        ? ` ($${pago.saldoAntes.toFixed(2)} → $${pago.saldoDespues.toFixed(2)})`
        : ""
    }.`,
    pago.ids,
    pago.shipmentOrderId,
  );
  return {
    ok: true,
    mensaje: `${numero} pagado del saldo de CJ${
      pago.saldoAntes !== null && pago.saldoDespues !== null
        ? ` — bajó de $${pago.saldoAntes.toFixed(2)} a $${pago.saldoDespues.toFixed(2)}`
        : ""
    }.`,
    pasos,
    seDetuvoEn: null,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · LA SONDA: una llamada suelta a CJ, para depurar sin volver a publicar
   ═══════════════════════════════════════════════════════════════════════════ */
export async function sondaCj(entrada: {
  ruta: string;
  metodo?: string;
  cuerpo?: unknown;
}): Promise<{ ok: true; datos: unknown } | { ok: false; motivo: string }> {
  if (!rutaDeSondaPermitida(entrada.ruta)) {
    return {
      ok: false,
      motivo: `Ruta fuera de la lista de la sonda: ${entrada.ruta}`,
    };
  }
  const r = await llamarCjConRitmo<unknown>(entrada.ruta.trim(), {
    metodo: entrada.metodo ?? "GET",
    cuerpo: entrada.cuerpo,
  });
  return r.ok ? { ok: true, datos: r.datos } : { ok: false, motivo: r.motivo };
}
