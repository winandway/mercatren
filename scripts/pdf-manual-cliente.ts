import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";

/**
 * EL MANUAL DE ARRANQUE PARA EL CLIENTE DE UN COMERCIO.
 *
 * ══ QUIÉN LO LEE ══
 *
 * **No es el dueño de la ferretería: es su cliente.** Alguien que recibe un
 * correo con un cobro y no ha oído hablar de Mercatren en su vida. Por eso el
 * manual empieza por el correo y no por el panel, y por eso no hay una sola
 * palabra técnica.
 *
 * El del comercio es otro documento distinto, hecho en la sesión de ese
 * comercio: aquel explica cómo MANDAR el cobro, este cómo PAGARLO.
 *
 * ══ LAS CAPTURAS SON DE VERDAD ══
 *
 * Salen de `scripts/capturas-manual-cliente.ts`, que las saca del sitio
 * corriendo con un cobro sembrado. Un manual con pantallas dibujadas a mano
 * envejece a la primera semana y manda a la gente a buscar botones que no
 * existen.
 *
 *   npm run dev                             (en otra terminal)
 *   npx tsx scripts/capturas-manual-cliente.ts
 *   npm run docs:pdf-manual-cliente
 *
 * ══ HORIZONTAL, COMO TODOS ══
 *
 * Se lee en el teléfono apaisado o en la pantalla de la ferretería, no impreso.
 */
const PLANTILLA = resolve("scripts/plantillas/manual-cliente-bley.html");
const DESTINO = "docs/Pagar-por-Mercatren-cliente-Bley.pdf";

async function main() {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();

  await pagina.goto(pathToFileURL(PLANTILLA).href, { waitUntil: "load" });
  /* Que las capturas estén cargadas antes de imprimir: si no, salen huecos
     blancos donde debería verse la pantalla. */
  await pagina.waitForLoadState("networkidle");

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
