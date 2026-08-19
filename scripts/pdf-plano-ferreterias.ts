import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";

/**
 * EL PLANO DEL COBRO CUANDO EL CLIENTE ES OTRA FERRETERÍA.
 *
 * Es la respuesta de Mercatren al plano que armó la sesión de Ferremateriales
 * Bley: coincide en el diagnóstico, corrige dos de sus tres preguntas —tal como
 * estaban planteadas romperían el modelo— y suma la pieza que faltaba: la
 * Ferretería B **ya está registrada** como cliente, así que el enlace no hay
 * que reenviarlo.
 *
 * Se lo lee el dueño de la ferretería, no un programador: cero jerga.
 *
 *   npm run docs:pdf-plano-ferreterias
 */
const PLANTILLA = resolve("scripts/plantillas/plano-cobro-ferreterias.html");
const DESTINO = "docs/Plano-cobro-ferreterias.pdf";

async function main() {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();
  await pagina.goto(pathToFileURL(PLANTILLA).href, { waitUntil: "load" });
  await mkdir("docs", { recursive: true });
  await pagina.pdf({
    path: DESTINO,
    format: "A4",
    landscape: true,
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
