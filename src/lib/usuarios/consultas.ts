import "server-only";

import { desc, eq, sql } from "drizzle-orm";

import { exigirEquipoInterno } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { pagosZelle, tiendas, user } from "@/lib/db/schema";

/**
 * Las cuentas del sistema, para el equipo de Mercatren.
 *
 * Distinto de "Clientes": ahí salen quienes han COMPRADO. Aquí sale todo el
 * que tiene cuenta — comercios, validadores, el equipo —, que es lo que hace
 * falta para responder "¿este comercio ya está dado de alta?" sin tener que
 * mirar la base a mano.
 *
 * SOLO EL EQUIPO. Es una lista de personas con sus correos: a un comercio no
 * le corresponde ver quién más usa la plataforma.
 */

export type FichaUsuario = {
  id: string;
  nombre: string;
  correo: string;
  correoVerificado: boolean;
  rol: string;
  idioma: string;
  pais: string | null;
  telefono: string | null;
  creadoEn: number;
  /**
   * EN QUÉ ESTADO ESTÁ LA CUENTA. Se enseña con un punto de color.
   *
   * Hace falta para no mentir. Si en una demostración salen 120 cuentas todas
   * en verde teniendo un solo comercio real, lo primero que piensa quien mira
   * es que los números están inflados — y con razón. Marcar cuáles operan de
   * verdad y cuáles son de muestra da MÁS credibilidad, no menos.
   *
   *   activo        → opera de verdad hoy
   *   inactivo      → existe pero su comercio no está activo
   *   demostracion  → cuenta sembrada para enseñar el sistema
   */
  estadoCuenta: "activo" | "inactivo" | "demostracion";
  tienda: {
    id: string;
    nombre: string;
    slug: string;
    estado: string;
    razonSocial: string | null;
    identificacionFiscal: string | null;
    correoContacto: string | null;
    telefono: string | null;
    direccion: string | null;
    ciudad: string | null;
    paisOrigen: string | null;
    sitioWeb: string | null;
    horario: string | null;
    comisionPuntosBase: number;
  } | null;
};

function aFicha(f: {
  usuario: typeof user.$inferSelect;
  tienda: typeof tiendas.$inferSelect | null;
}): FichaUsuario {
  const { usuario, tienda } = f;

  /**
   * Las cuentas de muestra llevan el prefijo `demo-` en el id. Se marcan
   * aparte a propósito: una cuenta sembrada no es una cuenta "inactiva", es
   * una que nunca fue real, y mezclarlas sería justo lo que se quiere evitar.
   */
  const esDemostracion = usuario.id.startsWith("demo-");

  const estadoCuenta = esDemostracion
    ? ("demostracion" as const)
    : usuario.rol === "vendedor" && tienda?.estado !== "activa"
      ? ("inactivo" as const)
      : ("activo" as const);

  return {
    estadoCuenta,
    id: usuario.id,
    nombre: usuario.name,
    correo: usuario.email,
    correoVerificado: Boolean(usuario.emailVerified),
    rol: usuario.rol,
    idioma: usuario.idioma,
    pais: usuario.paisEntrega,
    telefono: usuario.telefono,
    creadoEn: usuario.createdAt.getTime(),
    tienda: tienda
      ? {
          id: tienda.id,
          nombre: tienda.nombre,
          slug: tienda.slug,
          estado: tienda.estado,
          razonSocial: tienda.razonSocial,
          identificacionFiscal: tienda.identificacionFiscal,
          correoContacto: tienda.correoContacto,
          telefono: tienda.telefono,
          direccion: tienda.direccion,
          ciudad: tienda.ciudad,
          paisOrigen: tienda.paisOrigen,
          sitioWeb: tienda.sitioWeb,
          horario: tienda.horario,
          comisionPuntosBase: tienda.comisionPuntosBase,
        }
      : null,
  };
}

export async function listarUsuarios(): Promise<FichaUsuario[]> {
  await exigirEquipoInterno();

  const db = getDb();
  const filas = await db
    .select({ usuario: user, tienda: tiendas })
    .from(user)
    .leftJoin(tiendas, eq(tiendas.propietarioId, user.id))
    .orderBy(desc(user.createdAt));

  return filas.map(aFicha);
}

export async function obtenerUsuarioPorId(
  id: string,
): Promise<FichaUsuario | null> {
  await exigirEquipoInterno();

  const db = getDb();
  const [fila] = await db
    .select({ usuario: user, tienda: tiendas })
    .from(user)
    .leftJoin(tiendas, eq(tiendas.propietarioId, user.id))
    .where(eq(user.id, id))
    .limit(1);

  return fila ? aFicha(fila) : null;
}

/** Lo que ha movido su comercio, si tiene uno. */
export async function resumenDelComercio(tiendaId: string) {
  const db = getDb();

  const [fila] = await db
    .select({
      ventas: sqlContar(),
      brutoCentavos: sqlSumar("monto_centavos"),
      comisionCentavos: sqlSumar("comision_centavos"),
      netoCentavos: sqlSumar("neto_centavos"),
    })
    .from(pagosZelle)
    .where(eq(pagosZelle.tiendaId, tiendaId));

  return {
    ventas: Number(fila?.ventas ?? 0),
    brutoCentavos: Number(fila?.brutoCentavos ?? 0),
    comisionCentavos: Number(fila?.comisionCentavos ?? 0),
    netoCentavos: Number(fila?.netoCentavos ?? 0),
  };
}

/* Solo las entradas aprobadas cuentan: la regla de siempre. */
function condicion() {
  return sql`${pagosZelle.tipo} = 'entrada' AND ${pagosZelle.estado} = 'aprobado'`;
}

function sqlContar() {
  return sql<number>`COALESCE(SUM(CASE WHEN ${condicion()} THEN 1 ELSE 0 END), 0)`;
}

function sqlSumar(columna: string) {
  return sql<number>`COALESCE(SUM(CASE WHEN ${condicion()} THEN ${sql.raw(columna)} ELSE 0 END), 0)`;
}
