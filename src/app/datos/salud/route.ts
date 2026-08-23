import { sql } from "drizzle-orm";

import { VERSION_AGENTES } from "@/lib/agentes/recursos";
import { getDb } from "@/lib/db";
import { SITIO } from "@/lib/sitio";

export const dynamic = "force-dynamic";

/**
 * EL CANARIO: ¿está vivo el sitio y contesta su base?
 *
 * Lo enlazan el catálogo de la API y la tarjeta MCP como `status`, y sirve
 * para la prueba de humo después de publicar. Si la base no responde se dice
 * (`ok: false`, 503) en vez de un 200 que mienta.
 */
export async function GET() {
  const hora = new Date().toISOString();
  try {
    await getDb().run(sql`SELECT 1`);
    return Response.json(
      {
        ok: true,
        servicio: SITIO.nombre,
        version: VERSION_AGENTES,
        base: "ok",
        hora,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (e) {
    console.error("[salud] la base no respondió:", e);
    return Response.json(
      {
        ok: false,
        servicio: SITIO.nombre,
        version: VERSION_AGENTES,
        base: "error",
        hora,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
}
