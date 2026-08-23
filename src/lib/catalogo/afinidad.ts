/**
 * QUÉ ESTÁ BUSCANDO LA PERSONA — la parte pura de «seguirle mostrando».
 *
 * ══ LA IDEA, EN PALABRAS DEL DUEÑO ══
 *
 * «Si una mujer abrió un pintalabios y vio otro pintalabios y otro, cuando
 * navegue hacia otro lado, seguirle mostrando pintalabios. Pero si ya se varía
 * a otro —abre zapatos— seguirle mostrando zapatos.»
 *
 * ══ CÓMO SE DECIDE ══
 *
 * Se guardan las últimas fichas que abrió (en su propio navegador, nada sale
 * de ahí). La categoría que manda es:
 *
 *   1. Si las DOS últimas fichas son de la misma categoría → esa. Es el caso
 *      «ya se pasó a zapatos»: el interés más reciente gana aunque antes
 *      hubiera visto cinco pintalabios.
 *   2. Si no, la categoría que se repite al menos DOS veces entre las últimas
 *      ocho, la más reciente de ellas. Una sola visita no es una intención:
 *      se abre un producto por curiosidad todo el tiempo.
 *   3. Si no hay ninguna con dos, no hay afinidad y no se enseña nada. Mejor
 *      nada que una banda al azar con un título que promete.
 *
 * ══ POR QUÉ ESTÁ APARTE Y ES PURO ══
 *
 * Esta decisión la tiene que poder probar una prueba de unidad, sin navegador
 * ni almacenamiento: es la regla de negocio de «la tienda que sabe vender».
 */

export type Vista = {
  slug: string;
  categoriaSlug: string | null;
  categoriaNombre: string | null;
  tiendaSlug: string;
  /** Cuándo se abrió, en milisegundos. Solo para ordenar. */
  en: number;
};

/** Cuántas fichas se recuerdan. Más no aporta y llena el almacenamiento. */
export const MAXIMO_VISTAS = 12;
/** Cuántas de las últimas se miran para buscar una categoría repetida. */
export const VENTANA = 8;
/** Cuántas veces tiene que repetirse una categoría para contar como interés. */
export const MINIMO_REPETICIONES = 2;

/**
 * Agrega una visita al historial. La más nueva va PRIMERO; si el producto ya
 * estaba, sube al frente (volver a abrirlo es volver a interesarse).
 */
export function registrarVista(
  vistas: readonly Vista[],
  nueva: Vista,
  maximo = MAXIMO_VISTAS,
): Vista[] {
  const sinRepetir = vistas.filter((v) => v.slug !== nueva.slug);
  return [nueva, ...sinRepetir].slice(0, Math.max(1, maximo));
}

export type Afinidad = { slug: string; nombre: string | null };

/** La categoría que está mirando la persona, o null si no hay señal clara. */
export function categoriaDominante(vistas: readonly Vista[]): Afinidad | null {
  const conCategoria = vistas.filter(
    (v): v is Vista & { categoriaSlug: string } => Boolean(v.categoriaSlug),
  );
  if (conCategoria.length < MINIMO_REPETICIONES) return null;

  /* 1. Las dos últimas iguales: el interés más reciente manda. */
  const [a, b] = conCategoria;
  if (a && b && a.categoriaSlug === b.categoriaSlug) {
    return { slug: a.categoriaSlug, nombre: a.categoriaNombre };
  }

  /* 2. La categoría repetida más reciente dentro de la ventana. */
  const ventana = conCategoria.slice(0, VENTANA);
  const veces = new Map<string, number>();
  for (const v of ventana) {
    veces.set(v.categoriaSlug, (veces.get(v.categoriaSlug) ?? 0) + 1);
  }
  const ganadora = ventana.find(
    (v) => (veces.get(v.categoriaSlug) ?? 0) >= MINIMO_REPETICIONES,
  );
  return ganadora
    ? { slug: ganadora.categoriaSlug, nombre: ganadora.categoriaNombre }
    : null;
}

/** Quita de una lista lo que la persona ya abrió: enseñárselo otra vez no vende. */
export function sinLoYaVisto<T extends { slug: string }>(
  productos: readonly T[],
  vistas: readonly Vista[],
): T[] {
  const vistos = new Set(vistas.map((v) => v.slug));
  return productos.filter((p) => !vistos.has(p.slug));
}
