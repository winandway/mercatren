import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { contextoDe, respuestaDeError } from "@/lib/app-movil/datos";
import {
  estadoParaBorrar,
  pedirCierreDeMiCuenta,
} from "@/lib/cuenta/borrar-acciones";
import { CORREO_CONTACTO } from "@/lib/correo/direcciones";

export const dynamic = "force-dynamic";

/**
 * CERRAR LA TIENDA Y BORRAR LA CUENTA DESDE LA APP (5 nov 2026, Apple
 * 5.1.1(v)). Usa la MISMA pieza que la página «Delete account» de la web
 * (`pedirCierreDeMiCuenta` y `estadoParaBorrar`, sobre `cuenta/cierre.ts`).
 *
 * GET: si ya pidió el cierre y qué le falta (mirar también revisa si el
 * cierre ya puede terminar). POST: pide el cierre con la palabra.
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
  const estado = await estadoParaBorrar().catch(() => ({
    sesion: false as const,
  }));
  if (!estado.sesion) return privada({ ok: true, borrada: true });
  if (estado.puede || estado.motivo !== "tienda") {
    return privada({ ok: true, conTienda: false });
  }
  return privada({
    ok: true,
    conTienda: true,
    pedido: estado.cierre?.pedido ?? false,
    pasos: estado.cierre?.pasos ?? [],
  });
}

const esquema = z.object({ palabra: z.string().max(40) });

export async function POST(peticion: Request) {
  const contexto = contextoDe(new URL(peticion.url));
  if (!contexto.ok) return respuestaDeError("pais_o_idioma", 400);
  const cuerpo = esquema.safeParse(await peticion.json().catch(() => null));
  if (!cuerpo.success) return respuestaDeError("datos", 400);

  const r = await pedirCierreDeMiCuenta({
    palabra: cuerpo.data.palabra,
    origen: "app",
  });
  if (r.ok) return privada({ ok: true, borrada: r.borrada, pasos: r.pasos });

  const t = await getTranslations({
    locale: contexto.idioma,
    namespace: "borrarCuenta",
  });
  const motivo = r.motivo === "sin_tienda" ? "fallo" : r.motivo;
  return privada(
    {
      ok: false,
      motivo: r.motivo,
      mensaje: t(`errores.${motivo}`, { correo: CORREO_CONTACTO }),
    },
    r.motivo === "sesion" ? 401 : 400,
  );
}
