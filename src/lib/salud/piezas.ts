import "server-only";

import { desc } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { latidosVigilante } from "@/lib/db/schema";

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
