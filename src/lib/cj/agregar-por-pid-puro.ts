/**
 * ══ LEER EL DETALLE DE CJ SIN CONFIAR EN SU FORMA ══
 *
 * `/product/query` devuelve el precio como texto («3.61», a veces un rango
 * «3.61 -- 5.00»), la imagen como una URL suelta o como un arreglo JSON
 * dentro de un string, y las variantes con su propio precio. Estas tres
 * funciones son puras y con pruebas porque de ellas sale el costo con el
 * que se fija el precio publicado.
 */

const numero = (v: unknown): number | null => {
  const n = Number(
    String(v ?? "")
      .trim()
      .split(/[\s-]+/)[0],
  );
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * El costo en centavos: el MÍNIMO entre las variantes con precio, y si no
 * hay variantes, el primer número del `sellPrice`. Se toma el mínimo por la
 * misma razón que el importador: un precio en rango se publica por el
 * mínimo, y el comprador elige la variante que le corresponda.
 */
export function costoMinimoCentavos(
  sellPrice: unknown,
  variantes: ReadonlyArray<{ variantSellPrice?: unknown }> = [],
): number {
  const deVariantes = variantes
    .map((v) => numero(v.variantSellPrice))
    .filter((n): n is number => n !== null);
  const base =
    deVariantes.length > 0 ? Math.min(...deVariantes) : numero(sellPrice);
  return base === null ? 0 : Math.round(base * 100);
}

/** La primera foto: URL suelta, lista separada por comas, o arreglo JSON en texto. */
export function primeraImagen(productImage: unknown): string | null {
  if (Array.isArray(productImage)) {
    const u = productImage.find((x) => typeof x === "string" && x.trim());
    return typeof u === "string" ? u.trim() : null;
  }
  const texto = String(productImage ?? "").trim();
  if (!texto) return null;
  if (texto.startsWith("[")) {
    try {
      const lista = JSON.parse(texto) as unknown;
      return primeraImagen(lista);
    } catch {
      /* no era JSON: sigue como texto */
    }
  }
  const primera = texto.split(",")[0]?.trim() ?? "";
  return /^https?:\/\//i.test(primera) ? primera : null;
}

/** Cuánto hay en total en el almacén: la suma de las variantes con stock. */
export function existenciasDeVariantes(
  variantes: ReadonlyArray<Record<string, unknown>>,
  stockDe: (v: Record<string, unknown>) => number,
): number {
  return variantes.reduce((t, v) => t + stockDe(v), 0);
}
