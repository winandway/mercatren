import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { contextoDe, respuestaDeError } from "@/lib/app-movil/datos";
import { borrarMiCuenta } from "@/lib/cuenta/borrar-acciones";
import { CORREO_CONTACTO } from "@/lib/correo/direcciones";

export const dynamic = "force-dynamic";

/**
 * BORRAR LA CUENTA DESDE LA APP NATIVA (5 nov 2026). Apple lo exige DENTRO de
 * la app. Usa la MISMA acción de la página «Delete account» de la web
 * (`borrarMiCuenta`, con la palabra de confirmación y las mismas reglas: una
 * cuenta con tienda, pedidos en camino o paquetes en la bodega se cierra con
 * soporte). El mensaje sale traducido de los mismos textos de la web.
 */
const esquema = z.object({ palabra: z.string().max(40) });

export async function POST(peticion: Request) {
  const contexto = contextoDe(new URL(peticion.url));
  if (!contexto.ok) return respuestaDeError("pais_o_idioma", 400);
  const cuerpo = esquema.safeParse(await peticion.json().catch(() => null));
  if (!cuerpo.success) return respuestaDeError("datos", 400);

  const r = await borrarMiCuenta({
    palabra: cuerpo.data.palabra,
    origen: "app",
  });
  const t = await getTranslations({
    locale: contexto.idioma,
    namespace: "borrarCuenta",
  });
  return Response.json(
    r.ok
      ? { ok: true }
      : {
          ok: false,
          motivo: r.motivo,
          mensaje: t(`errores.${r.motivo}`, { correo: CORREO_CONTACTO }),
        },
    {
      status: r.ok ? 200 : r.motivo === "sesion" ? 401 : 400,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
