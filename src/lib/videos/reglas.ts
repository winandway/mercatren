/**
 * LOS SHORTS DE MERCATREN: las reglas, puras.
 *
 * Un comercio graba su tienda por dentro con el teléfono —en vertical— y lo
 * sube desde su panel. Aquí se decide qué video se acepta, cómo se arma su
 * dirección y cómo se reparten las hileras entre los productos de la portada.
 *
 * ══ EL TOPE SON 3 MINUTOS, Y SE RECHAZA EN EL ACTO ══
 *
 * Lo dijo el dueño: nada de más de tres minutos. Y se comprueba EN EL
 * NAVEGADOR antes de empezar a subir (el navegador ya conoce la duración en
 * cuanto lee los metadatos), porque hacer esperar cinco minutos una subida
 * para después decir «muy largo» es la forma más cara de perder a un comercio.
 * El servidor lo vuelve a comprobar: un formulario se salta con la consola.
 */
export const DURACION_MAXIMA_SEGUNDOS = 180;
export const DURACION_MINIMA_SEGUNDOS = 3;
/**
 * EL TOPE DE PESO SON 100 MB, y no es un número al azar: es lo que aguanta el
 * cuerpo de una petición en la plataforma donde corre el sitio. Un video
 * vertical de un minuto grabado con el teléfono pesa entre 20 y 60 MB, así que
 * entra de sobra; y quien tenga uno más pesado ve un aviso claro en vez de una
 * subida que muere a la mitad.
 */
export const PESO_MAXIMO_BYTES = 100 * 1024 * 1024;

export const TIPOS_VIDEO = [
  "video/mp4",
  "video/quicktime", // lo que graba el iPhone
  "video/webm",
  "video/x-m4v",
  "video/3gpp",
] as const;

export type TipoVideo = (typeof TIPOS_VIDEO)[number];

export type MotivoRechazo =
  "no_es_video" | "muy_largo" | "muy_corto" | "muy_pesado" | "sin_titulo";

export type Revision = { ok: true } | { ok: false; motivo: MotivoRechazo };

export function revisarVideo(v: {
  tipo: string;
  bytes: number;
  duracionSegundos: number;
  titulo: string;
}): Revision {
  if (!TIPOS_VIDEO.includes(v.tipo as TipoVideo))
    return { ok: false, motivo: "no_es_video" };
  if (v.bytes > PESO_MAXIMO_BYTES) return { ok: false, motivo: "muy_pesado" };
  /* La duración puede llegar en 0 si el navegador no la pudo leer: eso NO se
     rechaza aquí (se rechaza arriba, donde sí se sabe), pero un video de más
     de tres minutos sí. */
  if (v.duracionSegundos > DURACION_MAXIMA_SEGUNDOS)
    return { ok: false, motivo: "muy_largo" };
  if (v.duracionSegundos > 0 && v.duracionSegundos < DURACION_MINIMA_SEGUNDOS)
    return { ok: false, motivo: "muy_corto" };
  if (v.titulo.trim().length < 3) return { ok: false, motivo: "sin_titulo" };
  return { ok: true };
}

export function extensionDeVideo(tipo: string): string {
  if (tipo === "video/quicktime") return "mov";
  if (tipo === "video/webm") return "webm";
  if (tipo === "video/x-m4v") return "m4v";
  if (tipo === "video/3gpp") return "3gp";
  return "mp4";
}

/** «Mi tienda por dentro» → «mi-tienda-por-dentro-a1b2c3». El sufijo lo pone quien llama. */
export function slugDeVideo(titulo: string, sufijo: string): string {
  const raiz = titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${raiz || "video"}-${sufijo}`;
}

/** 95 → «1:35». Para la esquina de la tarjeta y para el dato estructurado. */
export function duracionCorta(segundos: number): string {
  const s = Math.max(0, Math.round(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** ISO 8601 (`PT1M35S`), que es lo que pide `VideoObject` de schema.org. */
export function duracionIso(segundos: number): string {
  const s = Math.max(0, Math.round(segundos));
  const m = Math.floor(s / 60);
  return `PT${m > 0 ? `${m}M` : ""}${s % 60}S`;
}

export type VideoPublico = {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string | null;
  url: string;
  portadaUrl: string | null;
  duracionSegundos: number;
  tiendaNombre: string;
  tiendaSlug: string;
  /** Para cruzar con las señales del usuario (recomendar/): no se dibuja. */
  tiendaId: string;
  /** Cuántas veces se ha visto. Se cuenta al mirarlo de verdad, no al cargar. */
  vistas: number;
  creadoEn: string | null;
};

/**
 * EL NÚMERO DE VISTAS, CORTO: «1,2 mil» y no «1234».
 *
 * Es el formato de todas las redes de video, y no es estética: un número
 * largo al lado del corazón no se lee de un vistazo. Se usa el formateador
 * del navegador (compact), que ya sabe cómo se abrevia en cada idioma.
 */
export function formatearVistas(vistas: number, idioma: string): string {
  if (!Number.isFinite(vistas) || vistas < 0) return "0";
  return new Intl.NumberFormat(idioma === "en" ? "en-US" : "es", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(vistas);
}

/**
 * CUÁNTOS VIDEOS TRAE UNA HILERA y cada cuántos productos aparece.
 *
 * Una hilera cada 18 productos: la portada se lee como una tienda con videos
 * en medio, no como una tienda de videos. Con menos de 3 videos no se dibuja
 * ninguna hilera: tres recuadros sueltos parecen un error, no una sección.
 */
export const VIDEOS_POR_HILERA = 8;
export const PRODUCTOS_ENTRE_HILERAS = 18;
export const MINIMO_PARA_HILERA = 3;

export type TrozoDeParrilla<T> =
  | { tipo: "productos"; items: T[] }
  | { tipo: "videos"; videos: VideoPublico[] };

/**
 * Parte una lista de productos en trozos y mete una hilera de videos entre
 * ellos. Nunca abre con videos —la persona vino a ver mercancía— y nunca
 * cierra con una hilera colgando al final.
 */
export function repartirHileras<T>(
  productos: T[],
  videos: VideoPublico[],
  cada = PRODUCTOS_ENTRE_HILERAS,
  porHilera = VIDEOS_POR_HILERA,
): TrozoDeParrilla<T>[] {
  if (videos.length < MINIMO_PARA_HILERA || productos.length <= cada) {
    return productos.length ? [{ tipo: "productos", items: productos }] : [];
  }
  const trozos: TrozoDeParrilla<T>[] = [];
  let turno = 0;
  for (let i = 0; i < productos.length; i += cada) {
    const tanda = productos.slice(i, i + cada);
    trozos.push({ tipo: "productos", items: tanda });
    /* La hilera va DESPUÉS de una tanda completa, y solo si todavía quedan
       productos debajo: si no, quedaría colgando al final de la página. */
    if (tanda.length === cada && i + cada < productos.length) {
      const desde = (turno * porHilera) % videos.length;
      const hilera = [...videos.slice(desde), ...videos.slice(0, desde)].slice(
        0,
        porHilera,
      );
      trozos.push({ tipo: "videos", videos: hilera });
      turno += 1;
    }
  }
  return trozos;
}
