"use server";

import "server-only";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { obtenerAlcance } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { aparienciaTienda } from "@/lib/db/schema";
import { COLORES_BANNER } from "@/lib/marca/colores";

/** El color guardado de un comercio, o `null` si nunca eligió. */
export async function colorGuardado(tiendaId: string): Promise<string | null> {
  const [fila] = await getDb()
    .select({ colorBanner: aparienciaTienda.colorBanner })
    .from(aparienciaTienda)
    .where(eq(aparienciaTienda.tiendaId, tiendaId))
    .limit(1);

  return fila?.colorBanner ?? null;
}

export type ResultadoColor = { ok: true } | { ok: false; mensaje: string };

/**
 * El comercio elige el color de su banner.
 *
 * SOLO DE LA PALETA. Lo que llegue fuera de la lista se rechaza aquí, no solo
 * en el formulario: un color claro mandado a mano dejaría el nombre y los datos
 * fiscales en blanco sobre blanco, y ese comercio no sabría por qué su ficha se
 * ve rota.
 *
 * La tienda sale del ALCANCE de la sesión, como en todo el panel: un vendedor
 * solo toca la suya.
 */
export async function guardarColorDeBanner(
  tiendaId: string,
  colorId: string,
): Promise<ResultadoColor> {
  const alcance = await obtenerAlcance().catch(() => null);
  if (!alcance) return { ok: false, mensaje: "Entra para hacer esto." };

  const destino =
    alcance.tipo === "tienda" ? alcance.tiendaId : tiendaId.trim();
  if (!destino) {
    return { ok: false, mensaje: "No sabemos de qué comercio es esto." };
  }

  if (!COLORES_BANNER.some((c) => c.id === colorId)) {
    return { ok: false, mensaje: "Ese color no está disponible." };
  }

  const valores = { colorBanner: colorId, actualizadoEn: new Date() };

  await getDb()
    .insert(aparienciaTienda)
    .values({ tiendaId: destino, ...valores })
    .onConflictDoUpdate({ target: aparienciaTienda.tiendaId, set: valores });

  revalidatePath("/[locale]/panel/mi-tienda", "page");
  revalidatePath("/[locale]/tienda/[slug]", "page");

  return { ok: true };
}
