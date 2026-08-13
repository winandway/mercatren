import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import Stripe from "stripe";

/**
 * La conexion con Stripe. UNA SOLA CUENTA: la de la sociedad que vende.
 *
 * ══ NO ES STRIPE CONNECT, Y ESO ES LO IMPORTANTE DE ESTE ARCHIVO ══
 *
 * Aqui decia que el cobro se repartia con Connect —comision para nosotros, el
 * resto a la cuenta conectada del vendedor— y eso es exactamente lo que el
 * abogado desarmo el 5 de agosto de 2026. Nunca se programo asi; el comentario
 * quedo del primer boceto. Se corrige porque es el archivo que uno abre al
 * configurar las claves, y describia el modelo contrario al que opera.
 *
 * Mercatren COMPRA la mercancia y la REVENDE. El cobro entero es ingreso
 * propio y lo que se le paga al comercio es un costo aparte, con su factura.
 * Un cobro dividido (`transfer_data` + `application_fee_amount`) le diria a
 * Stripe justo lo contrario: que el dinero es del comercio y que nosotros nos
 * quedamos una comision. Con eso, el 1099-K del bruto le saldria AL COMERCIO y
 * a nosotros solo el de la comision — la figura de intermediario financiero que
 * se elimino a proposito, y la razon por la que los bancos cierran cuentas.
 *
 * Si alguien "arregla" esto poniendo Connect, deshace la reestructuracion
 * entera. La explicacion larga esta en el CLAUDE.md del proyecto.
 *
 * `tiendas.stripeCuentaId` sigue en el esquema sin usarse. Es deuda conocida.
 */
export function getStripe() {
  const { env } = getCloudflareContext();

  return new Stripe(env.STRIPE_SECRET_KEY, {
    // El adaptador de Cloudflare necesita el cliente basado en fetch.
    httpClient: Stripe.createFetchHttpClient(),
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

/**
 * ¿Está Stripe configurado? Sin la clave, la tarjeta no se ofrece y las
 * pantallas lo dicen — el patrón de todo el proyecto: apagarse solo, nunca
 * inventar.
 */
export function stripeConfigurado() {
  const { env } = getCloudflareContext();
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_CLAVE_PUBLICA);
}
