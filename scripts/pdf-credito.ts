import { mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

import { chromium } from "playwright";

/**
 * EL PDF DE VENTAS A CRÉDITO, PARA MANDARLE AL COMERCIO.
 *
 * A diferencia del PDF del modelo de negocio —que se imprime desde la página
 * publicada para que no puedan diferir—, este sale de una plantilla propia
 * (`scripts/plantillas/credito-comercios.html`), y es a propósito:
 *
 * **No es contenido del sitio.** Es una propuesta comercial que se le manda a
 * un comercio para que la apruebe. No tiene por qué estar en mercatren.com, y
 * de hecho no debe: habla de una funcionalidad que todavía no existe.
 *
 * Se imprime desde el archivo, sin servidor levantado:
 *
 *   npm run docs:pdf-credito
 */
const PLANTILLA = resolve("scripts/plantillas/credito-comercios.html");
const DESTINO = "docs/mercatren-ventas-a-credito.pdf";

async function main() {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();

  const url = pathToFileURL(PLANTILLA).href;
  console.log(`Imprimiendo ${url}`);
  await pagina.goto(url, { waitUntil: "load" });

  await mkdir("docs", { recursive: true });

  await pagina.pdf({
    path: DESTINO,
    format: "A4",
    /* Los colores de marca tienen que salir en el PDF. Sin esto, Chromium
       imprime como una impresora de oficina: todo en blanco y negro. */
    printBackground: true,
    // Los márgenes los pone la propia hoja con @page; aquí van en cero.
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });

  await navegador.close();
  console.log(`Listo: ${DESTINO}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
