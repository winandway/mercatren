import { atenderMcp } from "@/lib/agentes/mcp";
import { origenDe, preflight } from "@/lib/agentes/origen";
import { serviciosMcp } from "@/lib/agentes/servicios";
import { mercadoDeLaPeticion } from "@/lib/mercado/repositorio";

export const dynamic = "force-dynamic";

const CABECERAS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, MCP-Protocol-Version",
  "Cache-Control": "no-store",
};

/**
 * EL SERVIDOR MCP (Streamable HTTP). Cada POST trae uno o varios mensajes
 * JSON-RPC y se contesta en el mismo viaje; no hay sesión ni SSE porque las
 * herramientas son de solo lectura y no empujan nada. El GET responde 405 con
 * la explicación, que es lo que manda el transporte cuando no hay flujo.
 */
export async function POST(peticion: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await peticion.json();
  } catch {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "El cuerpo no es JSON." },
      }),
      { status: 400, headers: CABECERAS },
    );
  }
  const base = origenDe(peticion);
  const idioma = /^en(-|$)/i.test(peticion.headers.get("accept-language") ?? "")
    ? "en"
    : "es";
  const mercado = await mercadoDeLaPeticion();
  const { estado, respuesta } = await atenderMcp(
    cuerpo,
    serviciosMcp(mercado, base, idioma),
  );
  if (respuesta === null)
    return new Response(null, { status: estado, headers: CABECERAS });
  return new Response(JSON.stringify(respuesta), {
    status: estado,
    headers: CABECERAS,
  });
}

export function GET() {
  return new Response(
    JSON.stringify({
      error:
        "Este servidor MCP no abre flujos: manda los mensajes JSON-RPC por POST.",
    }),
    { status: 405, headers: { ...CABECERAS, Allow: "POST, OPTIONS" } },
  );
}

export function OPTIONS() {
  return preflight();
}
