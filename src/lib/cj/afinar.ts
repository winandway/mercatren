import "server-only";

import { and, asc, eq, inArray, isNull, like, or, sql } from "drizzle-orm";

import { cjConfigurado } from "@/lib/cj/cliente";
import { FUENTE_CJ } from "@/lib/cj/constantes";
import { cotizarFlete } from "@/lib/cj/flete";
import { guardarTallas } from "@/lib/cj/guardar";
import { stockDeVariante } from "@/lib/cj/masivo";
import { leerPrioridad, quitarDePrioridad } from "@/lib/cj/prioridad";
import { plazaDelMercado, type Plaza } from "@/lib/cj/plazas";
import { REGIONALES } from "@/lib/cj/riesgo";
import { llamarCjConRitmo } from "@/lib/cj/ritmo";
import { elegirVariante, variantesDeCj } from "@/lib/cj/variantes";
import { getDb, type Db } from "@/lib/db";
import { enviosProducto, productos, tiendas } from "@/lib/db/schema";
import { precioPublicadoDe } from "@/lib/destino/precio-plaza";
import { mercadoPorCodigo } from "@/lib/mercado/mercados";
import { tasaVigente } from "@/lib/mercado/tasas";

/**
 * AFINAR LO QUE ENTRÓ CON ENVÍO ESTIMADO: flete real, tallas y stock.
 *
 * La importación masiva publica con un envío estimado (marcado así en
 * `envios_producto`). Esto toma esos productos —la ropa primero, que sin
 * talla no se puede vender bien— y por cada uno hace DOS llamadas a CJ: las
 * variantes (de ahí salen las tallas Y el stock de hoy) y el flete de la
 * variante más barata. Con eso rearma el precio con la fórmula de su plaza.
 *
 * Lo llama el reloj de `/datos/sincronizar` en cada vuelta y el botón del
 * panel. Lo que decide qué falta es el propio dato (`origen = 'estimado'`),
 * así que se puede cortar y retomar cuando sea.
 *
 * Un producto que en Chile pasa del tope de USD 500 con el flete real se
 * pasa a BORRADOR: venderlo sería mandarle una sorpresa de aduana al
 * comprador, y un precio inventado no se publica.
 */

export type ResultadoAfinado = {
  afinados: number;
  agotados: number;
  fallidos: number;
  restantes: number;
  motivo?: string;
  /** El motivo del último producto que falló, para el canario. */
  ultimoFallo?: string;
};

function condicionDeCola(paises: string[]) {
  return and(
    eq(productos.fuenteId, FUENTE_CJ),
    inArray(tiendas.paisOrigen, paises),
    /* Sin fila, estimado, o cotizado con un repartidor REGIONAL (los que ya
       costaron una venta a pérdida): todo eso necesita el flete real. */
    or(
      isNull(enviosProducto.productoId),
      eq(enviosProducto.origen, "estimado"),
      ...REGIONALES.map((r) =>
        like(sql`lower(${enviosProducto.transporte})`, `%${r}%`),
      ),
    ),
  );
}

export async function afinarImportados(o: {
  limite: number;
  presupuestoMs: number;
  plaza?: Plaza;
}): Promise<ResultadoAfinado> {
  const vacio = { afinados: 0, agotados: 0, fallidos: 0, restantes: 0 };
  if (!cjConfigurado())
    return { ...vacio, motivo: "Falta la variable CJ_API_KEY." };

  /* ══ SIN PUNTOS DE CJ NO SE AFINA, Y SE DICE (4 sep 2026) ══
     CJ reparte una cantidad de llamadas al día y se agotan (pasó con la
     importación del almacén completo). Sin puntos, cada producto de la cola
     devuelve el mismo error: la pantalla decía «fallidos 6» y el dueño lo
     leía como un fallo nuestro. Se corta antes de gastar el latido y se
     dice cuándo vuelve, que es lo único que hay que saber. */
  {
    const { getDb: db0 } = await import("@/lib/db");
    const { configuracion } = await import("@/lib/db/schema");
    const { eq: igual } = await import("drizzle-orm");
    const { LLAVE_SIN_PUNTOS, minutosParaVolver, sigueSinPuntos } =
      await import("@/lib/cj/puntos");
    const [fila] = await db0()
      .select({ valor: configuracion.valor })
      .from(configuracion)
      .where(igual(configuracion.clave, LLAVE_SIN_PUNTOS))
      .limit(1)
      .catch(() => []);
    if (sigueSinPuntos(fila?.valor, Date.now())) {
      return {
        ...vacio,
        motivo: `CJ no tiene puntos de API para hoy. Sigue solo en ${minutosParaVolver(fila?.valor, Date.now())} min.`,
      };
    }
  }

  const db = getDb();
  const paises = o.plaza ? [o.plaza.paisEntrega] : ["US", "CL", "CO"];
  const hasta = Date.now() + o.presupuestoMs;

  const [total] = await db
    .select({ n: sql<number>`count(*)` })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .leftJoin(enviosProducto, eq(enviosProducto.productoId, productos.id))
    .where(condicionDeCola(paises));
  const restantesAlEmpezar = Number(total?.n ?? 0);
  if (restantesAlEmpezar === 0) return vacio;

  const prioridad = await leerPrioridad(db);
  /* ══ LO PEDIDO QUE FALLA SALE DE LA LISTA (9 sep 2026) ══ Los dos
     monitores de Richard volvían a la cabeza en CADA latido con CJ
     devolviendo flete en cero: 40 puntos por latido tirados, ~5.700 a la
     hora. Se intenta UNA vez por petición; si falla, sale y el canario dice
     por qué. Quien lo quiera de nuevo, lo vuelve a pedir. */
  const soltarSiEraPedido = async (id: string) => {
    if (prioridad.includes(id)) await quitarDePrioridad(id, db);
  };
  const cola = await db
    .select({
      id: productos.id,
      pid: productos.externoId,
      costo: productos.precioBaseCentavos,
      pais: tiendas.paisOrigen,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .leftJoin(enviosProducto, eq(enviosProducto.productoId, productos.id))
    .where(condicionDeCola(paises))
    .orderBy(
      /* ══ 1. LO QUE UNA PERSONA PIDIÓ PRIMERO (9 sep 2026) ══ Richard:
         «póngalos a la cabeza de la fila». Ver `prioridad.ts`. */
      ...(prioridad.length > 0
        ? [sql`case when ${inArray(productos.id, prioridad)} then 0 else 1 end`]
        : []),
      /* ══ 2. LO NUNCA INTENTADO ANTES QUE LO QUE YA FALLÓ (8 sep 2026) ══
         Fallar solo le sube la fecha; sin esto, un puñado que CJ no cotiza
         volvía a la cabeza en cada vuelta y 44.000 no tuvieron turno. */
      sql`${enviosProducto.cotizadoEn} is not null`,
      /* ══ 3. VARIADO, NO PURA ROPA (9 sep 2026) ══ Richard: «si usted mira
         lo que está saliendo en Estados Unidos todos los días, es pura
         ropa». «La ropa primero» venía de cuando lo sin tallas se vendía
         sin afinar; hoy nada de CJ sale sin flete real, así que ya no
         tenía sentido. Se toma el 1.º de cada departamento, luego el 2.º de
         cada uno, y así: lo publicado del día se parece al catálogo. */
      sql`row_number() over (partition by ${productos.categoriaId} order by ${enviosProducto.cotizadoEn}, ${productos.creadoEn})`,
      asc(enviosProducto.cotizadoEn),
      asc(productos.creadoEn),
    )
    .limit(o.limite);

  const tasas = new Map<string, number | null>();
  const cuenta = { afinados: 0, agotados: 0, fallidos: 0 };
  let ultimoFallo: string | undefined;

  for (const p of cola) {
    if (Date.now() >= hasta) break;
    const plaza = plazaDelMercado(mercadoPorCodigo(p.pais ?? "US"));
    if (!tasas.has(plaza.mercado)) {
      tasas.set(
        plaza.mercado,
        plaza.mercado === "US" ? null : await tasaVigente(plaza.mercado),
      );
    }
    const tasa = tasas.get(plaza.mercado) ?? null;
    const ahora = new Date();

    if (!p.pid || !p.costo || p.costo <= 0) {
      cuenta.fallidos += 1;
      ultimoFallo = !p.pid
        ? "producto sin código de CJ"
        : "producto sin costo base";
      await soltarSiEraPedido(p.id);
      await posponer(db, p.id, ahora);
      continue;
    }

    /* 1) Las variantes con stock en el almacén de la plaza. */
    /* Con ritmo y reintento (el ritmo ya duerme por dentro): mientras la
       importación masiva le habla a CJ, los choques son lo normal. */
    const r = await llamarCjConRitmo<unknown>(
      `/product/variant/query?pid=${encodeURIComponent(p.pid)}&countryCode=${plaza.almacen}`,
    );
    if (!r.ok) {
      cuenta.fallidos += 1;
      ultimoFallo =
        `${prioridad.includes(p.id) ? "PEDIDO · " : ""}variantes: ${r.motivo}`.slice(
          0,
          160,
        );
      await soltarSiEraPedido(p.id);
      await posponer(db, p.id, ahora);
      continue;
    }
    const lista = variantesDeCj(r.datos);
    if (lista.length === 0) {
      /* CJ contestó bien y no hay ninguna variante con stock allá: agotado
         hoy. Se anota y se vuelve a mirar en otra vuelta. */
      cuenta.agotados += 1;
      await db
        .update(productos)
        .set({
          existencias: 0,
          controlaExistencias: true,
          sincronizadoEn: ahora,
          actualizadoEn: ahora,
        })
        .where(eq(productos.id, p.id))
        .catch(() => undefined);
      await soltarSiEraPedido(p.id);
      await posponer(db, p.id, ahora);
      continue;
    }

    /* 2) El flete de la más barata, que es la que se le cobra al comprador. */
    const elegida = elegirVariante(lista);
    /* `cotizarFlete` ya lleva su ritmo dentro. */
    const cotizacion = elegida?.vid
      ? await cotizarFlete(elegida.vid, plaza)
      : {};
    if (!(cotizacion.costoCentavos && cotizacion.costoCentavos > 0)) {
      cuenta.fallidos += 1;
      ultimoFallo =
        `${prioridad.includes(p.id) ? "PEDIDO · " : ""}flete: ${cotizacion.motivo ?? (elegida?.vid ? "sin cotización" : "sin variante que cotizar")}`.slice(
          0,
          160,
        );
      await soltarSiEraPedido(p.id);
      await posponer(db, p.id, ahora);
      continue;
    }

    const precio = precioPublicadoDe(
      plaza,
      p.costo,
      cotizacion.costoCentavos,
      tasa,
    );
    const stock = lista.reduce(
      (t, v) => t + stockDeVariante(v as Record<string, unknown>),
      0,
    );

    try {
      await db.batch([
        db
          .insert(enviosProducto)
          .values({
            productoId: p.id,
            costoCentavos: cotizacion.costoCentavos,
            origen: "cotizado",
            transporte: cotizacion.transporte ?? null,
            cotizadoEn: ahora,
          })
          .onConflictDoUpdate({
            target: enviosProducto.productoId,
            set: {
              costoCentavos: cotizacion.costoCentavos,
              origen: "cotizado",
              transporte: cotizacion.transporte ?? null,
              cotizadoEn: ahora,
            },
          }),
        db
          .update(productos)
          .set({
            /* ══ EL ÚLTIMO FILTRO (2 sep 2026) ══ Con flete real, precio en
               regla y stock, lo que estaba en revisión pasa a la venta. Lo que
               una persona dejó en borrador NO se toca. Sin stock se queda en
               revisión: el refresco de stock lo vuelve a mirar y el barrido lo
               publica cuando vuelva a haber. */
            ...(precio.ok
              ? {
                  precioCentavos: precio.publicadoCentavos,
                  ...(stock > 0
                    ? {
                        estado: sql`case when ${productos.estado} = 'en_revision' then 'publicado' else ${productos.estado} end`,
                      }
                    : {}),
                }
              : { estado: "borrador" as const }),
            existencias: stock,
            controlaExistencias: true,
            sincronizadoEn: ahora,
            actualizadoEn: ahora,
          })
          .where(eq(productos.id, p.id)),
      ]);
      if (precio.ok) {
        await guardarTallas(
          p.id,
          p.pid,
          plaza.almacen,
          precio.publicadoCentavos,
          ahora,
          lista,
        );
      }
      cuenta.afinados += 1;
      if (prioridad.includes(p.id)) await quitarDePrioridad(p.id, db);
    } catch (fallo) {
      console.error("[cj-afinar] no se pudo guardar", p.id, fallo);
      cuenta.fallidos += 1;
      await soltarSiEraPedido(p.id);
      ultimoFallo =
        `guardar: ${fallo instanceof Error ? fallo.message : String(fallo)}`.slice(
          0,
          160,
        );
    }
  }

  return {
    ...cuenta,
    restantes: Math.max(0, restantesAlEmpezar - cuenta.afinados),
    ...(ultimoFallo ? { ultimoFallo } : {}),
  };
}

/** Sube la fecha del estimado para que el producto vaya al final de la cola. */
async function posponer(db: Db, productoId: string, ahora: Date) {
  await db
    .insert(enviosProducto)
    .values({
      productoId,
      costoCentavos: 1,
      origen: "estimado",
      transporte: null,
      cotizadoEn: ahora,
    })
    .onConflictDoUpdate({
      target: enviosProducto.productoId,
      set: { cotizadoEn: ahora },
    })
    .catch(() => undefined);
}

/** Para el panel: cuántos siguen con envío estimado y cuántos ya tienen el real. */
export async function contarPorAfinar(
  plaza: Plaza,
): Promise<{ porAfinar: number; afinados: number }> {
  const db = getDb();
  const [filas] = await db
    .select({
      porAfinar: sql<number>`sum(case when ${enviosProducto.productoId} is null or ${enviosProducto.origen} = 'estimado' then 1 else 0 end)`,
      afinados: sql<number>`sum(case when ${enviosProducto.origen} = 'cotizado' then 1 else 0 end)`,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .leftJoin(enviosProducto, eq(enviosProducto.productoId, productos.id))
    .where(
      and(
        eq(productos.fuenteId, FUENTE_CJ),
        eq(tiendas.paisOrigen, plaza.paisEntrega),
      ),
    )
    .catch(() => []);
  return {
    porAfinar: Number(filas?.porAfinar ?? 0),
    afinados: Number(filas?.afinados ?? 0),
  };
}
