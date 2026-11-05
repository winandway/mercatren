import { z } from "zod";

import { contextoDe, respuestaDeError } from "@/lib/app-movil/datos";
import { tiendaDeLaSesion } from "@/lib/app-movil/tienda-de-la-sesion";
import {
  cambiarEstadoPromocion,
  guardarPromocion,
  promocionesDeTienda,
} from "@/lib/ganar/promociones";
import {
  CPC_CENTAVOS,
  PRESUPUESTO_MAXIMO_CENTAVOS,
  PRESUPUESTO_MINIMO_CENTAVOS,
  presupuestoDesdeTexto,
} from "@/lib/ganar/reglas";

export const dynamic = "force-dynamic";

/**
 * PROMOCIONAR DESDE LA APP (5 nov 2026, Fase 4): lo mismo que el panel.
 * GET: mis promociones con lo de hoy y los últimos 30 días.
 * POST: promocionar un producto (o cambiarle el presupuesto).
 * PATCH: pausar o reanudar. NADA SE COBRA: queda «por cobrar».
 */
function privada(cuerpo: unknown, estado = 200): Response {
  return Response.json(cuerpo, {
    status: estado,
    headers: { "Cache-Control": "private, no-store" },
  });
}

async function entrada(peticion: Request) {
  const contexto = contextoDe(new URL(peticion.url));
  if (!contexto.ok) return { fallo: respuestaDeError("pais_o_idioma", 400) };
  const t = await tiendaDeLaSesion();
  if (!t.ok)
    return {
      fallo: respuestaDeError(t.motivo, t.motivo === "sin_sesion" ? 401 : 403),
    };
  return { tiendaId: t.tiendaId };
}

export async function GET(peticion: Request) {
  const r = await entrada(peticion);
  if ("fallo" in r) return r.fallo;
  return privada({
    ok: true,
    promociones: await promocionesDeTienda(r.tiendaId),
    reglas: {
      cpcCentavos: CPC_CENTAVOS,
      minimoCentavos: PRESUPUESTO_MINIMO_CENTAVOS,
      maximoCentavos: PRESUPUESTO_MAXIMO_CENTAVOS,
    },
  });
}

/** El presupuesto llega en dólares, como lo escribe la persona («5», «12.50»). */
const esquemaNueva = z.object({
  productoId: z.string().min(1).max(40),
  presupuesto: z.string().max(8),
});

export async function POST(peticion: Request) {
  const r = await entrada(peticion);
  if ("fallo" in r) return r.fallo;
  const datos = esquemaNueva.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) return respuestaDeError("presupuesto", 400);
  const centavos = presupuestoDesdeTexto(datos.data.presupuesto);
  if (centavos === null) return respuestaDeError("presupuesto", 400);
  const hecho = await guardarPromocion({
    tiendaId: r.tiendaId,
    productoId: datos.data.productoId,
    presupuestoCentavos: centavos,
  });
  if (!hecho.ok) return respuestaDeError(hecho.motivo, 400);
  return privada({ ok: true, id: hecho.id });
}

const esquemaEstado = z.object({
  promocionId: z.string().min(1).max(40),
  estado: z.enum(["activa", "pausada"]),
});

export async function PATCH(peticion: Request) {
  const r = await entrada(peticion);
  if ("fallo" in r) return r.fallo;
  const datos = esquemaEstado.safeParse(
    await peticion.json().catch(() => null),
  );
  if (!datos.success) return respuestaDeError("datos", 400);
  const hecho = await cambiarEstadoPromocion({
    tiendaId: r.tiendaId,
    ...datos.data,
  });
  if (!hecho) return respuestaDeError("no_existe", 404);
  return privada({ ok: true });
}
