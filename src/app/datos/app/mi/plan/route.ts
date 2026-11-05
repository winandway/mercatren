import { z } from "zod";

import { contextoDe, respuestaDeError } from "@/lib/app-movil/datos";
import { tiendaDeLaSesion } from "@/lib/app-movil/tienda-de-la-sesion";
import { estadisticasDeTienda } from "@/lib/ganar/estadisticas";
import {
  cancelarPlan,
  empezarMesGratis,
  estadoDelPlan,
  seguirConPro,
} from "@/lib/ganar/planes";
import {
  PRECIO_PRO_CENTAVOS,
  TOPE_PRO,
  TOPE_SIN_PLAN,
} from "@/lib/ganar/reglas";

export const dynamic = "force-dynamic";

/**
 * EL PLAN PRO DESDE LA APP (5 nov 2026, Fase 4): el mismo que en el panel.
 * GET: cómo está el plan (y las estadísticas, si tiene Pro).
 * POST: empezar el mes gratis, cancelar o seguir. NADA SE COBRA.
 */
function privada(cuerpo: unknown, estado = 200): Response {
  return Response.json(cuerpo, {
    status: estado,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET(peticion: Request) {
  const contexto = contextoDe(new URL(peticion.url));
  if (!contexto.ok) return respuestaDeError("pais_o_idioma", 400);
  const t = await tiendaDeLaSesion();
  if (!t.ok)
    return respuestaDeError(t.motivo, t.motivo === "sin_sesion" ? 401 : 403);
  const estado = await estadoDelPlan(t.tiendaId);
  return privada({
    ok: true,
    plan: estado,
    precio: { centavos: PRECIO_PRO_CENTAVOS, moneda: "USD" },
    topes: { sinPlan: TOPE_SIN_PLAN, pro: TOPE_PRO },
    estadisticas: estado.pro ? await estadisticasDeTienda(t.tiendaId) : null,
  });
}

const esquema = z.object({
  accion: z.enum(["empezar", "cancelar", "seguir"]),
});

export async function POST(peticion: Request) {
  const contexto = contextoDe(new URL(peticion.url));
  if (!contexto.ok) return respuestaDeError("pais_o_idioma", 400);
  const t = await tiendaDeLaSesion();
  if (!t.ok)
    return respuestaDeError(t.motivo, t.motivo === "sin_sesion" ? 401 : 403);
  const datos = esquema.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) return respuestaDeError("datos", 400);

  if (datos.data.accion === "empezar") {
    const r = await empezarMesGratis(t.tiendaId);
    if (!r.ok) return respuestaDeError(r.motivo, 400);
  } else if (datos.data.accion === "cancelar") {
    await cancelarPlan(t.tiendaId);
  } else {
    await seguirConPro(t.tiendaId);
  }
  return privada({ ok: true, plan: await estadoDelPlan(t.tiendaId) });
}
