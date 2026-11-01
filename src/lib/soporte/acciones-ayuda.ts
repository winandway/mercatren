"use server";

import { getLocale } from "next-intl/server";

import { obtenerUsuario } from "@/lib/autorizacion";
import { esquemaCaso } from "@/lib/soporte/casos";

/**
 * Abrir un caso de ayuda y escribir en su chat (1 nov 2026). Solo funciones
 * async: un archivo «use server» que exporta otra cosa rompe la compilación.
 *
 * Si la BASE falla, se devuelve `motivo: "base"` y el formulario manda el
 * mensaje a la bandeja de soporte de Windoce (`bandeja.ts`): el cliente llega
 * igual, y lo escrito no se pierde.
 */
export async function abrirCasoAyuda(
  campos: Record<string, string>,
): Promise<
  | { ok: true; numero: string; codigo: string }
  | { ok: false; motivo: "datos" | "demasiados" | "base" }
> {
  const revisado = esquemaCaso.safeParse(campos);
  if (!revisado.success) return { ok: false, motivo: "datos" };
  const d = revisado.data;
  try {
    const { crearCaso, demasiadosCasos } =
      await import("@/lib/soporte/casos-consultas");
    if (await demasiadosCasos(d.email))
      return { ok: false, motivo: "demasiados" };
    const usuario = await obtenerUsuario().catch(() => null);
    const idioma = await getLocale();
    const caso = await crearCaso({
      usuarioId: usuario?.id ?? null,
      nombre: d.nombre,
      email: d.email,
      idioma,
      asunto: d.asunto,
      mensaje: d.mensaje,
    });
    /* El aviso a la persona, con el enlace a su chat. Nunca deshace el caso. */
    try {
      const { correoCasoAbierto } = await import("@/lib/correo/correos");
      await correoCasoAbierto({ email: d.email, name: d.nombre, idioma }, caso);
    } catch (fallo) {
      console.error("[ayuda] caso abierto; el correo no salió:", fallo);
    }
    return { ok: true, numero: caso.numero, codigo: caso.codigo };
  } catch (fallo) {
    console.error("[ayuda] no se pudo guardar el caso:", fallo);
    try {
      const { registrarError } = await import("@/lib/errores/registro");
      await registrarError("ayuda/abrir", fallo);
    } catch {
      /* nada */
    }
    return { ok: false, motivo: "base" };
  }
}
