"use server";

import { and, eq, isNull, lt, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { obtenerAlcance } from "@/lib/autorizacion";
import {
  agruparPorCodigo,
  type ArchivoDeOrigen,
  type ProductoDeOrigen,
} from "@/lib/catalogo/agrupar";
import { adivinarDepartamento } from "@/lib/catalogo/departamentos";
import { precioConAjusteCentavos } from "@/lib/dinero";
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

export type ResultadoSincronizacion = {
  ok: boolean;
  mensaje: string;
  creados?: number;
  actualizados?: number;
  aBorrador?: number;
  sinPrecio?: number;
  /** Líneas que se fundieron por venir del mismo código en otro galpón. */
  fusionadas?: number;
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
  /**
   * SIN SESIÓN: solo para la sincronización automática.
   *
   * El robotito que corre cada cuarto de hora no tiene sesión de nadie — no
   * hay comercio que consultar ni alcance que comprobar. Va como parámetro
   * explícito y no como «si no hay sesión, adelante», porque eso último
   * convertiría cualquier fallo al leer la sesión en un permiso.
   *
   * Quien lo llama así es `/datos/sincronizar`, que exige su propia llave.
   */
  opciones?: { sinSesion?: boolean },
): Promise<ResultadoSincronizacion> {
  const t = await mensajes();

  /* Si la cuenta no tiene comercio, se avisa: dejar que la excepción suba
     borraría el formulario del comercio con todo lo que llevara escrito. */
  const alcance = opciones?.sinSesion
    ? null
    : await obtenerAlcance().catch(() => null);
  if (!opciones?.sinSesion && !alcance) {
    return { ok: false, mensaje: t("cuentaSinComercio") };
  }
  const db = getDb();

  const [fuente] = await db
    .select()
    .from(fuentesCatalogo)
    .where(eq(fuentesCatalogo.id, fuenteId))
    .limit(1);

  if (!fuente) return { ok: false, mensaje: t("fuenteNoExiste") };

  if (
    alcance &&
    alcance.tipo === "tienda" &&
    fuente.tiendaId !== alcance.tiendaId
  ) {
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

  /**
   * UN CÓDIGO = UN PRODUCTO, aunque venga en varias líneas.
   *
   * Los sistemas que manejan más de un galpón mandan una línea por sucursal:
   * el mismo tubo dos veces, con las existencias de cada uno. Sin agrupar, el
   * comprador ve el producto repetido con dos cantidades distintas. El porqué
   * completo está en `agrupar.ts`.
   */
  const { grupos, fusionadas, repetidasEnUnGalpon, preciosDiscrepantes } =
    agruparPorCodigo(lista);

  /**
   * TODO LO QUE HAY QUE SABER DE LA BASE, EN DOS CONSULTAS.
   *
   * Antes se preguntaba producto por producto: con 757 líneas eran más de dos
   * mil consultas seguidas y la sincronización no alcanzaba a terminar.
   */
  const existentes = new Map<string, string>(); // identificador de origen → id
  for (const fila of await db
    .select({ id: productos.id, externoId: productos.externoId })
    .from(productos)
    .where(eq(productos.tiendaId, tiendaId))) {
    if (fila.externoId) existentes.set(fila.externoId, fila.id);
  }

  // Los que ya tienen su foto en NUESTRO almacenamiento: a esos no se les toca.
  const conFotoPropia = new Set(
    (
      await db
        .selectDistinct({ productoId: imagenesProducto.productoId })
        .from(imagenesProducto)
        .innerJoin(productos, eq(productos.id, imagenesProducto.productoId))
        .where(
          and(
            eq(productos.tiendaId, tiendaId),
            sql`${imagenesProducto.clave} IS NOT NULL`,
          ),
        )
    ).map((f) => f.productoId),
  );

  let creados = 0;
  let actualizados = 0;
  let sinPrecio = 0;

  for (const grupo of grupos) {
    const p: ProductoDeOrigen = grupo.principal;
    if (!p.title_es?.trim()) continue;

    /* EL IDENTIFICADOR CON EL QUE SE GUARDA. Se prefiere uno que Mercatren ya
       tenga: así el producto conserva su dirección web —que Google ya
       indexó— y las fotos que ya se trajeron. Si ninguno existe todavía, se
       usa el primero por orden alfabético, que no cambia nunca. */
    const externoId =
      grupo.ids.find((id) => existentes.has(id)) ?? grupo.ids[0];
    if (!externoId) continue;

    /**
     * El archivo del comercio trae SU precio (la base). Lo publicado lleva el
     * ajuste por procesamiento sumado aquí, igual que cuando carga un
     * producto a mano: el robotito trabaja en todas las puertas o el catálogo
     * queda mitad con ajuste y mitad sin él.
     */
    const precioBase = aCentavos(p.price);
    const precio =
      precioBase && precioBase > 0
        ? precioConAjusteCentavos(precioBase)
        : precioBase;
    let estado = ESTADOS[p.status ?? ""] ?? "borrador";

    // Publicado sin precio no se publica: se venderia regalado.
    if (estado === "publicado" && (precio === null || precio <= 0)) {
      estado = "borrador";
      sinPrecio++;
    }

    const existente = existentes.get(externoId);

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
      precioBaseCentavos: precioBase ?? 0,
      precioAntesCentavos: (() => {
        const antes = aCentavos(p.compare_at_price);
        return antes && antes > 0 ? precioConAjusteCentavos(antes) : null;
      })(),
      /* Las existencias SI llevan decimales: cable por metro, cemento por
         kilo. Y son la SUMA de los galpones, no las de una línea: así, mover
         mercancía de una sucursal a otra no se cuenta como venta. */
      existencias: grupo.existencias,
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
      productoId = existente;
      await db.update(productos).set(campos).where(eq(productos.id, existente));
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
    if (fotos.length > 0 && !conFotoPropia.has(productoId)) {
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

  /**
   * LO QUE YA NO VIENE PASA A BORRADOR, NO SE BORRA: puede tener pedidos
   * viejos colgando.
   *
   * Se reconoce por la FECHA, no por una lista de identificadores. Antes se
   * mandaban todos los identificadores vistos dentro de una sola consulta, y
   * con 757 la base la rechaza: tiene un tope de cuántos valores acepta de
   * golpe. Por la fecha, la consulta pesa igual con diez productos que con
   * diez mil.
   *
   * Esto barre también las fichas duplicadas que quedaron absorbidas por su
   * código: como no se tocaron en el bucle, su fecha quedó vieja. Su mercancía
   * no se pierde — ya está sumada en la ficha que se queda.
   */
  const quitados = await db
    .update(productos)
    .set({ estado: "borrador", actualizadoEn: ahora })
    .where(
      and(
        eq(productos.fuenteId, fuenteId),
        or(
          isNull(productos.sincronizadoEn),
          lt(productos.sincronizadoEn, ahora),
        ),
        sql`${productos.estado} != 'borrador'`,
      ),
    )
    .returning({ id: productos.id });
  const aBorrador = quitados.length;

  /* El resumen que queda guardado va telegráfico, en el mismo formato que ya
     tenía: son cuentas, no frases. Lo que el panel debe poder traducir son los
     NÚMEROS, y por eso van sueltos en el objeto que devuelve esta función.
     (Deuda conocida: `ultimoResultado` se guarda ya redactado, así que se lee
     en español aunque el panel esté en inglés. Se cierra el día que se guarde
     estructurado.) */
  const resumen = `${creados} nuevos, ${actualizados} actualizados${aBorrador ? `, ${aBorrador} retirados` : ""}${sinPrecio ? `, ${sinPrecio} sin precio` : ""}${fusionadas ? `, ${fusionadas} fundidas` : ""}${repetidasEnUnGalpon ? `, ${repetidasEnUnGalpon} repetidas` : ""}${preciosDiscrepantes ? `, ${preciosDiscrepantes} precios distintos` : ""}`;

  await db
    .update(fuentesCatalogo)
    .set({
      ultimaSincronizacion: ahora,
      ultimoResultado: resumen,
      // Los PRODUCTOS, no las líneas del archivo: 757 líneas son 690 productos.
      productosSincronizados: grupos.length,
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
    fusionadas,
  };
}

/**
 * Guarda la direccion del archivo del comercio, y su llave si la lleva.
 *
 * LA LLAVE NO ES UN EXTRA: casi ningun comercio publica su catalogo abierto al
 * mundo. El de la ferreteria piloto pide `Authorization: Bearer <token>` y sin
 * el responde 401 — asi que un formulario que solo pidiera la direccion dejaria
 * la lectura muerta para siempre, con la pantalla diciendo que esta todo bien.
 */
export async function guardarFuente(
  formulario: FormData,
): Promise<{ ok: boolean; mensaje: string }> {
  const t = await mensajes();

  /* Si la cuenta no tiene comercio, se avisa: dejar que la excepción suba
     borraría el formulario del comercio con todo lo que llevara escrito. */
  const alcance = await obtenerAlcance().catch(() => null);
  if (!alcance) return { ok: false, mensaje: t("cuentaSinComercio") };
  const db = getDb();

  const id = String(formulario.get("id") ?? "");
  const url = String(formulario.get("url") ?? "").trim();
  /* `null` = no vino el campo (no se toca lo guardado). Cadena vacia = vino
     vacio a proposito, y entonces se borra. Son dos cosas distintas: sin esa
     diferencia, guardar solo la direccion borraria la llave sin avisar. */
  const tokenCrudo = formulario.get("token");
  const token = tokenCrudo === null ? null : String(tokenCrudo).trim();

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
    .set({
      url: url || null,
      ...(token === null ? {} : { token: token || null }),
    })
    .where(eq(fuentesCatalogo.id, id));

  revalidatePath("/[locale]/panel", "layout");
  return { ok: true, mensaje: t("direccionGuardada") };
}
