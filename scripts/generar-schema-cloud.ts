/**
 * Arma el schema.sql que YaDominios Cloud ejecuta contra la base del sitio
 * (env.DB) en cada publicacion.
 *
 * Que lleva, y SOLO eso:
 *   1. Las tablas: el DDL del ESQUEMA ACTUAL (drizzle-kit export), vuelto
 *      idempotente con IF NOT EXISTS porque el archivo corre en CADA
 *      despliegue.
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
 * ══ POR QUE SALE DEL ESQUEMA ACTUAL Y NO DE LA CADENA DE MIGRACIONES ══
 *
 * Antes se concatenaban los .sql de drizzle/migrations. Eso funciona mientras
 * todo sean CREATE TABLE, pero en cuanto aparece un ALTER (una columna nueva
 * en una tabla que ya existia) el generador se plantaba — y con razon: un
 * ALTER repetido en cada publicacion revienta a la segunda.
 *
 * El problema es lo que quedaba detras: schema.sql se quedaba SIN esa columna,
 * asi que una base NUEVA nacia incompleta. Se descubrio el 17 ago 2026 con
 * `tiendas.mercado` y `pedidos.mercado`: las dos aplicadas a mano a las bases
 * que ya existian, y las dos ausentes del archivo que crea una base desde cero.
 * En produccion no se veia nada; habria explotado el dia que se levantara un
 * sitio nuevo.
 *
 * Ahora el DDL sale del esquema de Drizzle TAL COMO ESTA HOY, asi que las
 * tablas nacen completas. Y sigue valiendo la regla de siempre:
 *
 *   IF NOT EXISTS NO TOCA UNA TABLA QUE YA EXISTE. Una columna nueva sobre
 *   una base viva se aplica A MANO, una vez, con `npm run db:cargar`.
 *
 * Por eso el generador sigue avisando cuando la migracion nueva trae un ALTER:
 * ya no para el trabajo, pero deja escrito en pantalla que ese cambio hay que
 * llevarlo a las bases vivas por separado.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

import { DEPARTAMENTOS } from "../src/lib/catalogo/departamentos.ts";
import path from "node:path";

const RAIZ = process.cwd();
const MIGRACIONES = path.join(RAIZ, "drizzle", "migrations");
const SALIDA = path.join(RAIZ, "schema.sql");

/**
 * El piloto, igual que en scripts/importar-zelle.ts.
 *
 * Esto solo se usa para el ALTA (el INSERT lleva `ON CONFLICT DO NOTHING`):
 * en una base que ya tiene la tienda, ni el nombre ni nada mas se toca. Tiene
 * que seguir siendo asi — este archivo se ejecuta en CADA publicacion, y un
 * `DO UPDATE` aqui le devolveria al comercio el nombre viejo cada vez que
 * subimos un cambio al sitio.
 */
const PILOTO = {
  id: "tienda-bley-ferreteria",
  /** No cambia aunque cambie el nombre: es la direccion publica de su tienda. */
  slug: "bley-ferreteria",
  nombre: "Ferremateriales Bley C.A",
  paisOrigen: "VE",
  comisionPuntosBase: 300,
};

function ddlIdempotente() {
  /**
   * El esquema actual completo, no la suma de los parches historicos. Un
   * `drizzle-kit export` describe las tablas como son HOY, que es justo lo
   * que necesita una base que nace vacia.
   */
  const ddl = execFileSync(
    "npx",
    [
      "drizzle-kit",
      "export",
      "--dialect=sqlite",
      "--schema=src/lib/db/schema.ts",
    ],
    { encoding: "utf8", cwd: process.cwd() },
  );

  const sql = ddl
    .replaceAll("--> statement-breakpoint", "")
    .replace(/CREATE TABLE `/g, "CREATE TABLE IF NOT EXISTS `")
    .replace(/CREATE INDEX `/g, "CREATE INDEX IF NOT EXISTS `")
    .replace(/CREATE UNIQUE INDEX `/g, "CREATE UNIQUE INDEX IF NOT EXISTS `");

  /* Un export nunca deberia traer ALTER ni DROP: describe un estado, no un
     cambio. Si aparece uno, algo se torcio y es mejor parar que publicar un
     archivo que rompa la base en cada despliegue. */
  const peligroso = sql.match(/^\s*(ALTER|DROP)\s/im);
  if (peligroso) {
    throw new Error(
      `El export trae ${peligroso[1]} y este archivo corre en CADA publicacion. ` +
        "Revisa el esquema antes de seguir.",
    );
  }

  avisarDeColumnasNuevas();

  return [`-- ── Tablas (esquema actual) ──\n${sql.trim()}`];
}

/**
 * Avisa por pantalla si la ultima migracion trae un ALTER.
 *
 * No detiene nada —el schema.sql ya sale correcto para una base nueva— pero
 * recuerda lo que el archivo NO puede hacer: una tabla que ya existe no
 * recibe columnas nuevas por mucho IF NOT EXISTS que lleve.
 */
function avisarDeColumnasNuevas() {
  const archivos = readdirSync(MIGRACIONES)
    .filter((a) => a.endsWith(".sql"))
    .sort();
  const ultima = archivos.at(-1);
  if (!ultima) return;

  const sql = readFileSync(path.join(MIGRACIONES, ultima), "utf8");
  if (!/^\s*ALTER\s/im.test(sql)) return;

  console.warn(
    `\n  OJO: ${ultima} trae un ALTER. schema.sql crea las tablas nuevas ya\n` +
      "  completas, pero las bases que YA existen (produccion y la local) no\n" +
      "  reciben esa columna solas. Aplicala a mano con npm run db:cargar.\n",
  );
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

/**
 * LOS DEPARTAMENTOS DE MERCATREN.
 *
 * Viven en `categorias` con `tienda_id = NULL`, que es lo que significa "de la
 * casa, no de un comercio". Se siembran aqui para que lleguen solos a
 * produccion en cada publicacion: son navegacion del sitio, no datos de un
 * cliente, asi que no tiene sentido cargarlos a mano.
 *
 * DO NOTHING sobre el slug: republicar mil veces deja exactamente los mismos.
 * Si manana se renombra uno en departamentos.ts, el nombre nuevo NO pisa al
 * viejo — eso se hace a proposito, con un UPDATE pensado, no de rebote en un
 * despliegue.
 */
function seedDeDepartamentos() {
  const lineas = [
    "-- ── Departamentos de Mercatren (categorias de la casa, tienda_id NULL) ──",
    "-- Es la lista cerrada que elige el vendedor. Si cada comercio inventara",
    "-- la suya, el mismo taladro acabaria en cuatro categorias distintas y",
    "-- quien busca taladros encontraria una.",
  ];

  for (const [indice, d] of DEPARTAMENTOS.entries()) {
    lineas.push(
      `INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)`,
      `VALUES (${texto(`dep-${d.slug}`)}, NULL, ${texto(d.slug)}, ${texto(d.es)}, ${texto(d.en)}, NULL, ${indice})`,
      "ON CONFLICT(id) DO NOTHING;",
    );
  }

  return lineas.join("\n");
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
  seedDeDepartamentos(),
  "",
];

writeFileSync(SALIDA, partes.join("\n"), "utf8");

const kb = Math.round(Buffer.byteLength(partes.join("\n")) / 1024);
console.log(`schema.sql escrito (${kb} KB)`);
