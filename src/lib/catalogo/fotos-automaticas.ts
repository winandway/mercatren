import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, asc, eq, isNotNull, sql } from "drizzle-orm";

import { copiarFotoAlBucket } from "@/lib/catalogo/copiar-foto";
import {
  FOTOS_POR_TICK,
  LLAVE_CUOTA_FOTOS,
  LLAVE_FOTOS_POR_HORA,
  cuotaDisponible,
  fotosPorHoraDe,
  marcaDeCuota,
  motivoDe,
  seDaPorRota,
} from "@/lib/catalogo/fotos-reglas";
import { getDb } from "@/lib/db";
import {
  configuracion,
  fotosRotas,
  imagenesProducto,
  productos,
} from "@/lib/db/schema";

/**
 * LAS FOTOS SE TRAEN SOLAS DESDE EL RELOJ (3 sep 2026).
 *
 * Ver `fotos-reglas.ts` para el porqué. Aquí está la parte que toca la base
 * y el bucket: elegir las pendientes, respetar la cuota de la hora, copiar,
 * y anotar lo que falló para reintentarlo o darlo por perdido.
 */

export type ResultadoFotosReloj = {
  copiadas: number;
  fallidas: number;
  /** Las que se acaban de dar por perdidas en esta vuelta. */
  rotas: number;
  /** Cuántas siguen viviendo en un servidor ajeno (sin contar las rotas). */
  faltan: number;
  /** Cuota que quedaba al empezar; 0 = esta hora ya está servida. */
  cuota: number;
};

async function leerConfig(clave: string): Promise<string | null> {
  const [fila] = await getDb()
    .select({ valor: configuracion.valor })
    .from(configuracion)
    .where(eq(configuracion.clave, clave))
    .limit(1);
  return fila?.valor ?? null;
}

async function escribirConfig(clave: string, valor: string) {
  await getDb()
    .insert(configuracion)
    .values({ clave, valor })
    .onConflictDoUpdate({ target: configuracion.clave, set: { valor } });
}

/** Las que aún dependen del origen y no se dieron por perdidas. */
const pendienteDeTraer = and(
  isNotNull(imagenesProducto.url),
  sql`not exists (select 1 from ${fotosRotas} where ${fotosRotas.imagenId} = ${imagenesProducto.id} and ${fotosRotas.definitiva} = 1 and ${fotosRotas.url} = ${imagenesProducto.url})`,
);

export async function contarFotosPorTraer(): Promise<number> {
  const [f] = await getDb()
    .select({ n: sql<number>`count(*)` })
    .from(imagenesProducto)
    .where(pendienteDeTraer);
  return Number(f?.n ?? 0);
}

export async function contarFotosRotas(): Promise<number> {
  const [f] = await getDb()
    .select({ n: sql<number>`count(*)` })
    .from(fotosRotas)
    .innerJoin(imagenesProducto, eq(imagenesProducto.id, fotosRotas.imagenId))
    .where(
      and(
        eq(fotosRotas.definitiva, true),
        eq(fotosRotas.url, imagenesProducto.url),
      ),
    );
  return Number(f?.n ?? 0);
}

/** Las primeras rotas, con el producto, para nombrarlas en el correo. */
export async function detalleFotosRotas(
  limite = 8,
): Promise<{ producto: string; motivo: string }[]> {
  const filas = await getDb()
    .select({ titulo: productos.tituloEs, motivo: fotosRotas.motivo })
    .from(fotosRotas)
    .innerJoin(imagenesProducto, eq(imagenesProducto.id, fotosRotas.imagenId))
    .innerJoin(productos, eq(productos.id, fotosRotas.productoId))
    .where(
      and(
        eq(fotosRotas.definitiva, true),
        eq(fotosRotas.url, imagenesProducto.url),
      ),
    )
    .orderBy(asc(fotosRotas.ultimoIntentoEn))
    .limit(limite);
  return filas.map((f) => ({ producto: f.titulo, motivo: f.motivo }));
}

/**
 * Prueba unas pocas direcciones de origen al azar, con HEAD y poco tiempo.
 * Es la sonda del vigilante: dice si el servidor del comercio está fallando
 * AHORA, que es lo que la portada enseña, sin esperar a que el copiado se
 * tope con ello.
 */
export async function sondearFotosDeOrigen(
  cuantas = 5,
): Promise<{ probadas: number; fallidas: number; ejemplo: string | null }> {
  const filas = await getDb()
    .select({ url: imagenesProducto.url })
    .from(imagenesProducto)
    .where(pendienteDeTraer)
    .orderBy(sql`random()`)
    .limit(cuantas);
  let fallidas = 0;
  let ejemplo: string | null = null;
  for (const f of filas) {
    if (!f.url) continue;
    try {
      const r = await fetch(f.url, {
        method: "HEAD",
        signal: AbortSignal.timeout(5_000),
      });
      if (!r.ok) {
        fallidas++;
        ejemplo ??= `HTTP ${r.status} en ${new URL(f.url).host}`;
      }
    } catch (e) {
      fallidas++;
      ejemplo ??= `${motivoDe(null, e)} en ${new URL(f.url).host}`;
    }
  }
  return { probadas: filas.length, fallidas, ejemplo };
}

/**
 * Una vuelta del reloj: hasta `maximo` fotos, sin pasarse de la cuota de la
 * hora. Las que fallan se anotan; las que ya fallaron muchas veces, o cuyo
 * origen dijo 404, se dan por perdidas y dejan de enseñarse.
 */
export async function traerFotosDesdeElReloj(
  opciones: { maximo?: number; ahoraMs?: number } = {},
): Promise<ResultadoFotosReloj> {
  const db = getDb();
  const ahoraMs = opciones.ahoraMs ?? Date.now();
  const porHora = fotosPorHoraDe(await leerConfig(LLAVE_FOTOS_POR_HORA));
  const marca = await leerConfig(LLAVE_CUOTA_FOTOS);
  const cuota = cuotaDisponible(marca, ahoraMs, porHora);
  const maximo = Math.min(opciones.maximo ?? FOTOS_POR_TICK, cuota);

  const vacio = { copiadas: 0, fallidas: 0, rotas: 0, cuota };
  if (maximo <= 0) return { ...vacio, faltan: await contarFotosPorTraer() };

  /* Las filas de rotas cuya imagen ya no existe (la sincronización borra y
     vuelve a crear las fotos de un producto) se limpian de paso. */
  await db
    .delete(fotosRotas)
    .where(
      sql`not exists (select 1 from ${imagenesProducto} where ${imagenesProducto.id} = ${fotosRotas.imagenId})`,
    );

  /* Primero las que nunca fallaron, después las que menos veces; y dentro
     de eso, las más antiguas. Así un origen caído no monopoliza la cuota. */
  const pendientes = await db
    .select({
      id: imagenesProducto.id,
      productoId: imagenesProducto.productoId,
      url: imagenesProducto.url,
      intentos: sql<number>`coalesce((select ${fotosRotas.intentos} from ${fotosRotas} where ${fotosRotas.imagenId} = ${imagenesProducto.id} and ${fotosRotas.url} = ${imagenesProducto.url}), 0)`,
    })
    .from(imagenesProducto)
    .where(pendienteDeTraer)
    .orderBy(sql`4`, sql`imagenes_producto.rowid`)
    .limit(maximo);

  const { env } = getCloudflareContext();
  let copiadas = 0;
  let fallidas = 0;
  let rotas = 0;

  for (const foto of pendientes) {
    if (!foto.url) continue;
    const r = await copiarFotoAlBucket(env.BUCKET, {
      id: foto.id,
      productoId: foto.productoId,
      url: foto.url,
    });
    if (r.ok) {
      copiadas++;
      await db.delete(fotosRotas).where(eq(fotosRotas.imagenId, foto.id));
      continue;
    }
    fallidas++;
    const intentos = Number(foto.intentos) + 1;
    const definitiva = seDaPorRota(r.status, intentos);
    if (definitiva) rotas++;
    const fila = {
      productoId: foto.productoId,
      url: foto.url,
      motivo: motivoDe(r.status, r.error),
      intentos,
      definitiva,
      ultimoIntentoEn: new Date(ahoraMs),
    };
    await db
      .insert(fotosRotas)
      .values({ imagenId: foto.id, ...fila })
      .onConflictDoUpdate({ target: fotosRotas.imagenId, set: fila });
    console.error(`[fotos] no se pudo traer ${foto.url}: ${fila.motivo}`);
  }

  /* La cuota se gasta por intento, no por éxito: un origen caído también
     recibe nuestras peticiones, y es justo ahí donde no hay que insistir. */
  const gastadas = copiadas + fallidas;
  if (gastadas > 0) {
    await escribirConfig(
      LLAVE_CUOTA_FOTOS,
      marcaDeCuota(marca, ahoraMs, gastadas),
    );
  }

  return {
    copiadas,
    fallidas,
    rotas,
    faltan: await contarFotosPorTraer(),
    cuota,
  };
}
