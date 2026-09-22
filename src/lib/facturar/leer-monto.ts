/**
 * ══ LEER EL MONTO QUE ESCRIBE UNA PERSONA (21 sep 2026) ══
 *
 * Richard escribió **6.483,77** en «Cuadrar factura» y el sistema entendió
 * **$6,48**: hizo `replace(",", ".")` sobre `6.483,77`, quedó `6.483.77`, y
 * `parseFloat` corta en el segundo punto. La pantalla no avisó de nada — hizo
 * la cuenta entera con seis dólares y medio, y él estaba emitiendo una
 * factura de seis mil.
 *
 * En una pantalla de dinero no se puede adivinar mal en silencio. Aquí se
 * interpreta como lo hace una persona:
 *
 * - **El ÚLTIMO separador manda.** En `6.483,77` la coma va después: es la
 *   decimal, y el punto son miles. En `6,483.77` es al revés. Es la regla que
 *   usa cualquiera al leer, y no depende del idioma del navegador.
 * - **Un solo separador con tres cifras detrás son MILES** (`6.483` = seis mil
 *   cuatrocientos ochenta y tres), salvo que la persona haya escrito más de
 *   un grupo (`1.234.567`) o menos de tres decimales (`6.48` = seis con 48).
 * - **Lo que no se entiende, no se inventa**: devuelve `null` y la pantalla
 *   avisa, en vez de cobrar un número que nadie escribió.
 */

/** El monto en centavos enteros, o `null` si el texto no es un número. */
export function leerMontoEnCentavos(texto: string): number | null {
  const limpio = texto.replace(/[^\d.,]/g, "");
  if (!limpio || !/\d/.test(limpio)) return null;

  const ultimaComa = limpio.lastIndexOf(",");
  const ultimoPunto = limpio.lastIndexOf(".");
  let entero = limpio;
  let decimales = "";

  if (ultimaComa >= 0 || ultimoPunto >= 0) {
    const corte = Math.max(ultimaComa, ultimoPunto);
    const detras = limpio.slice(corte + 1);
    const soloUno = ultimaComa < 0 || ultimoPunto < 0;
    const cuantos = (limpio.match(/[.,]/g) ?? []).length;

    /* Un único separador con exactamente tres cifras detrás es de MILES
       (`6.483`, `1,250`) — salvo que haya varios (`1.234.567`, que también
       son miles) o que las cifras de detrás no sean tres (`6.48`, `6,4837`). */
    const esDeMiles = soloUno && cuantos === 1 && detras.length === 3;

    if (esDeMiles) {
      entero = limpio;
      decimales = "";
    } else {
      entero = limpio.slice(0, corte);
      decimales = detras;
    }
  }

  const soloDigitos = entero.replace(/[.,]/g, "");
  if (!/^\d*$/.test(decimales)) return null;
  if (soloDigitos === "" && decimales === "") return null;

  /* Se redondea al centavo: quien escribe tres decimales en dólares se pasó
     de teclas, y cobrar la fracción de centavo no existe. */
  const valor = Number(`${soloDigitos || "0"}.${decimales || "0"}`);
  if (!Number.isFinite(valor)) return null;
  return Math.round(valor * 100);
}
