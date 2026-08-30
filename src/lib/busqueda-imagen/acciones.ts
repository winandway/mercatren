"use server";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

import { exigirEquipoInterno } from "@/lib/autorizacion";
import { embeddingDeImagen } from "@/lib/busqueda-imagen/embeddings";
import { mirarImagen } from "@/lib/busqueda-imagen/mirar";
import { bytesAVector, masParecidos } from "@/lib/busqueda-imagen/similitud";
import { esEnlaceDeProductoNuestro } from "@/lib/busqueda-imagen/parsear";
import { direccionImagen, listarProductos } from "@/lib/catalogo/consultas";
import { correoProductoEncontrado } from "@/lib/correo/correos";
import { getDb } from "@/lib/db";
import {
  busquedasImagen,
  contactosBusqueda,
  embeddingsProducto,
  imagenesProducto,
  productos,
} from "@/lib/db/schema";

import { recordado } from "@/lib/cachecito";
import { mercadoActual } from "@/lib/mercado/actual";
import { mensajes } from "@/lib/mensajes";
import { correoAceptable } from "@/lib/validacion/correo-servidor";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";

/**
 * LA BÚSQUEDA POR FOTO, DE PUNTA A PUNTA (30 ago 2026).
 *
 * Pedido del dueño, con el negocio dentro: no es solo «buscar con una
 * imagen». Cada foto ES una señal de demanda — se GUARDA con lo que el ojo
 * entendió y cuántos resultados dio, y cuando no hay nada, el cliente deja
 * su correo y el equipo humano sigue buscando el producto. Lo que la gente
 * busca y no tenemos es la lista de compras del catálogo.
 */

const TIPOS = ["image/jpeg", "image/png", "image/webp"];
/** La foto ya viene comprimida del navegador; 3 MB es el respaldo. */
const TAMANO_MAXIMO = 3 * 1024 * 1024;
/** Tope por IP por hora: el ojo cuesta dinero y un robot no compra nada. */
const BUSQUEDAS_POR_HORA = 20;

export type ProductoEncontrado = {
  id: string;
  slug: string;
  tituloEs: string;
  tituloEn: string | null;
  precioCentavos: number;
  moneda: string;
  imagenUrl: string | null;
};

export type ResultadoBusquedaPorFoto =
  | {
      ok: true;
      busquedaId: string;
      descripcion: string;
      terminos: string[];
      mejorTermino: string | null;
      total: number;
      /** LOS PRODUCTOS CON SU FOTO, ahí mismo (30 ago 2026). El dueño probó
          con una captura de un producto nuestro y la página solo daba un
          botón: «debería de aparecer imágenes allí». Como Google Lens: la
          parrilla va en la propia página. */
      productos: ProductoEncontrado[];
    }
  | { ok: false; mensaje: string };

export async function buscarPorImagen(
  formulario: FormData,
): Promise<ResultadoBusquedaPorFoto> {
  const t = await mensajes();
  const archivo = formulario.get("foto");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { ok: false, mensaje: t("fotoFalta") };
  }
  if (!TIPOS.includes(archivo.type) || archivo.size > TAMANO_MAXIMO) {
    return { ok: false, mensaje: t("fotoInvalida") };
  }

  const db = getDb();
  const cabeceras = await headers();
  const ip = cabeceras.get("cf-connecting-ip") ?? "desconocida";

  /* El tope por IP: la misma tabla cuenta, sin infraestructura nueva. */
  const [enLaHora] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(busquedasImagen)
    .where(
      sql`${busquedasImagen.ip} = ${ip} AND ${busquedasImagen.creadoEn} > unixepoch() - 3600`,
    );
  if (Number(enLaHora?.n ?? 0) >= BUSQUEDAS_POR_HORA) {
    return { ok: false, mensaje: t("fotoMuchasBusquedas") };
  }

  const mercado = await mercadoActual();
  const bytes = await archivo.arrayBuffer();

  /* La foto se guarda ANTES de mirar: aunque el ojo falle, la señal de
     demanda queda. Es privada — la ve solo el equipo por /media. */
  const { env } = getCloudflareContext();
  const id = `bfoto-${nanoid(12)}`;
  const extension =
    archivo.type === "image/png"
      ? "png"
      : archivo.type === "image/webp"
        ? "webp"
        : "jpg";
  const clave = `busquedas/${id}.${extension}`;
  try {
    await env.BUCKET.put(clave, bytes, {
      httpMetadata: { contentType: archivo.type },
    });
  } catch {
    return { ok: false, mensaje: t("fotoNoSePudoSubir") };
  }

  const mirada = await mirarImagen(bytes, archivo.type);

  if (!mirada.ok) {
    await db.insert(busquedasImagen).values({
      id,
      mercado: mercado.codigo,
      imagenClave: clave,
      mirada: JSON.stringify({ error: mirada.motivo }),
      resultados: 0,
      ip,
    });
    return { ok: false, mensaje: t("fotoNoSePudoLeer") };
  }

  /* ══ EL MATCH POR IMAGEN, PRIMERO (30 ago 2026) ══
     Como los buscadores de imagen de verdad: el vector de la foto del
     cliente contra los vectores del catálogo (gemini-embedding-2, coseno).
     Los términos de texto quedan de RESPALDO — para los productos que aún
     no se indexaron y para los chips de la pantalla. */
  let visuales: ProductoEncontrado[] = [];
  try {
    const consulta = await embeddingDeImagen(bytes, archivo.type);
    if (consulta.ok) {
      const indiceDelMercado = await recordado(
        `indice-visual-${mercado.codigo}`,
        10 * 60_000,
        async () => {
          const filas = await db
            .select({
              id: embeddingsProducto.productoId,
              vector: embeddingsProducto.vector,
            })
            .from(embeddingsProducto)
            .where(
              sql`${embeddingsProducto.mercado} = ${mercado.codigo} AND ${embeddingsProducto.dimension} > 0`,
            );
          return filas.map((f) => ({
            id: f.id,
            vector: bytesAVector(new Uint8Array(f.vector as Buffer)),
          }));
        },
      );
      const vecinos = masParecidos(consulta.vector, indiceDelMercado, 12);
      if (vecinos.length > 0) {
        const porId = new Map(vecinos.map((v, i) => [v.id, i]));
        const filas = await db
          .select({
            id: productos.id,
            slug: productos.slug,
            tituloEs: productos.tituloEs,
            tituloEn: productos.tituloEn,
            precioCentavos: productos.precioCentavos,
            moneda: productos.moneda,
            fotoUrl: sql<
              string | null
            >`(SELECT url FROM ${imagenesProducto} WHERE ${imagenesProducto.productoId} = ${productos.id} ORDER BY orden, id LIMIT 1)`,
            fotoClave: sql<
              string | null
            >`(SELECT clave FROM ${imagenesProducto} WHERE ${imagenesProducto.productoId} = ${productos.id} ORDER BY orden, id LIMIT 1)`,
          })
          .from(productos)
          .where(
            and(
              inArray(
                productos.id,
                vecinos.map((v) => v.id),
              ),
              eq(productos.estado, "publicado"),
            ),
          );
        visuales = filas
          .sort((a, b) => (porId.get(a.id) ?? 99) - (porId.get(b.id) ?? 99))
          .map((p) => ({
            id: p.id,
            slug: p.slug,
            tituloEs: p.tituloEs,
            tituloEn: p.tituloEn ?? null,
            precioCentavos: p.precioCentavos,
            moneda: p.moneda,
            imagenUrl: direccionImagen({ url: p.fotoUrl, clave: p.fotoClave }),
          }));
      }
    }
  } catch {
    /* El índice visual nunca tumba la búsqueda: sin él quedan los términos. */
  }

  /* Se prueban los términos DEL MÁS ESPECÍFICO AL MÁS GENERAL contra el
     mismo motor del catálogo (sinónimos y mercado incluidos): el primero
     que dé resultados es el que se le enseña al cliente. */
  const candidatos = [...mirada.es, ...mirada.en];
  let mejorTermino: string | null = null;
  let total = 0;
  /* ══ SOLO EL TÉRMINO MÁS ESPECÍFICO QUE DÉ ALGO (30 ago 2026) ══
     La primera versión juntaba los primeros TRES términos con resultados, y
     el dueño lo cazó con su engrasadora: «herramienta manual» — el término
     genérico — le puso una brocha de maquillaje al lado. Un resultado
     preciso vale más que doce revueltos: se enseñan los del mejor término y
     los demás términos quedan como enlaces, para que el CLIENTE decida si
     abre la búsqueda ancha. */
  const encontradosFoto: ProductoEncontrado[] = [];
  for (const termino of candidatos) {
    const { productos: pagina1, total: n } = await listarProductos(mercado, {
      busqueda: termino,
      pagina: 1,
    });
    if (n === 0) continue;
    mejorTermino = termino;
    total = n;
    for (const p of pagina1.slice(0, 12)) {
      encontradosFoto.push({
        id: p.id,
        slug: p.slug,
        tituloEs: p.tituloEs,
        tituloEn: p.tituloEn ?? null,
        precioCentavos: p.precioCentavos,
        moneda: p.moneda,
        imagenUrl: p.imagenUrl,
      });
    }
    break;
  }

  await db.insert(busquedasImagen).values({
    id,
    mercado: mercado.codigo,
    imagenClave: clave,
    mirada: JSON.stringify({
      descripcion: mirada.descripcion,
      es: mirada.es,
      en: mirada.en,
      mejorTermino,
      visual: visuales.length,
    }),
    resultados: Math.max(total, encontradosFoto.length, visuales.length),
    ip,
  });

  return {
    ok: true,
    busquedaId: id,
    descripcion: mirada.descripcion,
    terminos: candidatos.slice(0, 6),
    mejorTermino,
    total: visuales.length > 0 ? Math.max(total, visuales.length) : total,
    /* El match visual manda; el textual es el respaldo de lo no indexado. */
    productos: visuales.length > 0 ? visuales : encontradosFoto,
  };
}

/** El cliente deja su correo para que le avisemos cuando el producto entre. */
export async function dejarCorreoDeBusqueda(
  busquedaId: string,
  correo: string,
  idioma: string,
  /* El nombre es opcional: obligarlo perdería avisos por un dato que solo
     sirve para el saludo. Vive en su propia tabla (contactos_busqueda). */
  nombre?: string,
): Promise<{ ok: boolean; mensaje: string }> {
  const t = await mensajes();
  const revisado = z.string().trim().toLowerCase().email().safeParse(correo);
  if (!revisado.success) return { ok: false, mensaje: t("correoInvalido") };

  /* La misma comprobación del registro: un correo que no recibe es un aviso
     que se pierde — y este correo existe SOLO para recibir un aviso. */
  const real = await correoAceptable(revisado.data);
  if (!real.ok) return { ok: false, mensaje: t("correoInvalido") };

  const db = getDb();
  const actualizado = await db
    .update(busquedasImagen)
    .set({ correo: revisado.data, idioma: idioma === "en" ? "en" : "es" })
    .where(eq(busquedasImagen.id, busquedaId))
    .returning({ id: busquedasImagen.id });
  if (actualizado.length === 0) {
    return { ok: false, mensaje: t("fotoBusquedaNoExiste") };
  }
  const nombreLimpio = (nombre ?? "").trim().slice(0, 80) || null;
  await db
    .insert(contactosBusqueda)
    .values({ busquedaId, nombre: nombreLimpio, correo: revisado.data })
    .onConflictDoUpdate({
      target: contactosBusqueda.busquedaId,
      set: { nombre: nombreLimpio, correo: revisado.data },
    });
  return { ok: true, mensaje: t("fotoCorreoGuardado") };
}

/**
 * El equipo avisa que el producto ya está: pega el enlace de la ficha y el
 * correo sale. El enlace lo escribe una persona — es la única que sabe CUÁL
 * producto es el de la foto — y por eso se valida que sea NUESTRO.
 */
export async function avisarProductoEncontrado(
  busquedaId: string,
  enlace: string,
): Promise<{ ok: boolean; mensaje: string }> {
  await exigirEquipoInterno();
  const t = await mensajes();

  const limpio = enlace.trim();
  if (!esEnlaceDeProductoNuestro(limpio)) {
    return { ok: false, mensaje: t("fotoEnlaceInvalido") };
  }

  const db = getDb();
  const [fila] = await db
    .select({
      id: busquedasImagen.id,
      correo: busquedasImagen.correo,
      idioma: busquedasImagen.idioma,
      estado: busquedasImagen.estado,
    })
    .from(busquedasImagen)
    .where(eq(busquedasImagen.id, busquedaId));

  if (!fila) return { ok: false, mensaje: t("fotoBusquedaNoExiste") };
  if (!fila.correo) return { ok: false, mensaje: t("fotoSinCorreo") };
  if (fila.estado === "avisado") {
    return { ok: false, mensaje: t("fotoYaAvisado") };
  }

  const [contacto] = await db
    .select({ nombre: contactosBusqueda.nombre })
    .from(contactosBusqueda)
    .where(eq(contactosBusqueda.busquedaId, busquedaId));
  const envio = await correoProductoEncontrado(
    {
      email: fila.correo,
      name: contacto?.nombre ?? fila.correo,
      idioma: fila.idioma as "es" | "en",
    },
    limpio,
  );
  if (!envio.enviado) {
    return { ok: false, mensaje: t("fotoCorreoNoSalio") };
  }

  await db
    .update(busquedasImagen)
    .set({ estado: "avisado", enlaceAvisado: limpio })
    .where(eq(busquedasImagen.id, busquedaId));

  return { ok: true, mensaje: t("fotoAvisado") };
}

/** El historial para el panel del equipo. */
export async function listarBusquedasPorImagen() {
  await exigirEquipoInterno();
  return getDb()
    .select({
      id: busquedasImagen.id,
      mercado: busquedasImagen.mercado,
      imagenClave: busquedasImagen.imagenClave,
      mirada: busquedasImagen.mirada,
      resultados: busquedasImagen.resultados,
      correo: busquedasImagen.correo,
      estado: busquedasImagen.estado,
      enlaceAvisado: busquedasImagen.enlaceAvisado,
      creadoEn: busquedasImagen.creadoEn,
      nombre: contactosBusqueda.nombre,
    })
    .from(busquedasImagen)
    .leftJoin(
      contactosBusqueda,
      eq(contactosBusqueda.busquedaId, busquedasImagen.id),
    )
    .orderBy(desc(busquedasImagen.creadoEn))
    .limit(200);
}
