/**
 * LA MUDANZA DE VENEZUELA, DE UNA SOLA VEZ.
 *
 * Mueve los comercios venezolanos —y sus productos y sus pedidos— del
 * catálogo de mercatren.com al de mercatren.com.ve. Mide antes, mueve,
 * mide después, y comprueba las dos vitrinas en el sitio publicado.
 *
 *   TOKEN_MERCATREN='...' npx tsx scripts/mudar-venezuela.ts
 *
 * NO BORRA NADA. Cambia una sola columna (`mercado`) en las tiendas
 * venezolanas: con eso desaparecen del .com y aparecen en el .ve. Los
 * precios, los saldos, los pedidos pagados y las fotos quedan intactos, y
 * la marcha atrás es una línea que este mismo script imprime al final.
 *
 * Se detiene si algo no cuadra: más vale no mover nada que mover a medias.
 */
const ENDPOINT = "https://yapanel.yadominios.com/api/hosting/db/query";
const SITIO = "mercatren";
const token = process.env.TOKEN_MERCATREN;

if (!token) {
  console.error("\n  Falta el token. Sale del panel de YaDominios Cloud:");
  console.error("  sitio «mercatren» → Ver token.\n");
  console.error("  TOKEN_MERCATREN='...' npx tsx scripts/mudar-venezuela.ts\n");
  process.exit(1);
}

/** Manda una consulta y devuelve las filas. El token viaja en memoria. */
async function consultar(sql: string, params: unknown[] = []) {
  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sitio: SITIO, token, sql, params }),
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`${r.status} · ${txt.slice(0, 300)}`);
  let d: unknown;
  try {
    d = JSON.parse(txt);
  } catch {
    throw new Error(`respuesta que no es JSON: ${txt.slice(0, 200)}`);
  }
  const c = d as Record<string, unknown>;
  /* La plataforma ha devuelto la forma {result:[{results:[…]}]} y también
     {results:[…]}: se aceptan las dos en vez de suponer una. */
  const r0 = Array.isArray(c.result)
    ? (c.result[0] as Record<string, unknown>)
    : null;
  return (r0?.results ?? c.results ?? c.rows ?? []) as Record<
    string,
    unknown
  >[];
}

const n = (f: Record<string, unknown>[]) => Number(f[0]?.n ?? 0);
const titulo = (t: string) =>
  console.log(`\n══ ${t} ${"═".repeat(Math.max(0, 58 - t.length))}`);

const VENEZOLANA = `UPPER(TRIM(COALESCE(pais_origen,''))) = 'VE'`;

async function main() {
  titulo("1 · LO QUE HAY AHORA");

  const tiendas = await consultar(
    `SELECT slug, nombre, ciudad, mercado,
            (SELECT COUNT(*) FROM productos p WHERE p.tienda_id = t.id) AS productos
       FROM tiendas t WHERE ${VENEZOLANA} ORDER BY productos DESC`,
  );
  if (tiendas.length === 0) {
    console.error("\n  No hay ni un comercio con país de origen Venezuela.");
    console.error("  No se mueve nada: eso no es lo esperado.\n");
    process.exit(1);
  }
  for (const t of tiendas) {
    console.log(
      `  ${String(t.nombre).slice(0, 34).padEnd(35)} ${String(t.ciudad ?? "—")
        .slice(0, 14)
        .padEnd(
          15,
        )} ${String(t.mercado).padEnd(4)} ${String(t.productos).padStart(5)} productos`,
    );
  }

  const productos = n(
    await consultar(
      `SELECT COUNT(*) AS n FROM productos p JOIN tiendas t ON t.id = p.tienda_id WHERE ${VENEZOLANA.replace(/pais_origen/g, "t.pais_origen")}`,
    ),
  );
  const pedidos = n(
    await consultar(
      `SELECT COUNT(DISTINCT ip.pedido_id) AS n
         FROM items_pedido ip
         JOIN productos p ON p.id = ip.producto_id
         JOIN tiendas t ON t.id = p.tienda_id
        WHERE UPPER(TRIM(COALESCE(t.pais_origen,''))) = 'VE'`,
    ),
  );
  const porMover = tiendas.filter((t) => t.mercado !== "VE").length;

  console.log(
    `\n  ${tiendas.length} comercios · ${productos} productos · ${pedidos} pedidos ya hechos`,
  );
  console.log(
    `  De esos comercios, ${porMover} todavía están fuera de Venezuela.`,
  );

  if (porMover === 0) {
    console.log("\n  Ya estaban todos mudados. No hay nada que hacer.\n");
    return;
  }

  titulo("2 · LA MUDANZA");

  await consultar(`UPDATE tiendas SET mercado = 'VE' WHERE ${VENEZOLANA}`);
  console.log("  Los comercios pasaron al catálogo de Venezuela.");

  await consultar(
    `UPDATE pedidos SET mercado = 'VE' WHERE id IN (
       SELECT DISTINCT ip.pedido_id FROM items_pedido ip
         JOIN productos p ON p.id = ip.producto_id
         JOIN tiendas t ON t.id = p.tienda_id
        WHERE UPPER(TRIM(COALESCE(t.pais_origen,''))) = 'VE')`,
  );
  console.log("  Los pedidos ya hechos se fueron con ellos.");

  titulo("3 · COMPROBAR");

  const fuera = n(
    await consultar(
      `SELECT COUNT(*) AS n FROM tiendas WHERE ${VENEZOLANA} AND mercado <> 'VE'`,
    ),
  );
  const reparto = await consultar(
    `SELECT mercado, COUNT(*) AS n FROM tiendas GROUP BY mercado ORDER BY n DESC`,
  );
  for (const f of reparto)
    console.log(`  catálogo ${f.mercado}: ${f.n} comercios`);
  console.log(
    `\n  venezolanos fuera de su catálogo: ${fuera}  (tiene que ser 0)`,
  );
  if (fuera !== 0) {
    console.error("\n  ALGO NO CUADRÓ. Marcha atrás abajo.\n");
    process.exit(1);
  }

  titulo("4 · LAS DOS VITRINAS, EN EL SITIO PUBLICADO");

  /* El borde guarda la portada un minuto: se espera antes de mirar, o se
     leería la versión de antes de la mudanza y parecería que falló. */
  console.log("  esperando a que el sitio se refresque…");
  await new Promise((r) => setTimeout(r, 75_000));

  for (const host of ["mercatren.com.ve", "mercatren.com"]) {
    try {
      const html = await fetch(`https://${host}/es?v=${Date.now()}`, {
        headers: { "cache-control": "no-cache" },
      }).then((r) => r.text());
      const h1 = html.match(/<h1[^>]*>([^<]*)</)?.[1]?.trim() ?? "(sin título)";
      const bley = (html.match(/bley-ferreteria/g) ?? []).length;
      console.log(`  ${host.padEnd(18)} «${h1}»`);
      console.log(
        `  ${" ".repeat(18)} productos venezolanos en la portada: ${bley}`,
      );
    } catch {
      console.log(
        `  ${host.padEnd(18)} no contestó ahora mismo; se mira en el navegador`,
      );
    }
  }

  titulo("SI HUBIERA QUE VOLVER ATRÁS");
  console.log(`  UPDATE tiendas SET mercado='US' WHERE ${VENEZOLANA};`);
  console.log(`  UPDATE pedidos SET mercado='US' WHERE mercado='VE';\n`);
}

main().catch((e) => {
  console.error("\n  Se detuvo:", e instanceof Error ? e.message : e, "\n");
  process.exit(1);
});
