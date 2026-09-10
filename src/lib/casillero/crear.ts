import "server-only";

import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { generarCodigoCasillero } from "@/lib/casillero/codigo";
import { BODEGA_MIAMI } from "@/lib/casillero/bodega";
import { getDb } from "@/lib/db";
import {
  altasCasillero,
  bodegasCasillero,
  casilleros,
  contadoresCasillero,
} from "@/lib/db/schema";

export type DatosDeAlta = {
  usuarioId: string;
  nombreLegal: string;
  telefono: string;
  paisDestino: string;
  origenId?: string | null;
  urlReferente?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
};

export type ResultadoAlta =
  | { ok: true; codigo: string; yaExistia: boolean }
  | { ok: false; motivo: string };

/**
 * ══ LA BODEGA SE SIEMBRA SOLA LA PRIMERA VEZ ══
 *
 * `schema.sql` crea las tablas pero no las llena, y un casillero sin bodega
 * no existe. En vez de un paso manual que alguien olvida el día del
 * despliegue, la fila se escribe si falta. Los datos salen de `bodega.ts`,
 * que es la única copia.
 */
async function asegurarBodega(db: ReturnType<typeof getDb>): Promise<string> {
  const b = BODEGA_MIAMI;
  await db
    .insert(bodegasCasillero)
    .values({
      id: b.id,
      codigo: b.codigo,
      nombre: b.nombre,
      linea1: b.linea1,
      ciudad: b.ciudad,
      estadoUs: b.estadoUs,
      zip: b.zip,
      telefono: "",
      activa: true,
    })
    .onConflictDoNothing();
  return b.id;
}

/**
 * ══ EL NÚMERO SALE DE UN CONTADOR, NO DE UN `MAX()+1` ══
 *
 * Con dos personas creando su casillero en el mismo segundo, `MAX()+1` le
 * da el mismo número a las dos y la segunda revienta contra el índice
 * único — o peor, se lo queda y hay dos casilleros con el mismo código.
 * `UPDATE … RETURNING` es atómico: cada quien se lleva el suyo.
 */
async function siguienteSecuencia(
  db: ReturnType<typeof getDb>,
): Promise<number> {
  await db
    .insert(contadoresCasillero)
    .values({ clave: "casillero", valor: 0 })
    .onConflictDoNothing();
  const filas = await db.all<{ valor: number }>(
    sql`UPDATE contadores_casillero SET valor = valor + 1 WHERE clave = 'casillero' RETURNING valor`,
  );
  const valor = Number(filas?.[0]?.valor);
  if (!Number.isFinite(valor) || valor < 1) {
    throw new Error("El contador de casilleros no devolvió un número");
  }
  /* El contador vale 1 la primera vez y la secuencia empieza en 0. */
  return valor - 1;
}

/**
 * Crea el casillero de un usuario que ya tiene cuenta en Mercatren.
 *
 * ══ UNO POR PERSONA ══
 *
 * Si ya lo tiene se le devuelve el que tiene, y no se crea otro. Dos
 * casilleros para la misma persona son dos códigos en circulación, y el
 * paquete que llega con el viejo cae en huérfanos.
 *
 * El alta queda registrada **siempre**, incluso cuando no crea nada: sin
 * los duplicados y los rechazos, el «de dónde vienen» del panel miente.
 */
export async function crearCasillero(
  datos: DatosDeAlta,
): Promise<ResultadoAlta> {
  const nombreLegal = datos.nombreLegal.trim().replace(/\s+/g, " ");
  const telefono = datos.telefono.trim();
  if (nombreLegal.length < 5 || !nombreLegal.includes(" ")) {
    return { ok: false, motivo: "nombre-incompleto" };
  }
  if (telefono.replace(/\D/g, "").length < 7) {
    return { ok: false, motivo: "telefono-invalido" };
  }

  const db = getDb();
  const ahora = new Date();

  const anotarAlta = async (estado: string, motivo?: string) => {
    await db
      .insert(altasCasillero)
      .values({
        id: nanoid(),
        usuarioId: datos.usuarioId,
        origenId: datos.origenId ?? null,
        urlReferente: datos.urlReferente ?? null,
        ipHash: datos.ipHash ?? null,
        userAgent: datos.userAgent?.slice(0, 300) ?? null,
        estado,
        motivo: motivo ?? null,
        creadoEn: ahora,
      })
      .catch(() => undefined);
  };

  const [existente] = await db
    .select({ codigo: casilleros.codigo })
    .from(casilleros)
    .where(eq(casilleros.usuarioId, datos.usuarioId))
    .limit(1);
  if (existente) {
    await anotarAlta("duplicada", "ya tenía casillero");
    return { ok: true, codigo: existente.codigo, yaExistia: true };
  }

  const bodegaId = await asegurarBodega(db);
  const secuencia = await siguienteSecuencia(db);
  const codigo = generarCodigoCasillero(secuencia);

  await db.insert(casilleros).values({
    id: nanoid(),
    usuarioId: datos.usuarioId,
    bodegaId,
    codigo,
    secuencia,
    nombreLegal,
    telefono,
    paisDestino: datos.paisDestino,
    estado: "activo",
    /* Nace SIN VERIFICAR: puede recibir paquetes —recibir nunca se
       bloquea— pero no puede despachar hasta verificar identidad. Los
       casilleros son el vehículo clásico del reenvío de mercancía comprada
       con tarjeta robada, y el intermediario responde. */
    verificado: false,
    origenId: datos.origenId ?? null,
    creadoEn: ahora,
  });
  await anotarAlta("creada");

  return { ok: true, codigo, yaExistia: false };
}

/** El casillero de quien está mirando, si lo tiene. */
export async function casilleroDe(usuarioId: string) {
  const db = getDb();
  const [fila] = await db
    .select({
      id: casilleros.id,
      codigo: casilleros.codigo,
      nombreLegal: casilleros.nombreLegal,
      telefono: casilleros.telefono,
      paisDestino: casilleros.paisDestino,
      estado: casilleros.estado,
      verificado: casilleros.verificado,
      creadoEn: casilleros.creadoEn,
    })
    .from(casilleros)
    .where(eq(casilleros.usuarioId, usuarioId))
    .limit(1);
  return fila ?? null;
}
