/**
 * ¿Llegaron a producción las tablas de las migraciones? (8 nov 2026)
 *
 * `schema.sql` corre en cada publicación con `CREATE TABLE IF NOT EXISTS`,
 * pero «llegan solas» no es lo mismo que «están». Esta sonda de SOLO LECTURA
 * mira `sqlite_master` (una consulta) y las columnas de `account` (la que
 * better-auth 1.7.7 querrá con `issuer`), y dice qué falta.
 */
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { TABLAS_ESPERADAS, tablasQueFaltan } from "./tablas-esperadas";

export async function revisarTablas() {
  const db = getDb();
  const filas = await db.all<{ name: string }>(
    sql.raw("SELECT name FROM sqlite_master WHERE type = 'table'"),
  );
  const presentes = filas.map((f) => f.name);
  const columnasAccount = (
    await db.all<{ name: string }>(sql.raw("PRAGMA table_info(account)"))
  ).map((c) => c.name);
  const faltan = tablasQueFaltan(TABLAS_ESPERADAS, presentes);
  return {
    ok: faltan.length === 0,
    faltan,
    totalDeTablas: presentes.length,
    account: {
      columnas: columnasAccount,
      tieneIssuer: columnasAccount.includes("issuer"),
    },
  };
}
