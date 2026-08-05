"use server";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { obtenerAlcance, obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { mensajes } from "@/lib/mensajes";
import {
  itemsPedido,
  itemsVariante,
  pagosZelle,
  pedidos,
  productos,
  tiendas,
  variantesProducto,
} from "@/lib/db/schema";
import { calcularComisionCentavos, ZELLE_MINIMO_CENTAVOS } from "@/lib/dinero";
import { esquemaPedido, type DatosPedido } from "@/lib/pedidos/esquemas";

/**
 * Cierre de la compra.
 *
 * REGLA: lo que manda el navegador se usa SOLO para saber que quiere comprar
 * (que producto y cuantos). El precio, la disponibilidad y la comision se
 * vuelven a leer de la base. Si alguien manipula el carrito para ponerse un
 * precio de un dolar, aqui no le sirve de nada.
 *
 * Las existencias NO se descuentan todavia: se descuentan cuando el pago queda
 * confirmado. Asi un carrito abandonado no deja mercancia bloqueada. A cambio,
 * el validador tiene que mirar que quede stock antes de aprobar.
 */

export type ResultadoPedido =
  { ok: true; numero: string } | { ok: false; mensaje: string };

/** Numero corto y legible para el cliente: MT-000124. */
async function siguienteNumero(db: ReturnType<typeof getDb>) {
  const [fila] = await db
    .select({ cuantos: sql<number>`COUNT(*)` })
    .from(pedidos);
  const siguiente = Number(fila?.cuantos ?? 0) + 1;
  return `MT-${String(siguiente).padStart(6, "0")}`;
}

export async function crearPedido(
  entrada: DatosPedido,
): Promise<ResultadoPedido> {
  const t = await mensajes();

  const usuario = await obtenerUsuario();
  if (!usuario) {
    return {
      ok: false,
      mensaje: t("entraParaComprar"),
    };
  }

  const revisado = esquemaPedido.safeParse(entrada);
  if (!revisado.success) {
    return {
      ok: false,
      mensaje: revisado.error.issues[0]?.message ?? t("faltanDatosPedido"),
    };
  }

  const { entrega, metodoPago, lineas } = revisado.data;

  /**
   * LAS REGLAS POR MÉTODO (4 ago 2026): la tarjeta es la protagonista y
   * sirve para cualquier monto; Zelle queda para compras desde $200 (esa se
   * valida más abajo, contra el total REAL calculado de la base). La
   * billetera todavía no paga.
   */
  if (metodoPago === "billetera") {
    return { ok: false, mensaje: t("metodoNoDisponible") };
  }

  const db = getDb();

  /**
   * EL CARRITO GUARDA "producto:variante" EN UN SOLO CAMPO.
   *
   * Es lo que hace que dos tallas del mismo producto sean dos líneas
   * distintas y no se sumen en una. Aquí se separan otra vez: el producto se
   * busca en `productos` y la variante en `variantes_producto`, y el precio y
   * el stock que mandan son los de la VARIANTE.
   *
   * Como todo lo que viene del navegador, se vuelve a leer de la base: quien
   * manipule su carrito para ponerse una talla a un dólar no consigue nada.
   */
  const partido = lineas.map((l) => {
    const [productoId, varianteId] = l.productoId.split(":");
    return { ...l, productoId: productoId!, varianteId: varianteId ?? null };
  });

  const idsVariantes = partido
    .map((l) => l.varianteId)
    .filter((v): v is string => Boolean(v));

  const variantesPedidas =
    idsVariantes.length > 0
      ? await db
          .select({
            id: variantesProducto.id,
            productoId: variantesProducto.productoId,
            talla: variantesProducto.talla,
            color: variantesProducto.color,
            precioCentavos: variantesProducto.precioCentavos,
            existencias: variantesProducto.existencias,
            activo: variantesProducto.activo,
          })
          .from(variantesProducto)
          .where(inArray(variantesProducto.id, idsVariantes))
      : [];

  const porVariante = new Map(variantesPedidas.map((v) => [v.id, v]));

  // Se leen de la base los productos pedidos, con su precio y su comercio.
  const encontrados = await db
    .select({
      id: productos.id,
      tituloEs: productos.tituloEs,
      precioCentavos: productos.precioCentavos,
      moneda: productos.moneda,
      existencias: productos.existencias,
      controlaExistencias: productos.controlaExistencias,
      estado: productos.estado,
      tiendaId: productos.tiendaId,
      tiendaEstado: tiendas.estado,
      comisionPuntosBase: tiendas.comisionPuntosBase,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(
      inArray(
        productos.id,
        partido.map((l) => l.productoId),
      ),
    );

  const porId = new Map(encontrados.map((p) => [p.id, p]));

  const items: (typeof itemsPedido.$inferInsert)[] = [];
  const enlacesVariante: (typeof itemsVariante.$inferInsert)[] = [];
  let subtotal = 0;

  for (const linea of partido) {
    const producto = porId.get(linea.productoId);

    if (!producto) {
      return {
        ok: false,
        mensaje: t("productoFueraDelCatalogo"),
      };
    }
    if (producto.estado !== "publicado" || producto.tiendaEstado !== "activa") {
      return {
        ok: false,
        mensaje: t("productoFueraDeVenta", { producto: producto.tituloEs }),
      };
    }
    /* LA VARIANTE MANDA sobre el padre: su precio y su stock son los que
       valen. Si el carrito trae una variante que ya no existe o que el
       comercio desactivó, el pedido no se crea — vender una talla que no está
       es peor que perder la venta. */
    const variante = linea.varianteId
      ? (porVariante.get(linea.varianteId) ?? null)
      : null;

    if (linea.varianteId && (!variante || !variante.activo)) {
      return { ok: false, mensaje: t("productoFueraDelCatalogo") };
    }
    if (variante && variante.productoId !== producto.id) {
      // Una variante de otro producto: el carrito viene manipulado.
      return { ok: false, mensaje: t("productoFueraDelCatalogo") };
    }

    const precioUnitario = variante
      ? variante.precioCentavos
      : producto.precioCentavos;
    const disponibles = variante ? variante.existencias : producto.existencias;
    const controla = variante ? true : producto.controlaExistencias;

    // El título lleva la talla y el color: el comercio despacha por él.
    const tituloLinea = variante
      ? [producto.tituloEs, variante.color, variante.talla]
          .filter(Boolean)
          .join(" · ")
      : producto.tituloEs;

    if (controla && disponibles < linea.cantidad) {
      return {
        ok: false,
        mensaje: t("sinSuficiente", {
          producto: tituloLinea,
          quedan: disponibles,
        }),
      };
    }

    // El precio sale de la base, NO del carrito.
    const subtotalLinea = precioUnitario * linea.cantidad;
    subtotal += subtotalLinea;

    items.push({
      id: nanoid(),
      pedidoId: "",
      productoId: producto.id,
      tiendaId: producto.tiendaId,
      titulo: tituloLinea,
      precioUnitarioCentavos: precioUnitario,
      cantidad: linea.cantidad,
      subtotalCentavos: subtotalLinea,
      comisionCentavos: calcularComisionCentavos(
        subtotalLinea,
        producto.comisionPuntosBase,
      ),
    });

    /* Qué variante se vendió en esta línea. Sin este enlace, al confirmarse
       el pago el stock se le descontaría al producto padre y la talla vendida
       seguiría figurando disponible. */
    if (variante) {
      enlacesVariante.push({
        itemPedidoId: items[items.length - 1]!.id,
        varianteId: variante.id,
      });
    }
  }

  // Zelle es para montos grandes: por debajo de $200 el pago va con tarjeta.
  if (metodoPago === "zelle" && subtotal < ZELLE_MINIMO_CENTAVOS) {
    return { ok: false, mensaje: t("zelleDesde200") };
  }

  if (subtotal <= 0) {
    return { ok: false, mensaje: t("pedidoSinMonto") };
  }

  const pedidoId = nanoid();
  const numero = await siguienteNumero(db);
  const ahora = new Date();

  // El envio y los impuestos quedan en cero por ahora: se acuerdan con el
  // comercio. Cuando se definan, entran aqui y en el total.
  await db.batch([
    db.insert(pedidos).values({
      id: pedidoId,
      numero,
      clienteId: usuario.id,
      estado: "pendiente_pago",
      subtotalCentavos: subtotal,
      envioCentavos: 0,
      impuestosCentavos: 0,
      totalCentavos: subtotal,
      moneda: encontrados[0]?.moneda ?? "USD",
      metodoPago,
      direccionEntrega: {
        nombre: entrega.nombre,
        pais: entrega.pais,
        ciudad: entrega.ciudad,
        direccion: entrega.direccion,
        referencia: entrega.referencia ?? null,
      },
      paisDestino: entrega.pais,
      telefonoContacto: entrega.telefono,
      notasCliente: entrega.notas ?? null,
      creadoEn: ahora,
      actualizadoEn: ahora,
    }),
    ...items.map((item) =>
      db.insert(itemsPedido).values({ ...item, pedidoId }),
    ),
    ...(enlacesVariante.length > 0
      ? [db.insert(itemsVariante).values(enlacesVariante)]
      : []),
  ]);

  // Gracias por su compra + el paso que falta (pagar por Zelle). El correo
  // nunca frena el pedido: si falla, el pedido ya quedo registrado igual.
  const { correoGraciasCompra } = await import("@/lib/correo/correos");
  await correoGraciasCompra(
    { email: usuario.email, name: usuario.name, idioma: usuario.idioma },
    { numero, totalCentavos: subtotal },
  );

  return { ok: true, numero };
}

/** El pedido de este cliente, con sus renglones. */
export async function obtenerPedidoPropio(numero: string) {
  const usuario = await obtenerUsuario();
  if (!usuario) return null;

  const db = getDb();

  const [pedido] = await db
    .select()
    .from(pedidos)
    .where(and(eq(pedidos.numero, numero), eq(pedidos.clienteId, usuario.id)))
    .limit(1);

  if (!pedido) return null;

  const renglones = await db
    .select()
    .from(itemsPedido)
    .where(eq(itemsPedido.pedidoId, pedido.id));

  // Si ya subio el comprobante, se muestra en que va en vez del formulario.
  const [pago] = await db
    .select({
      id: pagosZelle.id,
      estado: pagosZelle.estado,
      subidoEn: pagosZelle.subidoEn,
      motivoRechazo: pagosZelle.motivoRechazo,
    })
    .from(pagosZelle)
    .where(eq(pagosZelle.pedidoId, pedido.id))
    .orderBy(desc(pagosZelle.creadoEn))
    .limit(1);

  return { pedido, renglones, pago: pago ?? null };
}

/**
 * Los pedidos de este cliente, del mas nuevo al mas viejo.
 *
 * Trae solo lo que hace falta para la lista (numero, estado, total y como va
 * el pago), no los renglones: el detalle se abre al entrar a cada pedido.
 */
export async function listarPedidosPropios() {
  const usuario = await obtenerUsuario();
  if (!usuario) return [];

  const db = getDb();

  const filas = await db
    .select({
      numero: pedidos.numero,
      estado: pedidos.estado,
      totalCentavos: pedidos.totalCentavos,
      creadoEn: pedidos.creadoEn,
      articulos: sql<number>`(SELECT COUNT(*) FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id})`,
      estadoPago: sql<
        string | null
      >`(SELECT ${pagosZelle.estado} FROM ${pagosZelle} WHERE ${pagosZelle.pedidoId} = ${pedidos.id} ORDER BY ${pagosZelle.creadoEn} DESC LIMIT 1)`,
    })
    .from(pedidos)
    .where(eq(pedidos.clienteId, usuario.id))
    .orderBy(desc(pedidos.creadoEn));

  return filas;
}

export type PedidoDeLista = Awaited<
  ReturnType<typeof listarPedidosPropios>
>[number];

/**
 * EL COMERCIO CIERRA LA VENTA.
 *
 * Antes el pedido se quedaba en "pagado" para siempre: nadie tenía forma de
 * decir que ya lo había entregado. El cliente no sabía en qué iba lo suyo y el
 * comercio no podía distinguir lo que le faltaba por sacar de lo ya cerrado.
 *
 * SOLO SE AVANZA, NUNCA SE RETROCEDE. De "pagado" se pasa a "enviado" o
 * directo a "entregado" —muchas entregas son en mano, el mismo día— y de
 * "enviado" a "entregado". Volver atrás no se ofrece: un pedido entregado que
 * de pronto vuelve a "pagado" es la clase de cosa que nadie sabe explicar
 * después. Si hubo un error, se resuelve hablando, no cambiando el estado.
 *
 * Un pedido sin pagar no se toca: entregar mercancía que nadie pagó no es una
 * decisión que deba poder tomarse con un clic.
 */
const AVANCES: Record<string, string[]> = {
  pagado: ["enviado", "entregado"],
  preparando: ["enviado", "entregado"],
  enviado: ["entregado"],
};

export async function avanzarPedido(
  numero: string,
  nuevoEstado: "enviado" | "entregado",
): Promise<{ ok: boolean; mensaje: string }> {
  const t = await mensajes();

  const alcance = await obtenerAlcance().catch(() => null);
  if (!alcance) return { ok: false, mensaje: t("sinPermiso") };

  const db = getDb();

  const [pedido] = await db
    .select({ id: pedidos.id, estado: pedidos.estado })
    .from(pedidos)
    .where(eq(pedidos.numero, numero))
    .limit(1);

  if (!pedido) return { ok: false, mensaje: t("pedidoNoExiste") };

  // Un comercio solo toca los pedidos en los que vendió algo.
  if (alcance.tipo === "tienda") {
    const [suyo] = await db
      .select({ id: itemsPedido.id })
      .from(itemsPedido)
      .where(
        and(
          eq(itemsPedido.pedidoId, pedido.id),
          eq(itemsPedido.tiendaId, alcance.tiendaId),
        ),
      )
      .limit(1);

    if (!suyo) return { ok: false, mensaje: t("pedidoAjeno") };
  }

  if (!AVANCES[pedido.estado]?.includes(nuevoEstado)) {
    return { ok: false, mensaje: t("pedidoNoSePuedeAvanzar") };
  }

  // Con el estado en el WHERE: si otra persona lo movió medio segundo antes,
  // esta llamada no hace nada en vez de pisar su trabajo.
  const movido = await db
    .update(pedidos)
    .set({ estado: nuevoEstado, actualizadoEn: new Date() })
    .where(and(eq(pedidos.id, pedido.id), eq(pedidos.estado, pedido.estado)))
    .returning({ id: pedidos.id });

  if (movido.length === 0) {
    return { ok: false, mensaje: t("pedidoNoSePuedeAvanzar") };
  }

  revalidatePath("/[locale]/panel", "layout");
  return {
    ok: true,
    mensaje:
      nuevoEstado === "enviado" ? t("pedidoEnviado") : t("pedidoEntregado"),
  };
}
