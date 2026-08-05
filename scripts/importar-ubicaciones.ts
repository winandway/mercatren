/**
 * Ubica el catálogo: qué producto está en qué depósito y en qué ciudad.
 *
 *   npm run ubicaciones:importar -- --archivo=/ruta/al/export.json
 *
 * Lee el export del sistema del comercio (Control Box de Bley) y genera el
 * SQL que crea los depósitos y le pone a cada producto el suyo. NO toca
 * ninguna base: escribe un archivo para revisar antes de aplicarlo, como el
 * resto de los importadores del proyecto.
 *
 * SE UNE POR `externo_id`, que es el id que el producto tenía en el sistema
 * de origen. Es el mismo campo con el que ya se importó el catálogo, así que
 * un producto no se duplica ni se pierde.
 *
 * LA ZONA SE DEDUCE DE LA SUCURSAL, no de la dirección. El sistema de origen
 * solo guarda "Merida el vigia" y "Caracas" como dirección — nombres de
 * ciudad, no direcciones. Las direcciones de verdad se escriben después desde
 * el panel; sin ellas el sistema funciona igual, solo que no puede decirle al
 * cliente a qué puerta tocar.
 */

import { readFileSync, writeFileSync } from "node:fs";

type ProductoUbicado = {
  id: string;
  sku: string | null;
  titulo: string;
  sucursal: string;
  bodega: string;
  deposito: string | null;
  deposito_descripcion: string | null;
  stock: number;
};

/** De la sucursal del sistema de origen a nuestra zona. */
const ZONA_POR_SUCURSAL: Record<string, string> = {
  el_vigia: "el-vigia",
  caracas: "caracas",
};

const TIENDA = "tienda-bley-ferreteria";

function texto(valor: string | null) {
  return valor === null ? "NULL" : `'${valor.replace(/'/g, "''")}'`;
}

/** "DEPOSITO CENTRO" → "deposito-centro", para armar un id estable. */
function aSlug(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function salir(mensaje: string): never {
  console.error(`\n  ✗ ${mensaje}\n`);
  process.exit(1);
}

const arg = process.argv.find((a) => a.startsWith("--archivo="));
if (!arg) salir("Falta --archivo=/ruta/al/export.json");
const RUTA = arg.split("=").slice(1).join("=");

const datos = JSON.parse(readFileSync(RUTA, "utf8")) as {
  productos: ProductoUbicado[];
};

const productos = datos.productos ?? [];
if (productos.length === 0) salir("El archivo no trae productos.");

/* ── 1. Los depósitos, uno por (sucursal + nombre) ────────────────────────── */

const depositos = new Map<
  string,
  {
    id: string;
    nombre: string;
    queGuarda: string | null;
    zona: string;
    /** true = es la bodega entera, porque el origen aún no la subdividió. */
    sinSubdividir: boolean;
  }
>();

let sinZona = 0;
let sinDeposito = 0;

for (const p of productos) {
  const zona = ZONA_POR_SUCURSAL[p.sucursal];
  if (!zona) {
    sinZona++;
    continue;
  }
  /**
   * SIN DEPÓSITO EN EL ORIGEN NO ES SIN UBICACIÓN.
   *
   * Los 135 de Caracas no tienen depósito porque allá todavía no se crearon;
   * están sueltos en la bodega. Pero SÍ sabemos en qué ciudad están, y la
   * ciudad es lo único que decide a quién le llega. Si los dejáramos sin
   * depósito se quedarían sin zona, y entonces el sistema no sabría que están
   * en Caracas — que es justo el dato que hacía falta.
   *
   * Así que caen en un depósito con el nombre de su bodega. Cuando Bley
   * subdivida Caracas, la siguiente importación los reparte.
   */
  const nombreDeposito = p.deposito ?? p.bodega;
  if (!p.deposito) sinDeposito++;

  const clave = `${zona}|${nombreDeposito}`;
  if (!depositos.has(clave)) {
    depositos.set(clave, {
      id: `dep-${TIENDA}-${aSlug(zona)}-${aSlug(nombreDeposito)}`,
      nombre: nombreDeposito,
      queGuarda: p.deposito_descripcion,
      zona,
      sinSubdividir: !p.deposito,
    });
  }
}

/* ── 2. El SQL ────────────────────────────────────────────────────────────── */

const lineas: string[] = [
  "-- Ubicaciones del catalogo: depositos y en cual esta cada producto.",
  "-- Generado por scripts/importar-ubicaciones.ts. Idempotente.",
  "",
  "-- Los depositos del comercio.",
];

for (const d of depositos.values()) {
  lineas.push(
    `INSERT INTO depositos (id, tienda_id, nombre, que_guarda, zona, externo_nombre, activo)`,
    `VALUES (${texto(d.id)}, ${texto(TIENDA)}, ${texto(d.nombre)}, ${texto(d.queGuarda)}, ${texto(d.zona)}, ${texto(d.nombre)}, 1)`,
    "ON CONFLICT(id) DO UPDATE SET que_guarda = excluded.que_guarda, zona = excluded.zona;",
  );
}

lineas.push("", "-- Cada producto a su deposito, uniendo por externo_id.");

let ubicados = 0;
for (const p of productos) {
  const zona = ZONA_POR_SUCURSAL[p.sucursal];
  if (!zona) continue;
  const d = depositos.get(`${zona}|${p.deposito ?? p.bodega}`);
  if (!d) continue;

  lineas.push(
    `UPDATE productos SET deposito_id = ${texto(d.id)} WHERE externo_id = ${texto(p.id)} AND tienda_id = ${texto(TIENDA)};`,
  );
  ubicados++;
}

const SALIDA = ".local/ubicaciones.sql";
writeFileSync(SALIDA, lineas.join("\n") + "\n", "utf8");

/* ── 3. El reporte ────────────────────────────────────────────────────────── */

console.log(`\n  Archivo: ${RUTA}`);
console.log(`  Productos en el archivo: ${productos.length}`);
console.log(`\n  Depositos encontrados: ${depositos.size}`);
for (const d of depositos.values()) {
  const cuantos = productos.filter(
    (p) =>
      ZONA_POR_SUCURSAL[p.sucursal] === d.zona &&
      (p.deposito ?? p.bodega) === d.nombre,
  ).length;
  console.log(
    `    ${d.zona.padEnd(10)} ${d.nombre.padEnd(24)} ${String(cuantos).padStart(4)} productos  (${d.sinSubdividir ? "bodega entera, sin subdividir" : (d.queGuarda ?? "sin descripcion")})`,
  );
}

console.log(`\n  Productos ubicados: ${ubicados}`);
if (sinDeposito > 0) {
  console.log(
    `  De esos, ${sinDeposito} cayeron en la bodega entera porque el origen aun no la subdividio.`,
  );
}
if (sinZona > 0) {
  console.log(
    `  ✗ Sucursal desconocida: ${sinZona}  — revisar ZONA_POR_SUCURSAL`,
  );
}

console.log(`\n  SQL escrito en ${SALIDA}`);
console.log(`  Aplicarlo a produccion requiere autorizacion expresa.\n`);
