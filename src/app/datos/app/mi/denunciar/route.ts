import { z } from "zod";

import { contextoDe } from "@/lib/app-movil/datos";
import { obtenerUsuario } from "@/lib/autorizacion";
import { denunciarComo } from "@/lib/moderacion/nucleo";
import {
  estadoDeRechazo,
  MOTIVOS_DE_DENUNCIA,
  TIPOS_DENUNCIABLES,
} from "@/lib/moderacion/reglas";

export const dynamic = "force-dynamic";

/**
 * DENUNCIAR DESDE LA APP NATIVA (6 nov 2026). Google Play pide, para el
 * contenido que suben los usuarios, un sistema dentro de la app para
 * denunciarlo. Usa el MISMO núcleo que la web (`lib/moderacion/nucleo.ts`):
 * la denuncia queda en su tabla, el equipo recibe el correo y con tres
 * denuncias abiertas lo denunciado se oculta solo.
 *
 * Privado: la persona sale SIEMPRE de la sesión, nunca del cuerpo. Sin sesión
 * no hay denuncia (así no la llenan los robots). Una persona solo denuncia
 * una vez lo mismo (índice único de la tabla), que además sirve de tope.
 */
const esquema = z.object({
  tipo: z.enum(TIPOS_DENUNCIABLES),
  id: z.string().trim().min(1).max(200),
  motivo: z.enum(MOTIVOS_DE_DENUNCIA),
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

  const r = await denunciarComo(usuario.id, cuerpo.data);
  return r.ok
    ? privada({ ok: true, oculto: r.oculto })
    : privada({ ok: false, motivo: r.motivo }, estadoDeRechazo(r.motivo));
}
