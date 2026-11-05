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
};

export type FichaApp = {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  marca: string | null;
  precio: Precio;
  precioAntes: Precio | null;
  unidad: string | null;
  agotado: boolean;
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

export function urlPaises(idioma: Idioma): string {
  return conContexto("paises", null, idioma);
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
