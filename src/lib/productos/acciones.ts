"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { obtenerAlcance } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { mensajes } from "@/lib/mensajes";
import { imagenesProducto, productos } from "@/lib/db/schema";
import { borrarImagen, subirImagen } from "@/lib/subidas";

/**
 * El catalogo, desde el lado del comercio.
 *
 * REGLA DE ALCANCE, la de siempre: un vendedor solo toca SUS productos. La
 * tienda sale de la sesion, y antes de guardar se comprueba que el producto
 * pertenezca a esa tienda. Mandar el id de un producto ajeno no sirve de nada.
 *
 * DOS CUIDADOS CON EL DINERO Y LA MERCANCIA:
 *   - El precio se escribe en dolares y se guarda en CENTAVOS ENTEROS. Nunca
 *     se guarda un decimal como precio.
 *   - Las existencias SI llevan decimales: una ferreteria vende cable por
 *     metro y cemento por kilo.
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
    tituloEs: z
      .string()
      .trim()
      .min(2, "El nombre del producto es obligatorio.")
      .max(160),
    tituloEn: z.string().trim().max(160).optional(),
    descripcionEs: z.string().trim().max(2000).optional(),
    descripcionEn: z.string().trim().max(2000).optional(),
    sku: z.string().trim().max(60).optional(),
    marca: z.string().trim().max(80).optional(),
    unidad: z.string().trim().max(30).optional(),
    precio: z
      .string()
      .trim()
      .min(1, t("ponlePrecioAlProducto"))
      .refine((v) => Number(v.replace(",", ".")) > 0, t("precioMayorQueCero")),
    precioAntes: z.string().trim().optional(),
    existencias: z.string().trim().optional(),
    controlaExistencias: z.string().optional(),
    estado: z.enum(["borrador", "publicado", "agotado"]),
    destacado: z.string().optional(),
  });
}

export type ResultadoProducto =
  { ok: true; mensaje: string; id: string } | { ok: false; mensaje: string };

/** De lo que escribe una persona ("12,50") a centavos enteros. */
function aCentavos(texto: string | undefined) {
  if (!texto?.trim()) return null;
  const numero = Number(texto.replace(",", "."));
  if (!Number.isFinite(numero) || numero < 0) return null;
  return Math.round(numero * 100);
}

/** Direccion legible sacada del titulo. */
function aSlug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Un slug que no choque con otro producto ya existente. */
async function slugLibre(
  db: ReturnType<typeof getDb>,
  base: string,
  excluirId?: string,
) {
  const raiz = base || "producto";
  for (let intento = 0; intento < 20; intento++) {
    const candidato = intento === 0 ? raiz : `${raiz}-${intento + 1}`;
    const [choca] = await db
      .select({ id: productos.id })
      .from(productos)
      .where(
        excluirId
          ? and(eq(productos.slug, candidato), ne(productos.id, excluirId))
          : eq(productos.slug, candidato),
      )
      .limit(1);
    if (!choca) return candidato;
  }
  return `${raiz}-${nanoid(6).toLowerCase()}`;
}

/**
 * Crea o actualiza un producto del comercio.
 * Si llega `id`, se edita ese; si no, se crea uno nuevo.
 */
export async function guardarProducto(
  formulario: FormData,
): Promise<ResultadoProducto> {
  const t = await mensajes();

  const alcance = await obtenerAlcance();
  const db = getDb();
  const id = String(formulario.get("id") ?? "").trim() || null;

  // De que tienda es. Un vendedor, la suya; el equipo, la que este viendo.
  let tiendaId: string | null =
    alcance.tipo === "tienda" ? alcance.tiendaId : null;

  if (id) {
    const [existente] = await db
      .select({ tiendaId: productos.tiendaId })
      .from(productos)
      .where(eq(productos.id, id))
      .limit(1);

    if (!existente) return { ok: false, mensaje: t("productoNoExiste") };

    // La comprobacion que impide tocar el producto de otro comercio.
    if (alcance.tipo === "tienda" && existente.tiendaId !== alcance.tiendaId) {
      return { ok: false, mensaje: t("productoAjeno") };
    }
    tiendaId = existente.tiendaId;
  } else if (!tiendaId) {
    tiendaId = String(formulario.get("tiendaId") ?? "").trim() || null;
  }

  if (!tiendaId) {
    return { ok: false, mensaje: t("productoSinTienda") };
  }

  const revisado = construirEsquema(t).safeParse(
    Object.fromEntries(formulario),
  );
  if (!revisado.success) {
    return {
      ok: false,
      mensaje: revisado.error.issues[0]?.message ?? t("revisaLosDatos"),
    };
  }

  const d = revisado.data;
  const precioCentavos = aCentavos(d.precio);
  if (precioCentavos === null || precioCentavos <= 0) {
    return { ok: false, mensaje: t("precioMayorQueCero") };
  }

  // Un producto publicado sin precio se venderia regalado.
  if (d.estado === "publicado" && precioCentavos <= 0) {
    return {
      ok: false,
      mensaje: t("sinPrecioNoSePublica"),
    };
  }

  const existencias = d.existencias?.trim()
    ? Number(d.existencias.replace(",", "."))
    : 0;

  const ahora = new Date();
  const campos = {
    tiendaId,
    tituloEs: d.tituloEs,
    tituloEn: d.tituloEn?.trim() || null,
    descripcionEs: d.descripcionEs?.trim() || null,
    descripcionEn: d.descripcionEn?.trim() || null,
    sku: d.sku?.trim() || null,
    marca: d.marca?.trim() || null,
    unidad: d.unidad?.trim() || null,
    precioCentavos,
    precioAntesCentavos: aCentavos(d.precioAntes),
    existencias: Number.isFinite(existencias) ? Math.max(0, existencias) : 0,
    controlaExistencias: d.controlaExistencias === "on",
    estado: d.estado,
    destacado: d.destacado === "on",
    actualizadoEn: ahora,
  };

  let productoId = id;

  if (id) {
    await db.update(productos).set(campos).where(eq(productos.id, id));
  } else {
    productoId = nanoid();
    await db.insert(productos).values({
      ...campos,
      id: productoId,
      slug: await slugLibre(db, aSlug(d.tituloEs)),
      moneda: "USD",
      creadoEn: ahora,
    });
  }

  // Las fotos nuevas se suman a las que ya tenga.
  const fotos = formulario
    .getAll("fotos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (fotos.length > 0 && productoId) {
    const [ultima] = await db
      .select({ n: sql<number>`COALESCE(MAX(${imagenesProducto.orden}), -1)` })
      .from(imagenesProducto)
      .where(eq(imagenesProducto.productoId, productoId));

    let orden = Number(ultima?.n ?? -1) + 1;

    for (const foto of fotos.slice(0, 8)) {
      const subida = await subirImagen(foto, `productos/${productoId}`);
      if (!subida.ok) return subida;

      await db.insert(imagenesProducto).values({
        id: nanoid(),
        productoId,
        clave: subida.clave,
        orden: orden++,
      });
    }
  }

  revalidatePath("/[locale]/panel", "layout");
  revalidatePath("/[locale]/catalogo", "page");
  revalidatePath("/[locale]/tienda/[slug]", "page");

  return {
    ok: true,
    id: productoId!,
    mensaje: id ? "Producto actualizado." : "Producto creado.",
  };
}

/** Quita una foto de un producto del comercio. */
export async function borrarFoto(
  imagenId: string,
): Promise<{ ok: boolean; mensaje: string }> {
  const t = await mensajes();

  const alcance = await obtenerAlcance();
  const db = getDb();

  const [fila] = await db
    .select({
      clave: imagenesProducto.clave,
      url: imagenesProducto.url,
      tiendaId: productos.tiendaId,
    })
    .from(imagenesProducto)
    .innerJoin(productos, eq(productos.id, imagenesProducto.productoId))
    .where(eq(imagenesProducto.id, imagenId))
    .limit(1);

  if (!fila) return { ok: false, mensaje: t("fotoNoExiste") };
  if (alcance.tipo === "tienda" && fila.tiendaId !== alcance.tiendaId) {
    return { ok: false, mensaje: t("fotoAjena") };
  }

  await db.delete(imagenesProducto).where(eq(imagenesProducto.id, imagenId));

  // Solo se borra del almacenamiento lo que subimos nosotros. Las fotos que
  // viven en el servidor del comercio de origen no son nuestras.
  if (fila.clave) await borrarImagen(fila.clave);

  revalidatePath("/[locale]/panel", "layout");
  return { ok: true, mensaje: t("fotoQuitada") };
}

/** Publica o retira un producto de la tienda, sin abrir el formulario. */
export async function cambiarEstadoProducto(
  id: string,
  estado: "borrador" | "publicado" | "agotado",
): Promise<{ ok: boolean; mensaje: string }> {
  const t = await mensajes();

  const alcance = await obtenerAlcance();
  const db = getDb();

  const [producto] = await db
    .select({ tiendaId: productos.tiendaId, precio: productos.precioCentavos })
    .from(productos)
    .where(eq(productos.id, id))
    .limit(1);

  if (!producto) return { ok: false, mensaje: t("productoNoExiste") };
  if (alcance.tipo === "tienda" && producto.tiendaId !== alcance.tiendaId) {
    return { ok: false, mensaje: t("productoAjeno") };
  }
  if (estado === "publicado" && producto.precio <= 0) {
    return { ok: false, mensaje: t("ponlePrecio") };
  }

  await db
    .update(productos)
    .set({ estado, actualizadoEn: new Date() })
    .where(eq(productos.id, id));

  revalidatePath("/[locale]/panel", "layout");
  revalidatePath("/[locale]/catalogo", "page");

  return { ok: true, mensaje: t("listo") };
}
