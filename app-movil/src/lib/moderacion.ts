import { API_BASE } from "./api";
import type { Idioma } from "./dinero";
import type { ClaveDeTexto } from "./textos";

/**
 * DENUNCIAR Y BLOQUEAR EN LA APP (6 nov 2026). Google Play pide, para el
 * contenido que suben los usuarios (productos y tiendas que cualquiera abre
 * desde el teléfono), poder denunciarlo y bloquear a quien lo publicó DENTRO
 * de la app. Las puertas privadas del sitio hacen el trabajo
 * (`/datos/app/mi/denunciar`, `/bloquear` y `/bloqueos`); aquí solo las
 * direcciones, los motivos y la traducción de la respuesta. Puro: lo prueba
 * el sitio.
 */

/** Los mismos motivos del servidor (`lib/moderacion/reglas.ts`), con su texto. */
export const MOTIVOS: ReadonlyArray<{
  motivo: "spam" | "ofensivo" | "sexual" | "odio" | "fraude" | "otro";
  clave: ClaveDeTexto;
}> = [
  { motivo: "spam", clave: "reasonSpam" },
  { motivo: "ofensivo", clave: "reasonOffensive" },
  { motivo: "sexual", clave: "reasonSexual" },
  { motivo: "odio", clave: "reasonHate" },
  { motivo: "fraude", clave: "reasonFraud" },
  { motivo: "otro", clave: "reasonOther" },
];

export type MotivoDenuncia = (typeof MOTIVOS)[number]["motivo"];

/** Lo que se puede denunciar desde la app: un producto o una tienda. */
export type ObjetivoDenuncia = {
  tipo: "producto" | "tienda";
  /** El id del producto, o el slug de la tienda. */
  id: string;
  nombre: string;
};

function privada(ruta: string, pais: string, idioma: Idioma): string {
  return `${API_BASE}/datos/app/mi/${ruta}?pais=${encodeURIComponent(pais)}&idioma=${idioma}`;
}

export const urlDenunciar = (pais: string, idioma: Idioma) =>
  privada("denunciar", pais, idioma);
export const urlBloquear = (pais: string, idioma: Idioma) =>
  privada("bloquear", pais, idioma);
export const urlBloqueos = (pais: string, idioma: Idioma) =>
  privada("bloqueos", pais, idioma);

export type Bloqueado = { slug: string; nombre: string };

/** El texto para cada motivo de rechazo que devuelve el servidor. */
export function claveDeRechazo(motivo: string | undefined): ClaveDeTexto {
  switch (motivo) {
    case "sesion":
      return "reportNeedsSignIn";
    case "propio":
      return "reportOwn";
    case "invalido":
      return "reportGone";
    default:
      return "reportFailed";
  }
}

export type Resultado = { ok: true } | { ok: false; clave: ClaveDeTexto };

/** Manda un POST con la sesión del teléfono y traduce la respuesta. */
export async function enviar(
  url: string,
  cuerpo: unknown,
  cabeceras: Record<string, string>,
  pedir: typeof fetch = fetch,
): Promise<Resultado> {
  try {
    const r = await pedir(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...cabeceras },
      body: JSON.stringify(cuerpo),
    });
    const j = (await r.json().catch(() => null)) as {
      ok?: boolean;
      motivo?: string;
    } | null;
    if (r.ok && j?.ok) return { ok: true };
    return {
      ok: false,
      clave: r.status === 401 ? "reportNeedsSignIn" : claveDeRechazo(j?.motivo),
    };
  } catch {
    return { ok: false, clave: "reportFailed" };
  }
}
