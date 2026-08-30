"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { itemsPedido, pagos, pedidos } from "@/lib/db/schema";
import { COMISION_TARJETA_PB, calcularComisionCentavos } from "@/lib/dinero";
import { getStripe, stripeConfigurado } from "@/lib/stripe";
import { sufijoDelExtracto } from "@/lib/pagos/descriptor";
import { montoParaStripe } from "@/lib/stripe/monedas";
import { anotarEnBitacora } from "@/lib/pagos/bitacora";

/**
 * El intento de pago con tarjeta de un pedido.
 *
 * SE REUTILIZA, NO SE DUPLICA. Si el cliente recarga la página o vuelve
 * mañana, se le devuelve el mismo intento en vez de crear uno nuevo: cada
 * intento suelto en Stripe es un cobro fantasma esperando confirmarse dos
 * veces. La referencia vive en la tabla `pagos`.
 *
 * EL MONTO SALE DEL PEDIDO EN LA BASE, jamás del navegador. Y el intento
 * guarda el pedido en su metadata: es lo que el webhook usa después para
 * saber qué acreditar.
 */
export type IntentoDePago =
  | { ok: true; clientSecret: string; clavePublica: string }
  | { ok: false; sinConfigurar?: boolean };

export async function crearIntentoDePago(
  numero: string,
): Promise<IntentoDePago> {
  if (!stripeConfigurado()) return { ok: false, sinConfigurar: true };

  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) return { ok: false };

  const db = getDb();
  const { env } = getCloudflareContext();

  const [pedido] = await db
    .select({
      id: pedidos.id,
      numero: pedidos.numero,
      totalCentavos: pedidos.totalCentavos,
      /* La moneda viaja al intento: CLP y COP se cobran tal cual. */
      moneda: pedidos.moneda,
      estado: pedidos.estado,
      clienteId: pedidos.clienteId,
      metodoPago: pedidos.metodoPago,
    })
    .from(pedidos)
    .where(eq(pedidos.numero, numero))
    .limit(1);

  // Solo el dueño del pedido, solo si sigue por pagar, solo si es de tarjeta.
  if (
    !pedido ||
    pedido.clienteId !== usuario.id ||
    pedido.estado !== "pendiente_pago" ||
    pedido.metodoPago !== "stripe" ||
    pedido.totalCentavos <= 0
  ) {
    return { ok: false };
  }

  const stripe = getStripe();

  // ¿Ya hay un intento vivo para este pedido? Se devuelve ese.
  const [previo] = await db
    .select({ referenciaExterna: pagos.referenciaExterna })
    .from(pagos)
    .where(
      and(
        eq(pagos.pedidoId, pedido.id),
        eq(pagos.metodo, "stripe"),
        eq(pagos.estado, "pendiente"),
      ),
    )
    .limit(1);

  if (previo?.referenciaExterna) {
    const intento = await stripe.paymentIntents
      .retrieve(previo.referenciaExterna)
      .catch(() => null);

    if (
      intento?.client_secret &&
      intento.amount ===
        montoParaStripe(pedido.totalCentavos, pedido.moneda ?? "USD") &&
      (intento.status === "requires_payment_method" ||
        intento.status === "requires_confirmation" ||
        intento.status === "requires_action")
    ) {
      return {
        ok: true,
        clientSecret: intento.client_secret,
        clavePublica: env.STRIPE_CLAVE_PUBLICA!,
      };
    }

    /**
     * EL INTENTO GUARDADO YA NO SIRVE: SE CIERRA.
     *
     * ══ POR QUÉ (13 ago 2026, al cambiar de cuenta de Stripe) ══
     *
     * Un intento creado con las claves de la sociedad anterior **no existe**
     * para las claves nuevas: Stripe contesta «no encontrado» y el `catch` de
     * arriba lo deja en null. Sin esto, la fila seguía marcada `pendiente`, y
     * como es la primera que devuelve la consulta, **cada vez que el comprador
     * abría su pedido se creaba un intento nuevo**: uno por recarga, todos
     * colgando en Stripe.
     *
     * También pasa sin cambiar de cuenta, cuando el intento caduca o el monto
     * del pedido cambió.
     *
     * Se marca `rechazado` porque es la verdad: por esa referencia ya no puede
     * entrar dinero. Y así deja de contarse como un cobro en el aire — que es
     * lo que hace que un pedido parezca tener dos pagos pendientes.
     */
    await db
      .update(pagos)
      .set({ estado: "rechazado", actualizadoEn: new Date() })
      .where(
        and(
          eq(pagos.referenciaExterna, previo.referenciaExterna),
          eq(pagos.estado, "pendiente"),
        ),
      );
  }

  const desglose = await desglosarPedido(pedido.id);

  /**
   * ══ LA MONEDA ES LA DEL PEDIDO (27 ago 2026) ══
   *
   * mercatren.cl vende en pesos chilenos y .com.co en colombianos. Cobrar
   * «usd» fijo a un pedido de 96.742 CLP habría intentado cobrar NOVENTA Y
   * SEIS MIL DÓLARES. Y el monto pasa por la ADUANA de `montoParaStripe`:
   * la suposición de que CLP y COP eran iguales para Stripe dejó la
   * MT-000010 imposible de pagar — Stripe trata el peso colombiano CON dos
   * decimales, y 65423 tal cual le llegó como 654,23 pesos.
   */
  /* ══ EL CREATE VA EN SU TRY, Y EL MOTIVO A LA BITÁCORA (30 ago 2026) ══
     La MT-000010 murió aquí sin dejar rastro: Stripe rechazó el intento
     (654,23 COP, bajo su mínimo) y la acción reventó con un error genérico.
     Ahora el rechazo queda ESCRITO con el mensaje entero de Stripe y el
     comprador recibe un aviso honesto en vez de una pantalla rota. */
  let intento: import("stripe").Stripe.PaymentIntent | undefined;
  try {
    const intento = await stripe.paymentIntents.create({
      amount: montoParaStripe(pedido.totalCentavos, pedido.moneda ?? "USD"),
      currency: (pedido.moneda ?? "USD").toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        // El webhook lee estos dos para saber qué pedido acreditar.
        pedidoId: pedido.id,
        numero: pedido.numero,
        // Y estos tres son para la contabilidad. Ver el comentario de abajo.
        ingreso_bruto_centavos: String(pedido.totalCentavos),
        costo_mercancia_centavos: String(desglose.costoMercanciaCentavos),
        margen_bruto_centavos: String(desglose.margenBrutoCentavos),
      },
      description: `Mercatren · ${pedido.numero}`,
      /* Lo que el comprador ve en su estado de cuenta, junto al prefijo de la
         cuenta: `MERCATREN* MT-000003`. Va el número del pedido y no la marca
         otra vez, que es lo único que le deja saber DE CUÁL compra se trata tres
         semanas después. Un cargo que no se reconoce se reclama, y cada
         contracargo cuesta la venta, la comisión y la multa. */
      statement_descriptor_suffix: sufijoDelExtracto(pedido.numero),
    });
    await anotarEnBitacora({
      pedidoId: pedido.id,
      metodo: "stripe",
      paso: "intento_creado",
      detalle: `${intento.id} · ${pedido.totalCentavos} ${pedido.moneda ?? "USD"} (amount ${intento.amount} ${intento.currency})`,
    });
  } catch (fallo) {
    await anotarEnBitacora({
      pedidoId: pedido.id,
      metodo: "stripe",
      paso: "intento_rechazado",
      detalle: fallo instanceof Error ? fallo.message : String(fallo),
    });
    return { ok: false };
  }

  if (!intento?.client_secret) return { ok: false };

  await db.insert(pagos).values({
    id: `pago-${nanoid(12)}`,
    pedidoId: pedido.id,
    metodo: "stripe",
    estado: "pendiente",
    montoCentavos: pedido.totalCentavos,
    referenciaExterna: intento.id,
  });

  return {
    ok: true,
    clientSecret: intento.client_secret,
    clavePublica: env.STRIPE_CLAVE_PUBLICA!,
  };
}

/**
 * EL DESGLOSE CONTABLE DE UN PEDIDO: qué parte del cobro es ingreso propio y
 * qué parte es costo de la mercancía.
 *
 * ═══ POR QUÉ ESTO VA EN CADA COBRO (7 ago 2026) ═══
 *
 * Stripe le reporta al IRS el **bruto** de todo lo que entró por la cuenta —
 * el formulario 1099-K trae el total, nunca el margen. Eso es correcto y es lo
 * que tiene que pasar: Windoce, LLC es quien vende, así que los $103 completos
 * de una venta de $103 son ingreso propio.
 *
 * La separación entre lo que es ingreso y lo que es costo NO la hace Stripe:
 * la hace la declaración de la sociedad, restando el costo de la mercancía
 * vendida del ingreso bruto. Sobre esa resta se pagan impuestos.
 *
 *   Ingreso bruto ($103) − Costo de mercancía ($100) = Margen ($3)
 *
 * Declarar solo el margen sería el error caro: Stripe reporta el bruto, la
 * declaración diría otra cosa, y esa diferencia es exactamente lo que dispara
 * una auditoría por descuadre.
 *
 * LO QUE HACE ESTA FUNCIÓN es dejar la resta ya escrita **dentro de cada cobro
 * de Stripe**, para que al conciliar el 1099-K no haya que reconstruirla a
 * mano pedido por pedido: cada cargo trae su bruto, su costo y su margen.
 *
 * NO CAMBIA UN CENTAVO de lo que se cobra ni de lo que Stripe reporta. Es el
 * papel de trabajo del contador, adjunto a la operación que describe.
 *
 * OJO — NO SE USA STRIPE CONNECT NI PAGO DIVIDIDO, y es a propósito. Un cobro
 * dividido (`transfer_data` + `application_fee_amount`) le diría a Stripe que
 * el dinero es del comercio y que nosotros nos quedamos una comisión: el
 * 1099-K del bruto le saldría AL COMERCIO y a nosotros solo el de la comisión.
 * Esa es la figura de intermediario que el abogado desarmó el 5 ago 2026.
 * Aquí se compra y se revende, así que el cobro entero es nuestro y el pago al
 * comercio es un costo aparte.
 */
async function desglosarPedido(pedidoId: string): Promise<{
  costoMercanciaCentavos: number;
  margenBrutoCentavos: number;
}> {
  const renglones = await getDb()
    .select({
      tiendaId: itemsPedido.tiendaId,
      subtotalCentavos: itemsPedido.subtotalCentavos,
    })
    .from(itemsPedido)
    .where(eq(itemsPedido.pedidoId, pedidoId));

  /* El margen se calcula POR COMERCIO y no sobre el total, igual que al
     acreditar en el webhook. Sobre el total daría un centavo distinto por el
     redondeo, y entonces el papel de trabajo no cuadraría con lo que de
     verdad se le pagó a cada comercio. */
  const porTienda = new Map<string, number>();
  for (const r of renglones) {
    if (!r.tiendaId) continue;
    porTienda.set(
      r.tiendaId,
      (porTienda.get(r.tiendaId) ?? 0) + Number(r.subtotalCentavos),
    );
  }

  let margenBrutoCentavos = 0;
  let brutoMercanciaCentavos = 0;
  for (const bruto of porTienda.values()) {
    brutoMercanciaCentavos += bruto;
    margenBrutoCentavos += calcularComisionCentavos(bruto, COMISION_TARJETA_PB);
  }

  return {
    costoMercanciaCentavos: brutoMercanciaCentavos - margenBrutoCentavos,
    margenBrutoCentavos,
  };
}
