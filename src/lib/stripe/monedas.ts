import { divisorDe } from "@/lib/mercado/moneda";

/**
 * LA TRADUCCIÓN DE MONTOS ENTRE MERCATREN Y STRIPE (30 ago 2026).
 *
 * ══ EL FALLO QUE LA PARIÓ: LA MT-000010 NO SE PODÍA PAGAR ══
 *
 * La primera compra colombiana quedó «esperando el pago» para siempre. La
 * causa: nosotros guardamos el peso colombiano en pesos ENTEROS (divisor 1),
 * y el código asumió que para Stripe CLP y COP eran iguales — «zero-decimal,
 * el número viaja tal cual». ES FALSO PARA COP: en la tabla de Stripe el
 * peso chileno va SIN decimales pero el colombiano va CON DOS. El pedido de
 * 65.423 COP le llegó a Stripe como 654,23 pesos (~16 centavos de dólar):
 * por debajo de su cobro mínimo, el intento de pago muere al crearse y el
 * comprador nunca ve la pantalla de la tarjeta.
 *
 * ══ LA REGLA ══
 *
 * El formato INTERNO (unidad menor real: centavos USD, pesos enteros CLP y
 * COP) no cambia — es el de toda la base. Estas dos funciones son la ADUANA:
 * todo monto que SALE hacia Stripe pasa por `montoParaStripe` y todo monto
 * que VUELVE de Stripe pasa por `montoDesdeStripe`. Comparar o guardar un
 * `intento.amount` crudo es reintroducir el fallo.
 *
 * La lista de monedas sin decimales es LA DE STRIPE, copiada de su
 * documentación — no la nuestra (`divisorDe`), que dice cuántos decimales
 * tiene la moneda en la vida real. Son dos preguntas distintas y COP es
 * justo el caso donde difieren: en la calle no tiene centavos, en Stripe sí.
 */
const CERO_DECIMALES_EN_STRIPE = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

/** Cuántas unidades de Stripe vale UNA unidad mayor de la moneda. */
function divisorDeStripe(moneda: string): number {
  return CERO_DECIMALES_EN_STRIPE.has(moneda.trim().toUpperCase()) ? 1 : 100;
}

/** Del monto interno (unidad menor real) al `amount` que espera Stripe. */
export function montoParaStripe(centavosInternos: number, moneda: string) {
  const mayores = centavosInternos / divisorDe(moneda);
  return Math.round(mayores * divisorDeStripe(moneda));
}

/** Del `amount` que devuelve Stripe al monto interno de la base. */
export function montoDesdeStripe(amountDeStripe: number, moneda: string) {
  const mayores = amountDeStripe / divisorDeStripe(moneda);
  return Math.round(mayores * divisorDe(moneda));
}
