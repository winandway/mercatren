import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { getDb } from "@/lib/db";
import {
  facturas,
  itemsPedido,
  lineasFactura,
  ordenesCompra,
  pedidos,
  user,
} from "@/lib/db/schema";
import { SERIES } from "@/lib/facturas/numeracion";
import { siguienteNumero } from "@/lib/facturas/serie";
import { SITIO } from "@/lib/sitio";

/**
 * LAS DOS FACTURAS DE CADA VENTA.
 *
 * ══ LA FIGURA, QUE ES LO QUE MANDA SOBRE ESTE ARCHIVO ══
 *
 * Windoce, LLC compra mercancía y la revende. Por eso cada operación deja DOS
 * documentos, y no uno:
 *
 *   1. La FACTURA DE VENTA (nosotros → el comprador). La emitimos nosotros,
 *      así que la generamos aquí.
 *   2. La FACTURA DE COMPRA (el comercio → nosotros). **La emite el comercio,
 *      no nosotros.** No se puede fabricar un documento a nombre de otro.
 *      Lo que sí hacemos es emitirle la ORDEN DE COMPRA con todo lo que
 *      necesita para facturarnos, y guardar su factura contra ella.
 *
 * Sin la factura de compra a nombre de Windoce, LLC la figura de reventa no se
 * sostiene ante una auditoría: quedaría una entrada de dinero sin una compra
 * que la respalde. Por eso la orden de compra no es un adorno.
 *
 * ══ CUÁNDO SE EMITE ══
 *
 * Cuando el pago queda CONFIRMADO, nunca al crear el pedido. Un pedido sin
 * pagar no es una venta y no puede tener factura. Se llama desde los dos
 * caminos por donde se confirma un pago: el aviso de Stripe y la aprobación
 * de un comprobante de Zelle.
 *
 * ══ SE PUEDE LLAMAR DOS VECES SIN MIEDO ══
 *
 * Stripe reintenta sus avisos, así que esto va a correr repetido. Los índices
 * únicos de la base (un pedido = una factura; un pedido + comercio = una
 * orden) son la barrera de verdad, y aquí además se comprueba antes para no
 * gastar números de la serie en documentos que no se van a insertar.
 *
 * ══ NUNCA TUMBA UN PAGO ══
 *
 * Si algo falla emitiendo, se registra y se sigue. Un pago cobrado y
 * acreditado jamás se deshace porque un documento no salió — el documento se
 * puede volver a emitir después; el pago no se puede volver a cobrar.
 */

type Emisor = {
  nombre: string;
  identificacion: string | null;
  direccion: string | null;
};

/**
 * Quién emite, leído del entorno.
 *
 * Va en variables y no en el código para que el día que la sociedad pase a
 * Mercatren LLC se cambie sin tocar una línea, y para no tener el domicilio
 * fiscal escrito en un repositorio público. Si falta, sale el nombre solo:
 * **nunca se inventa una dirección**.
 */
function emisor(): Emisor {
  const { env } = getCloudflareContext();
  return {
    nombre: SITIO.sociedad,
    identificacion: env.EMISOR_IDENTIFICACION ?? null,
    direccion: env.EMISOR_DIRECCION ?? null,
  };
}

/** La dirección de entrega, aplanada a una línea para el documento. */
function direccionEnUnaLinea(guardada: unknown): string | null {
  if (!guardada || typeof guardada !== "object") return null;
  const d = guardada as Record<string, unknown>;
  const partes = [d.direccion, d.referencia, d.ciudad, d.pais]
    .filter((p): p is string => typeof p === "string" && p.trim() !== "")
    .map((p) => p.trim());
  return partes.length > 0 ? partes.join(", ") : null;
}

/**
 * Emite la factura de venta y las órdenes de compra de un pedido pagado.
 *
 * Devuelve el número de la factura, o `null` si no había nada que emitir
 * (porque ya estaba emitida, o porque el pedido no existe).
 */
export async function emitirDocumentosDeVenta(
  pedidoId: string,
): Promise<string | null> {
  const db = getDb();

  const [pedido] = await db
    .select({
      id: pedidos.id,
      numero: pedidos.numero,
      clienteId: pedidos.clienteId,
      subtotalCentavos: pedidos.subtotalCentavos,
      impuestosCentavos: pedidos.impuestosCentavos,
      totalCentavos: pedidos.totalCentavos,
      moneda: pedidos.moneda,
      direccionEntrega: pedidos.direccionEntrega,
    })
    .from(pedidos)
    .where(eq(pedidos.id, pedidoId))
    .limit(1);

  if (!pedido) return null;

  /* Si ya tiene factura, no se hace nada. El aviso repetido de Stripe llega
     hasta aquí y se va sin gastar un número de la serie. */
  const [yaHay] = await db
    .select({ numero: facturas.numero })
    .from(facturas)
    .where(eq(facturas.pedidoId, pedidoId))
    .limit(1);

  if (yaHay) return yaHay.numero;

  const [cliente] = await db
    .select({ name: user.name, email: user.email, idioma: user.idioma })
    .from(user)
    .where(eq(user.id, pedido.clienteId))
    .limit(1);

  const renglones = await db
    .select({
      tiendaId: itemsPedido.tiendaId,
      titulo: itemsPedido.titulo,
      cantidad: itemsPedido.cantidad,
      precioUnitarioCentavos: itemsPedido.precioUnitarioCentavos,
      subtotalCentavos: itemsPedido.subtotalCentavos,
      comisionCentavos: itemsPedido.comisionCentavos,
    })
    .from(itemsPedido)
    .where(eq(itemsPedido.pedidoId, pedidoId));

  if (renglones.length === 0) return null;

  const quienEmite = emisor();
  const numero = await siguienteNumero(db, SERIES.facturaVenta);
  const facturaId = `fac-${nanoid(12)}`;
  const ahora = new Date();

  await db.insert(facturas).values({
    id: facturaId,
    numero,
    tipo: "venta",
    pedidoId: pedido.id,
    clienteId: pedido.clienteId,
    emisorNombre: quienEmite.nombre,
    emisorIdentificacion: quienEmite.identificacion,
    emisorDireccion: quienEmite.direccion,
    receptorNombre: cliente?.name ?? "—",
    receptorCorreo: cliente?.email ?? null,
    receptorDireccion: direccionEnUnaLinea(pedido.direccionEntrega),
    subtotalCentavos: pedido.subtotalCentavos,
    impuestosCentavos: pedido.impuestosCentavos,
    totalCentavos: pedido.totalCentavos,
    moneda: pedido.moneda,
    idioma: cliente?.idioma ?? "es",
    emitidaEn: ahora,
  });

  await db.insert(lineasFactura).values(
    renglones.map((r) => ({
      id: `lin-${nanoid(12)}`,
      facturaId,
      descripcion: r.titulo,
      cantidad: r.cantidad,
      precioUnitarioCentavos: r.precioUnitarioCentavos,
      subtotalCentavos: r.subtotalCentavos,
    })),
  );

  await emitirOrdenesDeCompra(db, pedido.id, pedido.moneda, renglones, ahora);

  return numero;
}

/**
 * Una orden de compra POR COMERCIO.
 *
 * Un pedido con productos de tres comercios genera tres órdenes: cada uno nos
 * vende lo suyo y nos factura lo suyo.
 *
 * EL MONTO ES LO QUE SE LE PAGA AL COMERCIO — el subtotal menos el margen de
 * Mercatren, que es exactamente lo que se le acredita en su cuenta. Si aquí
 * figurara el precio publicado, la orden diría que le compramos por más de lo
 * que le pagamos, y eso no cuadraría con nada.
 */
async function emitirOrdenesDeCompra(
  db: ReturnType<typeof getDb>,
  pedidoId: string,
  moneda: string,
  renglones: {
    tiendaId: string;
    subtotalCentavos: number;
    comisionCentavos: number;
  }[],
  ahora: Date,
) {
  const porTienda = new Map<string, number>();
  for (const r of renglones) {
    const aPagar = r.subtotalCentavos - r.comisionCentavos;
    porTienda.set(r.tiendaId, (porTienda.get(r.tiendaId) ?? 0) + aPagar);
  }

  for (const [tiendaId, subtotalCentavos] of porTienda) {
    const numero = await siguienteNumero(db, SERIES.ordenCompra);
    await db
      .insert(ordenesCompra)
      .values({
        id: `oc-${nanoid(12)}`,
        numero,
        pedidoId,
        tiendaId,
        subtotalCentavos,
        moneda,
        estado: "emitida",
        emitidaEn: ahora,
      })
      /* Por si dos avisos entraron a la vez y los dos pasaron la comprobación
         de arriba: el índice único manda y el segundo no crea nada. */
      .onConflictDoNothing();
  }
}
