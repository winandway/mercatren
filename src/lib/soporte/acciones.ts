"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { tiendas } from "@/lib/db/schema";
import { mensajes } from "@/lib/mensajes";
import { guardarComercioObservado } from "@/lib/soporte/ver-como";

/**
 * Entrar y salir de «ver como este comercio».
 *
 * ══ SOLO `soporte`, Y SE COMPRUEBA AQUÍ ══
 *
 * No basta con que el botón salga solo para Soporte: una acción de servidor la
 * puede llamar cualquiera que sepa que existe. El rol se mira en el servidor,
 * antes de tocar la cookie.
 *
 * Se comprueba el rol REAL de la sesión, no el alcance — que en este modo está
 * justamente disfrazado.
 */

export type Resultado = { ok: boolean; mensaje: string };

export async function verComoComercio(tiendaId: string): Promise<Resultado> {
  const t = await mensajes();

  const usuario = await obtenerUsuario();
  if (usuario?.rol !== "soporte") {
    return { ok: false, mensaje: t("sinPermiso") };
  }

  // El comercio tiene que existir. Sin esto, una cookie con basura dejaría el
  // panel mirando un comercio fantasma y sin datos, sin decir por qué.
  const [tienda] = await getDb()
    .select({ id: tiendas.id })
    .from(tiendas)
    .where(eq(tiendas.id, tiendaId))
    .limit(1);

  if (!tienda) return { ok: false, mensaje: t("comercioDestinoNoExiste") };

  await guardarComercioObservado(tienda.id);
  revalidatePath("/[locale]/panel", "layout");

  return { ok: true, mensaje: t("listo") };
}

/**
 * Salir del modo.
 *
 * No exige el rol a propósito: quitarse el disfraz nunca puede fallar. Si una
 * sesión quedara en un estado raro, lo peor sería no poder volver a ser uno
 * mismo.
 */
export async function dejarDeVerComoComercio(): Promise<Resultado> {
  const t = await mensajes();
  await guardarComercioObservado(null);
  revalidatePath("/[locale]/panel", "layout");
  return { ok: true, mensaje: t("listo") };
}
