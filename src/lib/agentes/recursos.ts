import { CORREO_CONTACTO } from "@/lib/correo/direcciones";
import { SITIO } from "@/lib/sitio";
import { SOCIEDAD } from "@/lib/sociedad";

/**
 * LO QUE MERCATREN LE PUBLICA A LOS AGENTES (23 ago 2026).
 *
 * El dueño pasó el sitio por isitagentready.com y dio 33/100, «Bot-Aware». Lo
 * que faltaba no era contenido, era **que una máquina pudiera descubrir qué
 * hay y cómo usarlo**: un catálogo de la API, un servidor MCP con su tarjeta,
 * los skills, el manifiesto ARD, la negociación de Markdown y los metadatos de
 * autenticación. Todo eso sale de aquí, con UNA sola lista de direcciones, para
 * que el catálogo de la API, la tarjeta MCP y el manifiesto ARD no se
 * contradigan entre sí (tres documentos que apuntan a lo mismo, escritos a mano
 * por separado, se desincronizan a la segunda semana).
 *
 * Regla de la casa que se respeta aquí: **no se inventa nada**. No hay servidor
 * OAuth, así que no se publica uno; lo que sí hay —tokens de tienda que entrega
 * el equipo— se describe tal cual en `auth.md` y en el recurso protegido.
 */
export const VERSION_AGENTES = "1.0.0";

/** El protocolo MCP que habla el servidor (Streamable HTTP, sin SSE). */
export const PROTOCOLO_MCP = "2025-06-18";
export const PROTOCOLOS_MCP_ADMITIDOS = [
  "2025-03-26",
  "2025-06-18",
  "2025-11-25",
];

export function recursosDe(base: string = SITIO.url) {
  const b = base.replace(/\/$/, "");
  return {
    base: b,
    nombre: SITIO.nombre,
    sociedad: SOCIEDAD.nombre,
    contacto: CORREO_CONTACTO,
    /* Para máquinas */
    mcp: `${b}/datos/mcp`,
    openapi: `${b}/datos/openapi.json`,
    salud: `${b}/datos/salud`,
    catalogo: `${b}/datos/catalogo`,
    buscar: `${b}/datos/buscar`,
    feedGoogle: `${b}/datos/google`,
    llms: `${b}/llms.txt`,
    sitemap: `${b}/sitemap.xml`,
    robots: `${b}/robots.txt`,
    /* Descubrimiento */
    catalogoApi: `${b}/.well-known/api-catalog`,
    tarjetaMcp: `${b}/.well-known/mcp/server-card.json`,
    skills: `${b}/.well-known/agent-skills/index.json`,
    ard: `${b}/.well-known/ai-catalog.json`,
    recursoProtegido: `${b}/.well-known/oauth-protected-resource`,
    authMd: `${b}/auth.md`,
    /* Para personas */
    docs: `${b}/es/docs`,
    docsEn: `${b}/en/docs`,
    comoFunciona: `${b}/es/como-funciona`,
    vender: `${b}/es/vender`,
    tiendas: `${b}/es/tiendas`,
    catalogoWeb: `${b}/es/catalogo`,
  } as const;
}

export type Recursos = ReturnType<typeof recursosDe>;

/** SHA-256 en hexadecimal, con la criptografía del runtime (sirve en el borde). */
export async function sha256Hex(texto: string): Promise<string> {
  const datos = new TextEncoder().encode(texto);
  const resumen = await crypto.subtle.digest("SHA-256", datos);
  return [...new Uint8Array(resumen)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Cabeceras comunes de los documentos de descubrimiento: JSON, CORS abierto, caché corta. */
export function cabecerasDeDescubrimiento(
  tipo = "application/json; charset=utf-8",
) {
  return {
    "Content-Type": tipo,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Accept, Mcp-Session-Id, MCP-Protocol-Version",
    "Cache-Control": "public, max-age=300",
  };
}
