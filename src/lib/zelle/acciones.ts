"use server";

import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import {
  idDeRegistro,
  motivoEscrito,
  revisar,
} from "@/lib/validacion/acciones";
import { exigirEquipoInterno, obtenerUsuario } from "@/lib/autorizacion";
import type { Db } from "@/lib/db";
import { getDb } from "@/lib/db";
import { mensajes } from "@/lib/mensajes";
import { anotarHito } from "@/lib/pedidos/hitos";
import { bloqueaLaAprobacion } from "@/lib/zelle/alertas";
import { alertasDelPago } from "@/lib/zelle/sospechas";
import {
  billeteras,
  itemsPedido,
  itemsVariante,
  movimientosBilletera,
  pagosZelle,
  pedidos,
  productos,
  tiendas,
  user,
  variantesProducto,
} from "@/lib/db/schema";

/**
 * Con quien hablar de un pago: el cliente que lo hizo (via su pedido) y el
 * dueno del comercio al que se le acredita. El historico importado no tiene
 * pedido, asi que ahi no se avisa a nadie — esas operaciones ya pasaron.
 */
async function contactosDelPago(
  db: Db,
  pago: { pedidoId: string | null; tiendaId: string | null },
) {
  const [cliente] = pago.pedidoId
    ? await db
        .select({
          email: user.email,
          name: user.name,
          idioma: user.idioma,
          numero: pedidos.numero,
          totalCentavos: pedidos.totalCentavos,
        })
        .from(pedidos)
        .innerJoin(user, eq(user.id, pedidos.clienteId))
        .where(eq(pedidos.id, pago.pedidoId))
        .limit(1)
    : [];

  const [comercio] = pago.tiendaId
    ? await db
        .select({ email: user.email, name: user.name, idioma: user.idioma })
        .from(tiendas)
        .innerJoin(user, eq(user.id, tiendas.propietarioId))
        .where(eq(tiendas.id, pago.tiendaId))
        .limit(1)
    : [];

  return { cliente: cliente ?? null, comercio: comercio ?? null };
}

/**
 * Lo que hace el validador con un pago.
 *
 * Aprobar mueve dinero: el neto se le acredita al comercio. Por eso todo el
 * trabajo va en un solo envio a la base (batch), y el saldo se suma con una
 * operacion relativa (saldo = saldo + X) para que dos validadores trabajando a
 * la vez no se pisen el resultado.
 */

export type Resultado =
  { ok: true; mensaje: string } | { ok: false; mensaje: string };

/**
 * Aprueba un pago pendiente y le acredita el neto al comercio.
 *
 * El pago solo se toca si sigue en "pendiente": si otro validador lo aprobo
 * medio segundo antes, esta llamada no hace nada y avisa.
 */
export async function aprobarPago(id: string): Promise<Resultado> {
  const t = await mensajes();

  try {
    await exigirEquipoInterno();
  } catch {
    return { ok: false, mensaje: t("sinPermisoAprobar") };
  }

  /* Lo que llega se comprueba ANTES de tocar la base: esta acción acredita
     dinero a la billetera de un comercio. */
  const revisado = revisar(idDeRegistro, id);
  if (!revisado.ok) return { ok: false, mensaje: t(revisado.aviso) };
  id = revisado.datos;

  const db = getDb();
  const usuario = await obtenerUsuario();

  /**
   * SE NOMBRAN LAS COLUMNAS, NUNCA `.select()` A SECAS.
   *
   * Drizzle lista TODAS las del esquema, incluidas las que se acaban de
   * agregar — y como `schema.sql` solo trae `CREATE TABLE IF NOT EXISTS`, una
   * base que ya existe no las recibe. La consulta pediría una columna que en
   * producción no está y **aprobar pagos dejaría de funcionar**. Pasó el 5 ago
   * 2026 con las fichas de producto; aquí el precio sería peor.
   */
  const [pago] = await db
    .select({
      id: pagosZelle.id,
      estado: pagosZelle.estado,
      tipo: pagosZelle.tipo,
      tiendaId: pagosZelle.tiendaId,
      pedidoId: pagosZelle.pedidoId,
      netoCentavos: pagosZelle.netoCentavos,
      codigoConfirmacion: pagosZelle.codigoConfirmacion,
    })
    .from(pagosZelle)
    .where(eq(pagosZelle.id, id))
    .limit(1);

  if (!pago) return { ok: false, mensaje: t("pagoNoExiste") };
  if (pago.estado !== "pendiente") {
    return { ok: false, mensaje: t("pagoYaRevisado") };
  }
  if (pago.tipo !== "entrada") {
    return {
      ok: false,
      mensaje: t("soloEntradas"),
    };
  }
  if (!pago.tiendaId) {
    return {
      ok: false,
      mensaje: t("pagoSinComercio"),
    };
  }

  /**
   * EL CANDADO CONTRA LA CAPTURA REPETIDA.
   *
   * Zelle no manda un cobro: manda una FOTO. Si el código de confirmación o la
   * imagen ya se aprobaron en otro pago, ese dinero ya se contó una vez, y
   * aprobarlo de nuevo es acreditarle al comercio plata que nadie transfirió.
   *
   * Va AQUÍ, en el servidor, y no solo como aviso en la pantalla: un aviso
   * dibujado se lo salta cualquiera, y del otro lado hay dinero de un comercio.
   *
   * Solo bloquea lo ya APROBADO. Un código visto en un pago rechazado no
   * bloquea: rechazar y volver a intentar con la transferencia corregida es lo
   * normal, y cerrarle la puerta a quien pagó de verdad cuesta más caro que el
   * fraude que evitaría.
   */
  const impedimento = bloqueaLaAprobacion(await alertasDelPago(db, pago.id));
  if (impedimento) {
    return {
      ok: false,
      mensaje: t(`alertas.${impedimento.clave}`, impedimento.datos ?? {}),
    };
  }

  // Mismo motivo que arriba: solo las columnas que se usan.
  const [billetera] = await db
    .select({ id: billeteras.id, saldoCentavos: billeteras.saldoCentavos })
    .from(billeteras)
    .where(eq(billeteras.tiendaId, pago.tiendaId))
    .limit(1);

  if (!billetera) {
    return {
      ok: false,
      mensaje: t("sinBilletera"),
    };
  }

  const ahora = new Date();
  const movimientoId = nanoid();
  // Al comercio le toca el neto: el monto menos la comision de Mercatren.
  const acreditado = pago.netoCentavos;

  /**
   * Los renglones del pedido, para descontarlos del inventario.
   *
   * Se leen ANTES del envio por lotes porque ahi solo caben sentencias
   * armadas con el constructor; una consulta cruda dentro del lote lo tumba
   * entero, y con el se caeria tambien la acreditacion del dinero.
   */
  const renglones = pago.pedidoId
    ? await db
        .select({
          productoId: itemsPedido.productoId,
          cantidad: itemsPedido.cantidad,
          /* Qué variante se vendió, si el producto tenía tallas o colores.
             Sin esto el stock se le descontaría al padre y la talla vendida
             seguiría figurando disponible. */
          varianteId: itemsVariante.varianteId,
        })
        .from(itemsPedido)
        .leftJoin(itemsVariante, eq(itemsVariante.itemPedidoId, itemsPedido.id))
        .where(eq(itemsPedido.pedidoId, pago.pedidoId))
    : [];

  await db.batch([
    db.insert(movimientosBilletera).values({
      id: movimientoId,
      billeteraId: billetera.id,
      tipo: "recarga",
      montoCentavos: acreditado,
      saldoResultanteCentavos: billetera.saldoCentavos + acreditado,
      referencia: pago.id,
      nota: `Pago Zelle aprobado${pago.codigoConfirmacion ? ` · ${pago.codigoConfirmacion}` : ""}`,
      hechoPorId: usuario?.id ?? null,
      creadoEn: ahora,
    }),

    db
      .update(billeteras)
      .set({
        saldoCentavos: sql`${billeteras.saldoCentavos} + ${acreditado}`,
        sincronizadoEn: ahora,
      })
      .where(eq(billeteras.id, billetera.id)),

    db
      .update(pagosZelle)
      .set({
        estado: "aprobado",
        aprobadoEn: ahora,
        revisadoEn: ahora,
        validadorId: usuario?.id ?? null,
        billeteraId: billetera.id,
        movimientoBilleteraId: movimientoId,
        motivoRechazo: null,
      })
      // La condicion evita aprobarlo dos veces si alguien se adelanto.
      .where(and(eq(pagosZelle.id, id), eq(pagosZelle.estado, "pendiente"))),

    /**
     * EL PEDIDO PASA A PAGADO Y SE DESCUENTA EL INVENTARIO.
     *
     * Sin esto el circulo no cierra: el dinero entraba a la billetera del
     * comercio pero el pedido se quedaba en "esperando el pago" para siempre.
     * El cliente que YA PAGO seguia viendo que debia, y nadie preparaba nada.
     *
     * El inventario se descuenta AQUI, no al crear el pedido, para que un
     * carrito abandonado no deje mercancia bloqueada. A cambio, quien valida
     * tiene que mirar que quede existencia antes de aprobar.
     *
     * Va en el mismo envio que la acreditacion: o entra todo, o no entra
     * nada. Acreditar el dinero y dejar el pedido a medias seria peor que
     * fallar.
     */
    ...(pago.pedidoId
      ? [
          db
            .update(pedidos)
            .set({ estado: "pagado", actualizadoEn: ahora })
            .where(
              and(
                eq(pedidos.id, pago.pedidoId),
                eq(pedidos.estado, "pendiente_pago"),
              ),
            ),

          // MAX(0, ...) porque un inventario en negativo no existe: si dos
          // pedidos se aprueban casi a la vez, se queda en cero y el comercio
          // lo ve, en vez de arrastrar un numero imposible.
          /* Con variante, el stock que baja es el SUYO: si se le descontara
             al padre, la talla vendida seguiría figurando disponible y se
             vendería tres veces la única camisa M azul que había. */
          ...renglones
            .filter((r) => r.varianteId)
            .map((r) =>
              db
                .update(variantesProducto)
                .set({
                  existencias: sql`MAX(0, ${variantesProducto.existencias} - ${r.cantidad})`,
                  actualizadoEn: ahora,
                })
                .where(eq(variantesProducto.id, r.varianteId!)),
            ),
          ...renglones
            .filter((r) => r.productoId && !r.varianteId)
            .map((r) =>
              db
                .update(productos)
                .set({
                  existencias: sql`MAX(0, ${productos.existencias} - ${r.cantidad})`,
                  actualizadoEn: ahora,
                })
                .where(eq(productos.id, r.productoId!)),
            ),
        ]
      : []),
  ]);

  if (pago.pedidoId) {
    await anotarHito(db, {
      pedidoId: pago.pedidoId,
      hito: "pagado",
      hechoPorId: usuario?.id ?? null,
      hechoPorNombre: usuario?.name ?? null,
    });
  }

  revalidatePath("/[locale]/panel", "layout");

  /* LAS DOS FACTURAS. Aquí es donde una venta por Zelle pasa a ser una venta:
     el validador comprobó el pago contra el banco. Va en su propio try — si
     emitir falla, el pago sigue acreditado. Un documento se vuelve a emitir;
     un cobro aprobado no se deshace. */
  if (pago.pedidoId) {
    try {
      const { emitirDocumentosDeVenta } = await import("@/lib/facturas/emitir");
      await emitirDocumentosDeVenta(pago.pedidoId);
    } catch (e) {
      console.error("[zelle] pago aprobado; la factura no salio:", e);
    }
  }

  // Los avisos salen despues de acreditar y nunca lo deshacen: al cliente,
  // que su compra fue aprobada; al comercio, que el neto entro a su saldo.
  const { correoCompraAprobada, correoVentaAcreditada } =
    await import("@/lib/correo/correos");
  const { cliente, comercio } = await contactosDelPago(db, pago);
  if (cliente) {
    await correoCompraAprobada(cliente, {
      numero: cliente.numero,
      totalCentavos: cliente.totalCentavos,
    });
  }
  if (comercio) {
    await correoVentaAcreditada(comercio, {
      montoCentavos: acreditado,
      referencia: cliente?.numero ?? pago.codigoConfirmacion,
    });
  }

  /**
   * Y AL EQUIPO, QUE DE UN ZELLE APROBADO NO SE ENTERABA NADIE.
   *
   * Una venta con tarjeta ya avisaba; esta no. El resultado era que las ventas
   * por Zelle —que hoy son las más— no llegaban a ningún celular: había que
   * abrir el panel para saber que entró dinero y que hay algo que despachar.
   *
   * Va con la MISMA ficha que la tarjeta, para que los dos correos digan lo
   * mismo y no haya que aprenderse dos formatos.
   */
  if (pago.pedidoId) {
    try {
      const { correoAvisoAlEquipo } = await import("@/lib/correo/correos");
      const { fichaDeVenta, lineasDeLaVenta } =
        await import("@/lib/pedidos/ficha-para-el-equipo");
      const { SITIO } = await import("@/lib/sitio");

      const ficha = await fichaDeVenta(pago.pedidoId);
      if (ficha) {
        await correoAvisoAlEquipo({
          asunto: `Venta por Zelle ${ficha.numero}`,
          lineas: lineasDeLaVenta(ficha),
          url: `${SITIO.url}/es/panel/ordenes/${ficha.numero}`,
          boton: "Ver el pedido",
        });
      }
    } catch (e) {
      /* Un aviso que no sale jamás deshace un pago ya acreditado. */
      console.error("[zelle] pago aprobado; el aviso al equipo no salio:", e);
    }
  }

  /**
   * SI ESTA CAPTURA PERTENECE A UN COBRO POR ENLACE, EL COBRO SE CIERRA AQUÍ.
   *
   * El dinero ya entró por el camino normal de Zelle (movimiento + saldo, unas
   * líneas más arriba). Lo que falta es lo que el comercio y el pagador están
   * esperando: la factura marcada como pagada —que es lo que su sistema
   * consulta— y sus correos. Va después de acreditar y en su propio try: un
   * pago aprobado jamás se deshace porque un aviso no salió.
   */
  try {
    const { cobrosZelle, cobrosSolicitados } = await import("@/lib/db/schema");
    const [puente] = await db
      .select({ cobroId: cobrosZelle.cobroId })
      .from(cobrosZelle)
      .where(eq(cobrosZelle.pagoZelleId, pago.id))
      .limit(1);

    if (puente) {
      /* `estado = 'abierto'` DENTRO del WHERE: si el cobro ya se pagó por
         otro camino (tarjeta mientras la captura esperaba), no se pisa. */
      const cerrado = await db
        .update(cobrosSolicitados)
        .set({ estado: "pagado", pagadoEn: ahora, pagoId: pago.id })
        .where(
          and(
            eq(cobrosSolicitados.id, puente.cobroId),
            eq(cobrosSolicitados.estado, "abierto"),
          ),
        )
        .returning({
          referencia: cobrosSolicitados.referencia,
          montoCentavos: cobrosSolicitados.montoCentavos,
          contactoCorreo: cobrosSolicitados.contactoCorreo,
          contactoNombre: cobrosSolicitados.contactoNombre,
          tiendaId: cobrosSolicitados.tiendaId,
        });

      const cobro = cerrado[0];
      if (cobro) {
        const correos = await import("@/lib/correo/correos");

        if (cobro.contactoCorreo) {
          const [duennoCobro] = await db
            .select({ nombre: tiendas.nombre })
            .from(tiendas)
            .where(eq(tiendas.id, cobro.tiendaId))
            .limit(1);

          await correos.correoReciboDeCobro(
            {
              email: cobro.contactoCorreo,
              name: cobro.contactoNombre ?? "",
              idioma: "es",
            },
            {
              comercio: duennoCobro?.nombre ?? "",
              referencia: cobro.referencia,
              montoCentavos: cobro.montoCentavos,
            },
          );
        }

        await correos.correoAvisoAlEquipo({
          asunto: `Cobro por enlace pagado por Zelle · ${cobro.referencia}`,
          lineas: [
            `Cobro ${cobro.referencia} · ${(cobro.montoCentavos / 100).toFixed(2)} USD · Zelle`,
            `Neto al comercio: ${(acreditado / 100).toFixed(2)} USD`,
          ],
          url: "https://mercatren.com/es/panel/cobros/enlaces",
          boton: "Ver los enlaces de cobro",
        });
      }
    }
  } catch (fallo) {
    console.error("[zelle] aprobado; el cierre del cobro no salio:", fallo);
  }

  // Y si esa venta dejó algo en cero, que el comercio lo sepa hoy y no
  // cuando note que dejó de vender.
  const { avisarAgotados } = await import("@/lib/productos/agotados");
  await avisarAgotados(renglones);

  return { ok: true, mensaje: t("pagoAprobado") };
}

/** Rechaza un pago pendiente. No toca ningun saldo. */
export async function rechazarPago(
  id: string,
  motivo: string,
): Promise<Resultado> {
  const t = await mensajes();

  try {
    await exigirEquipoInterno();
  } catch {
    return { ok: false, mensaje: t("sinPermisoRechazar") };
  }

  const revisadoId = revisar(idDeRegistro, id);
  if (!revisadoId.ok) return { ok: false, mensaje: t(revisadoId.aviso) };
  id = revisadoId.datos;

  /* El motivo se lo lleva el comprador en un correo: tiene que explicar algo. */
  const revisadoMotivo = revisar(motivoEscrito, motivo);
  if (!revisadoMotivo.ok) {
    return { ok: false, mensaje: t(revisadoMotivo.aviso) };
  }
  const limpio = revisadoMotivo.datos;

  const db = getDb();
  const usuario = await obtenerUsuario();
  const ahora = new Date();

  const [pago] = await db
    .select({
      estado: pagosZelle.estado,
      pedidoId: pagosZelle.pedidoId,
      tiendaId: pagosZelle.tiendaId,
    })
    .from(pagosZelle)
    .where(eq(pagosZelle.id, id))
    .limit(1);

  if (!pago) return { ok: false, mensaje: t("pagoNoExiste") };
  if (pago.estado !== "pendiente") {
    return { ok: false, mensaje: t("pagoYaRevisado") };
  }

  await db
    .update(pagosZelle)
    .set({
      estado: "rechazado",
      motivoRechazo: limpio,
      revisadoEn: ahora,
      validadorId: usuario?.id ?? null,
    })
    .where(and(eq(pagosZelle.id, id), eq(pagosZelle.estado, "pendiente")));

  revalidatePath("/[locale]/panel", "layout");

  // Aviso al cliente con el motivo tal cual lo escribio el validador, y el
  // camino para resolverlo: subir otro comprobante o escribir al buzon real.
  const { correoPagoRechazado } = await import("@/lib/correo/correos");
  const { cliente } = await contactosDelPago(db, pago);
  if (cliente) {
    await correoPagoRechazado(
      cliente,
      { numero: cliente.numero, totalCentavos: cliente.totalCentavos },
      limpio,
    );
  }

  /* Si la captura era de un cobro por enlace, el pagador se entera con el
     MOTIVO: el cobro sigue abierto y puede volver a intentar — corregir la
     transferencia o pagar con tarjeta — mientras el enlace no venza. Sin este
     correo se queda esperando un recibo que no va a llegar. */
  try {
    const { cobrosZelle, cobrosSolicitados } = await import("@/lib/db/schema");
    const [puente] = await db
      .select({
        referencia: cobrosSolicitados.referencia,
        montoCentavos: cobrosSolicitados.montoCentavos,
        contactoCorreo: cobrosSolicitados.contactoCorreo,
        contactoNombre: cobrosSolicitados.contactoNombre,
      })
      .from(cobrosZelle)
      .innerJoin(
        cobrosSolicitados,
        eq(cobrosSolicitados.id, cobrosZelle.cobroId),
      )
      .where(eq(cobrosZelle.pagoZelleId, id))
      .limit(1);

    if (puente?.contactoCorreo) {
      await correoPagoRechazado(
        {
          email: puente.contactoCorreo,
          name: puente.contactoNombre ?? "",
          idioma: "es",
        },
        { numero: puente.referencia, totalCentavos: puente.montoCentavos },
        limpio,
      );
    }
  } catch (fallo) {
    console.error("[zelle] rechazado; el aviso del cobro no salio:", fallo);
  }

  return { ok: true, mensaje: t("pagoRechazado") };
}
