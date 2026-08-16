import { mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

import { chromium } from "playwright";

/**
 * LA COMPARATIVA DE PROVEEDORES DE ESTADOS UNIDOS, EN PDF.
 *
 * Cuarto documento para la misma persona, y el que más distinto tiene que
 * verse: los otros tres son propuestas e informes para estudiar; este es un
 * DOCUMENTO DE DECISIÓN — se lee para elegir un proveedor y arrancar.
 *
 * Se distingue por grafito y ámbar (en vez de azul, verde o vino), franja
 * gruesa arriba en vez de lomo lateral, semáforos de color en la tabla, y una
 * conclusión de una línea al pie de cada página.
 *
 * HORIZONTAL, como todos los PDF desde el 7 ago 2026: se leen en pantalla, y
 * la tabla comparativa es ancha — que es justo lo que cabe bien en apaisado.
 *
 *   npm run docs:pdf-proveedores
 */
const PLANTILLA = resolve("scripts/plantillas/proveedores-estados-unidos.html");
const DESTINO = "docs/mercatren-proveedores-estados-unidos.pdf";

async function main() {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();

  await pagina.goto(pathToFileURL(PLANTILLA).href, { waitUntil: "load" });
  await mkdir("docs", { recursive: true });

  await pagina.pdf({
    path: DESTINO,
    format: "A4",
    // Horizontal: se lee en pantalla, no impreso en papel.
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
