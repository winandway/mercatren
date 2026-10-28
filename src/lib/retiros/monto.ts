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
export function aCentavos(
  texto: string,
  /** Los decimales de la moneda: dos casi siempre, cero en pesos chilenos. */
  lugares = 2,
): number | null {
  const limpio = conPuntoDecimal(texto.replace(/[^0-9.,]/g, ""));
  if (!limpio) return null;

  // "1.2.3" no es un monto.
  if ((limpio.match(/\./g)?.length ?? 0) > 1) return null;

  const [enteros, decimales = ""] = limpio.split(".");

  // Más decimales de los que tiene la moneda significa que quien escribió
  // pensaba en otra cosa; redondearle el dinero a alguien no es opción.
  if (decimales.length > lugares) return null;

  const centavos = Number(`${enteros || "0"}${decimales.padEnd(lugares, "0")}`);
  return Number.isSafeInteger(centavos) ? centavos : null;
}

/**
 * ══ LA COMA DECIMAL DE ESPAÑA (27 oct 2026) ══
 *
 * Esto quitaba todo lo que no fuera cifra o punto, coma incluida. En Estados
 * Unidos da igual —la coma separa miles—, pero en España se escribe
 * «121,25»: quedaba «12125» y se leía como doce mil ciento veinticinco. Con
 * mucho saldo, alguien que pedía uno con cincuenta («1,50») pedía ciento
 * cincuenta.
 *
 * Se deja todo con PUNTO decimal y sin separador de miles, y el resto de
 * `aCentavos` sigue igual de estricto:
 *
 * - con coma y punto, manda el ÚLTIMO («1.234,56» y «1,234.56»);
 * - una sola coma es decimal («121,25»), salvo con tres cifras detrás;
 * - con tres cifras detrás, o varias comas, son miles («1,000»), como antes.
 */
function conPuntoDecimal(limpio: string): string {
  const coma = limpio.lastIndexOf(",");
  const punto = limpio.lastIndexOf(".");
  if (coma < 0) return limpio;

  if (punto >= 0) {
    // Los dos: el último es el decimal y el otro, de miles.
    return coma > punto
      ? limpio.replace(/\./g, "").replace(",", ".")
      : limpio.replace(/,/g, "");
  }

  /* Una sola coma es decimal salvo que lleve justo tres cifras detrás. Si
     lleva más decimales de los que tiene la moneda («5990,5» en pesos
     chilenos), `aCentavos` lo rechaza: leerlo como miles sería pedir diez
     veces más. */
  const detras = limpio.length - coma - 1;
  const unaSola = limpio.indexOf(",") === coma;
  return unaSola && detras !== 3
    ? limpio.replace(",", ".")
    : limpio.replace(/,/g, "");
}
