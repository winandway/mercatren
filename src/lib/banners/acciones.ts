"use server";

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { esSoporteDeVerdad } from "@/lib/autorizacion";
import {
  CADA_CUANTOS_MAXIMO,
  CADA_CUANTOS_MINIMO,
  CADA_CUANTOS_POR_DEFECTO,
  UBICACIONES,
} from "@/lib/banners/reglas";
import { olvidar } from "@/lib/cachecito";
import { getDb } from "@/lib/db";
import { banners } from "@/lib/db/schema";
import { MERCADOS } from "@/lib/mercado/mercados";
import { mensajes } from "@/lib/mensajes";
import { borrarImagen, subirImagen } from "@/lib/subidas";

/**
 * LAS ACCIONES DE LOS BANNERS — solo el rol soporte, comprobado en el
 * servidor y con `esSoporteDeVerdad()`: quien mira el panel de un comercio con
 * el disfraz de «ver su panel» no puede poner publicidad.
 *
 * El enlace admite una ruta del sitio (`/tienda/maxium`,
 * `/catalogo?categoria=ropa-y-calzado`) o una URL completa https. Nada de
 * `javascript:` ni de rutas raras: se valida con zod antes de guardar.
 */
export type ResultadoBanner =
  { ok: true; mensaje: string; id: string } | { ok: false; mensaje: string };

const Enlace = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine((v) => v.startsWith("/") || /^https:\/\/[^\s]+$/i.test(v), "enlace");

function texto(max: number) {
  return z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().max(max),
  );
}

/* Lo recordado de los banners se tira al guardar: un minuto de caché está bien
   para el público, no para quien acaba de pulsar «Guardar» y va a mirar. */
function olvidarBanners() {
  for (const m of MERCADOS) olvidar(`banners-activos-${m.codigo}`);
}

function oNulo(v: string | undefined | null): string | null {
  const limpio = v?.trim();
  return limpio ? limpio : null;
}

function fecha(v: FormDataEntryValue | null): Date | null {
  const t = typeof v === "string" ? v.trim() : "";
  if (!t) return null;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

const Entrada = z.object({
  tituloEs: texto(120).refine((v) => v.length > 0, "tituloEs"),
  tituloEn: texto(120).optional(),
  textoEs: texto(300).optional(),
  textoEn: texto(300).optional(),
  botonEs: texto(40).optional(),
  botonEn: texto(40).optional(),
  enlace: Enlace,
  ubicacion: z.enum(UBICACIONES),
  tiendaId: z.string().trim().max(120).optional(),
  cadaCuantos: z.coerce
    .number()
    .int()
    .min(CADA_CUANTOS_MINIMO)
    .max(CADA_CUANTOS_MAXIMO)
    .default(CADA_CUANTOS_POR_DEFECTO),
  orden: z.coerce.number().int().min(0).max(999).default(0),
  activo: z.boolean(),
  mercado: z.string().trim().toUpperCase().default("US"),
});

export async function guardarBanner(
  formulario: FormData,
): Promise<ResultadoBanner> {
  const t = await mensajes();
  if (!(await esSoporteDeVerdad()))
    return { ok: false, mensaje: t("sinPermiso") };

  const revisado = Entrada.safeParse({
    tituloEs: formulario.get("tituloEs"),
    tituloEn: formulario.get("tituloEn") ?? "",
    textoEs: formulario.get("textoEs") ?? "",
    textoEn: formulario.get("textoEn") ?? "",
    botonEs: formulario.get("botonEs") ?? "",
    botonEn: formulario.get("botonEn") ?? "",
    enlace: formulario.get("enlace"),
    ubicacion: formulario.get("ubicacion") ?? "todas",
    tiendaId: formulario.get("tiendaId") ?? "",
    cadaCuantos: formulario.get("cadaCuantos") ?? CADA_CUANTOS_POR_DEFECTO,
    orden: formulario.get("orden") ?? 0,
    activo:
      formulario.get("activo") === "on" || formulario.get("activo") === "true",
    mercado: formulario.get("mercado") ?? "US",
  });
  if (!revisado.success) {
    const campo = revisado.error.issues[0]?.path?.[0];
    return {
      ok: false,
      mensaje: `${t("revisaLosDatos")}${campo ? ` (${String(campo)})` : ""}`,
    };
  }
  const d = revisado.data;
  if (!MERCADOS.some((m) => m.codigo === d.mercado))
    return { ok: false, mensaje: `${t("revisaLosDatos")} (mercado)` };

  const id = String(formulario.get("id") ?? "").trim() || nanoid();
  const db = getDb();
  const [actual] = await db
    .select({ id: banners.id, imagenClave: banners.imagenClave })
    .from(banners)
    .where(eq(banners.id, id))
    .limit(1);

  /* La foto: opcional; si viene una nueva, la anterior se borra DESPUÉS de guardar. */
  let imagenClave = actual?.imagenClave ?? null;
  const archivo = formulario.get("imagen");
  let claveAnterior: string | null = null;
  if (archivo instanceof File && archivo.size > 0) {
    const subida = await subirImagen(archivo, `banners/${id}`);
    if (!subida.ok) return { ok: false, mensaje: subida.mensaje };
    claveAnterior = imagenClave;
    imagenClave = subida.clave;
  }
  if (formulario.get("quitarImagen") === "on") {
    claveAnterior = imagenClave;
    imagenClave = null;
  }

  const valores = {
    tituloEs: d.tituloEs,
    tituloEn: oNulo(d.tituloEn),
    textoEs: oNulo(d.textoEs),
    textoEn: oNulo(d.textoEn),
    botonEs: oNulo(d.botonEs),
    botonEn: oNulo(d.botonEn),
    imagenClave,
    enlace: d.enlace,
    ubicacion: d.ubicacion,
    tiendaId: oNulo(d.tiendaId),
    cadaCuantos: d.cadaCuantos,
    orden: d.orden,
    activo: d.activo,
    desde: fecha(formulario.get("desde")),
    hasta: fecha(formulario.get("hasta")),
    mercado: d.mercado,
    actualizadoEn: new Date(),
  };

  try {
    if (actual) await db.update(banners).set(valores).where(eq(banners.id, id));
    else
      await db.insert(banners).values({ id, ...valores, creadoEn: new Date() });
  } catch (e) {
    console.error("[banners] no se pudo guardar:", e);
    return {
      ok: false,
      mensaje: `${t("noSePudoGuardar")}: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
  if (claveAnterior && claveAnterior !== imagenClave)
    await borrarImagen(claveAnterior);

  olvidarBanners();
  revalidatePath("/[locale]/panel/banners", "page");
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/tienda/[slug]", "page");
  revalidatePath("/[locale]/catalogo", "page");
  return { ok: true, mensaje: t("guardado"), id };
}

export async function cambiarEstadoBanner(
  id: string,
  activo: boolean,
): Promise<ResultadoBanner> {
  const t = await mensajes();
  if (!(await esSoporteDeVerdad()))
    return { ok: false, mensaje: t("sinPermiso") };
  await getDb()
    .update(banners)
    .set({ activo, actualizadoEn: new Date() })
    .where(eq(banners.id, id));
  olvidarBanners();
  revalidatePath("/[locale]/panel/banners", "page");
  revalidatePath("/[locale]", "page");
  return { ok: true, mensaje: t("guardado"), id };
}

export async function borrarBanner(id: string): Promise<ResultadoBanner> {
  const t = await mensajes();
  if (!(await esSoporteDeVerdad()))
    return { ok: false, mensaje: t("sinPermiso") };
  const db = getDb();
  const [actual] = await db
    .select({ imagenClave: banners.imagenClave })
    .from(banners)
    .where(eq(banners.id, id))
    .limit(1);
  await db.delete(banners).where(eq(banners.id, id));
  if (actual?.imagenClave) await borrarImagen(actual.imagenClave);
  olvidarBanners();
  revalidatePath("/[locale]/panel/banners", "page");
  revalidatePath("/[locale]", "page");
  return { ok: true, mensaje: t("guardado"), id };
}
