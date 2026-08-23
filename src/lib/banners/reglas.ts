/**
 * LOS BANNERS PUBLICITARIOS DE LAS PARRILLAS: las reglas, puras.
 *
 * Un banner es publicidad de la casa a sus propios comercios, que aparece EN
 * MEDIO de una parrilla de productos («veo cuarenta productos y en la mitad un
 * banner de la tienda de zapatos»). Aquí se decide cuáles salen (vigencia y
 * lugar) y dónde se meten (cada cuántos productos). Lo administra solo el
 * equipo; esto no tiene pantalla del lado del comercio.
 */
export const UBICACIONES = ["todas", "portada", "tienda", "catalogo"] as const;
export type UbicacionBanner = (typeof UBICACIONES)[number];

export const CADA_CUANTOS_MINIMO = 3;
export const CADA_CUANTOS_MAXIMO = 60;
export const CADA_CUANTOS_POR_DEFECTO = 12;

export type BannerBase = {
  id: string;
  tituloEs: string;
  tituloEn: string | null;
  textoEs: string | null;
  textoEn: string | null;
  botonEs: string | null;
  botonEn: string | null;
  imagenClave: string | null;
  enlace: string;
  ubicacion: string;
  tiendaId: string | null;
  cadaCuantos: number;
  orden: number;
  activo: boolean;
  desde: Date | null;
  hasta: Date | null;
};

/** Lo que ve el público, ya en su idioma. */
export type BannerPublico = {
  id: string;
  titulo: string;
  texto: string | null;
  boton: string | null;
  imagenUrl: string | null;
  enlace: string;
  cadaCuantos: number;
};

export function esUbicacion(valor: unknown): valor is UbicacionBanner {
  return (
    typeof valor === "string" &&
    (UBICACIONES as readonly string[]).includes(valor)
  );
}

/** Activo y dentro de sus fechas (las fechas son opcionales). */
export function estaVigente(
  b: Pick<BannerBase, "activo" | "desde" | "hasta">,
  ahora: Date = new Date(),
): boolean {
  if (!b.activo) return false;
  if (b.desde && ahora < b.desde) return false;
  if (b.hasta && ahora > b.hasta) return false;
  return true;
}

/**
 * ¿Sale en este lugar? `todas` sale en cualquier parrilla. Uno clavado a una
 * tienda (`tiendaId`) sale SOLO en la parrilla de esa tienda: en la portada y
 * el catálogo no, que es justo lo que quiere quien lo clava ahí.
 */
export function saleEn(
  b: Pick<BannerBase, "ubicacion" | "tiendaId">,
  lugar: UbicacionBanner,
  tiendaId: string | null = null,
): boolean {
  if (b.tiendaId) return lugar === "tienda" && tiendaId === b.tiendaId;
  return b.ubicacion === "todas" || b.ubicacion === lugar;
}

export function aPublico(
  b: BannerBase,
  idioma: "es" | "en",
  imagenUrl: string | null,
): BannerPublico {
  const en = idioma === "en";
  return {
    id: b.id,
    titulo: (en ? b.tituloEn : null)?.trim() || b.tituloEs,
    texto: ((en ? b.textoEn : null)?.trim() || b.textoEs?.trim()) ?? null,
    boton: ((en ? b.botonEn : null)?.trim() || b.botonEs?.trim()) ?? null,
    imagenUrl,
    enlace: b.enlace,
    cadaCuantos: Math.min(
      CADA_CUANTOS_MAXIMO,
      Math.max(CADA_CUANTOS_MINIMO, b.cadaCuantos || CADA_CUANTOS_POR_DEFECTO),
    ),
  };
}

export type Intercalado<T> =
  { tipo: "producto"; item: T } | { tipo: "banner"; banner: BannerPublico };

/**
 * Mete los banners ENTRE los productos: después de `cadaCuantos` productos va
 * el primer banner, `cadaCuantos` productos después el siguiente, y al agotar
 * la lista de banners se vuelve a empezar. Nunca abre ni cierra la parrilla
 * con un banner: un anuncio antes del primer producto es un muro, y uno al
 * final es un hueco. La parrilla infinita lo aplica sobre TODO lo cargado, así
 * la cuenta sigue sola de una tanda a la siguiente.
 */
export function intercalarBanners<T>(
  items: T[],
  banners: BannerPublico[],
): Intercalado<T>[] {
  if (banners.length === 0)
    return items.map((item) => ({ tipo: "producto", item }));
  const salida: Intercalado<T>[] = [];
  let desdeElUltimo = 0;
  let cuantos = 0;
  for (const item of items) {
    const banner = banners[cuantos % banners.length]!;
    if (desdeElUltimo >= banner.cadaCuantos) {
      salida.push({ tipo: "banner", banner });
      cuantos += 1;
      desdeElUltimo = 0;
    }
    salida.push({ tipo: "producto", item });
    desdeElUltimo += 1;
  }
  return salida;
}
