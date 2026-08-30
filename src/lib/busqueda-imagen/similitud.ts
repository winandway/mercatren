/**
 * LA MATEMÁTICA DEL BUSCADOR VISUAL — pura, para poder probarla.
 *
 * ══ CÓMO FUNCIONA UN BUSCADOR DE IMÁGENES DE VERDAD (30 ago 2026) ══
 *
 * Investigado en la fuente antes de escribir una línea: todos los buscadores
 * de imagen serios (Google Lens, Amazon, los motores CLIP de código abierto)
 * hacen lo mismo — convierten cada imagen en un VECTOR (embedding) con un
 * modelo de visión, y buscar es encontrar los vectores más cercanos por
 * similitud de coseno. Nada de palabras: la imagen entera es la consulta.
 *
 * Aquí los vectores los da `gemini-embedding-2` (multimodal, la misma llave
 * del traductor) y vienen NORMALIZADOS del modelo, así que el coseno se
 * reduce al producto punto — una multiplicación por dimensión.
 */

/** Dimensión de los vectores. 256 (Matryoshka) equilibra precisión y peso:
    cada producto pesa 1 KB y el índice entero de un mercado cabe en la
    memoria del worker. Subirla exige reindexar — es un botón, no un drama. */
export const DIMENSION = 256;

/** El piso de parecido: por debajo, el producto NO se enseña como match
    visual. Calibrado bajo a propósito — el orden ya pone lo mejor primero y
    cortar de más esconde el producto que sí era. */
export const UMBRAL_DE_PARECIDO = 0.35;

export function productoPunto(a: Float32Array, b: Float32Array): number {
  const n = Math.min(a.length, b.length);
  let suma = 0;
  for (let i = 0; i < n; i += 1) suma += a[i]! * b[i]!;
  return suma;
}

/** De vector a BLOB para la base, y de vuelta. Little-endian explícito:
    un índice escrito en una máquina tiene que leerse igual en el borde. */
export function vectorABytes(v: Float32Array): Uint8Array {
  const bytes = new Uint8Array(v.length * 4);
  const vista = new DataView(bytes.buffer);
  for (let i = 0; i < v.length; i += 1) vista.setFloat32(i * 4, v[i]!, true);
  return bytes;
}

export function bytesAVector(bytes: Uint8Array): Float32Array {
  const vista = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const v = new Float32Array(Math.floor(bytes.byteLength / 4));
  for (let i = 0; i < v.length; i += 1) v[i] = vista.getFloat32(i * 4, true);
  return v;
}

export type VecinoVisual = { id: string; parecido: number };

/**
 * Los K productos más parecidos a la consulta, ya filtrados por el umbral y
 * ordenados del más parecido al menos.
 */
export function masParecidos(
  consulta: Float32Array,
  indice: Array<{ id: string; vector: Float32Array }>,
  k: number,
): VecinoVisual[] {
  const puntuados: VecinoVisual[] = [];
  for (const entrada of indice) {
    const parecido = productoPunto(consulta, entrada.vector);
    if (parecido >= UMBRAL_DE_PARECIDO) {
      puntuados.push({ id: entrada.id, parecido });
    }
  }
  puntuados.sort((a, b) => b.parecido - a.parecido);
  return puntuados.slice(0, k);
}
