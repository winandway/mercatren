import { z } from "zod";

import { contextoDe } from "@/lib/app-movil/datos";
import { obtenerUsuario } from "@/lib/autorizacion";
import {
  desbloquearTienda,
  listarBloqueados,
} from "@/lib/moderacion/para-la-app";

export const dynamic = "force-dynamic";

/**
 * LOS VENDEDORES QUE UNO BLOQUEÓ, Y DESHACERLO (6 nov 2026). Se llega desde
 * «Cuenta». GET lista las tiendas bloqueadas; POST `{ slug }` quita el
 * bloqueo del dueño de esa tienda. Siempre de la sesión, sin caché.
 */
function privada(cuerpo: unknown, estado = 200): Response {
  return Response.json(cuerpo, {
    status: estado,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET(peticion: Request) {
  if (!contextoDe(new URL(peticion.url)).ok) {
    return privada({ ok: false, motivo: "pais_o_idioma" }, 400);
  }
  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) return privada({ ok: false, motivo: "sesion" }, 401);
  try {
    return privada({
      ok: true,
      bloqueados: await listarBloqueados(usuario.id),
    });
  } catch (fallo) {
    console.error("[app/bloqueos]", fallo);
    return privada({ ok: false, motivo: "base" }, 503);
  }
}

const esquema = z.object({ slug: z.string().trim().min(1).max(200) });

export async function POST(peticion: Request) {
  if (!contextoDe(new URL(peticion.url)).ok) {
    return privada({ ok: false, motivo: "pais_o_idioma" }, 400);
  }
  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) return privada({ ok: false, motivo: "sesion" }, 401);

  const cuerpo = esquema.safeParse(await peticion.json().catch(() => null));
  if (!cuerpo.success) return privada({ ok: false, motivo: "datos" }, 400);
  try {
    const ok = await desbloquearTienda(usuario.id, cuerpo.data.slug);
    return ok
      ? privada({ ok: true })
      : privada({ ok: false, motivo: "invalido" }, 404);
  } catch (fallo) {
    console.error("[app/bloqueos]", fallo);
    return privada({ ok: false, motivo: "base" }, 503);
  }
}
