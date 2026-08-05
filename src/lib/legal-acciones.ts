"use server";

import { nanoid } from "nanoid";

import { obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { aceptaciones } from "@/lib/db/schema";
import { VERSION_TERMINOS } from "@/lib/legal";

/**
 * GRABA QUE ESTE USUARIO ACEPTÓ LOS TÉRMINOS.
 *
 * Se llama justo después de crear la cuenta (la casilla ya venía marcada: el
 * formulario no se envía sin ella) y al solicitar la apertura de un comercio.
 * Lo que queda grabado es lo que un abogado necesita probar: quién, cuándo,
 * qué versión y en qué pantalla.
 *
 * NUNCA revienta hacia fuera: si la grabación falla, la cuenta ya existe y
 * dejar a la persona a mitad de registro por un error nuestro es peor. El
 * fallo queda en el registro del servidor para perseguirlo.
 */
export async function registrarAceptacion(
  contexto: "registro" | "alta-comercio",
): Promise<void> {
  try {
    const usuario = await obtenerUsuario();
    if (!usuario) return;

    const db = getDb();
    await db.insert(aceptaciones).values({
      id: nanoid(),
      userId: usuario.id,
      documento: "terminos",
      version: VERSION_TERMINOS,
      contexto,
      creadoEn: new Date(),
    });
  } catch (e) {
    console.error("[aceptaciones] no se pudo grabar:", e);
  }
}
