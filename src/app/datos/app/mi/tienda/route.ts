import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import {
  contextoDe,
  PAISES_ENCENDIDOS,
  respuestaDeError,
} from "@/lib/app-movil/datos";
import { obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { tiendas } from "@/lib/db/schema";
import {
  documentoDelMercado,
  tieneDocumentoPropio,
} from "@/lib/mercado/identificacion";
import { darDeAltaComercio } from "@/lib/tiendas/alta";

export const dynamic = "force-dynamic";

/**
 * «MI TIENDA» DESDE LA APP NATIVA (5 nov 2026, plan PLAN-UNA-SOLA-MERCATREN).
 *
 * GET: si quien pregunta ya tiene tienda, y cómo se llama el documento de la
 * empresa en su país (para la etiqueta del formulario).
 * POST: crea la tienda con la MISMA alta que la web (`lib/tiendas/alta.ts`).
 *
 * Privado: la sesión llega en la galleta que manda la app, y el usuario sale
 * SIEMPRE de la sesión, nunca del cuerpo. Vive fuera de `/datos/app/v1`, que
 * es la parte que se guarda en el borde. Sin caché.
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
  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) return respuestaDeError("sin_sesion", 401);

  const [suya] = await getDb()
    .select({
      slug: tiendas.slug,
      nombre: tiendas.nombre,
      estado: tiendas.estado,
      mercado: tiendas.mercado,
    })
    .from(tiendas)
    .where(eq(tiendas.propietarioId, usuario.id))
    .limit(1);

  /* Igual que la web (`vender/empezar`): el nombre propio del documento
     (RUT, NIT, NIF) o «Identificación fiscal» traducido; el ejemplo solo
     donde hay regla propia (el genérico es un RIF, que no le dice nada a
     alguien de Estados Unidos). */
  const documento = documentoDelMercado(contexto.mercado);
  const propio = tieneDocumentoPropio(contexto.mercado);
  const t = await getTranslations({
    locale: contexto.idioma,
    namespace: "comercio",
  });
  return privada({
    ok: true,
    tienda: suya ?? null,
    documento: {
      nombre: propio ? documento.nombre : t("campos.identificacionFiscal"),
      ejemplo: propio ? documento.ejemplo : null,
    },
  });
}

/** Lo que manda el formulario de la app. Las reglas finas las pone el alta. */
const esquemaAlta = z.object({
  nombre: z.string().max(80),
  razonSocial: z.string().max(120),
  identificacionFiscal: z.string().max(40),
  correoContacto: z.string().max(200),
  telefono: z.string().max(40),
  direccion: z.string().max(200),
  ciudad: z.string().max(80),
  paisOrigen: z.string().max(60),
  descripcionEs: z.string().max(600).optional(),
  aceptaTerminos: z.boolean(),
});

export async function POST(peticion: Request) {
  const contexto = contextoDe(new URL(peticion.url));
  if (!contexto.ok) return respuestaDeError("pais_o_idioma", 400);
  /* Una tienda nace donde se puede vender: en un país encendido. */
  if (!PAISES_ENCENDIDOS.includes(contexto.mercado.codigo)) {
    return respuestaDeError("pais_apagado", 400);
  }
  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) return respuestaDeError("sin_sesion", 401);

  const cuerpo = esquemaAlta.safeParse(await peticion.json().catch(() => null));
  if (!cuerpo.success) return respuestaDeError("datos", 400);

  const { aceptaTerminos, ...resto } = cuerpo.data;
  const t = await getTranslations({
    locale: contexto.idioma,
    namespace: "panel.mensajes",
  });
  const r = await darDeAltaComercio({
    usuario,
    mercado: contexto.mercado,
    datos: {
      ...Object.fromEntries(
        Object.entries(resto).map(([k, v]) => [k, v ?? ""]),
      ),
      aceptaTerminos: aceptaTerminos ? "on" : "",
    },
    t,
    contexto: "alta-comercio-app",
  });
  return privada(r, r.ok ? 200 : 400);
}
