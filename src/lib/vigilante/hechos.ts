import "server-only";

import {
  and,
  count,
  eq,
  inArray,
  isNull,
  like,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";

import { FUENTE_CJ } from "@/lib/cj/constantes";
import { REGIONALES } from "@/lib/cj/riesgo";
import { contarPublicadosSinVerificar } from "@/lib/cj/verificados";
import { getDb } from "@/lib/db";
import {
  configuracion,
  enviosProducto,
  fuentesCatalogo,
  importacionesCj,
  itemsPedido,
  pagosZelle,
  pedidos,
  pedidosProveedor,
  productos,
  retiros,
  tandasImportacionCj,
  tiendas,
} from "@/lib/db/schema";
import { avisoDeStripeArmado, saludDelProveedor } from "@/lib/salud/piezas";

import {
  LLAVE_LATIDO_SINCRONIZAR,
  UMBRALES,
  type CompraVista,
  type Hechos,
  type ImportacionVista,
  type PlazaVista,
} from "./reglas";

/**
 * LO QUE EL VIGILANTE MIDE. Solo lee; las decisiones están en `reglas.ts`.
 * Cada medida va en su propio `catch`: un fallo en una no deja ciego al
 * resto, y un vigilante que se cae por una consulta es un vigilante que no
 * avisa de nada.
 */
const PLAZAS = ["US", "CL", "CO"] as const;

async function seguro<T>(respaldo: T, medir: () => Promise<T>): Promise<T> {
  try {
    return await medir();
  } catch (fallo) {
    console.error("[vigilante] una medida falló:", fallo);
    return respaldo;
  }
}

export async function recogerHechos(): Promise<Hechos> {
  const db = getDb();
  const ahora = new Date();
  const ahoraMs = ahora.getTime();
  const hace = (min: number) => new Date(ahoraMs - min * 60_000);

  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const env = getCloudflareContext().env as unknown as Record<
    string,
    string | undefined
  >;

  const [
    latidoSincronizarMs,
    proveedor,
    avisoStripe,
    importaciones,
    plazas,
    publicadosSinVerificar,
    comprasConError,
    comprasPorPagarViejas,
    ventasSinCompra,
    zellePendientesViejos,
    retirosSinPagarViejos,
    fuentesAtrasadas,
    sinTraducir,
  ] = await Promise.all([
    seguro<number | null>(null, async () => {
      const [fila] = await db
        .select({ valor: configuracion.valor })
        .from(configuracion)
        .where(eq(configuracion.clave, LLAVE_LATIDO_SINCRONIZAR))
        .limit(1);
      const n = Number(fila?.valor);
      return Number.isFinite(n) && n > 0 ? n : null;
    }),
    seguro("error", saludDelProveedor),
    seguro("error", () => avisoDeStripeArmado(env)),
    seguro<ImportacionVista[]>([], async () => {
      const vivas = await db
        .select({
          id: importacionesCj.id,
          mercado: importacionesCj.mercado,
          estado: importacionesCj.estado,
          actualizadoEn: importacionesCj.actualizadoEn,
          ultimoError: importacionesCj.ultimoError,
          agregados: importacionesCj.agregados,
        })
        .from(importacionesCj)
        .where(inArray(importacionesCj.estado, ["en_curso", "pausada"]));
      const salida: ImportacionVista[] = [];
      for (const v of vivas) {
        const [c] = await db
          .select({
            pendientes: sql<number>`sum(case when ${tandasImportacionCj.estado} in ('pendiente','en_curso') then 1 else 0 end)`,
            conError: sql<number>`sum(case when ${tandasImportacionCj.estado} = 'con_error' then 1 else 0 end)`,
          })
          .from(tandasImportacionCj)
          .where(eq(tandasImportacionCj.importacionId, v.id));
        salida.push({
          id: v.id,
          mercado: v.mercado,
          estado: v.estado,
          actualizadoEnMs: v.actualizadoEn.getTime(),
          tandasPendientes: Number(c?.pendientes ?? 0),
          tandasConError: Number(c?.conError ?? 0),
          ultimoError: v.ultimoError,
          agregados: v.agregados,
        });
      }
      return salida;
    }),
    seguro<PlazaVista[]>([], async () => {
      const salida: PlazaVista[] = [];
      for (const mercado of PLAZAS) {
        const deCj = and(
          eq(productos.fuenteId, FUENTE_CJ),
          eq(tiendas.paisOrigen, mercado),
        );
        const [fila] = await db
          .select({
            publicados: sql<number>`sum(case when ${productos.estado} = 'publicado' then 1 else 0 end)`,
            enRevision: sql<number>`sum(case when ${productos.estado} = 'en_revision' then 1 else 0 end)`,
            porAfinar: sql<number>`sum(case when ${enviosProducto.productoId} is null or ${enviosProducto.origen} = 'estimado' or ${or(
              ...REGIONALES.map((r) =>
                like(sql`lower(${enviosProducto.transporte})`, `%${r}%`),
              ),
            )} then 1 else 0 end)`,
            sinCostoBase: sql<number>`sum(case when ${productos.estado} != 'borrador' and (${productos.precioBaseCentavos} is null or ${productos.precioBaseCentavos} <= 0) then 1 else 0 end)`,
          })
          .from(productos)
          .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
          .leftJoin(enviosProducto, eq(enviosProducto.productoId, productos.id))
          .where(deCj);
        salida.push({
          mercado,
          publicados: Number(fila?.publicados ?? 0),
          enRevision: Number(fila?.enRevision ?? 0),
          porAfinar: Number(fila?.porAfinar ?? 0),
          sinCostoBase: Number(fila?.sinCostoBase ?? 0),
        });
      }
      return salida;
    }),
    seguro(0, contarPublicadosSinVerificar),
    seguro(0, async () => {
      const [f] = await db
        .select({ n: count() })
        .from(pedidosProveedor)
        .where(eq(pedidosProveedor.estado, "con_error"));
      return Number(f?.n ?? 0);
    }),
    seguro(0, async () => {
      const [f] = await db
        .select({ n: count() })
        .from(pedidosProveedor)
        .where(
          and(
            eq(pedidosProveedor.estado, "por_pagar"),
            lt(pedidosProveedor.creadoEn, hace(UMBRALES.compraPorPagarMin)),
          ),
        );
      return Number(f?.n ?? 0);
    }),
    seguro(0, async () => {
      /* Ventas pagadas con al menos un producto de CJ y sin pedido al
         proveedor, con media hora de margen para que el automático corra. */
      const conCj = db
        .select({ id: itemsPedido.pedidoId })
        .from(itemsPedido)
        .innerJoin(productos, eq(productos.id, itemsPedido.productoId))
        .where(eq(productos.fuenteId, FUENTE_CJ));
      const conCompra = db
        .select({ id: pedidosProveedor.pedidoId })
        .from(pedidosProveedor);
      const [f] = await db
        .select({ n: count() })
        .from(pedidos)
        .where(
          and(
            inArray(pedidos.estado, ["pagado", "preparando"]),
            lt(pedidos.creadoEn, hace(UMBRALES.ventaSinCompraMin)),
            inArray(pedidos.id, conCj),
            sql`${pedidos.id} not in ${conCompra}`,
          ),
        );
      return Number(f?.n ?? 0);
    }),
    seguro(0, async () => {
      const [f] = await db
        .select({ n: count() })
        .from(pagosZelle)
        .where(
          and(
            eq(pagosZelle.estado, "pendiente"),
            lt(pagosZelle.subidoEn, hace(UMBRALES.zelleHoras * 60)),
          ),
        );
      return Number(f?.n ?? 0);
    }),
    seguro(0, async () => {
      const [f] = await db
        .select({ n: count() })
        .from(retiros)
        .where(
          and(
            eq(retiros.estado, "solicitado"),
            lt(retiros.creadoEn, hace(UMBRALES.retiroHoras * 60)),
          ),
        );
      return Number(f?.n ?? 0);
    }),
    seguro<string[]>([], async () => {
      const filas = await db
        .select({ nombre: fuentesCatalogo.nombre })
        .from(fuentesCatalogo)
        .where(
          and(
            sql`${fuentesCatalogo.url} is not null and ${fuentesCatalogo.url} != ''`,
            ne(fuentesCatalogo.estado, "pausada"),
            or(
              isNull(fuentesCatalogo.ultimaSincronizacion),
              lt(
                fuentesCatalogo.ultimaSincronizacion,
                hace(UMBRALES.fuentesHoras * 60),
              ),
            ),
          ),
        );
      return filas.map((f) => f.nombre);
    }),
    seguro(0, async () => {
      const [f] = await db
        .select({ n: count() })
        .from(productos)
        .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
        .where(
          and(
            inArray(tiendas.paisOrigen, [...PLAZAS]),
            ne(productos.estado, "borrador"),
            sql`${productos.tituloEn} is not null and trim(${productos.tituloEn}) != ''`,
            or(
              sql`trim(${productos.tituloEs}) = ''`,
              sql`lower(trim(${productos.tituloEs})) = lower(trim(${productos.tituloEn}))`,
            ),
          ),
        );
      return Number(f?.n ?? 0);
    }),
  ]);

  /* Los detalles: número y motivo de cada compra con problema, y los
     pedidos pagados sin compra. Van aparte para que un fallo aquí no deje
     sin conteo a lo de arriba. */
  const detalleCompras = await seguro<CompraVista[]>([], async () => {
    const filas = await db
      .select({
        numero: pedidos.numero,
        estado: pedidosProveedor.estado,
        motivo: pedidosProveedor.ultimoError,
        creadoEn: pedidosProveedor.creadoEn,
      })
      .from(pedidosProveedor)
      .innerJoin(pedidos, eq(pedidos.id, pedidosProveedor.pedidoId))
      .where(
        or(
          eq(pedidosProveedor.estado, "con_error"),
          and(
            eq(pedidosProveedor.estado, "por_pagar"),
            lt(pedidosProveedor.creadoEn, hace(UMBRALES.compraPorPagarMin)),
          ),
        ),
      )
      .limit(8);
    return filas.map((f) => ({
      numero: f.numero,
      estado: f.estado,
      motivo: f.motivo,
      haceMinutos: Math.max(
        0,
        Math.round((ahoraMs - f.creadoEn.getTime()) / 60_000),
      ),
    }));
  });
  const detalleVentasSinCompra = await seguro<string[]>([], async () => {
    const conCj = db
      .select({ id: itemsPedido.pedidoId })
      .from(itemsPedido)
      .innerJoin(productos, eq(productos.id, itemsPedido.productoId))
      .where(eq(productos.fuenteId, FUENTE_CJ));
    const conCompra = db
      .select({ id: pedidosProveedor.pedidoId })
      .from(pedidosProveedor);
    const filas = await db
      .select({ numero: pedidos.numero })
      .from(pedidos)
      .where(
        and(
          inArray(pedidos.estado, ["pagado", "preparando"]),
          lt(pedidos.creadoEn, hace(UMBRALES.ventaSinCompraMin)),
          inArray(pedidos.id, conCj),
          sql`${pedidos.id} not in ${conCompra}`,
        ),
      )
      .limit(8);
    return filas.map((f) => f.numero);
  });

  return {
    ahoraMs,
    latidoSincronizarMs,
    proveedor,
    avisoStripe,
    importaciones,
    plazas,
    publicadosSinVerificar,
    comprasConError,
    comprasPorPagarViejas,
    ventasSinCompra,
    zellePendientesViejos,
    retirosSinPagarViejos,
    fuentesAtrasadas,
    sinTraducir,
    detalleCompras,
    detalleVentasSinCompra,
  };
}
