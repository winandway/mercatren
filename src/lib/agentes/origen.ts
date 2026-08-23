import { SITIO } from "@/lib/sitio";

/**
 * La base absoluta de la petición (https://mercatren.com, https://mercatren.cl,
 * http://localhost:3000). Los documentos de descubrimiento se arman con la del
 * host que los pidió, porque cada dominio es un mercado y sus enlaces tienen
 * que quedarse en casa; si algo raro llega, se cae a la dirección canónica.
 */
export function origenDe(peticion: Request): string {
  try {
    const u = new URL(peticion.url);
    if (
      u.hostname === "localhost" ||
      u.hostname.endsWith("mercatren.com") ||
      u.hostname.endsWith("mercatren.cl") ||
      u.hostname.endsWith("mercatren.com.co") ||
      u.hostname.endsWith("sitios.dev")
    ) {
      return `${u.protocol}//${u.host}`;
    }
  } catch {
    /* cae abajo */
  }
  return SITIO.url;
}

export function respuestaJson(
  cuerpo: unknown,
  tipo = "application/json; charset=utf-8",
): Response {
  return new Response(JSON.stringify(cuerpo, null, 2), {
    headers: {
      "Content-Type": tipo,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, Accept, Mcp-Session-Id, MCP-Protocol-Version",
      "Cache-Control": "public, max-age=300",
    },
  });
}

export function respuestaTexto(
  cuerpo: string,
  tipo = "text/markdown; charset=utf-8",
): Response {
  return new Response(cuerpo, {
    headers: {
      "Content-Type": tipo,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300",
    },
  });
}

export function preflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, Accept, Mcp-Session-Id, MCP-Protocol-Version",
      "Access-Control-Max-Age": "86400",
    },
  });
}
