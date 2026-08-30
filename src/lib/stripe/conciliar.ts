"use server";

import { and, eq } from "drizzle-orm";

import { esEquipoInterno, obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { pagos, pedidos } from "@/lib/db/schema";
import { mensajes } from "@/lib/mensajes";
import { getStripe, stripeConfigurado } from "@/lib/stripe";
import { acreditarPagoConTarjeta } from "@/lib/stripe/acreditar";
import { cobroConfirmado } from "@/lib/stripe/estado-intento";
import { montoDesdeStripe } from "@/lib/stripe/monedas";

/**
 * EL RESPALDO PARA QUE UN COBRO CON TARJETA NO SE PIERDA.
 *
 * ══ EL AGUJERO QUE TAPA ══
 *
 * Todo el cobro con tarjeta dependía de que llegara el aviso de Stripe. Y si
 * no llega —una caída del servicio, una dirección mal configurada, una ventana
 * de despliegue— **nadie se entera**: el comprador pagó, el pedido se queda en
 * «esperando el pago» para siempre, no se descuenta stock, no se le acredita
 * al comercio, no se emite factura, y no salta ninguna alarma.
 *
 * Es el lado seguro del fallo —nunca se despacha sin cobrar— pero es una venta
 * perdida y un cliente escribiendo para preguntar qué pasó.
 *
 * ══ POR QUÉ NO HACE FALTA UN CRON ══
 *
 * El momento en que esto importa es exactamente el momento en que el comprador
 * abre su pedido a ver qué pasó. Ahí se le pregunta a Stripe. Un proceso
 * periódico repasando pedidos viejos costaría más y llegaría más tarde que la
 * persona que ya está mirando la pantalla.
 *
 * ══ POR QUÉ ES SEGURO LLAMARLO DE MÁS ══
 *
 * Acredita con la MISMA función del webhook, que es idempotente: el pedido
 * solo se toca si sigue en `pendiente_pago`, y ese estado va dentro del WHERE.
 * Si el aviso de Stripe entra en el mismo segundo, uno de los dos no encuentra
 * nada que hacer.
 *
 * ══ Y POR QUÉ NUNCA TUMBA LA PÁGINA ══
 *
 * Si Stripe no responde, se devuelve «no se pudo comprobar» y la página del
 * pedido se dibuja igual. Un servicio ajeno lento no puede dejar a un cliente
 * sin ver su compra.
 */

export type ResultadoConciliacion =
  | { estado: "acreditado" }
  | { estado: "sin_cambios" }
  | { estado: "no_aplica" }
  | { estado: "no_se_pudo" };

/**
 * Comprueba contra Stripe si el pedido ya está cobrado y, si lo está, lo
 * acredita.
 *
 * No exige sesión a propósito: lo llama la página del pedido, que ya comprobó
 * que quien mira es el dueño. Lo único que hace falta es el número del pedido,
 * y con él no se puede provocar nada que Stripe no confirme.
 */
export async function conciliarPedido(
  numero: string,
): Promise<ResultadoConciliacion> {
  if (!stripeConfigurado()) return { estado: "no_aplica" };

  try {
    const db = getDb();

    const [pedido] = await db
      .select({
        id: pedidos.id,
        estado: pedidos.estado,
        metodoPago: pedidos.metodoPago,
      })
      .from(pedidos)
      .where(eq(pedidos.numero, numero))
      .limit(1);

    // Solo tiene sentido para un pedido de tarjeta que sigue sin pagar.
    if (
      !pedido ||
      pedido.metodoPago !== "stripe" ||
      pedido.estado !== "pendiente_pago"
    ) {
      return { estado: "no_aplica" };
    }

    const [intento] = await db
      .select({ referencia: pagos.referenciaExterna })
      .from(pagos)
      .where(
        and(
          eq(pagos.pedidoId, pedido.id),
          eq(pagos.metodo, "stripe"),
          eq(pagos.estado, "pendiente"),
        ),
      )
      .limit(1);

    if (!intento?.referencia) return { estado: "no_aplica" };

    const enStripe = await getStripe().paymentIntents.retrieve(
      intento.referencia,
    );

    if (!cobroConfirmado(enStripe.status)) return { estado: "sin_cambios" };

    /* El amount de Stripe pasa por la aduana: en COP viene con dos decimales
       y el interno va en pesos enteros. */
    await acreditarPagoConTarjeta(
      pedido.id,
      enStripe.id,
      montoDesdeStripe(enStripe.amount, enStripe.currency),
    );
    return { estado: "acreditado" };
  } catch (fallo) {
    console.error("[stripe] no se pudo conciliar", numero, fallo);
    return { estado: "no_se_pudo" };
  }
}

/**
 * Lo mismo, pero disparado a mano por el equipo desde la ficha del pedido.
 *
 * Existe aparte porque devuelve un mensaje para la pantalla y porque **exige
 * ser del equipo**: la versión de arriba la llama la página del comprador con
 * su propia comprobación de dueño, y no se le puede dar a cualquiera un botón
 * que hable con Stripe.
 */
export async function comprobarElCobro(
  numero: string,
): Promise<{ ok: boolean; mensaje: string }> {
  const t = await mensajes();

  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario || !(await esEquipoInterno())) {
    return { ok: false, mensaje: t("sinPermiso") };
  }

  const r = await conciliarPedido(numero);

  return {
    ok: r.estado === "acreditado",
    mensaje: t(`conciliacion.${r.estado}`),
  };
}
