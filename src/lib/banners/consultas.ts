import { and, desc, eq } from "drizzle-orm";

import { recordado } from "@/lib/cachecito";
import { direccionImagen } from "@/lib/catalogo/consultas";
import { getDb } from "@/lib/db";
import { banners, tiendas } from "@/lib/db/schema";
import type { Mercado } from "@/lib/mercado/mercados";
import {
  aPublico,
  estaVigente,
  saleEn,
  type BannerBase,
  type BannerPublico,
  type UbicacionBanner,
} from "@/lib/banners/reglas";

/**
 * LOS BANNERS QUE VE EL PÚBLICO, por mercado y por lugar.
 *
 * Se recuerdan un minuto POR MERCADO (la llave lleva el código: un banner de
 * mercatren.com no puede salir en mercatren.cl) y se filtran en memoria por
 * vigencia y lugar. Si la base falla, no hay banners: una parrilla sin
 * publicidad es una parrilla; una parrilla caída por la publicidad, no.
 */
async function activosDe(mercado: Mercado): Promise<BannerBase[]> {
  return recordado(`banners-activos-${mercado.codigo}`, 60_000, async () =>
    getDb()
      .select({
        id: banners.id,
        tituloEs: banners.tituloEs,
        tituloEn: banners.tituloEn,
        textoEs: banners.textoEs,
        textoEn: banners.textoEn,
        botonEs: banners.botonEs,
        botonEn: banners.botonEn,
        imagenClave: banners.imagenClave,
        enlace: banners.enlace,
        ubicacion: banners.ubicacion,
        tiendaId: banners.tiendaId,
        cadaCuantos: banners.cadaCuantos,
        orden: banners.orden,
        activo: banners.activo,
        desde: banners.desde,
        hasta: banners.hasta,
      })
      .from(banners)
      .where(and(eq(banners.activo, true), eq(banners.mercado, mercado.codigo)))
      .orderBy(banners.orden, desc(banners.creadoEn)),
  );
}

export async function bannersPara(
  mercado: Mercado,
  lugar: UbicacionBanner,
  idioma: "es" | "en",
  tiendaId: string | null = null,
): Promise<BannerPublico[]> {
  try {
    const ahora = new Date();
    return (await activosDe(mercado))
      .filter((b) => estaVigente(b, ahora) && saleEn(b, lugar, tiendaId))
      .map((b) =>
        aPublico(
          b,
          idioma,
          direccionImagen({ url: null, clave: b.imagenClave }),
        ),
      );
  } catch (e) {
    console.error("[banners] no se pudieron leer:", e);
    return [];
  }
}

/** Para el panel: todos, con el nombre de la tienda si está clavado a una. */
export async function listarBanners() {
  return getDb()
    .select({
      id: banners.id,
      tituloEs: banners.tituloEs,
      tituloEn: banners.tituloEn,
      textoEs: banners.textoEs,
      textoEn: banners.textoEn,
      botonEs: banners.botonEs,
      botonEn: banners.botonEn,
      imagenClave: banners.imagenClave,
      enlace: banners.enlace,
      ubicacion: banners.ubicacion,
      tiendaId: banners.tiendaId,
      tiendaNombre: tiendas.nombre,
      cadaCuantos: banners.cadaCuantos,
      orden: banners.orden,
      activo: banners.activo,
      desde: banners.desde,
      hasta: banners.hasta,
      mercado: banners.mercado,
      actualizadoEn: banners.actualizadoEn,
    })
    .from(banners)
    .leftJoin(tiendas, eq(tiendas.id, banners.tiendaId))
    .orderBy(desc(banners.activo), banners.orden, desc(banners.actualizadoEn));
}

export async function obtenerBanner(id: string) {
  const [b] = await listarBanners().then((lista) =>
    lista.filter((x) => x.id === id),
  );
  return b ?? null;
}

/** Las tiendas activas, para elegir a cuál apunta el banner. */
export async function tiendasParaBanner() {
  return getDb()
    .select({
      id: tiendas.id,
      nombre: tiendas.nombre,
      slug: tiendas.slug,
      mercado: tiendas.mercado,
    })
    .from(tiendas)
    .where(eq(tiendas.estado, "activa"))
    .orderBy(tiendas.nombre);
}
