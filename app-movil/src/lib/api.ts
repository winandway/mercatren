import type { Idioma } from "./dinero";

/**
 * La conexión con el servidor de Mercatren: la puerta de datos de la app
 * (`/datos/app/v1` en el sitio). Puro, sin React Native: lo prueban las
 * pruebas del sitio.
 *
 * En desarrollo, `EXPO_PUBLIC_API_URL=http://localhost:3000` apunta al
 * servidor local (el simulador de iPhone llega a la computadora por localhost).
 */
export const API_BASE = (
  process.env.EXPO_PUBLIC_API_URL ?? "https://mercatren.com"
).replace(/\/$/, "");

/** Donde viven las cuentas en el sitio (nunca /api: ver `src/lib/rutas.ts`). */
export const RUTA_AUTH = "/datos/auth";

/** El prefijo de las galletas de sesión del sitio (`advanced.cookiePrefix`). */
export const PREFIJO_DE_GALLETAS = "mercatren";

/** La página del escudo anti-robots que la app carga en una vista web. */
export function urlEscudo(idioma: Idioma): string {
  return `${API_BASE}/datos/app/escudo?idioma=${idioma}`;
}

export type Precio = { centavos: number; moneda: string };

export type Pais = {
  codigo: string;
  nombre: string;
  moneda: string;
  encendido: boolean;
};

export type ProductoApp = {
  id: string;
  slug: string;
  titulo: string;
  precio: Precio;
  precioAntes: Precio | null;
  foto: string | null;
  fotoAlt: string | null;
  tienda: { nombre: string; slug: string };
  agotado: boolean;
  /** Solo en los promocionados: se enseña «Patrocinado» y se cuenta el clic. */
  patrocinado?: { promocionId: string; firma: string };
};

export type FichaApp = {
  /** Solo en España: quién fabrica el producto y sus advertencias. */
  seguridad?: {
    fabricante: string;
    responsableUe: string | null;
    advertencias: string | null;
  } | null;
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  marca: string | null;
  precio: Precio;
  precioAntes: Precio | null;
  unidad: string | null;
  agotado: boolean;
  /** false si la venta del país de la tienda está en pausa. */
  seVende?: boolean;
  categoria: string | null;
  tienda: { nombre: string; slug: string };
  fotos: Array<{ url: string; alt: string | null }>;
};

export type PaginaCatalogo = {
  productos: ProductoApp[];
  pagina: number;
  paginas: number;
  total: number;
};

function conContexto(
  ruta: string,
  pais: string | null,
  idioma: Idioma,
  extra: Record<string, string | number | undefined> = {},
): string {
  const url = new URL(`${API_BASE}/datos/app/v1/${ruta}`);
  if (pais) url.searchParams.set("pais", pais);
  url.searchParams.set("idioma", idioma);
  for (const [clave, valor] of Object.entries(extra)) {
    if (valor !== undefined && valor !== "") {
      url.searchParams.set(clave, String(valor));
    }
  }
  return url.toString();
}

/** Donde se avisa el clic en un promocionado (Fase 4). */
export function urlClicPromocion(): string {
  return `${API_BASE}/datos/promo/clic`;
}

/**
 * Las páginas legales y de ayuda DEL PAÍS de la persona: el servidor la lleva
 * a la de su país (`/datos/app/v1/legal`). Abrir la dirección de los términos a secas
 * enseñaba siempre las de Estados Unidos.
 */
export type PaginaLegal = "terminos" | "privacidad" | "ayuda" | "devoluciones";

export function urlLegal(
  pais: string | null | undefined,
  idioma: Idioma,
  pagina: PaginaLegal,
): string {
  return `${API_BASE}/datos/app/v1/legal?pais=${encodeURIComponent(pais ?? "US")}&idioma=${idioma}&pagina=${pagina}`;
}

export function urlPaises(idioma: Idioma): string {
  return conContexto("paises", null, idioma);
}

/**
 * La lista de países SIEMPRE fresca (5 nov 2026): el teléfono la guardaba y,
 * al encender o apagar un país, seguía diciendo «Próximamente» (o dejaba
 * elegir uno ya apagado). Es una lista corta y fija: pedirla de nuevo no
 * cuesta nada en la base.
 */
export function pedirPaises(
  idioma: Idioma,
): Promise<{ paises: Pais[]; porDefecto?: string | null }> {
  return pedirJson<{ paises: Pais[]; porDefecto?: string | null }>(
    urlPaises(idioma),
    fetch,
    { headers: { "Cache-Control": "no-cache" } },
  );
}

/**
 * EL PAÍS POR DEFECTO EN LA BIENVENIDA (8 nov 2026): quien abre la app por
 * primera vez lo encuentra ARRIBA y ya marcado (Venezuela, el único con
 * productos hoy; lo dice el servidor). Solo si está encendido. Quien ya
 * eligió un país conserva el suyo.
 */
export function paisesEnOrden(
  paises: Pais[],
  porDefecto: string | null | undefined,
): Pais[] {
  const primero = paises.find((p) => p.codigo === porDefecto && p.encendido);
  if (!primero) return paises;
  return [primero, ...paises.filter((p) => p !== primero)];
}

export function paisMarcado(
  actual: string | null,
  paises: Pais[],
  porDefecto: string | null | undefined,
): string | null {
  if (actual && paises.some((p) => p.codigo === actual && p.encendido))
    return actual;
  return paises.some((p) => p.codigo === porDefecto && p.encendido)
    ? (porDefecto ?? null)
    : null;
}

export function urlCatalogo(o: {
  pais: string;
  idioma: Idioma;
  q?: string;
  pagina?: number;
}): string {
  return conContexto("catalogo", o.pais, o.idioma, {
    q: o.q?.trim(),
    pagina: o.pagina && o.pagina > 1 ? o.pagina : undefined,
  });
}

/** Las puertas privadas de la app (con sesión), fuera de lo que se guarda en el borde. */
function privada(ruta: string, pais: string, idioma: Idioma): string {
  return `${API_BASE}/datos/app/mi/${ruta}?pais=${encodeURIComponent(pais)}&idioma=${idioma}`;
}

export function urlPedido(pais: string, idioma: Idioma): string {
  return privada("pedido", pais, idioma);
}

export function urlPagarPedido(pais: string, idioma: Idioma): string {
  return privada("pagar", pais, idioma);
}

export function urlMisPedidos(pais: string, idioma: Idioma): string {
  return privada("pedidos", pais, idioma);
}

/** «Confirmar desistimiento» de un pedido (España). */
export function urlDesistir(
  numero: string,
  pais: string,
  idioma: Idioma,
): string {
  return privada(
    `pedidos/${encodeURIComponent(numero)}/desistir`,
    pais,
    idioma,
  );
}

export function urlProducto(
  slug: string,
  pais: string,
  idioma: Idioma,
): string {
  return conContexto(`producto/${encodeURIComponent(slug)}`, pais, idioma);
}

/**
 * ¿Sigue encendido el país guardado? Si el servidor ya no vende ahí, la app
 * vuelve a la bienvenida. Sin red no se llama: no se echa a nadie por un mal
 * minuto de conexión.
 */
export function paisSigueEncendido(pais: string, paises: Pais[]): boolean {
  return paises.some((p) => p.codigo === pais && p.encendido);
}

/** Las fotos llegan como «/media/…»: la app las pide al mismo servidor. */
export function absoluta(url: string | null): string | null {
  if (!url) return null;
  return /^https?:\/\//.test(url) ? url : `${API_BASE}${url}`;
}

export class FalloDeRed extends Error {
  constructor(
    readonly motivo: "sin_conexion" | "no_existe" | "servidor" | "sin_sesion",
    mensaje?: string,
  ) {
    super(mensaje ?? motivo);
  }
}

/** Pide JSON al servidor, con un tope de 15 segundos. */
export async function pedirJson<T>(
  url: string,
  pedir: typeof fetch = fetch,
  opciones: RequestInit = {},
): Promise<T> {
  const corte = new AbortController();
  const reloj = setTimeout(() => corte.abort(), 15_000);
  try {
    const r = await pedir(url, { ...opciones, signal: corte.signal });
    if (r.status === 401) throw new FalloDeRed("sin_sesion");
    if (r.status === 404) throw new FalloDeRed("no_existe");
    if (!r.ok) throw new FalloDeRed("servidor", `HTTP ${r.status}`);
    return (await r.json()) as T;
  } catch (fallo) {
    if (fallo instanceof FalloDeRed) throw fallo;
    throw new FalloDeRed("sin_conexion", String(fallo));
  } finally {
    clearTimeout(reloj);
  }
}
