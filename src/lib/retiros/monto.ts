/**
 * El monto de un retiro, escrito por una persona.
 *
 * Llega como "1,000.50", "1000", "$1000" o "  25.5 ", y tiene que salir como
 * centavos enteros.
 *
 * SE CONVIERTE POR TEXTO, NO MULTIPLICANDO. En coma flotante 932.76 * 100 da
 * 93275.99999999999, y ese centavo perdido acaba siendo una diferencia real en
 * la cuenta de alguien. Pegando los decimales como texto no hay redondeo que
 * valga.
 *
 * Vive aparte de `acciones.ts` porque ese archivo es "use server" y ahí solo
 * pueden salir funciones asíncronas. De paso, así se puede probar sola.
 */
export function aCentavos(texto: string): number | null {
  const limpio = texto.replace(/[^0-9.]/g, "");
  if (!limpio) return null;

  // "1.2.3" no es un monto.
  if ((limpio.match(/\./g)?.length ?? 0) > 1) return null;

  const [enteros, decimales = ""] = limpio.split(".");

  // Más de dos decimales significa que quien escribió pensaba en otra cosa;
  // redondearle el dinero a alguien por nuestra cuenta no es opción.
  if (decimales.length > 2) return null;

  const centavos = Number(`${enteros || "0"}${decimales.padEnd(2, "0")}`);
  return Number.isSafeInteger(centavos) ? centavos : null;
}
