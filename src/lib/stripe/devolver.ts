"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { exigirEquipoInterno, obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { hitosPedido, pagos, pedidos } from "@/lib/db/schema";
import { mensajes } from "@/lib/mensajes";
import { getStripe, stripeConfigurado } from "@/lib/stripe";
import {
  montoEnDolares,
  motivoEscrito,
  numeroDePedido,
  revisar,
} from "@/lib/validacion/acciones";
import { nanoid } from "nanoid";
import { montoParaStripe } from "@/lib/stripe/monedas";

/**
 * DEVOLVERLE EL DINERO AL COMPRADOR, DESDE EL PANEL.
 *
 * ══ POR QUE HACIA FALTA ══
 *
 * El estado `reembolsado` existia desde el principio y no habia forma de
 * llegar a el: el primer cliente que pidiera una devolucion se atendia a mano
 * entrando a Stripe, y en el panel el pedido seguia diciendo «pagado». Dos
 * verdades distintas del mismo dinero es como un comercio deja de creerle al
 * sistema.
 *
 * ══ SOLO EL EQUIPO INTERNO ══
 *
 * Devolver dinero es de las pocas cosas que no se pueden deshacer. Y ademas
 * quien vende no es quien cobra: el cobro entero es de Mercatren, asi que la
 * devolucion la decide Mercatren.
 *
 * ══ LO QUE ESTO **NO** HACE, A PROPOSITO ══
 *
 * NO le quita el neto de la billetera al comercio. Puede que ya lo haya
 * retirado, puede que la devolucion sea culpa nuestra y no suya, puede que se
 * acuerde descontarlo del proximo corte. Quien asume ese dinero es una decision
 * de negocio, la misma que ya se tomo con los contracargos — y un sistema que
 * resta solo le quitaria a un comercio dinero que a lo mejor no le toca perder.
 *
 * Lo que si hace es dejarlo escrito: el hito queda con su autor y su fecha, y
 * el pedido pasa a `reembolsado`. Con eso, la conversacion con el comercio se
 * tiene sobre un hecho y no sobre un recuerdo.
 *
 * ══ ZELLE NO SE DEVUELVE DESDE AQUI ══
 *
 * Zelle no tiene marcha atras: el dinero se manda a mano desde el banco. Si el
 * pedido se pago asi, esto lo dice y no finge que puede hacerlo.
 */

type Resultado = { ok: boolean; mensaje: string };

export async function devolverPago(formulario: FormData): Promise<Resultado> {
  const t = await mensajes();

  try {
    await exigirEquipoInterno();
  } catch {
    return { ok: false, mensaje: t("soloEquipo") };
  }

  const revisadoNumero = revisar(numeroDePedido, formulario.get("numero"));
  if (!revisadoNumero.ok) {
    return { ok: false, mensaje: t(revisadoNumero.aviso) };
  }

  const revisadoMotivo = revisar(motivoEscrito, formulario.get("motivo"));
  if (!revisadoMotivo.ok) {
    return { ok: false, mensaje: t(revisadoMotivo.aviso) };
  }

  const db = getDb();

  const [pedido] = await db
    .select({
      id: pedidos.id,
      numero: pedidos.numero,
      estado: pedidos.estado,
      totalCentavos: pedidos.totalCentavos,
      moneda: pedidos.moneda,
      metodoPago: pedidos.metodoPago,
    })
    .from(pedidos)
    .where(eq(pedidos.numero, revisadoNumero.datos))
    .limit(1);

  if (!pedido) return { ok: false, mensaje: t("pedidoNoExiste") };
  if (pedido.estado === "reembolsado") {
    return { ok: false, mensaje: t("yaEstabaReembolsado") };
  }

  if (pedido.metodoPago !== "stripe") {
    /* Zelle no tiene marcha atras. Fingir que se puede seria peor que decirlo. */
    return { ok: false, mensaje: t("soloSeDevuelveTarjeta") };
  }

  if (!stripeConfigurado()) {
    return { ok: false, mensaje: t("stripeSinConfigurar") };
  }

  /* El cobro confirmado de ese pedido: es lo que Stripe necesita para
     devolver, y su existencia es la prueba de que hubo dinero. */
  const [cobro] = await db
    .select({ referencia: pagos.referenciaExterna, estado: pagos.estado })
    .from(pagos)
    .where(eq(pagos.pedidoId, pedido.id))
    .limit(1);

  if (!cobro?.referencia || cobro.estado !== "confirmado") {
    return { ok: false, mensaje: t("noHayCobroQueDevolver") };
  }

  /**
   * EL MONTO: TODO, O LO QUE SE ESCRIBA.
   *
   * Una devolucion parcial es lo normal cuando llegan tres cosas y una viene
   * rota. Vacio significa «todo», que es el caso mas comun y el que no hay que
   * obligar a teclear.
   */
  const escrito = String(formulario.get("monto") ?? "").trim();
  let centavos = pedido.totalCentavos;

  if (escrito) {
    const revisadoMonto = revisar(montoEnDolares, escrito);
    if (!revisadoMonto.ok) {
      return { ok: false, mensaje: t(revisadoMonto.aviso) };
    }
    centavos = Math.round(Number(revisadoMonto.datos.replace(",", ".")) * 100);

    if (centavos <= 0) return { ok: false, mensaje: t("montoRaro") };
    if (centavos > pedido.totalCentavos) {
      /* Devolver mas de lo que se cobro sale de nuestro bolsillo y Stripe lo
         rechazaria de todos modos: mejor decirlo aqui, con su motivo. */
      return { ok: false, mensaje: t("devolucionMayorQueElCobro") };
    }
  }

  try {
    const stripe = getStripe();
    await stripe.refunds.create({
      payment_intent: cobro.referencia,
      /* La aduana también al devolver: un reembolso parcial de 20.000 COP
         mandado crudo devolvería 200 pesos. */
      amount: montoParaStripe(centavos, pedido.moneda ?? "USD"),
      metadata: {
        pedido: pedido.numero,
        motivo: revisadoMotivo.datos.slice(0, 400),
      },
    });
  } catch (fallo) {
    /* Se dice lo que contesto Stripe. «No se pudo» obliga a entrar al panel de
       Stripe a averiguarlo, que es justo lo que esto viene a evitar. */
    console.error("[devolucion] Stripe rechazo la devolucion:", fallo);
    const motivo = fallo instanceof Error ? fallo.message : String(fallo);
    return { ok: false, mensaje: t("stripeRechazo", { motivo }) };
  }

  const usuario = await obtenerUsuario();
  const ahora = new Date();

  /**
   * SOLO SE MARCA `reembolsado` SI SE DEVOLVIO TODO.
   *
   * Un pedido con una devolucion parcial sigue siendo una venta viva: quedan
   * cosas entregadas y dinero que si es de alguien. Marcarlo entero seria
   * borrar esa parte de la contabilidad.
   */
  const devueltoTodo = centavos === pedido.totalCentavos;

  if (devueltoTodo) {
    await db
      .update(pedidos)
      .set({ estado: "reembolsado", actualizadoEn: ahora })
      .where(eq(pedidos.id, pedido.id));
  }

  /* El rastro, con su autor: dentro de tres meses nadie se acuerda de quien
     autorizo devolver ni por que. */
  await db.insert(hitosPedido).values({
    id: nanoid(),
    pedidoId: pedido.id,
    hito: devueltoTodo ? "reembolsado" : "reembolso_parcial",
    hechoPorId: usuario?.id ?? null,
    hechoPorNombre: usuario?.name ?? null,
    creadoEn: ahora,
  });

  revalidatePath("/[locale]/panel", "layout");

  return {
    ok: true,
    mensaje: t("devolucionHecha", {
      monto: (centavos / 100).toFixed(2),
    }),
  };
}
