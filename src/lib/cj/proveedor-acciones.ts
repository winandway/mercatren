"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { exigirEquipoInterno, obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { pedidos, pedidosProveedor } from "@/lib/db/schema";
import { idDeRegistro, revisar } from "@/lib/validacion/acciones";

/**
 * LA COLA DE «HAY QUE PAGARLE AL PROVEEDOR».
 *
 * Solo el equipo interno: aquí se ven enlaces que cobran de NUESTRA tarjeta y
 * el costo real de la mercancía — que es exactamente el número que un
 * comprador no debe ver nunca.
 */

type Resultado = { ok: boolean; mensaje: string };

export type CompraAlProveedor = {
  id: string;
  pedidoId: string;
  numero: string;
  estado: string;
  urlPago: string | null;
  costoCentavos: number | null;
  externoNumero: string | null;
  guia: string | null;
  ultimoError: string | null;
  creadoEn: Date | null;
};

/** Lo que hay pendiente de comprar o de pagar, lo más viejo primero. */
export async function listarComprasAlProveedor(
  limite = 50,
): Promise<CompraAlProveedor[]> {
  try {
    await exigirEquipoInterno();
  } catch {
    return [];
  }

  const db = getDb();

  const filas = await db
    .select({
      id: pedidosProveedor.id,
      pedidoId: pedidosProveedor.pedidoId,
      numero: pedidos.numero,
      estado: pedidosProveedor.estado,
      urlPago: pedidosProveedor.urlPago,
      costoCentavos: pedidosProveedor.costoCentavos,
      externoNumero: pedidosProveedor.externoNumero,
      guia: pedidosProveedor.guia,
      ultimoError: pedidosProveedor.ultimoError,
      creadoEn: pedidosProveedor.creadoEn,
    })
    .from(pedidosProveedor)
    .innerJoin(pedidos, eq(pedidos.id, pedidosProveedor.pedidoId))
    .orderBy(desc(pedidosProveedor.creadoEn))
    .limit(limite)
    .catch(() => []);

  return filas;
}

/**
 * Las ventas ya pagadas por el cliente que TODAVÍA no se le compraron al
 * proveedor.
 *
 * Es la lista que de verdad importa: cada fila aquí es un comprador que pagó y
 * está esperando una caja que nadie ha pedido.
 */
export async function ventasSinComprar(): Promise<
  Array<{ id: string; numero: string; totalCentavos: number }>
> {
  try {
    await exigirEquipoInterno();
  } catch {
    return [];
  }

  const db = getDb();
  const { itemsPedido, productos, tiendas } = await import("@/lib/db/schema");

  /* Solo lo de Estados Unidos: lo de Venezuela lo despacha su comercio. */
  const candidatos = await db
    .selectDistinct({
      id: pedidos.id,
      numero: pedidos.numero,
      totalCentavos: pedidos.totalCentavos,
    })
    .from(pedidos)
    .innerJoin(itemsPedido, eq(itemsPedido.pedidoId, pedidos.id))
    .innerJoin(productos, eq(productos.id, itemsPedido.productoId))
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(
      and(
        inArray(pedidos.estado, ["pagado", "enviado"]),
        /* EL FILTRO DE PAÍS NO ES DECORATIVO: sin él, cada venta venezolana
           aparecería aquí como «hay que comprársela al proveedor», y alguien
           terminaría pagándole a CJ un producto que la ferretería ya despachó
           de su propio depósito. */
        eq(tiendas.paisOrigen, "US"),
      ),
    )
    .orderBy(desc(pedidos.creadoEn))
    .limit(100)
    .catch(() => []);

  if (candidatos.length === 0) return [];

  const yaComprados = new Set(
    (
      await db
        .select({ pedidoId: pedidosProveedor.pedidoId })
        .from(pedidosProveedor)
        .where(
          inArray(
            pedidosProveedor.pedidoId,
            candidatos.map((c) => c.id),
          ),
        )
        .catch(() => [])
    ).map((f) => f.pedidoId),
  );

  return candidatos.filter((c) => !yaComprados.has(c.id));
}

/** Dispara la compra al proveedor de un pedido. */
export async function comprarPedidoAlProveedor(
  pedidoId: string,
): Promise<Resultado> {
  try {
    await exigirEquipoInterno();
  } catch {
    return { ok: false, mensaje: "No tienes permiso para esto." };
  }

  const revisado = revisar(idDeRegistro, pedidoId);
  if (!revisado.ok) return { ok: false, mensaje: "Ese pedido no existe." };

  const { comprarAlProveedor } = await import("@/lib/cj/pedidos");
  const r = await comprarAlProveedor(revisado.datos);

  revalidatePath("/[locale]/panel/proveedor", "page");

  return r.ok
    ? {
        ok: true,
        mensaje: r.urlPago
          ? "Pedido creado en el proveedor. Ya puedes pagarlo."
          : "Pedido creado, pero el proveedor no devolvió enlace de pago.",
      }
    : { ok: false, mensaje: r.motivo };
}

/**
 * «Ya lo pagué»: lo marca quien abrió el enlace y pagó.
 *
 * Se guarda QUIÉN y CUÁNDO, igual que los retiros: el pago ocurre fuera del
 * sistema, en la pasarela del proveedor, así que lo único que podemos dejar es
 * la constancia de quién dice haberlo hecho.
 */
export async function marcarCompraPagada(id: string): Promise<Resultado> {
  try {
    await exigirEquipoInterno();
  } catch {
    return { ok: false, mensaje: "No tienes permiso para esto." };
  }

  const revisado = revisar(idDeRegistro, id);
  if (!revisado.ok) return { ok: false, mensaje: "Esa compra no existe." };

  const usuario = await obtenerUsuario();
  const db = getDb();

  /* `por_pagar` va DENTRO del WHERE: dos clics seguidos no reescriben la fecha
     ni el autor del primero, que es el dato que sirve para auditar. */
  const cambiadas = await db
    .update(pedidosProveedor)
    .set({
      estado: "pagado",
      pagadoEn: new Date(),
      pagadoPorId: usuario?.id ?? null,
      actualizadoEn: new Date(),
    })
    .where(eq(pedidosProveedor.id, revisado.datos))
    .returning({ id: pedidosProveedor.id });

  revalidatePath("/[locale]/panel/proveedor", "page");

  return cambiadas.length > 0
    ? { ok: true, mensaje: "Marcado como pagado." }
    : { ok: false, mensaje: "Esa compra no existe." };
}
