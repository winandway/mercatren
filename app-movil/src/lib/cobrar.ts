import {
  initPaymentSheet,
  initStripe,
  presentPaymentSheet,
} from "@stripe/stripe-react-native";

/**
 * LA HOJA DE PAGO DE STRIPE, en un solo sitio (la usan «Pagar» y «Mis
 * pedidos»). El intento lo crea SIEMPRE el servidor (`crearIntentoDePago`, con
 * el monto del pedido en la base); aquí solo se enseña. El cobro lo acredita
 * el aviso de Stripe al servidor, nunca la app.
 */
export type ResultadoDelCobro =
  | { tipo: "pagado" }
  | { tipo: "cancelado" }
  | { tipo: "error"; mensaje: string };

export async function cobrarConHoja(
  pago: { clientSecret: string; clavePublica: string },
  nombre?: string,
): Promise<ResultadoDelCobro> {
  await initStripe({
    publishableKey: pago.clavePublica,
    urlScheme: "mercatren",
  });
  const listo = await initPaymentSheet({
    merchantDisplayName: "Mercatren",
    paymentIntentClientSecret: pago.clientSecret,
    returnURL: "mercatren://stripe-redirect",
    defaultBillingDetails: nombre ? { name: nombre } : undefined,
  });
  if (listo.error) return { tipo: "error", mensaje: listo.error.message };
  const r = await presentPaymentSheet();
  if (r.error) {
    return r.error.code === "Canceled"
      ? { tipo: "cancelado" }
      : { tipo: "error", mensaje: r.error.message };
  }
  return { tipo: "pagado" };
}
