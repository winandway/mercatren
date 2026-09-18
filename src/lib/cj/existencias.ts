import "server-only";

import {
  and,
  asc,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  lt,
  notLike,
  or,
  sql,
} from "drizzle-orm";

import { cjConfigurado } from "@/lib/cj/cliente";
import { llamarCjConRitmo } from "@/lib/cj/ritmo";
import { FUENTE_CJ } from "@/lib/cj/constantes";
import { stockDeVariante } from "@/lib/cj/masivo";
import { completarStockDeFabrica } from "@/lib/cj/stock-fabrica";
import { almacenDeEntrega } from "@/lib/cj/plazas";
import { REGIONALES } from "@/lib/cj/riesgo";
import { variantesDeCj } from "@/lib/cj/variantes";
import { getDb } from "@/lib/db";
import {
  configuracion,
  enviosProducto,
  productos,
  tiendas,
  variantesProducto,
} from "@/lib/db/schema";

/**
 * EL STOCK DE CJ, PREGUNTADO A CJ (2 sep 2026).
 *
 * La existencia que guardamos es la del día que se importó el producto, y
 * CJ vende esa misma mercancía a miles de tiendas: se agota sin avisar. La
 * MT-000011 se cobró con «15 en almacén» aquí y cero en los almacenes de
 * EE. UU. allá. Dos usos:
 *
 *  · `hayExistenciaEnCj` — en el checkout, ANTES de cobrar.
 *  · `refrescarExistenciasCj` — desde el reloj, por tandas, para que lo
 *    agotado allá se vea agotado aquí sin que nadie compre primero.
 *
 * `/product/variant/query?countryCode=US` devuelve SOLO las variantes con
 * inventario en ese país (doc de CJ). Es la señal más barata que existe:
 * una llamada por producto.
 */

type VarianteConStock = {
  vid?: string;
  variantSku?: string;
  variantStock?: number | string;
  stockNum?: number | string;
  /** El nombre que de verdad usa `/product/variant/query` (medido 8 sep). */
  inventoryNum?: number | string;
};

/* La regla vive en `masivo.ts` (pura): el afinado de la importación masiva
   cuenta el stock igual que aquí, y dos copias se separan al primer arreglo. */
const stockDe = (v: VarianteConStock): number => stockDeVariante(v);

async function variantesConStockEn(
  pid: string,
  almacen: "US" | "CN",
): Promise<VarianteConStock[] | null> {
  const r = await llamarCjConRitmo<unknown>(
    `/product/variant/query?pid=${encodeURIComponent(pid)}&countryCode=${almacen}`,
  );
  if (!r.ok) return null;
  return completarStockDeFabrica(
    variantesDeCj(r.datos) as VarianteConStock[],
    almacen,
  );
}

/** Lo mismo, pero diciendo POR QUÉ falló: el refresco lo publica en el canario. */
async function variantesOMotivo(
  pid: string,
  almacen: "US" | "CN",
): Promise<
  { ok: true; variantes: VarianteConStock[] } | { ok: false; motivo: string }
> {
  const r = await llamarCjConRitmo<unknown>(
    `/product/variant/query?pid=${encodeURIComponent(pid)}&countryCode=${almacen}`,
  );
  if (!r.ok) return { ok: false, motivo: r.motivo };
  return {
    ok: true,
    variantes: await completarStockDeFabrica(
      variantesDeCj(r.datos) as VarianteConStock[],
      almacen,
    ),
  };
}

/**
 * ¿Hay stock en EE. UU. para vender `cantidad` de este producto (y de esta
 * talla, si se eligió)? `null` = CJ no contestó: no se bloquea la venta por
 * una caída ajena; el candado de margen y el panel lo atrapan después.
 */
export async function hayExistenciaEnCj(
  pid: string | null | undefined,
  skuVariante: string | null,
  cantidad: number,
  /** El almacén del que sale ESA plaza: EE. UU. para el .com, China para CL/CO. */
  almacen: "US" | "CN" = "US",
): Promise<boolean | null> {
  if (!pid || !cjConfigurado()) return null;
  const variantes = await variantesConStockEn(pid, almacen);
  if (variantes === null) return null;
  const candidatas = skuVariante
    ? variantes.filter(
        (v) => (v.variantSku ?? "").trim() === skuVariante.trim(),
      )
    : variantes;
  return candidatas.some((v) => stockDe(v) >= cantidad);
}

/**
 * Una tanda del refresco: los productos de CJ publicados en la vitrina de
 * EE. UU., del más viejo sin mirar al más nuevo. Cada uno recibe la
 * existencia que CJ dice hoy — cero si no queda ninguna talla allá.
 */
/**
 * ══ LOS «CASI LISTOS»: A UNA LLAMADA DE VOLVER A VENDERSE (8 sep 2026) ══
 *
 * El barrido del 8 de septiembre retiró 2.642 fichas (1.779 en EE. UU., 863
 * en Colombia) porque TODAS sus tallas decían cero. Ese cero no venía de
 * CJ: era el `existencias: 0` fijo que escribía la importación, y nadie lo
 * había vuelto a leer. Richard trajo la primera: una mochila con 3
 * variantes con stock en el almacén de CJ y flete cotizado, en «revisión»
 * y dando 404.
 *
 * Y nadie iba a volver a mirarlas: el afinado solo toma lo que no tiene
 * flete real (estas ya lo tienen), y este refresco miraba primero las
 * ~6.000 publicadas, a UNA cada quince minutos mientras la cola por afinar
 * pase de 500. Turno para ellas: nunca.
 *
 * «Casi listo» = de CJ, en revisión, con flete real bueno y precio base,
 * y sin leer en las últimas 24 h. Van primero, y mientras haya alguna el
 * reloj no cede el ritmo (`cuantosDeStock`): con la misma llamada de 10
 * puntos vuelve a la venta una ficha entera, contra los 20 que cuesta
 * afinar una nueva. Cuando CJ dice cero de verdad, se queda en revisión y
 * se vuelve a mirar al día siguiente.
 */
const HACE_24_H = () => new Date(Date.now() - 24 * 60 * 60 * 1000);

function envioBueno() {
  return getDb()
    .select({ id: enviosProducto.productoId })
    .from(enviosProducto)
    .where(
      and(
        eq(enviosProducto.origen, "cotizado"),
        /* ≥ 0: el cero cotizado de EE. UU. es envío gratis (13 sep 2026). */
        gte(enviosProducto.costoCentavos, 0),
        or(
          isNull(enviosProducto.transporte),
          and(
            ...REGIONALES.map((r) =>
              notLike(sql`lower(${enviosProducto.transporte})`, `%${r}%`),
            ),
          ),
        ),
      ),
    );
}

function casiListo() {
  return and(
    eq(productos.estado, "en_revision"),
    gt(productos.precioBaseCentavos, 0),
    inArray(productos.id, envioBueno()),
    or(
      isNull(productos.sincronizadoEn),
      lt(productos.sincronizadoEn, HACE_24_H()),
    ),
  );
}

const PLAZAS_CON_ALMACEN = ["US", "CL", "CO"] as const;

/**
 * ══ LA COLA DEL STOCK SE CALCULA UNA VEZ Y SE CONSUME POR LATIDOS
 * (emergencia de costo, 18 sep 2026) ══
 *
 * Elegir a quién le toca lectura de stock ordenaba TODO lo de CJ (casi
 * listos primero, después lo publicado por fecha) y contar los casi listos
 * recorría lo mismo otra vez; las dos cosas, cada minuto, para mirar dos o
 * cuatro productos. Ahora se calcula una lista de `COLA_STOCK_TANDA` ids y
 * el conteo de una vez, se guardan en `configuracion`, y cada latido toma
 * los suyos y los vuelve a mirar por id. La lista se rehace cuando se
 * acaba o a la media hora. El orden es el de siempre.
 */
const COLA_STOCK_TANDA = 200;
const COLA_STOCK_VIGENCIA_MS = 30 * 60_000;
export const LLAVE_COLA_STOCK = "cj_cola_stock";

type ColaDeStock = { ids: string[]; casiListos: number; calculadaEn: number };

async function leerColaDeStock(): Promise<ColaDeStock | null> {
  const [fila] = await getDb()
    .select({ valor: configuracion.valor })
    .from(configuracion)
    .where(eq(configuracion.clave, LLAVE_COLA_STOCK))
    .limit(1)
    .catch(() => []);
  if (!fila) return null;
  try {
    const c = JSON.parse(fila.valor) as Partial<ColaDeStock>;
    if (
      !Array.isArray(c.ids) ||
      typeof c.casiListos !== "number" ||
      typeof c.calculadaEn !== "number"
    )
      return null;
    if (Date.now() - c.calculadaEn > COLA_STOCK_VIGENCIA_MS) return null;
    return c as ColaDeStock;
  } catch {
    return null;
  }
}

async function guardarColaDeStock(cola: ColaDeStock): Promise<void> {
  const valor = JSON.stringify(cola);
  await getDb()
    .insert(configuracion)
    .values({ clave: LLAVE_COLA_STOCK, valor })
    .onConflictDoUpdate({ target: configuracion.clave, set: { valor } })
    .catch(() => undefined);
}

/** La lista vigente, o una recién calculada (las dos consultas caras). */
async function colaDeStock(): Promise<ColaDeStock> {
  const guardada = await leerColaDeStock();
  if (guardada) return guardada;
  const db = getDb();
  const [fila] = await db
    .select({ n: sql<number>`count(*)` })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(
      and(
        eq(productos.fuenteId, FUENTE_CJ),
        inArray(tiendas.paisOrigen, [...PLAZAS_CON_ALMACEN]),
        casiListo(),
      ),
    )
    .catch(() => []);
  /* Las tres plazas: cada producto se mira en el almacén del que sale su
     tienda (EE. UU. o China). */
  const ids = await db
    .select({ id: productos.id })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(
      and(
        eq(productos.fuenteId, FUENTE_CJ),
        /* También lo que está en revisión: cuando vuelva a tener stock, el
           barrido del vigilante lo publica. */
        inArray(productos.estado, ["publicado", "en_revision"]),
        inArray(tiendas.paisOrigen, [...PLAZAS_CON_ALMACEN]),
      ),
    )
    /* Primero los CASI LISTOS (8 sep 2026): retirados con flete real que
       solo esperan una lectura de stock. Después lo PUBLICADO (3 sep): es lo
       que se puede comprar, y con cuarenta mil fichas en revisión el turno
       de las de la venta llegaba cada varios días. El resto de la revisión
       lo refresca el afinado al publicarlo. */
    .orderBy(
      sql`case when ${casiListo()} then 0 when ${productos.estado} = 'publicado' then 1 else 2 end`,
      /* Dentro de los casi listos, el que falló pasa al final (ver arriba). */
      sql`case when ${casiListo()} then ${productos.actualizadoEn} else 0 end`,
      sql`${productos.sincronizadoEn} IS NOT NULL`,
      asc(productos.sincronizadoEn),
    )
    .limit(COLA_STOCK_TANDA)
    .catch(() => []);
  const cola = {
    ids: ids.map((f) => f.id),
    casiListos: Number(fila?.n ?? 0),
    calculadaEn: Date.now(),
  };
  await guardarColaDeStock(cola);
  return cola;
}

/** Cuántas fichas están a una lectura de stock de volver a la venta. */
export async function contarCasiListos(): Promise<number> {
  try {
    return (await colaDeStock()).casiListos;
  } catch {
    return 0;
  }
}

export async function refrescarExistenciasCj(limite = 25): Promise<{
  mirados: number;
  agotados: number;
  fallidos: number;
  /** El motivo del último producto que falló, para el canario. */
  ultimoFallo?: string;
}> {
  if (!cjConfigurado()) return { mirados: 0, agotados: 0, fallidos: 0 };
  const db = getDb();
  const guardada = await colaDeStock();
  if (guardada.ids.length === 0) {
    /* Lista agotada: la vuelta siguiente la rehace. */
    await guardarColaDeStock({ ...guardada, calculadaEn: 0 });
    return { mirados: 0, agotados: 0, fallidos: 0 };
  }
  const turno = guardada.ids.slice(0, limite);
  await guardarColaDeStock({
    ...guardada,
    ids: guardada.ids.slice(turno.length),
  });
  /* Se vuelven a mirar por id, en el orden de la lista: pocas filas. */
  const cola = await db
    .select({
      id: productos.id,
      pid: productos.externoId,
      pais: tiendas.paisOrigen,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(
      and(
        inArray(productos.id, turno),
        eq(productos.fuenteId, FUENTE_CJ),
        inArray(productos.estado, ["publicado", "en_revision"]),
      ),
    )
    .orderBy(
      sql`case ${sql.join(
        turno.map((id, i) => sql`when ${productos.id} = ${id} then ${i}`),
        sql` `,
      )} else ${turno.length} end`,
    )
    .catch(() => []);

  let agotados = 0;
  let fallidos = 0;
  let ultimoFallo: string | undefined;
  for (const p of cola) {
    if (!p.pid) continue;
    const r = await variantesOMotivo(p.pid, almacenDeEntrega(p.pais ?? "US"));
    if (!r.ok) {
      fallidos += 1;
      ultimoFallo = r.motivo.slice(0, 160);
      /* ══ UN FALLO NO SE QUEDA A LA CABEZA (9 sep 2026) ══ Los casi listos
         van por fecha; sin mover la fecha, los mismos tres que CJ no
         contesta volvían primeros en CADA latido y solo avanzaba el cuarto:
         3 de 4 lecturas tiradas. Se le sube `actualizadoEn` y pasa al final
         de su grupo; se relee cuando le vuelva a tocar. */
      await db
        .update(productos)
        .set({ actualizadoEn: new Date() })
        .where(eq(productos.id, p.id))
        .catch(() => undefined);
      continue;
    }
    const variantes = r.variantes;
    const total = variantes.reduce((t, v) => t + stockDe(v), 0);
    if (total === 0) agotados += 1;
    await db
      .update(productos)
      .set({
        existencias: total,
        controlaExistencias: true,
        sincronizadoEn: new Date(),
        actualizadoEn: new Date(),
      })
      .where(eq(productos.id, p.id))
      .catch(() => undefined);

    /**
     * ══ Y CADA TALLA CON LO SUYO (8 sep 2026) ══
     *
     * Hasta hoy este refresco actualizaba el total del producto y TIRABA las
     * variantes que tenía en la mano. La ficha decide si una talla se puede
     * comprar por el stock de la VARIANTE, así que el producto decía «Quedan
     * 2» y cada talla «Sin existencias»: 2.642 fichas así en producción.
     *
     * CJ devuelve SOLO las variantes con inventario en ese país (su doc),
     * así que primero se ponen todas a cero y después se escribe lo que
     * vino, por SKU. Una talla que allá se agotó queda en cero de verdad.
     */
    await db
      .update(variantesProducto)
      .set({ existencias: 0, actualizadoEn: new Date() })
      .where(eq(variantesProducto.productoId, p.id))
      .catch(() => undefined);
    for (const v of variantes) {
      const sku = v.variantSku?.trim();
      if (!sku) continue;
      await db
        .update(variantesProducto)
        .set({ existencias: stockDe(v), actualizadoEn: new Date() })
        .where(
          and(
            eq(variantesProducto.productoId, p.id),
            eq(variantesProducto.sku, sku),
          ),
        )
        .catch(() => undefined);
    }
  }
  return {
    mirados: cola.length,
    agotados,
    fallidos,
    ...(ultimoFallo ? { ultimoFallo } : {}),
  };
}
