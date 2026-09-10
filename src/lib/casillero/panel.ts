import "server-only";

import { and, count, desc, eq, gte, isNull, sql } from "drizzle-orm";

import { ESTADOS_EN_BODEGA } from "@/lib/casillero/estados";
import { getDb } from "@/lib/db";
import {
  altasCasillero,
  casilleros,
  origenesCasillero,
  paquetesCasillero,
  user,
} from "@/lib/db/schema";

/**
 * ══ LOS NÚMEROS DEL CASILLERO PARA EL PANEL ══
 *
 * Lo primero que se mira. **«De dónde vienen las altas» es la pregunta que
 * el dueño hace todos los días**, así que va con nombre propio y no
 * escondida en una tabla.
 *
 * Cada consulta nombra sus columnas: pedir la tabla entera hace que Drizzle
 * liste todas las del esquema, y una base que ya existe no recibe las
 * nuevas — 500 en producción con todo perfecto en local.
 */
export type ResumenCasillero = {
  altas: { hoy: number; semana: number; mes: number; total: number };
  porOrigen: Array<{ nombre: string; cuantos: number }>;
  porPais: Array<{ pais: string; cuantos: number }>;
  enBodega: number;
  huerfanos: number;
  sinDeclarar: number;
  sinVerificar: number;
};

const diasAtras = (n: number) => new Date(Date.now() - n * 86_400_000);

export async function resumenCasillero(): Promise<ResumenCasillero | null> {
  try {
    const db = getDb();
    const cuantos = async (desde?: Date) => {
      const [f] = await db
        .select({ n: count() })
        .from(casilleros)
        .where(desde ? gte(casilleros.creadoEn, desde) : undefined);
      return Number(f?.n ?? 0);
    };

    const [hoy, semana, mes, total] = await Promise.all([
      cuantos(diasAtras(1)),
      cuantos(diasAtras(7)),
      cuantos(diasAtras(30)),
      cuantos(),
    ]);

    const porOrigen = await db
      .select({
        nombre: sql<string>`COALESCE(${origenesCasillero.nombre}, 'Mercatren')`,
        cuantos: count(),
      })
      .from(casilleros)
      .leftJoin(
        origenesCasillero,
        eq(origenesCasillero.id, casilleros.origenId),
      )
      .groupBy(sql`COALESCE(${origenesCasillero.nombre}, 'Mercatren')`)
      .orderBy(desc(count()))
      .limit(10);

    const porPais = await db
      .select({ pais: casilleros.paisDestino, cuantos: count() })
      .from(casilleros)
      .groupBy(casilleros.paisDestino)
      .orderBy(desc(count()))
      .limit(20);

    const [bodega] = await db
      .select({ n: count() })
      .from(paquetesCasillero)
      .where(
        sql`${paquetesCasillero.estado} IN (${sql.join(
          ESTADOS_EN_BODEGA.map((e) => sql`${e}`),
          sql`, `,
        )})`,
      );

    const [huerfanos] = await db
      .select({ n: count() })
      .from(paquetesCasillero)
      .where(isNull(paquetesCasillero.casilleroId));

    const [sinDeclarar] = await db
      .select({ n: count() })
      .from(paquetesCasillero)
      .where(isNull(paquetesCasillero.valorDeclaradoCentavos));

    const [sinVerificar] = await db
      .select({ n: count() })
      .from(casilleros)
      .where(eq(casilleros.verificado, false));

    return {
      altas: { hoy, semana, mes, total },
      porOrigen: porOrigen.map((o) => ({
        nombre: o.nombre,
        cuantos: Number(o.cuantos),
      })),
      porPais: porPais.map((p) => ({
        pais: p.pais,
        cuantos: Number(p.cuantos),
      })),
      enBodega: Number(bodega?.n ?? 0),
      huerfanos: Number(huerfanos?.n ?? 0),
      sinDeclarar: Number(sinDeclarar?.n ?? 0),
      sinVerificar: Number(sinVerificar?.n ?? 0),
    };
  } catch (fallo) {
    console.error("[casillero] no se pudo armar el resumen:", fallo);
    return null;
  }
}

/**
 * La tabla de casilleros.
 *
 * ══ EL TELÉFONO SALE ENMASCARADO ══
 *
 * Ver el dato completo es una acción aparte que queda registrada en
 * `accesos_datos`. Eso es lo que convierte una fuga en algo investigable:
 * sin el registro, nadie puede decir quién miró qué.
 */
export async function listarCasilleros(filtro?: string) {
  const db = getDb();
  const busqueda = filtro?.trim();
  const filas = await db
    .select({
      id: casilleros.id,
      codigo: casilleros.codigo,
      nombreLegal: casilleros.nombreLegal,
      telefono: casilleros.telefono,
      paisDestino: casilleros.paisDestino,
      estado: casilleros.estado,
      verificado: casilleros.verificado,
      creadoEn: casilleros.creadoEn,
      correo: user.email,
      origen: origenesCasillero.nombre,
    })
    .from(casilleros)
    .innerJoin(user, eq(user.id, casilleros.usuarioId))
    .leftJoin(origenesCasillero, eq(origenesCasillero.id, casilleros.origenId))
    .where(
      busqueda
        ? sql`(${casilleros.codigo} LIKE ${"%" + busqueda + "%"}
            OR lower(${casilleros.nombreLegal}) LIKE ${"%" + busqueda.toLowerCase() + "%"}
            OR lower(${user.email}) LIKE ${"%" + busqueda.toLowerCase() + "%"})`
        : undefined,
    )
    .orderBy(desc(casilleros.creadoEn))
    .limit(200)
    .catch(() => []);

  return filas.map((f) => ({
    ...f,
    /* Se enmascara AQUÍ y no en la pantalla: si el dato completo llega al
       navegador, ya salió, y el «ver» de la pantalla sería teatro. */
    telefono: enmascarar(f.telefono),
    correo: enmascararCorreo(f.correo),
  }));
}

/** Deja los últimos dos dígitos: alcanza para reconocer, no para llamar. */
export function enmascarar(valor: string | null): string {
  if (!valor) return "—";
  const limpio = valor.replace(/\s+/g, "");
  if (limpio.length <= 3) return "•••";
  return `•••• ${limpio.slice(-2)}`;
}

export function enmascararCorreo(valor: string | null): string {
  if (!valor) return "—";
  const [antes, dominio] = valor.split("@");
  if (!dominio || !antes) return "•••";
  return `${antes.slice(0, 2)}•••@${dominio}`;
}

/** Las altas de los últimos días, con su origen y su resultado. */
export async function altasRecientes(dias = 30) {
  return getDb()
    .select({
      id: altasCasillero.id,
      estado: altasCasillero.estado,
      motivo: altasCasillero.motivo,
      creadoEn: altasCasillero.creadoEn,
      origen: origenesCasillero.nombre,
    })
    .from(altasCasillero)
    .leftJoin(
      origenesCasillero,
      eq(origenesCasillero.id, altasCasillero.origenId),
    )
    .where(and(gte(altasCasillero.creadoEn, diasAtras(dias))))
    .orderBy(desc(altasCasillero.creadoEn))
    .limit(100)
    .catch(() => []);
}
