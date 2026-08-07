import { mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

import { chromium } from "playwright";

/**
 * EL INFORME DE PRECIOS Y DECLARACIÓN, EN PDF.
 *
 * Tercer documento para la misma persona, y el que tiene que verse MÁS
 * distinto de los tres: los otros dos son propuestas para convencer a un
 * comercio, este es un informe para estudiar y para reenviarle una hoja al
 * contador.
 *
 * Por eso vuelve al VERTICAL (el de la API es horizontal) pero cambia todo lo
 * demás: vino en vez de azul o verde, títulos en serif en vez de sans, un lomo
 * de color a la izquierda, y cero dibujos.
 *
 *   npm run docs:pdf-informe
 */
const PLANTILLA = resolve(
  "scripts/plantillas/informe-precios-declaracion.html",
);
const DESTINO = "docs/mercatren-informe-precios-declaracion.pdf";

async function main() {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();

  await pagina.goto(pathToFileURL(PLANTILLA).href, { waitUntil: "load" });
  await mkdir("docs", { recursive: true });

  await pagina.pdf({
    path: DESTINO,
    format: "A4",
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
