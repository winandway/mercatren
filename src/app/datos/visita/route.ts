import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { getDb } from "@/lib/db";
import { visitas } from "@/lib/db/schema";
import { mercadoActual } from "@/lib/mercado/actual";
import { esRobot, rutaLimpia } from "@/lib/trafico/bots";

/**
 * EL PULSO DEL TRÁFICO (30 ago 2026).
 *
 * El navegador manda aquí cada página vista, y al salir, cuántos segundos
 * estuvo. Sin cookies: el visitante es un hash que rota cada día (IP +
 * navegador + fecha) — se cuentan personas únicas sin identificar a nadie,
 * el patrón de Plausible/Umami. Los robots no ejecutan JavaScript, así que
 * ni llegan; a los que llegan se les revisa el User-Agent.
 *
 * Nunca responde error al visitante: medir jamás puede estorbar la visita.
 */

async function hashDelDia(ip: string, ua: string): Promise<string> {
  const dia = new Date().toISOString().slice(0, 10);
  const datos = new TextEncoder().encode(`${ip}|${ua}|${dia}|mercatren`);
  const resumen = await crypto.subtle.digest("SHA-256", datos);
  return Array.from(new Uint8Array(resumen).slice(0, 12))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(peticion: Request) {
  try {
    const ua = peticion.headers.get("user-agent");
    if (esRobot(ua)) return Response.json({ ok: true });

    const cuerpo = (await peticion.json().catch(() => null)) as {
      ruta?: string;
      referido?: string;
      visitaId?: string;
      segundos?: number;
    } | null;
    if (!cuerpo?.ruta && !cuerpo?.visitaId) return Response.json({ ok: true });

    const db = getDb();

    /* El cierre: la página avisa cuánto estuvo. Solo sube — un segundo
       aviso menor no pisa al mayor. */
    if (cuerpo.visitaId && typeof cuerpo.segundos === "number") {
      const segundos = Math.max(0, Math.min(7200, Math.round(cuerpo.segundos)));
      await db
        .update(visitas)
        .set({ segundos })
        .where(
          and(
            eq(visitas.id, cuerpo.visitaId),
            sql`${visitas.segundos} <= ${segundos}`,
          ),
        )
        .catch(() => null);
      return Response.json({ ok: true });
    }

    /* La página vista. */
    const ip = peticion.headers.get("cf-connecting-ip") ?? "local";
    const pais = peticion.headers.get("cf-ipcountry") ?? null;
    const mercado = await mercadoActual();
    const id = `vis-${nanoid(12)}`;

    /* El panel no se cuenta: es trabajo nuestro, no una visita. */
    const ruta = rutaLimpia(String(cuerpo.ruta ?? "/"));
    if (/^\/(es|en)\/panel/.test(ruta)) return Response.json({ ok: true });

    let referido: string | null = null;
    if (cuerpo.referido) {
      try {
        const origen = new URL(cuerpo.referido).hostname;
        /* El propio sitio no es un referido: solo interesa de DÓNDE llegó. */
        if (!origen.includes("mercatren")) referido = origen.slice(0, 100);
      } catch {
        /* Un referer roto no es nada. */
      }
    }

    await db.insert(visitas).values({
      id,
      visitante: await hashDelDia(ip, ua ?? ""),
      mercado: mercado.codigo,
      pais: pais === "XX" ? null : pais,
      ruta,
      referido,
    });

    return Response.json({ ok: true, id });
  } catch {
    return Response.json({ ok: true });
  }
}
