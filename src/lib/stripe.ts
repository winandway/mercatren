import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import Stripe from "stripe";

/**
 * Cobros de Mercatren con Stripe Connect.
 *
 * Como es un mercado con muchos vendedores, el cliente paga una sola vez y
 * Stripe reparte: la comision se queda en la cuenta de Mercatren y el resto va
 * a la cuenta conectada del vendedor (tiendas.stripeCuentaId).
 *
 * Aqui solo esta la conexion. El cobro, el reparto y los avisos se programan
 * cuando toque el modulo de pagos.
 */
export function getStripe() {
  const { env } = getCloudflareContext();

  return new Stripe(env.STRIPE_SECRET_KEY, {
    // El adaptador de Cloudflare necesita el cliente basado en fetch.
    httpClient: Stripe.createFetchHttpClient(),
    apiVersion: "2026-06-30.preview" as Stripe.LatestApiVersion,
    appInfo: {
      name: "Mercatren",
      url: "https://mercatren.com",
    },
  });
}

// Los calculos de comision viven en src/lib/dinero.ts para poder probarlos
// sin levantar Stripe ni el entorno del Worker.
export {
  calcularComisionCentavos,
  calcularNetoVendedorCentavos,
} from "@/lib/dinero";
