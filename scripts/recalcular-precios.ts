/**
 * RECALCULA EL PRECIO PUBLICADO DE TODO EL CATÁLOGO.
 *
 * Se usa cuando cambia el margen de Mercatren (`COMISION_TARJETA_PB`). El
 * precio publicado se calcula hacia atrás con ese número dentro, así que si la
 * constante sube y los precios guardados se quedan como estaban, **la
 * diferencia sale del bolsillo del comercio en cada venta**.
 *
 * ══ EL ORDEN IMPORTA MÁS QUE EL SCRIPT ══
 *
 * Primero se corre esto contra producción, DESPUÉS se despliega el código con
 * la constante nueva. Así, durante los minutos que tarda la publicación, el
 * precio ya es el nuevo y el descuento todavía el viejo: el error cuesta de
 * nuestro lado. Al revés lo paga el comercio, y eso no se puede.
 *
 * ══ SIEMPRE DESDE LA BASE, NUNCA DESDE EL PUBLICADO ══
 *
 * `precio_base_centavos` es lo que el comercio quiere recibir. El publicado ya
 * lleva el ajuste, y volver a aplicárselo lo infla en cada corrida: 500 → 525
 * → 552. Pasó de verdad el 5 ago 2026. Por eso los productos sin base guardada
 * se SALTAN y se listan aparte, en vez de adivinarles el precio.
 *
 *   node scripts/recalcular-precios.ts            → escribe .local/precios.sql
 *   TOKEN_MERCATREN='...' npm run db:cargar -- .local/precios.sql
 */
import { mkdirSync, writeFileSync } from "node:fs";

import {
  COMISION_TARJETA_PB,
  formatearPrecio,
  precioConAjusteCentavos,
} from "../src/lib/dinero.ts";

const ENDPOINT = "https://yapanel.yadominios.com/api/hosting/db/query";
const SITIO = "mercatren";
const SALIDA = ".local/precios.sql";

const token = process.env.TOKEN_MERCATREN;
if (!token) {
  console.error("Falta TOKEN_MERCATREN. Sale del panel: sitio → Ver token.");
  process.exit(1);
}

type Fila = {
  id: string;
  titulo_es: string;
  precio_centavos: number;
  precio_base_centavos: number | null;
  estado: string;
};

async function consultar(sql: string): Promise<Fila[]> {
  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sitio: SITIO, token, sql }),
  });
  const datos = (await r.json()) as { results?: Fila[]; error?: string };
  if (datos.error) throw new Error(datos.error);
  return datos.results ?? [];
}

const productos = await consultar(
  "select id, titulo_es, precio_centavos, precio_base_centavos, estado from productos",
);

const cambios: string[] = [];
let sinBase = 0;
let yaCorrectos = 0;
let sumaAntes = 0;
let sumaDespues = 0;

for (const p of productos) {
  const base = Number(p.precio_base_centavos ?? 0);

  // Sin base no se toca: adivinarla es como se infla un precio solo.
  if (base <= 0) {
    sinBase++;
    continue;
  }

  const antes = Number(p.precio_centavos);
  const despues = precioConAjusteCentavos(base);

  sumaAntes += antes;
  sumaDespues += despues;

  if (antes === despues) {
    yaCorrectos++;
    continue;
  }

  cambios.push(
    `UPDATE productos SET precio_centavos = ${despues}, actualizado_en = unixepoch() WHERE id = '${p.id}';`,
  );
}

mkdirSync(".local", { recursive: true });
writeFileSync(
  SALIDA,
  [
    `-- Recalculo del precio publicado con el margen en ${COMISION_TARJETA_PB / 100}%.`,
    `-- Generado desde precioConAjusteCentavos(), no a mano.`,
    `-- ${cambios.length} productos cambian de precio.`,
    "",
    ...cambios,
    "",
  ].join("\n"),
);

console.log(`Productos leídos:      ${productos.length}`);
console.log(`  cambian de precio:   ${cambios.length}`);
console.log(`  ya estaban bien:     ${yaCorrectos}`);
console.log(`  sin precio base:     ${sinBase} (no se tocan)`);
console.log("");
console.log(`Suma publicada antes:  ${formatearPrecio(sumaAntes)}`);
console.log(`Suma publicada después:${formatearPrecio(sumaDespues)}`);
console.log(
  `Diferencia:            ${formatearPrecio(sumaDespues - sumaAntes)}`,
);
console.log("");
console.log(`Escrito en ${SALIDA}`);
