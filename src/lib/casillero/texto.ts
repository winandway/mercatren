/**
 * Comparar nombres que no están escritos igual.
 *
 * Se usa SOLO para *sugerirle* candidatos al operario de la bodega. El
 * sistema **nunca** auto-asigna un paquete por parecido de nombre: hay
 * homónimos, y familias enteras que comparten apellido y ciudad. Un
 * «JUAN PEREZ» no es prueba de nada.
 */

/** Mayúsculas, sin tildes, sin puntuación, espacios colapsados. */
export function normalizarNombre(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function bigramas(texto: string): Map<string, number> {
  const limpio = texto.replace(/\s+/g, "");
  const mapa = new Map<string, number>();
  for (let i = 0; i < limpio.length - 1; i++) {
    const par = limpio.slice(i, i + 2);
    mapa.set(par, (mapa.get(par) ?? 0) + 1);
  }
  return mapa;
}

/** Sørensen–Dice sobre bigramas: 0 = nada en común, 1 = idéntico. */
export function similitudDice(a: string, b: string): number {
  if (a === b) return 1;
  const ba = bigramas(a);
  const bb = bigramas(b);
  if (ba.size === 0 || bb.size === 0) return 0;
  let comunes = 0;
  let totalA = 0;
  let totalB = 0;
  for (const n of ba.values()) totalA += n;
  for (const n of bb.values()) totalB += n;
  for (const [par, n] of ba) {
    const m = bb.get(par);
    if (m) comunes += Math.min(n, m);
  }
  return (2 * comunes) / (totalA + totalB);
}

/** Palabras compartidas: tolera el orden invertido y los nombres de más. */
function similitudPalabras(a: string, b: string): number {
  const pa = new Set(a.split(" ").filter((p) => p.length > 1));
  const pb = new Set(b.split(" ").filter((p) => p.length > 1));
  if (pa.size === 0 || pb.size === 0) return 0;
  let comunes = 0;
  for (const p of pa) if (pb.has(p)) comunes++;
  return comunes / Math.min(pa.size, pb.size);
}

/**
 * Cuánto se parecen dos nombres, de 0 a 1.
 *
 * Combina las dos medidas porque fallan en casos distintos: los bigramas
 * aguantan las erratas del lector óptico («RODRIGUFZ»), y las palabras
 * compartidas aguantan «PEREZ JUAN» contra «JUAN PEREZ GOMEZ», que para
 * los bigramas son bastante distintos.
 */
export function similitudNombres(a: string, b: string): number {
  const na = normalizarNombre(a);
  const nb = normalizarNombre(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  return Math.max(similitudDice(na, nb), similitudPalabras(na, nb) * 0.95);
}
