import { z } from "zod";

import { contextoDe } from "@/lib/app-movil/datos";
import { obtenerUsuario } from "@/lib/autorizacion";
import { bloquearComo } from "@/lib/moderacion/nucleo";
import { estadoDeRechazo, TIPOS_DENUNCIABLES } from "@/lib/moderacion/reglas";

export const dynamic = "force-dynamic";

/**
 * BLOQUEAR A UN VENDEDOR (O A QUIEN ESCRIBIÓ UNA PREGUNTA) DESDE LA APP
 * (6 nov 2026). Lo bloqueado se esconde, solo para quien bloqueó, en el
 * catálogo, la búsqueda y la ficha (`lib/moderacion/para-la-app.ts`). Mismo
 * núcleo que la web. La persona sale de la sesión, nunca del cuerpo, y sin
 * sesión no se bloquea a nadie.
 */
const esquema = z.object({
  tipo: z.enum(TIPOS_DENUNCIABLES),
  id: z.string().trim().min(1).max(200),
});

function privada(cuerpo: unknown, estado = 200): Response {
  return Response.json(cuerpo, {
    status: estado,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(peticion: Request) {
  if (!contextoDe(new URL(peticion.url)).ok) {
    return privada({ ok: false, motivo: "pais_o_idioma" }, 400);
  }
  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) return privada({ ok: false, motivo: "sesion" }, 401);

  const cuerpo = esquema.safeParse(await peticion.json().catch(() => null));
  if (!cuerpo.success) return privada({ ok: false, motivo: "datos" }, 400);

  const r = await bloquearComo(usuario.id, cuerpo.data);
  return r.ok
    ? privada({ ok: true })
    : privada({ ok: false, motivo: r.motivo }, estadoDeRechazo(r.motivo));
}
