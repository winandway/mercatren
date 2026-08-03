"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { obtenerAlcance } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { mensajes } from "@/lib/mensajes";
import { tiendas } from "@/lib/db/schema";
import { borrarImagen, subirImagen } from "@/lib/subidas";

/**
 * Lo que el comercio puede cambiar de su propia tienda.
 *
 * REGLA DE ALCANCE: un vendedor solo toca la SUYA. La tienda no se recibe del
 * formulario; se resuelve desde la sesion con obtenerAlcance(). Aunque alguien
 * mande otro identificador, se ignora.
 *
 * Lo que el comercio NO puede cambiar desde aqui, a proposito:
 *   - su comision (la acuerda Mercatren),
 *   - su estado (activa/suspendida),
 *   - su slug (romperia los enlaces que ya circulan).
 */

/**
 * El esquema se arma con los textos ya traducidos.
 *
 * Antes era una constante del modulo, y ahi no hay idioma todavia: los
 * avisos de validacion salian siempre en espanol aunque la persona
 * estuviera usando el panel en ingles.
 */
/** Los textos traducidos que necesita el esquema. */
type Textos = Awaited<ReturnType<typeof mensajes>>;

function construirEsquema(t: Textos) {
  return z.object({
    nombre: z.string().trim().min(2, t("nombreTiendaObligatorio")).max(80),
    descripcionEs: z.string().trim().max(600).optional(),
    descripcionEn: z.string().trim().max(600).optional(),
    razonSocial: z.string().trim().max(120).optional(),
    identificacionFiscal: z.string().trim().max(40).optional(),
    correoContacto: z
      .union([z.literal(""), z.string().trim().email(t("correoInvalido"))])
      .optional(),
    telefono: z.string().trim().max(40).optional(),
    direccion: z.string().trim().max(200).optional(),
    ciudad: z.string().trim().max(80).optional(),
    sitioWeb: z
      .union([z.literal(""), z.string().trim().url(t("direccionInvalida"))])
      .optional(),
    horario: z.string().trim().max(200).optional(),
  });
}

export type ResultadoTienda =
  { ok: true; mensaje: string } | { ok: false; mensaje: string };

/** Lo vacio se guarda como NULL, para que la ficha no muestre huecos. */
function oNulo(valor: string | undefined) {
  const limpio = valor?.trim();
  return limpio ? limpio : null;
}

export async function guardarMiTienda(
  formulario: FormData,
): Promise<ResultadoTienda> {
  const t = await mensajes();

  const alcance = await obtenerAlcance();

  // El equipo de Mercatren puede editar la tienda que este viendo; un
  // comercio, solo la suya.
  const tiendaId =
    alcance.tipo === "tienda"
      ? alcance.tiendaId
      : String(formulario.get("tiendaId") ?? "");

  if (!tiendaId) {
    return { ok: false, mensaje: t("tiendaSinIdentificar") };
  }

  const revisado = construirEsquema(t).safeParse({
    nombre: formulario.get("nombre"),
    descripcionEs: formulario.get("descripcionEs"),
    descripcionEn: formulario.get("descripcionEn"),
    razonSocial: formulario.get("razonSocial"),
    identificacionFiscal: formulario.get("identificacionFiscal"),
    correoContacto: formulario.get("correoContacto"),
    telefono: formulario.get("telefono"),
    direccion: formulario.get("direccion"),
    ciudad: formulario.get("ciudad"),
    sitioWeb: formulario.get("sitioWeb"),
    horario: formulario.get("horario"),
  });

  if (!revisado.success) {
    return {
      ok: false,
      mensaje: revisado.error.issues[0]?.message ?? t("revisaLosDatos"),
    };
  }

  const db = getDb();
  const [actual] = await db
    .select({
      logoClave: tiendas.logoClave,
      portadaClave: tiendas.portadaClave,
    })
    .from(tiendas)
    .where(eq(tiendas.id, tiendaId))
    .limit(1);

  if (!actual) return { ok: false, mensaje: t("tiendaNoExiste") };

  const datos = revisado.data;
  const cambios: Record<string, unknown> = {
    nombre: datos.nombre,
    descripcionEs: oNulo(datos.descripcionEs),
    descripcionEn: oNulo(datos.descripcionEn),
    razonSocial: oNulo(datos.razonSocial),
    identificacionFiscal: oNulo(datos.identificacionFiscal),
    correoContacto: oNulo(datos.correoContacto),
    telefono: oNulo(datos.telefono),
    direccion: oNulo(datos.direccion),
    ciudad: oNulo(datos.ciudad),
    sitioWeb: oNulo(datos.sitioWeb),
    horario: oNulo(datos.horario),
    actualizadoEn: new Date(),
  };

  // El logo y la portada solo se tocan si mandaron una imagen nueva. La
  // anterior se borra despues de guardar la nueva, no antes: si algo falla,
  // el comercio se queda con la que tenia y no sin ninguna.
  const logo = formulario.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const subida = await subirImagen(logo, `tiendas/${tiendaId}/logo`);
    if (!subida.ok) return subida;
    cambios.logoClave = subida.clave;
  }

  const portada = formulario.get("portada");
  if (portada instanceof File && portada.size > 0) {
    const subida = await subirImagen(portada, `tiendas/${tiendaId}/portada`);
    if (!subida.ok) return subida;
    cambios.portadaClave = subida.clave;
  }

  await db.update(tiendas).set(cambios).where(eq(tiendas.id, tiendaId));

  if (cambios.logoClave && actual.logoClave) {
    await borrarImagen(actual.logoClave);
  }
  if (cambios.portadaClave && actual.portadaClave) {
    await borrarImagen(actual.portadaClave);
  }

  revalidatePath("/[locale]/panel", "layout");
  revalidatePath("/[locale]/tienda/[slug]", "page");

  return { ok: true, mensaje: t("tiendaGuardada") };
}
