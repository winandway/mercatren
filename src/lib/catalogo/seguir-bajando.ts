/**
 * ══ SEGUIR BAJANDO EN VEZ DE «SIGUIENTE» — la parte pura (20 sep 2026) ══
 *
 * Richard, mirando «Página 1 de 36» en una búsqueda: «los paginadores son
 * cosas antiguas… que el cliente vaya bajando y se le cargue lo siguiente».
 * La portada ya lo hacía; el catálogo, las búsquedas y las tiendas seguían con
 * el botón.
 *
 * Aquí vive lo que se puede probar sin navegador: con qué dirección se pide
 * la tanda siguiente, y cuándo se le devuelve a la persona lo que ya había
 * bajado. El componente (`parrilla-infinita.tsx`) solo pinta y escucha.
 */

/** Los filtros de un listado, tal como viajan en la dirección de la página. */
export type FiltrosDeLista = {
  q?: string;
  categoria?: string;
  comercio?: string;
  orden?: string;
  /** «Toda Venezuela»: ignora la ciudad de la cookie. */
  todas?: boolean;
};

/**
 * Lo que se le agrega a `/datos/catalogo?` para pedir las tandas de ESTE
 * listado. `modo=lista` es la señal: mismo motor, mismos filtros y mismas 24
 * por tanda que la página, o al bajar saldría otra cosa que lo que se vino a
 * ver. La página y la tanda se piden aparte (`&pagina=N`).
 */
export function consultaDeLista(f: FiltrosDeLista): string {
  const p = new URLSearchParams({ modo: "lista" });
  if (f.q?.trim()) p.set("q", f.q.trim());
  if (f.categoria?.trim()) p.set("categoria", f.categoria.trim());
  if (f.comercio?.trim()) p.set("comercio", f.comercio.trim());
  if (f.orden?.trim()) p.set("orden", f.orden.trim());
  if (f.todas) p.set("todas", "1");
  return p.toString();
}

/**
 * ══ AL VOLVER DE UNA FICHA, LA LISTA SIGUE DONDE ESTABA ══
 *
 * El problema de siempre del scroll infinito: se bajan cinco tandas, se abre
 * un producto, se toca «atrás»… y la lista vuelve con las 24 primeras y la
 * persona arriba del todo. Con el botón «Siguiente» eso no pasaba (cada
 * página tenía su dirección), así que quitarlo sin resolver esto sería
 * cambiar una molestia por otra peor.
 *
 * Se guarda en `sessionStorage` lo bajado y por dónde iba, y se devuelve SOLO
 * cuando de verdad es una vuelta (atrás/adelante), es la misma lista y es
 * reciente. Entrando de nuevo por un enlace se empieza arriba, como espera
 * cualquiera.
 */
export type ListaGuardada<T> = {
  /** De qué listado es: la dirección con sus filtros. */
  clave: string;
  /** Para no mezclar: el primer producto de la tanda que pintó el servidor. */
  primerId: string | null;
  productos: T[];
  pagina: number;
  alto: number;
  guardadoEn: number;
};

/** Pasado esto, lo guardado ya no se devuelve: los precios y el stock cambian. */
export const LISTA_GUARDADA_MS = 30 * 60_000;
/** Ni se guarda una lista sin fondo: cada producto pesa, y es por pestaña. */
export const LISTA_GUARDADA_MAXIMO = 600;

/**
 * UNA SOLA CASILLA POR FAMILIA (portada, catálogo, tienda), no una por
 * búsqueda: cada lista guardada pesa, `sessionStorage` tiene tope, y a lo que
 * se vuelve con «atrás» es casi siempre a la última lista que se miró.
 */
export function casillaDe(clave: string): string {
  return `parrilla:${clave.split(/[?/#]/)[0] || "lista"}`;
}

export function seDevuelveLoGuardado<T>(p: {
  guardada: ListaGuardada<T> | null;
  clave: string;
  esVuelta: boolean;
  primerIdAhora: string | null;
  paginaInicial: number;
  ahora: number;
}): p is typeof p & { guardada: ListaGuardada<T> } {
  const g = p.guardada;
  if (!g || !p.esVuelta) return false;
  if (g.clave !== p.clave) return false;
  if (p.ahora - g.guardadoEn > LISTA_GUARDADA_MS) return false;
  if (g.primerId !== p.primerIdAhora) return false;
  /* Solo si había bajado: con lo mismo que pintó el servidor no hay nada que
     devolver, y el navegador ya sabe volver a su sitio en una página corta. */
  return g.pagina > p.paginaInicial && g.productos.length > 0;
}
