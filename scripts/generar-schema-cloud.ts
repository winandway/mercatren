/**
 * Arma el schema.sql que YaDominios Cloud ejecuta contra la base del sitio
 * (env.DB) en cada publicacion.
 *
 * Que lleva, y SOLO eso:
 *   1. Las tablas (el DDL de drizzle/migrations, vuelto idempotente con
 *      IF NOT EXISTS, porque el archivo corre en CADA despliegue).
 *   2. El comercio piloto y su billetera EN CERO (ON CONFLICT DO NOTHING:
 *      jamas pisa un saldo que ya este andando en produccion).
 *
 * SE MANTIENE CHICO A PROPOSITO (unos 13 KB). Este archivo se ejecuta entero
 * en cada publicacion, antes de que el sitio quede en vivo: meterle los 689
 * productos lo llevaba a 556 KB y 76 sentencias, y un despliegue que tarda de
 * mas se cae y deja el sitio sin publicar. Las tablas son lo unico que el
 * sitio NECESITA para arrancar; los datos se cargan despues, una sola vez.
 *
 * Que NO lleva, a proposito:
 *   - El catalogo (.local/catalogo.sql). Se carga aparte, una vez, contra la
 *     base del sitio. No hace falta repetirlo en cada despliegue.
 *   - El historico de pagos Zelle. Trae nombres y correos de personas reales
 *     y el repositorio es publico. Ese se carga aparte, directo a la base,
 *     con autorizacion expresa (ver datos/LEEME.md).
 *   - Cuentas de usuario. Las claves no viven en el repositorio.
 *
 * Uso:  npm run db:schema-cloud   (y commitear el schema.sql resultante)
 *
 * OJO al evolucionar el esquema: IF NOT EXISTS no aplica cambios a tablas ya
 * creadas. Si una migracion nueva trae ALTER TABLE, este script la detiene:
 * ahi hay que decidir a mano como llevar ese cambio a produccion.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const RAIZ = process.cwd();
const MIGRACIONES = path.join(RAIZ, "drizzle", "migrations");
const SALIDA = path.join(RAIZ, "schema.sql");

/** El piloto, igual que en scripts/importar-zelle.ts. */
const PILOTO = {
  id: "tienda-bley-ferreteria",
  slug: "bley-ferreteria",
  nombre: "Bley Ferretería",
  paisOrigen: "VE",
  comisionPuntosBase: 300,
};

function ddlIdempotente() {
  const archivos = readdirSync(MIGRACIONES)
    .filter((a) => a.endsWith(".sql"))
    .sort();

  return archivos.map((archivo) => {
    let sql = readFileSync(path.join(MIGRACIONES, archivo), "utf8");

    // Un ALTER o DROP no se puede repetir a ciegas en cada despliegue: si
    // aparece uno, ese cambio se piensa a mano en vez de romper produccion.
    const peligroso = sql.match(/^\s*(ALTER|DROP)\s/im);
    if (peligroso) {
      throw new Error(
        `${archivo} trae ${peligroso[1]} y este generador solo sabe de CREATE. ` +
          "Decide a mano como llevar ese cambio a produccion.",
      );
    }

    sql = sql
      .replaceAll("--> statement-breakpoint", "")
      .replace(/CREATE TABLE `/g, "CREATE TABLE IF NOT EXISTS `")
      .replace(/CREATE INDEX `/g, "CREATE INDEX IF NOT EXISTS `")
      .replace(/CREATE UNIQUE INDEX `/g, "CREATE UNIQUE INDEX IF NOT EXISTS `");

    return `-- ── Tablas (${archivo}) ──\n${sql.trim()}`;
  });
}

function texto(valor: string) {
  return `'${valor.replace(/'/g, "''")}'`;
}

/** El piloto y su billetera. El saldo NUNCA se toca desde aqui. */
function seedDelPiloto() {
  const ahora = Math.floor(Date.now() / 1000);
  return [
    "-- ── Comercio piloto y su billetera ──",
    "-- La billetera nace en CERO (el historico ya se liquido en el sistema",
    "-- anterior) y DO NOTHING garantiza que un despliegue jamas pise el",
    "-- saldo real que este andando en produccion.",
    `INSERT INTO tiendas (id, slug, nombre, estado, comision_puntos_base, pais_origen, descripcion_es, descripcion_en, creado_en, actualizado_en)`,
    `VALUES (${texto(PILOTO.id)}, ${texto(PILOTO.slug)}, ${texto(PILOTO.nombre)}, 'activa', ${PILOTO.comisionPuntosBase}, ${texto(PILOTO.paisOrigen)}, NULL, NULL, ${ahora}, ${ahora})`,
    "ON CONFLICT(id) DO NOTHING;",
    "",
    `INSERT INTO billeteras (id, tienda_id, saldo_centavos, moneda, proveedor, estado, creado_en)`,
    `VALUES (${texto(`billetera-${PILOTO.slug}`)}, ${texto(PILOTO.id)}, 0, 'USD', 'tokiia', 'activa', ${ahora})`,
    "ON CONFLICT(tienda_id) DO NOTHING;",
  ].join("\n");
}

const partes = [
  "-- schema.sql — YaDominios Cloud lo ejecuta contra env.DB en cada publicacion.",
  "-- Generado por scripts/generar-schema-cloud.ts. NO editar a mano:",
  "--   npm run db:schema-cloud",
  "-- Todo lo de aqui es idempotente: correr dos veces deja lo mismo.",
  "-- SOLO tablas y el comercio piloto: esto corre en CADA publicacion y tiene",
  "-- que ser rapido. El catalogo y el historico se cargan aparte, una vez.",
  "",
  ...ddlIdempotente(),
  "",
  seedDelPiloto(),
  "",
];

writeFileSync(SALIDA, partes.join("\n"), "utf8");

const kb = Math.round(Buffer.byteLength(partes.join("\n")) / 1024);
console.log(`schema.sql escrito (${kb} KB)`);
