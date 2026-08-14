import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  facturas,
  itemsPedido,
  ordenesCompra,
  pagos,
  pedidos,
  tiendas,
  user,
} from "@/lib/db/schema";

/**
 * TODO LO QUE HAY QUE SABER DE UNA VENTA, EN UN SOLO CORREO.
 *
 * ══ POR QUÉ (14 ago 2026) ══
 *
 * El aviso al equipo decía tres cosas: el número del pedido, el total, y que el
 * neto ya estaba acreditado. Nada más. Para saber **qué tienda vendió, quién
 * compró, qué se llevó y quién tiene que entregarlo** había que abrir el panel
 * y buscarlo — y ese correo llega al celular, muchas veces cuando uno no está
 * frente a la computadora.
 *
 * Palabras del dueño: *«me tiene que decir cuánto el cliente, cuánto costó,
 * toda esa información yo necesito saberla»*.
 *
 * ══ POR QUÉ TODO SE LEE DE LA BASE Y NO SE PASA POR PARÁMETRO ══
 *
 * Los datos que hacen falta viven en seis tablas y el aviso se dispara desde
 * dos sitios distintos —el cobro con tarjeta y la aprobación de un Zelle—.
 * Pasarlos a mano por parámetro obligaría a que los dos armen la misma lista, y
 * al primer arreglo uno de los dos se quedaría atrás diciendo otra cosa.
 *
 * ══ NUNCA TUMBA UN COBRO ══
 *
 * Se llama dentro del `try` de los avisos y cada consulta va con su `catch`: si
 * una falla, esa línea sale vacía y el correo se manda igual. Un dato que falta
 * es molesto; un pago acreditado que se deshace porque un correo no salió es
 * mucho peor.
 */

export type FichaDeVenta = {
  numero: string;
  totalCentavos: number;
  metodoPago: string | null;
  /** `pi_…` de Stripe o el código de confirmación del banco. */
  referencia: string | null;
  comprador: { nombre: string; correo: string } | null;
  entrega: string | null;
  /** El teléfono con el que se le habla al comprador por este pedido. */
  telefono: string | null;
  /** Un renglón por comercio, con lo que se le compró y lo que se le paga. */
  comercios: Array<{
    nombre: string;
    /** Quién responde por la entrega: el dueño de la cuenta del comercio. */
    responsable: string | null;
    brutoCentavos: number;
    comisionCentavos: number;
    netoCentavos: number;
    articulos: Array<{ titulo: string; cantidad: number; centavos: number }>;
  }>;
  /** La factura de venta al comprador, si ya se emitió. */
  facturaNumero: string | null;
  /** Las órdenes de compra a los comercios, si ya se emitieron. */
  ordenesNumero: string[];
};

/**
 * La dirección se guarda como JSON para no perder el histórico: si el cliente
 * la cambia mañana, el pedido viejo conserva a dónde se mandó de verdad. Aquí
 * se aplana a una línea legible, saltando lo que venga vacío — un correo con
 * «, , Venezuela» se lee como un error del sistema.
 */
function textoDeLaEntrega(valor: unknown): string | null {
  if (!valor || typeof valor !== "object") return null;
  const d = valor as Record<string, unknown>;
  const partes = [d.nombre, d.direccion, d.ciudad, d.pais, d.referencia]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
  return partes.length ? partes.join(" · ") : null;
}

export async function fichaDeVenta(
  pedidoId: string,
): Promise<FichaDeVenta | null> {
  const db = getDb();

  const [pedido] = await db
    .select({
      id: pedidos.id,
      numero: pedidos.numero,
      totalCentavos: pedidos.totalCentavos,
      metodoPago: pedidos.metodoPago,
      clienteId: pedidos.clienteId,
      direccion: pedidos.direccionEntrega,
      telefono: pedidos.telefonoContacto,
    })
    .from(pedidos)
    .where(eq(pedidos.id, pedidoId))
    .limit(1);

  if (!pedido) return null;

  const [comprador] = pedido.clienteId
    ? await db
        .select({ nombre: user.name, correo: user.email })
        .from(user)
        .where(eq(user.id, pedido.clienteId))
        .limit(1)
        .catch(() => [])
    : [];

  const renglones = await db
    .select({
      tiendaId: itemsPedido.tiendaId,
      titulo: itemsPedido.titulo,
      cantidad: itemsPedido.cantidad,
      subtotalCentavos: itemsPedido.subtotalCentavos,
      comisionCentavos: itemsPedido.comisionCentavos,
    })
    .from(itemsPedido)
    .where(eq(itemsPedido.pedidoId, pedido.id))
    .catch(() => []);

  /* Se agrupa por comercio porque un pedido puede traer cosas de varios, y a
     cada uno se le compra y se le paga por separado. */
  const porTienda = new Map<string, FichaDeVenta["comercios"][number]>();

  for (const r of renglones) {
    const clave = r.tiendaId ?? "sin-comercio";
    const bruto = Number(r.subtotalCentavos ?? 0);
    const comision = Number(r.comisionCentavos ?? 0);

    const actual = porTienda.get(clave) ?? {
      nombre: clave,
      responsable: null,
      brutoCentavos: 0,
      comisionCentavos: 0,
      netoCentavos: 0,
      articulos: [],
    };

    actual.brutoCentavos += bruto;
    actual.comisionCentavos += comision;
    actual.netoCentavos += bruto - comision;
    actual.articulos.push({
      titulo: r.titulo ?? "",
      cantidad: Number(r.cantidad ?? 0),
      centavos: bruto,
    });

    porTienda.set(clave, actual);
  }

  /* El nombre del comercio y QUIÉN RESPONDE por la entrega. Sin el segundo, el
     correo dice qué hay que entregar pero no a quién reclamárselo. */
  for (const [id, datos] of porTienda) {
    if (id === "sin-comercio") continue;
    const [t] = await db
      .select({ nombre: tiendas.nombre, propietarioId: tiendas.propietarioId })
      .from(tiendas)
      .where(eq(tiendas.id, id))
      .limit(1)
      .catch(() => []);

    if (t) {
      datos.nombre = t.nombre;
      if (t.propietarioId) {
        const [duenno] = await db
          .select({ nombre: user.name, correo: user.email })
          .from(user)
          .where(eq(user.id, t.propietarioId))
          .limit(1)
          .catch(() => []);
        if (duenno) datos.responsable = `${duenno.nombre} · ${duenno.correo}`;
      }
    }
  }

  const [cobro] = await db
    .select({ referencia: pagos.referenciaExterna })
    .from(pagos)
    .where(eq(pagos.pedidoId, pedido.id))
    .limit(1)
    .catch(() => []);

  const [factura] = await db
    .select({ numero: facturas.numero })
    .from(facturas)
    .where(eq(facturas.pedidoId, pedido.id))
    .limit(1)
    .catch(() => []);

  const ordenes = await db
    .select({ numero: ordenesCompra.numero })
    .from(ordenesCompra)
    .where(eq(ordenesCompra.pedidoId, pedido.id))
    .catch(() => []);

  return {
    numero: pedido.numero,
    totalCentavos: Number(pedido.totalCentavos ?? 0),
    metodoPago: pedido.metodoPago ?? null,
    referencia: cobro?.referencia ?? null,
    comprador: comprador
      ? { nombre: comprador.nombre, correo: comprador.correo }
      : null,
    entrega: textoDeLaEntrega(pedido.direccion),
    telefono: pedido.telefono ?? null,
    comercios: [...porTienda.values()],
    facturaNumero: factura?.numero ?? null,
    ordenesNumero: ordenes.map((o) => o.numero).filter(Boolean) as string[],
  };
}

/** Cómo se llama cada método en un correo que lee una persona. */
const NOMBRE_DEL_METODO: Record<string, string> = {
  stripe: "Tarjeta",
  zelle: "Zelle",
  billetera: "Saldo en Mercatren",
};

/**
 * La ficha convertida en las líneas del correo.
 *
 * Va aquí y no en la plantilla del correo para que los dos disparadores —el
 * cobro con tarjeta y la aprobación de un Zelle— manden exactamente lo mismo.
 */
export function lineasDeLaVenta(f: FichaDeVenta): string[] {
  const usd = (c: number) => `${(c / 100).toFixed(2)} USD`;
  const lineas: string[] = [];

  lineas.push(
    `Pedido ${f.numero} · ${NOMBRE_DEL_METODO[f.metodoPago ?? ""] ?? "Sin método"} · Total ${usd(f.totalCentavos)}`,
  );

  if (f.referencia) lineas.push(`Referencia del cobro: ${f.referencia}`);

  if (f.comprador) {
    lineas.push(`Compró: ${f.comprador.nombre} · ${f.comprador.correo}`);
  }

  if (f.entrega) lineas.push(`Entregar a: ${f.entrega}`);
  if (f.telefono) lineas.push(`Teléfono: ${f.telefono}`);

  for (const c of f.comercios) {
    lineas.push(`— ${c.nombre} —`);
    if (c.responsable) lineas.push(`Entrega: ${c.responsable}`);
    for (const a of c.articulos) {
      lineas.push(`${a.cantidad} × ${a.titulo} — ${usd(a.centavos)}`);
    }
    lineas.push(
      `Vendido ${usd(c.brutoCentavos)} · comisión de Mercatren ${usd(c.comisionCentavos)} · se le paga ${usd(c.netoCentavos)}`,
    );
  }

  if (f.facturaNumero) lineas.push(`Factura de venta: ${f.facturaNumero}`);
  if (f.ordenesNumero.length) {
    lineas.push(`Orden de compra: ${f.ordenesNumero.join(", ")}`);
  }

  return lineas;
}
