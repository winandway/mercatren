/**
 * LOS CONTEOS DEL CATÁLOGO, ARMADOS EN CÓDIGO (emergencia de costo, 17 sep 2026).
 *
 * Aquí no hay base de datos: entran los agregados baratos (cuántos productos
 * publicados hay por categoría, por tienda y por depósito) y sale lo que las
 * pantallas necesitan: la tira de departamentos con sus hijos sumados, el
 * menú de categorías, el directorio de comercios y los bombillos por ciudad.
 *
 * Es puro a propósito: se prueba sin base, y la única consulta que queda del
 * lado del servidor es un GROUP BY plano. La versión anterior hacía una
 * subconsulta correlacionada POR DEPARTAMENTO (22 recorridos del catálogo
 * entero por visita: 458.000 filas cada vez, 30 mil millones a la semana).
 */

/** Una categoría de la base: la nuestra (sin tienda) o la de un comercio. */
export type CategoriaPlana = {
  id: string;
  slug: string;
  nombreEs: string;
  nombreEn: string | null;
  padreId: string | null;
  tiendaId: string | null;
};

/** Cuántos productos publicados cuelgan DIRECTAMENTE de cada categoría. */
export type ConteoPorCategoria = ReadonlyMap<string, number>;

/**
 * Los departamentos raíz (los de Mercatren, sin tienda) con lo que cuelga
 * de ellos directamente MÁS lo de sus subcategorías, por slug.
 *
 * Solo un nivel de hijos, igual que la consulta que reemplaza: los productos
 * de Bley están en «PVC» y «Hierro», que cuelgan de «Ferretería y
 * construcción». Un nieto no existe hoy y no se inventa.
 */
export function armarDepartamentos(
  porCategoria: ConteoPorCategoria,
  categorias: readonly CategoriaPlana[],
): Record<string, number> {
  const raices = categorias.filter((c) => c.tiendaId === null);
  const resultado: Record<string, number> = {};
  for (const raiz of raices) {
    let cuantos = porCategoria.get(raiz.id) ?? 0;
    for (const c of categorias) {
      if (c.padreId === raiz.id) cuantos += porCategoria.get(c.id) ?? 0;
    }
    resultado[raiz.slug] = cuantos;
  }
  return resultado;
}

export type CategoriaDelMenu = {
  slug: string;
  nombreEs: string;
  nombreEn: string | null;
  cuantos: number;
};

/**
 * El menú de categorías: las que tienen al menos un producto, de más a menos.
 *
 * Se agrupa por SLUG y no por id, como hacía la consulta: dos comercios
 * pueden tener cada uno su «ropa», y el menú las enseña como una sola.
 * El nombre que queda es el de la primera que aparece.
 */
export function armarMenuDeCategorias(
  porCategoria: ConteoPorCategoria,
  categorias: readonly CategoriaPlana[],
): CategoriaDelMenu[] {
  const porSlug = new Map<string, CategoriaDelMenu>();
  for (const c of categorias) {
    const cuantos = porCategoria.get(c.id) ?? 0;
    if (cuantos === 0) continue;
    const ya = porSlug.get(c.slug);
    if (ya) ya.cuantos += cuantos;
    else
      porSlug.set(c.slug, {
        slug: c.slug,
        nombreEs: c.nombreEs,
        nombreEn: c.nombreEn,
        cuantos,
      });
  }
  return [...porSlug.values()].sort((a, b) => b.cuantos - a.cuantos);
}

export type TiendaPlana = {
  id: string;
  slug: string;
  nombre: string;
  descripcionEs: string | null;
  descripcionEn: string | null;
  paisOrigen: string | null;
  logoClave: string | null;
  ciudad: string | null;
  /** En milisegundos: el JSON no sabe de fechas. */
  creadoEnMs: number;
};

export type ComercioConteo = Omit<TiendaPlana, "id"> & { cuantos: number };

/** La tienda que va primera en el directorio (pedido del dueño, 30 ago 2026). */
export const TIENDA_PRIMERA = "us-mayorista";

/**
 * TODOS los comercios activos del mercado con su conteo, incluidos los que
 * tienen cero (ver la nota de `listarComerciosDestacados`: una tienda recién
 * abierta tiene que encontrarse a sí misma en `/tiendas`). La mayorista de
 * la casa primero; el resto por tamaño de catálogo.
 */
export function armarComercios(
  porTienda: ReadonlyMap<string, number>,
  tiendas: readonly TiendaPlana[],
): ComercioConteo[] {
  return tiendas
    .map(({ id, ...t }) => ({ ...t, cuantos: porTienda.get(id) ?? 0 }))
    .sort((a, b) => {
      const pa = a.slug === TIENDA_PRIMERA ? 0 : 1;
      const pb = b.slug === TIENDA_PRIMERA ? 0 : 1;
      return pa - pb || b.cuantos - a.cuantos;
    });
}

/**
 * Los bombillos: zona → cuántos productos se retiran ahí. Solo zonas que
 * existen en el mapa (`zonaExiste`): un depósito con la zona escrita a mano y
 * mal no puede inventar una ciudad en el selector.
 */
export function armarCobertura(
  porZona: ReadonlyArray<{ zona: string | null; cuantos: number }>,
  zonaExiste: (slug: string) => boolean,
): Record<string, number> {
  const cobertura: Record<string, number> = {};
  for (const f of porZona) {
    if (f.zona && zonaExiste(f.zona)) {
      cobertura[f.zona] = (cobertura[f.zona] ?? 0) + Number(f.cuantos);
    }
  }
  return cobertura;
}
