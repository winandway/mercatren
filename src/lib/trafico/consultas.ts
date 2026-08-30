import "server-only";

import { sql } from "drizzle-orm";

import { exigirEquipoInterno } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { visitas } from "@/lib/db/schema";
import { mercadoDelPanel } from "@/lib/mercado/panel";

/**
 * LAS CUENTAS DEL TRÁFICO (30 ago 2026).
 *
 * Solo PERSONAS (los robots se filtraron al entrar) y solo del país que el
 * selector del panel está mirando — la regla de siempre. «Visitantes» son
 * únicos del día (el hash rota a medianoche, así que los únicos de 7 o 30
 * días son aproximados por suma de días: honesto y barato).
 */

function haceSegundos(s: number) {
  return sql`${visitas.creadoEn} > unixepoch() - ${s}`;
}

export async function resumenDeTrafico() {
  await exigirEquipoInterno();
  const db = getDb();
  const mercado = await mercadoDelPanel();
  const delMercado = sql`${visitas.mercado} = ${mercado.codigo}`;

  const [
    [hoy],
    [semana],
    [mes],
    [enVivo],
    porPais,
    porRuta,
    porDia,
    referidos,
    [duracion],
  ] = await Promise.all([
    /* Hoy: desde la medianoche, no «hace 24 horas» — regla de la casa. */
    db
      .select({
        visitas: sql<number>`COUNT(*)`,
        visitantes: sql<number>`COUNT(DISTINCT ${visitas.visitante})`,
      })
      .from(visitas)
      .where(
        sql`${delMercado} AND ${visitas.creadoEn} >= unixepoch(date('now'))`,
      ),
    db
      .select({
        visitas: sql<number>`COUNT(*)`,
        visitantes: sql<number>`COUNT(DISTINCT ${visitas.visitante} || date(${visitas.creadoEn}, 'unixepoch'))`,
      })
      .from(visitas)
      .where(sql`${delMercado} AND ${haceSegundos(7 * 86_400)}`),
    db
      .select({
        visitas: sql<number>`COUNT(*)`,
        visitantes: sql<number>`COUNT(DISTINCT ${visitas.visitante} || date(${visitas.creadoEn}, 'unixepoch'))`,
      })
      .from(visitas)
      .where(sql`${delMercado} AND ${haceSegundos(30 * 86_400)}`),
    /* En vivo: personas distintas con una página vista hace <5 minutos. */
    db
      .select({ n: sql<number>`COUNT(DISTINCT ${visitas.visitante})` })
      .from(visitas)
      .where(sql`${delMercado} AND ${haceSegundos(300)}`),
    db
      .select({
        pais: visitas.pais,
        visitas: sql<number>`COUNT(*)`,
        visitantes: sql<number>`COUNT(DISTINCT ${visitas.visitante})`,
      })
      .from(visitas)
      .where(sql`${delMercado} AND ${haceSegundos(30 * 86_400)}`)
      .groupBy(visitas.pais)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(12),
    db
      .select({ ruta: visitas.ruta, visitas: sql<number>`COUNT(*)` })
      .from(visitas)
      .where(sql`${delMercado} AND ${haceSegundos(30 * 86_400)}`)
      .groupBy(visitas.ruta)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(15),
    db
      .select({
        dia: sql<string>`date(${visitas.creadoEn}, 'unixepoch')`,
        visitas: sql<number>`COUNT(*)`,
        visitantes: sql<number>`COUNT(DISTINCT ${visitas.visitante})`,
      })
      .from(visitas)
      .where(sql`${delMercado} AND ${haceSegundos(30 * 86_400)}`)
      .groupBy(sql`date(${visitas.creadoEn}, 'unixepoch')`)
      .orderBy(sql`date(${visitas.creadoEn}, 'unixepoch') DESC`)
      .limit(30),
    db
      .select({ referido: visitas.referido, visitas: sql<number>`COUNT(*)` })
      .from(visitas)
      .where(
        sql`${delMercado} AND ${visitas.referido} IS NOT NULL AND ${haceSegundos(30 * 86_400)}`,
      )
      .groupBy(visitas.referido)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(10),
    /* La duración media, solo de las visitas que avisaron al salir. */
    db
      .select({ media: sql<number>`AVG(${visitas.segundos})` })
      .from(visitas)
      .where(
        sql`${delMercado} AND ${visitas.segundos} > 0 AND ${haceSegundos(30 * 86_400)}`,
      ),
  ]);

  return {
    mercado: mercado.codigo,
    hoy: {
      visitas: Number(hoy?.visitas ?? 0),
      visitantes: Number(hoy?.visitantes ?? 0),
    },
    semana: {
      visitas: Number(semana?.visitas ?? 0),
      visitantes: Number(semana?.visitantes ?? 0),
    },
    mes: {
      visitas: Number(mes?.visitas ?? 0),
      visitantes: Number(mes?.visitantes ?? 0),
    },
    enVivo: Number(enVivo?.n ?? 0),
    duracionMediaSegundos: Math.round(Number(duracion?.media ?? 0)),
    porPais: porPais.map((f) => ({
      pais: f.pais ?? "??",
      visitas: Number(f.visitas),
      visitantes: Number(f.visitantes),
    })),
    porRuta: porRuta.map((f) => ({ ruta: f.ruta, visitas: Number(f.visitas) })),
    porDia: porDia.map((f) => ({
      dia: f.dia,
      visitas: Number(f.visitas),
      visitantes: Number(f.visitantes),
    })),
    referidos: referidos.map((f) => ({
      referido: f.referido ?? "",
      visitas: Number(f.visitas),
    })),
  };
}
