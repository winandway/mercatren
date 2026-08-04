"use server";

import { and, eq, notInArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { obtenerAlcance } from "@/lib/autorizacion";
import { adivinarDepartamento } from "@/lib/catalogo/departamentos";
import { getDb } from "@/lib/db";
import { mensajes } from "@/lib/mensajes";
import {
  categorias,
  fuentesCatalogo,
  imagenesProducto,
  productos,
} from "@/lib/db/schema";

/**
 * Sincronizacion del catalogo desde el sistema del comercio.
 *
 * EL ARCHIVO DE EXPORTACION ES EL CONTRATO. El mismo JSON que se importo a
 * mano la primera vez sirve para que Mercatren lo lea solo: el comercio lo
 * publica en una direccion suya y aqui se relee cuando haga falta.
 *
 * TRES REGLAS QUE VIENEN DEL IMPORTADOR Y NO SE TOCAN:
 *
 *  1. Cada producto se reconoce por (tienda, externo_id). Reimportar
 *     ACTUALIZA en vez de duplicar. Sin esto, la segunda sincronizacion
 *     llenaria el catalogo de copias.
 *  2. Un producto publicado SIN PRECIO no se publica: se vendria regalado.
 *     Entra como borrador y se avisa.
 *  3. Lo que el comercio quita de su tienda pasa a BORRADOR, no se borra:
 *     puede tener pedidos viejos colgando.
 *
 * Y una mas, propia de aqui: las fotos que ya trajimos a nuestro
 * almacenamiento NO se pisan con las del origen. Si se copiaron para dejar de
 * depender de ese servidor, volver a apuntar alli seria deshacer el trabajo.
 */

type ProductoDeOrigen = {
  id?: string;
  sku?: string | null;
  slug?: string | null;
  title_es?: string | null;
  title_en?: string | null;
  description_es?: string | null;
  description_en?: string | null;
  category_id?: string | null;
  brand?: string | null;
  price?: number | null;
  compare_at_price?: number | null;
  stock?: number | null;
  unit?: string | null;
  weight_grams?: number | null;
  status?: string | null;
  featured?: boolean | null;
  images?: { url?: string | null; alt?: string | null; position?: number }[];
};

type ArchivoDeOrigen = {
  categories?: {
    id?: string;
    slug?: string;
    name_es?: string;
    name_en?: string | null;
  }[];
  products?: ProductoDeOrigen[];
};

export type ResultadoSincronizacion = {
  ok: boolean;
  mensaje: string;
  creados?: number;
  actualizados?: number;
  aBorrador?: number;
  sinPrecio?: number;
};

/** Dolares a centavos enteros. El dinero nunca lleva decimales. */
function aCentavos(valor: number | null | undefined) {
  if (valor === null || valor === undefined) return null;
  const n = Number(valor);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

/**
 * La direccion del producto.
 * Hay sistemas cuya URL es el identificador interno; usarlo dejaria
 * direcciones como /producto/9f3c1a7e-... asi que en ese caso se arma del
 * titulo. El id de origen se guarda igual en externo_id.
 */
function aSlug(origen: ProductoDeOrigen) {
  const pareceIdentificador =
    !origen.slug ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      origen.slug,
    );

  const base = pareceIdentificador ? (origen.title_es ?? "") : origen.slug!;

  return (
    base
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `producto-${nanoid(6).toLowerCase()}`
  );
}

const ESTADOS: Record<string, "publicado" | "borrador" | "agotado"> = {
  published: "publicado",
  active: "publicado",
  draft: "borrador",
  out_of_stock: "agotado",
  archived: "borrador",
};

/**
 * Lee el archivo del comercio y actualiza su catalogo.
 * Solo el equipo de Mercatren o el propio comercio, y solo sobre su tienda.
 */
export async function sincronizarCatalogo(
  fuenteId: string,
): Promise<ResultadoSincronizacion> {
  const t = await mensajes();

  const alcance = await obtenerAlcance();
  const db = getDb();

  const [fuente] = await db
    .select()
    .from(fuentesCatalogo)
    .where(eq(fuentesCatalogo.id, fuenteId))
    .limit(1);

  if (!fuente) return { ok: false, mensaje: t("fuenteNoExiste") };

  if (alcance.tipo === "tienda" && fuente.tiendaId !== alcance.tiendaId) {
    return { ok: false, mensaje: t("fuenteAjena") };
  }
  if (!fuente.url) {
    return {
      ok: false,
      mensaje: t("fuenteSinDireccion"),
    };
  }

  // Se lee el archivo del comercio.
  let archivo: ArchivoDeOrigen;
  try {
    const respuesta = await fetch(fuente.url, {
      headers: fuente.token
        ? { Authorization: `Bearer ${fuente.token}` }
        : undefined,
    });
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    archivo = (await respuesta.json()) as ArchivoDeOrigen;
  } catch (e) {
    const detalle = e instanceof Error ? e.message : String(e);
    await db
      .update(fuentesCatalogo)
      .set({
        ultimaSincronizacion: new Date(),
        ultimoResultado: `No se pudo leer: ${detalle}`.slice(0, 200),
      })
      .where(eq(fuentesCatalogo.id, fuenteId));

    return { ok: false, mensaje: t("archivoIlegible", { detalle }) };
  }

  const lista = archivo.products ?? [];
  if (lista.length === 0) {
    return { ok: false, mensaje: t("archivoSinProductos") };
  }

  const tiendaId = fuente.tiendaId;
  const ahora = new Date();

  /**
   * Las categorias del comercio, primero: los productos apuntan a ellas.
   *
   * Y CADA UNA SE CUELGA DE UN DEPARTAMENTO DE MERCATREN. El comercio manda
   * "PVC" y "Hierro"; nosotros los reconocemos como ferreteria y los colgamos
   * de ese departamento. Sin esto, sus productos existirian pero no saldrian
   * en ninguna parte del sitio: quien busca por departamento no los veria.
   *
   * Lo que no se reconoce se deja sin colgar a proposito. Es mejor que el
   * equipo lo asigne despues a que quede en el departamento equivocado, donde
   * lo encontraria justo quien no lo buscaba.
   */
  const idCategoria = new Map<string, string>();
  for (const c of archivo.categories ?? []) {
    if (!c.id) continue;
    const id = `cat-${tiendaId}-${c.slug ?? c.id}`;
    idCategoria.set(c.id, id);

    const departamento = adivinarDepartamento(
      `${c.name_es ?? ""} ${c.slug ?? ""}`,
    );

    await db
      .insert(categorias)
      .values({
        id,
        tiendaId,
        slug: c.slug ?? c.id,
        nombreEs: c.name_es ?? c.id,
        nombreEn: c.name_en ?? null,
        padreId: departamento ? `dep-${departamento}` : null,
        externoId: c.id,
      })
      .onConflictDoUpdate({
        target: categorias.id,
        set: {
          nombreEs: c.name_es ?? c.id,
          nombreEn: c.name_en ?? null,
          padreId: departamento ? `dep-${departamento}` : null,
        },
      });
  }

  let creados = 0;
  let actualizados = 0;
  let sinPrecio = 0;
  const vistos: string[] = [];

  for (const p of lista) {
    const externoId = p.id ?? p.sku;
    if (!externoId || !p.title_es?.trim()) continue;

    vistos.push(externoId);

    const precio = aCentavos(p.price);
    let estado = ESTADOS[p.status ?? ""] ?? "borrador";

    // Publicado sin precio no se publica: se venderia regalado.
    if (estado === "publicado" && (precio === null || precio <= 0)) {
      estado = "borrador";
      sinPrecio++;
    }

    const [existente] = await db
      .select({ id: productos.id })
      .from(productos)
      .where(
        and(
          eq(productos.tiendaId, tiendaId),
          eq(productos.externoId, externoId),
        ),
      )
      .limit(1);

    const campos = {
      categoriaId: p.category_id
        ? (idCategoria.get(p.category_id) ?? null)
        : null,
      sku: p.sku ?? null,
      marca: p.brand ?? null,
      tituloEs: p.title_es,
      tituloEn: p.title_en ?? null,
      descripcionEs: p.description_es ?? null,
      descripcionEn: p.description_en ?? null,
      precioCentavos: precio ?? 0,
      precioAntesCentavos: aCentavos(p.compare_at_price),
      // Las existencias SI llevan decimales: cable por metro, cemento por kilo.
      existencias: Number(p.stock ?? 0),
      unidad: p.unit ?? null,
      pesoGramos: p.weight_grams ?? null,
      estado,
      destacado: Boolean(p.featured),
      fuenteId,
      sincronizadoEn: ahora,
      actualizadoEn: ahora,
    };

    let productoId: string;

    if (existente) {
      productoId = existente.id;
      await db
        .update(productos)
        .set(campos)
        .where(eq(productos.id, existente.id));
      actualizados++;
    } else {
      productoId = nanoid();
      await db.insert(productos).values({
        ...campos,
        id: productoId,
        tiendaId,
        externoId,
        slug: `${aSlug(p)}-${nanoid(4).toLowerCase()}`,
        moneda: "USD",
        creadoEn: ahora,
      });
      creados++;
    }

    // Las fotos: solo se tocan las que siguen viniendo del origen. Las que ya
    // trajimos a nuestro almacenamiento (tienen `clave`) se dejan en paz.
    const fotos = (p.images ?? []).filter((f) => f.url);
    if (fotos.length > 0) {
      const [yaNuestras] = await db
        .select({ n: sql<number>`COUNT(*)` })
        .from(imagenesProducto)
        .where(
          and(
            eq(imagenesProducto.productoId, productoId),
            sql`${imagenesProducto.clave} IS NOT NULL`,
          ),
        );

      if (Number(yaNuestras?.n ?? 0) === 0) {
        await db
          .delete(imagenesProducto)
          .where(eq(imagenesProducto.productoId, productoId));

        for (const [i, f] of fotos.entries()) {
          await db.insert(imagenesProducto).values({
            id: nanoid(),
            productoId,
            url: f.url!,
            textoAltEs: f.alt ?? null,
            orden: f.position ?? i,
          });
        }
      }
    }
  }

  // Lo que el comercio quito de su tienda pasa a borrador, NO se borra:
  // puede tener pedidos viejos colgando.
  let aBorrador = 0;
  if (vistos.length > 0) {
    const quitados = await db
      .update(productos)
      .set({ estado: "borrador", actualizadoEn: ahora })
      .where(
        and(
          eq(productos.fuenteId, fuenteId),
          notInArray(productos.externoId, vistos),
          sql`${productos.estado} != 'borrador'`,
        ),
      )
      .returning({ id: productos.id });
    aBorrador = quitados.length;
  }

  const resumen = `${creados} nuevos, ${actualizados} actualizados${aBorrador ? `, ${aBorrador} retirados` : ""}${sinPrecio ? `, ${sinPrecio} sin precio` : ""}`;

  await db
    .update(fuentesCatalogo)
    .set({
      ultimaSincronizacion: ahora,
      ultimoResultado: resumen,
      productosSincronizados: lista.length,
    })
    .where(eq(fuentesCatalogo.id, fuenteId));

  revalidatePath("/[locale]/panel", "layout");
  revalidatePath("/[locale]/catalogo", "page");

  return {
    ok: true,
    mensaje: resumen,
    creados,
    actualizados,
    aBorrador,
    sinPrecio,
  };
}

/** Guarda la direccion del archivo del comercio. */
export async function guardarFuente(
  formulario: FormData,
): Promise<{ ok: boolean; mensaje: string }> {
  const t = await mensajes();

  const alcance = await obtenerAlcance();
  const db = getDb();

  const id = String(formulario.get("id") ?? "");
  const url = String(formulario.get("url") ?? "").trim();

  const [fuente] = await db
    .select({ tiendaId: fuentesCatalogo.tiendaId })
    .from(fuentesCatalogo)
    .where(eq(fuentesCatalogo.id, id))
    .limit(1);

  if (!fuente) return { ok: false, mensaje: t("fuenteNoExiste") };
  if (alcance.tipo === "tienda" && fuente.tiendaId !== alcance.tiendaId) {
    return { ok: false, mensaje: t("fuenteAjena") };
  }

  if (url && !/^https:\/\//.test(url)) {
    return {
      ok: false,
      mensaje: t("direccionHttps"),
    };
  }

  await db
    .update(fuentesCatalogo)
    .set({ url: url || null })
    .where(eq(fuentesCatalogo.id, id));

  revalidatePath("/[locale]/panel", "layout");
  return { ok: true, mensaje: t("direccionGuardada") };
}
