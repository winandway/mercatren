/**
 * ══ EL CÓDIGO DE CASILLERO: 5 DÍGITOS + VERIFICADOR LUHN ══
 *
 * Un cliente compra en Amazon y pone NUESTRA dirección de Miami con su
 * código. La caja llega a la bodega y **nadie vio esa compra**: hay que
 * saber de quién es en menos de treinta segundos, leyendo una etiqueta.
 *
 * El dígito verificador existe para UNA cosa: que un dígito mal leído por
 * el lector óptico **falle la validación** en vez de asignarle el paquete a
 * otro cliente. Asignar mal es peor que no asignar — el segundo caso es una
 * cola de excepciones; el primero es la caja de una persona en manos de
 * otra, y no hay forma de saberlo hasta que alguien reclama.
 *
 * En la etiqueta el código va DOS VECES (pegado al nombre y en la línea 2)
 * porque Amazon normaliza las direcciones contra la base de USPS y a veces
 * borra la línea 2.
 */

/**
 * ══ EL PREFIJO ES «BW», POR BESTWAY ══
 *
 * Decisión de Richard (9 sep 2026). La bodega de Miami la opera **BESTWAY
 * GROUP INTL. CORP.**, que es quien firma el recibo ante UPS y FedEx: el
 * código que va en la etiqueta tiene que ser el de la casa que recibe, no
 * el de la tienda que vende. Para el cliente sigue siendo su casillero de
 * Mercatren, y así se lo dice la pantalla.
 *
 * Corto a propósito: son ocho caracteres con el guion. En una etiqueta de
 * Amazon, pegado al nombre y con el espacio contado, cada carácter de más
 * es un carácter que la tienda puede recortar.
 */
export const PREFIJO_CASILLERO = "BW";

/** Empieza en 10000 para que el largo sea siempre de 5 dígitos. */
const BASE_INICIAL = 10_000;
const BASE_MAXIMA = 99_999;

/** Acepta «BW-104281», «BW 104281», «BW.104281», «bw104281». */
export const RE_CASILLERO = /\bBW[\s\-–—._]?(\d{5})(\d)\b/i;

/** Dígito verificador Luhn de una base numérica en texto. */
export function digitoLuhn(base: string): number {
  let suma = 0;
  /* El verificador ocupará la posición par contando desde la derecha. */
  let doble = true;
  for (let i = base.length - 1; i >= 0; i--) {
    let d = base.charCodeAt(i) - 48;
    if (d < 0 || d > 9) throw new Error(`Base no numérica: ${base}`);
    if (doble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    suma += d;
    doble = !doble;
  }
  return (10 - (suma % 10)) % 10;
}

/** El código a partir de la secuencia del casillero (0, 1, 2, …). */
export function generarCodigoCasillero(secuencia: number): string {
  if (!Number.isInteger(secuencia) || secuencia < 0) {
    throw new Error(`Secuencia inválida: ${secuencia}`);
  }
  const numero = BASE_INICIAL + secuencia;
  if (numero > BASE_MAXIMA) {
    /* Noventa mil casilleros. Cuando se acabe hay que ampliar la base Y el
       regex a la vez: emitir uno de seis dígitos con el regex de cinco lo
       haría invisible para el lector de la bodega. */
    throw new Error(
      "Se agotó el rango de 5 dígitos: hay que ampliar la base y el regex antes de seguir emitiendo casilleros.",
    );
  }
  const base = String(numero);
  return `${PREFIJO_CASILLERO}-${base}${digitoLuhn(base)}`;
}

/** Cualquier escritura del código, llevada a la forma «MTR-104281». */
export function normalizarCodigo(texto: string): string | null {
  const m = RE_CASILLERO.exec(texto);
  if (!m) return null;
  return `${PREFIJO_CASILLERO}-${m[1]}${m[2]}`;
}

/** true solo si el código está en el texto Y su verificador cuadra. */
export function codigoValido(texto: string): boolean {
  const m = RE_CASILLERO.exec(texto);
  if (!m) return false;
  return digitoLuhn(m[1]!) === Number(m[2]);
}

/**
 * Saca el código del texto que devuelve el lector óptico. `null` si no hay
 * código o si el verificador no cuadra: un dígito mal leído no puede
 * terminar en el casillero de otro.
 */
export function extraerCodigo(textoOcr: string): string | null {
  if (!codigoValido(textoOcr)) return null;
  return normalizarCodigo(textoOcr);
}
