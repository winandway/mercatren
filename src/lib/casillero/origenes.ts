"use server";

import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { esSoporteDeVerdad } from "@/lib/autorizacion";
import { nuevaClavePublica } from "@/lib/casillero/widget-puro";
import { getDb } from "@/lib/db";
import { origenesCasillero } from "@/lib/db/schema";

/**
 * Los sitios donde está pegado el widget.
 *
 * ══ SE ADMINISTRA DESDE EL PANEL, NO DESPLEGANDO ══
 *
 * El día que una clave aparezca en un foro hay que poder apagarla en diez
 * segundos. Si eso exigiera tocar código y esperar una publicación, la
 * clave seguiría viva media hora, que es justo lo que dura una avalancha
 * de altas falsas.
 *
 * Lo hace `esSoporteDeVerdad` y no `esEquipoInterno`: crear una llave que
 * abre una puerta pública no es algo que se haga desde el disfraz de «ver
 * el panel de un comercio».
 */
export async function crearOrigen(
  _previo: { error?: string; clave?: string } | null,
  formulario: FormData,
): Promise<{ error?: string; clave?: string }> {
  if (!(await esSoporteDeVerdad())) return { error: "permiso" };

  const nombre = String(formulario.get("nombre") ?? "").trim();
  const dominio = String(formulario.get("dominio") ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
  if (nombre.length < 2) return { error: "nombre" };
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(dominio)) return { error: "dominio" };

  const clave = nuevaClavePublica();
  try {
    await getDb().insert(origenesCasillero).values({
      id: nanoid(),
      nombre,
      dominio,
      clavePublica: clave,
      activo: true,
      creadoEn: new Date(),
    });
    return { clave };
  } catch (fallo) {
    console.error("[casillero] no se pudo crear el origen:", fallo);
    return { error: "fallo" };
  }
}

/** Apagar o encender un sitio. Apagar es la acción de urgencia. */
export async function cambiarOrigen(
  id: string,
  activo: boolean,
): Promise<{ ok: boolean }> {
  if (!(await esSoporteDeVerdad())) return { ok: false };
  await getDb()
    .update(origenesCasillero)
    .set({ activo })
    .where(eq(origenesCasillero.id, id))
    .catch(() => undefined);
  return { ok: true };
}

export async function listarOrigenes() {
  return getDb()
    .select({
      id: origenesCasillero.id,
      nombre: origenesCasillero.nombre,
      dominio: origenesCasillero.dominio,
      clavePublica: origenesCasillero.clavePublica,
      activo: origenesCasillero.activo,
      creadoEn: origenesCasillero.creadoEn,
    })
    .from(origenesCasillero)
    .orderBy(desc(origenesCasillero.creadoEn))
    .limit(100)
    .catch(() => []);
}
