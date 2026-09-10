"use server";

import { obtenerUsuario } from "@/lib/autorizacion";
import { crearCasillero } from "@/lib/casillero/crear";

/**
 * Crear el casillero desde el formulario del sitio.
 *
 * La sesión se comprueba AQUÍ y no solo en la página: una acción de
 * servidor se puede llamar con un POST directo, sin pasar por la pantalla.
 */
export async function crearMiCasillero(
  _previo: { error?: string; codigo?: string } | null,
  formulario: FormData,
): Promise<{ error?: string; codigo?: string }> {
  const usuario = await obtenerUsuario();
  if (!usuario) return { error: "sesion" };

  const nombreLegal = String(formulario.get("nombreLegal") ?? "");
  const telefono = String(formulario.get("telefono") ?? "");
  const paisDestino = String(formulario.get("paisDestino") ?? "");
  if (formulario.get("terminos") !== "on") return { error: "terminos" };

  try {
    const r = await crearCasillero({
      usuarioId: usuario.id,
      nombreLegal,
      telefono,
      paisDestino,
      origenId: String(formulario.get("origenId") ?? "") || null,
    });
    if (!r.ok) return { error: r.motivo };
    return { codigo: r.codigo };
  } catch (fallo) {
    console.error("[casillero] no se pudo crear:", fallo);
    return { error: "fallo" };
  }
}
