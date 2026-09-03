import "server-only";

import { desc, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { configuracion, latidosVigilante } from "@/lib/db/schema";
import { LLAVE_ULTIMO_TICK } from "@/lib/reloj/tick";
import { LLAVE_LATIDO_SINCRONIZAR } from "@/lib/vigilante/reglas";

/**
 * LAS PIEZAS DEL CANARIO, COMPARTIDAS CON EL VIGILANTE.
 *
 * Vivían dentro de `/datos/salud/route.ts`; el vigilante las necesita para
 * mirar lo mismo cada 20 minutos y avisar por correo cuando algo se apaga.
 * Ni un carácter de ninguna llave sale de aquí.
 */

/** La llave de CJ está viva: `ok`, `sin_llave` o `error`. */
export async function saludDelProveedor(): Promise<string> {
  try {
    const { cjConfigurado, llamarCj } = await import("@/lib/cj/cliente");
    if (!cjConfigurado()) return "sin_llave";
    const r = await llamarCj<unknown>("/product/list?pageNum=1&pageSize=1");
    return r.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}

/**
 * ¿Está armado el aviso de Stripe? (31 ago 2026). De ese webhook depende que
 * un cobro se acredite solo. Consulta de SOLO LECTURA a Stripe.
 */
export async function avisoDeStripeArmado(
  env: Record<string, string | undefined>,
): Promise<string> {
  try {
    const clave = env.STRIPE_SECRET_KEY?.trim();
    if (!clave) return "sin_llave";
    const r = await fetch(
      "https://api.stripe.com/v1/webhook_endpoints?limit=16",
      { headers: { authorization: `Bearer ${clave}` } },
    );
    if (!r.ok) return "error";
    const d = (await r.json().catch(() => null)) as {
      data?: Array<{
        url?: string;
        status?: string;
        enabled_events?: string[];
      }>;
    } | null;
    const nuestro = (d?.data ?? []).find(
      (w) => (w.url ?? "").includes("/datos/stripe") && w.status === "enabled",
    );
    if (!nuestro) return "falta";
    const eventos = nuestro.enabled_events ?? [];
    if (!eventos.includes("*") && !eventos.includes("payment_intent.succeeded"))
      return "sin_evento";
    if (!env.STRIPE_WEBHOOK_SECRET?.trim()) return "sin_secreto";
    return "ok";
  } catch {
    return "error";
  }
}

/** El último latido del vigilante, para el canario: hace cuánto y con
 *  cuántas alertas. `null` si nunca corrió. */
export async function resumenDelVigilante(): Promise<{
  haceMinutos: number;
  alertas: number;
  rojas: number;
} | null> {
  try {
    const [ultimo] = await getDb()
      .select({
        corridoEn: latidosVigilante.corridoEn,
        alertas: latidosVigilante.alertas,
      })
      .from(latidosVigilante)
      .orderBy(desc(latidosVigilante.corridoEn))
      .limit(1);
    if (!ultimo) return null;
    const lista = JSON.parse(ultimo.alertas || "[]") as Array<{
      nivel?: string;
    }>;
    return {
      haceMinutos: Math.max(
        0,
        Math.round((Date.now() - ultimo.corridoEn.getTime()) / 60_000),
      ),
      alertas: lista.length,
      rojas: lista.filter((a) => a.nivel === "rojo").length,
    };
  } catch {
    return null;
  }
}

/** El último latido del reloj (propio o de GitHub), en minutos. `null` si
 *  nunca latió. Es lo que permite ver desde fuera si el sitio se mueve solo. */
export async function resumenDelReloj(): Promise<{
  haceMinutos: number;
  /** El último latido que TERMINÓ su trabajo: de dónde vino, cuánto tardó
   *  y qué hizo. Si la marca se reclama y esto no avanza, el trabajo se
   *  está cortando. */
  ultimo: {
    haceMinutos: number;
    origen: string;
    duracionMs: number;
    hizo: string[];
  } | null;
} | null> {
  try {
    const filas = await getDb()
      .select({ clave: configuracion.clave, valor: configuracion.valor })
      .from(configuracion)
      .where(
        inArray(configuracion.clave, [
          LLAVE_LATIDO_SINCRONIZAR,
          LLAVE_ULTIMO_TICK,
        ]),
      );
    const marca = Number(
      filas.find((f) => f.clave === LLAVE_LATIDO_SINCRONIZAR)?.valor,
    );
    if (!Number.isFinite(marca) || marca <= 0) return null;
    let ultimo = null;
    const crudo = filas.find((f) => f.clave === LLAVE_ULTIMO_TICK)?.valor;
    if (crudo) {
      const t = JSON.parse(crudo) as {
        en?: number;
        origen?: string;
        duracionMs?: number;
        hizo?: string[];
      };
      ultimo = {
        haceMinutos: Math.max(
          0,
          Math.round((Date.now() - Number(t.en ?? 0)) / 60_000),
        ),
        origen: String(t.origen ?? ""),
        duracionMs: Number(t.duracionMs ?? 0),
        hizo: Array.isArray(t.hizo) ? t.hizo : [],
      };
    }
    return {
      haceMinutos: Math.max(0, Math.round((Date.now() - marca) / 60_000)),
      ultimo,
    };
  } catch {
    return null;
  }
}
