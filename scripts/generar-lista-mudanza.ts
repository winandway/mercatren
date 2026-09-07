import { writeFileSync } from "node:fs";
const ENDPOINT = "https://yapanel.yadominios.com/api/hosting/db/query";
const token = process.env.TOKEN_MERCATREN;
async function q(sql: string) {
  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sitio: "mercatren", token, sql, params: [] }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${t.slice(0, 200)}`);
  const d = JSON.parse(t) as Record<string, unknown>;
  const r0 = Array.isArray(d.result)
    ? (d.result[0] as Record<string, unknown>)
    : null;
  return (r0?.results ?? d.results ?? d.rows ?? []) as Record<
    string,
    unknown
  >[];
}

async function main() {
  const prods = await q(
    `SELECT p.slug FROM productos p JOIN tiendas t ON t.id=p.tienda_id WHERE t.pais_origen='VE' ORDER BY p.slug`,
  );
  const tds = await q(
    `SELECT slug FROM tiendas WHERE pais_origen='VE' ORDER BY slug`,
  );
  const P = prods.map((r) => String(r.slug)).filter(Boolean);
  const T = tds.map((r) => String(r.slug)).filter(Boolean);

  const archivo = `/**
 * LAS DIRECCIONES QUE SE MUDARON A mercatren.com.ve (7 sep 2026).
 *
 * Generado desde la base el día de la mudanza con
 * \`scripts/generar-lista-mudanza.ts\`. Son las fichas que Google ya tenía
 * indexadas en mercatren.com cuando Venezuela vivía ahí: un conjunto
 * CERRADO, que no cambia. Un producto venezolano creado después nace ya en
 * su dominio y nunca estuvo en el .com, así que no necesita redirección.
 *
 * ══ POR QUÉ ESTÁ ESCRITO AQUÍ Y NO SE CONSULTA ══
 *
 * La primera versión se la pedía a \`/datos/mudanza\` desde el middleware.
 * MEDIDO EN PRODUCCIÓN el 7 sep, con el dato ya movido y la lista
 * respondiendo bien: seis intentos seguidos contestaron 200 en vez de 308.
 * El middleware corre en el borde y ese \`fetch\` a su propio origen —una
 * consulta de más de mil filas con un tope de un segundo— no llegaba nunca,
 * y el \`catch\` lo tapaba: mil fichas dando un 404 blando en silencio, que
 * es exactamente lo que la casa prohíbe.
 *
 * Aquí no hay red, ni caché, ni tiempo de espera: la comparación es contra
 * un Set en memoria. Pesa ~40 KB en el worker, que está a un tercio de su
 * tope.
 *
 * ══ CUÁNDO SE REGENERA ══
 *
 * Solo si OTRO país se muda de dominio, o si un comercio que ya estaba
 * indexado en el .com pasa a Venezuela. No al agregar productos.
 */

/** Fichas de producto que vivían en mercatren.com. */
export const PRODUCTOS_MUDADOS: ReadonlySet<string> = new Set(
${JSON.stringify(P, null, 0).replace(/^\[/, "  [").replace(/\]$/, "]")},
);

/** Fichas de tienda que vivían en mercatren.com. */
export const TIENDAS_MUDADAS: ReadonlySet<string> = new Set(
${JSON.stringify(T, null, 0).replace(/^\[/, "  [").replace(/\]$/, "]")},
);

/** A dónde se fueron todas: el mercado de Venezuela. */
export const MERCADO_DE_LA_MUDANZA = "VE";
`;
  writeFileSync("src/lib/mercado/mudados.ts", archivo);
  console.log(
    `  ${P.length} productos y ${T.length} tiendas escritos en src/lib/mercado/mudados.ts`,
  );
  console.log(`  pesa ${Math.round(archivo.length / 1024)} KB`);
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
