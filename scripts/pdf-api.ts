import { mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

import { chromium } from "playwright";

/**
 * EL PLAN DE LA API, EN PDF.
 *
 * Igual que el de ventas a crédito: sale de su propia plantilla, no del sitio.
 * Es un documento de trabajo sobre algo que todavía no existe, así que no tiene
 * por qué estar publicado en mercatren.com.
 *
 *   npm run docs:pdf-api
 */
const PLANTILLA = resolve("scripts/plantillas/api-integraciones.html");
const DESTINO = "docs/mercatren-api-integraciones.pdf";

async function main() {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();

  await pagina.goto(pathToFileURL(PLANTILLA).href, { waitUntil: "load" });
  await mkdir("docs", { recursive: true });

  await pagina.pdf({
    path: DESTINO,
    format: "A4",
    /* HORIZONTAL, y es lo primero que se nota. Al comercio ya le mandamos el
       documento de ventas a crédito en vertical; si este llega con la misma
       cara, el ojo lo reconoce y el cerebro lo saltea — "esto ya lo vi". */
    landscape: true,
    // Sin esto Chromium imprime en blanco y negro, como una impresora vieja.
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });

  await navegador.close();
  console.log(`Listo: ${DESTINO}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
