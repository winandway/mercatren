"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { exigirEquipoInterno, obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { pedidos, pedidosProveedor, renglonesProveedor } from "@/lib/db/schema";
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
  /** Qué se le pidió exactamente, con la variante elegida de cada renglón. */
  renglones: RenglonComprado[];
};

/**
 * UN RENGLÓN DE LO QUE SE LE PIDIÓ AL PROVEEDOR.
 *
 * Se enseña ANTES de pagar porque, cuando un producto de CJ tiene tallas o
 * colores, **el comprador nunca eligió**: nuestra ficha lo publica como una
 * sola cosa. La elige el sistema, y quien va a pagar tiene que poder verlo y
 * cancelar si el color no era ese. Mandar la talla equivocada es una
 * devolución, y una devolución de un producto de $8 la pagamos nosotros.
 */
export type RenglonComprado = {
  id: string;
  titulo: string | null;
  varianteNombre: string | null;
  cantidad: number;
  varianteAutomatica: boolean;
  variantesTotales: number | null;
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

  if (filas.length === 0) return [];

  /* Una sola consulta para todos los renglones, no una por compra: con la cola
     llena serían cincuenta viajes a la base para pintar una pantalla. */
  const renglones = await db
    .select({
      id: renglonesProveedor.id,
      pedidoProveedorId: renglonesProveedor.pedidoProveedorId,
      titulo: renglonesProveedor.titulo,
      varianteNombre: renglonesProveedor.varianteNombre,
      cantidad: renglonesProveedor.cantidad,
      varianteAutomatica: renglonesProveedor.varianteAutomatica,
      variantesTotales: renglonesProveedor.variantesTotales,
    })
    .from(renglonesProveedor)
    .where(
      inArray(
        renglonesProveedor.pedidoProveedorId,
        filas.map((f) => f.id),
      ),
    )
    /* La tabla es nueva: una base todavía sin ella no puede tumbar la cola de
       pagos, que es lo único imprescindible de esta pantalla. */
    .catch(() => []);

  return filas.map((f) => ({
    ...f,
    renglones: renglones
      .filter((r) => r.pedidoProveedorId === f.id)
      .map(({ pedidoProveedorId: _, ...resto }) => resto),
  }));
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

/**
 * QUÉ VARIANTES HAY, PARA ELEGIR ANTES DE COMPRAR.
 *
 * El panel llama a esto **primero**. Sin este paso la talla se elegía sola y
 * solo se veía después, con el pedido ya creado en CJ y sin forma de cambiarla.
 */
export async function variantesDeLaVenta(pedidoId: string) {
  try {
    await exigirEquipoInterno();
  } catch {
    return [];
  }

  const revisado = revisar(idDeRegistro, pedidoId);
  if (!revisado.ok) return [];

  const { variantesParaElegir } = await import("@/lib/cj/pedidos");
  return variantesParaElegir(revisado.datos);
}

/**
 * Dispara la compra al proveedor de un pedido.
 *
 * `elegidas` es `{ productoId: vid }` con lo que una persona eligió en el
 * panel. Manda sobre la elección automática — ver `cj/variantes.ts`.
 */
export async function comprarPedidoAlProveedor(
  pedidoId: string,
  elegidas?: Record<string, string>,
): Promise<Resultado> {
  try {
    await exigirEquipoInterno();
  } catch {
    return { ok: false, mensaje: "No tienes permiso para esto." };
  }

  const revisado = revisar(idDeRegistro, pedidoId);
  if (!revisado.ok) return { ok: false, mensaje: "Ese pedido no existe." };

  const { comprarAlProveedor } = await import("@/lib/cj/pedidos");
  const r = await comprarAlProveedor(revisado.datos, elegidas);

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
