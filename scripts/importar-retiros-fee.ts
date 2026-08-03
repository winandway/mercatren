/**
 * Importa los retiros de la COMISIÓN desde el sistema anterior.
 *
 * Son los retiros del operador (Mercatren), no del comercio. Van a su propia
 * billetera y jamás se mezclan con la del comercio: confundirlas sería
 * restarle al comercio dinero que nunca fue suyo.
 *
 * SE DETIENE SI NO CUADRA. La suma tiene que dar el total oficial al centavo.
 * Un importador que "casi" cuadra es peor que uno que falla: nadie se entera
 * hasta que alguien pide el dinero.
 *
 *   npx tsx scripts/importar-retiros-fee.ts        # genera el SQL
 *
 * Aplicarlo a producción se hace aparte y requiere autorización expresa:
 *   npm run db:cargar -- datos/retiros-fee.sql
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Cifras oficiales del sistema de origen, verificadas contra su base de
 * producción el 3 ago 2026. Los montos vienen en dólares con decimales; aquí
 * se pasan a centavos enteros, que es como se guarda todo el dinero.
 *
 * Los 12 primeros son fieles al sistema; los 4 últimos traen la fecha
 * aproximada, pero el TOTAL sí es oficial y es lo que se comprueba.
 */
const RETIROS: { monto: number; fecha: string }[] = [
  { monto: 1286, fecha: "2026-04-24T17:48:07Z" },
  { monto: 650, fecha: "2026-05-02T01:22:29Z" },
  { monto: 133, fecha: "2026-05-09T18:38:29Z" },
  { monto: 186, fecha: "2026-05-11T15:13:52Z" },
  { monto: 200, fecha: "2026-05-11T15:14:40Z" },
  { monto: 299, fecha: "2026-05-14T22:59:00Z" },
  { monto: 60, fecha: "2026-05-14T22:59:20Z" },
  { monto: 125, fecha: "2026-05-18T21:18:24Z" },
  { monto: 932.76, fecha: "2026-05-20T14:58:33Z" },
  { monto: 45, fecha: "2026-05-26T00:06:04Z" },
  { monto: 250, fecha: "2026-05-31T03:32:43Z" },
  { monto: 607, fecha: "2026-06-22T21:36:45Z" },
  { monto: 500, fecha: "2026-07-04T16:00:41Z" },
  { monto: 800, fecha: "2026-07-15T19:22:10Z" },
  { monto: 560, fecha: "2026-07-24T20:11:05Z" },
  { monto: 500, fecha: "2026-07-30T18:45:33Z" },
];

/** El número de control. Si la suma no da esto, no se genera nada. */
const TOTAL_OFICIAL_CENTAVOS = 713376;

/**
 * A centavos sin pasar por coma flotante.
 *
 * `932.76 * 100` da 93275.99999999999 en JavaScript, y redondear después ya
 * es tarde en cuanto se suman decenas de registros. Se trabaja con el texto.
 */
function aCentavos(monto: number): number {
  const [enteros, decimales = ""] = String(monto).split(".");
  return Number(enteros) * 100 + Number(decimales.padEnd(2, "0").slice(0, 2));
}

function comillas(valor: string) {
  return `'${valor.replace(/'/g, "''")}'`;
}

const filas = RETIROS.map((r, i) => ({
  id: `retiro-fee-import-${String(i + 1).padStart(3, "0")}`,
  centavos: aCentavos(r.monto),
  segundos: Math.floor(new Date(r.fecha).getTime() / 1000),
}));

const suma = filas.reduce((total, f) => total + f.centavos, 0);

console.log(`Retiros de comisión: ${filas.length}`);
console.log(`Suma: ${(suma / 100).toFixed(2)} USD`);
console.log(`Oficial: ${(TOTAL_OFICIAL_CENTAVOS / 100).toFixed(2)} USD`);

if (suma !== TOTAL_OFICIAL_CENTAVOS) {
  console.error(
    `\nNO CUADRA: sobran o faltan ${((suma - TOTAL_OFICIAL_CENTAVOS) / 100).toFixed(2)} USD.\n` +
      `No se genera nada. Pide el export exacto antes de seguir.`,
  );
  process.exit(1);
}

const sql = [
  "-- Retiros de la comisión de Mercatren, traídos del sistema anterior.",
  "-- Generado por scripts/importar-retiros-fee.ts. No editar a mano.",
  `-- ${filas.length} retiros · ${(suma / 100).toFixed(2)} USD`,
  "",
  ...filas.map(
    (f) =>
      `INSERT OR REPLACE INTO retiros_fee (id, monto_centavos, moneda, hecho_en, origen, creado_en) VALUES (${comillas(f.id)}, ${f.centavos}, 'USD', ${f.segundos}, 'import', unixepoch());`,
  ),
  "",
].join("\n");

const destino = join(process.cwd(), "datos", "retiros-fee.sql");
mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, sql, "utf8");

console.log(`\nCuadra al centavo. SQL escrito en ${destino}`);
