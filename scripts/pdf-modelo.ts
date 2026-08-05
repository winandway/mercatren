import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

/**
 * EL PDF DEL MODELO DE NEGOCIO, IMPRESO DESDE LA PROPIA PÁGINA.
 *
 * POR QUÉ ASÍ Y NO A MANO. El PDF anterior era un archivo suelto de 1,5 MB
 * que nadie regeneraba: describía el modelo viejo —el de cobrar y liquidar
 * dinero ajeno— mientras la página ya decía otra cosa. Un banco que descarga
 * ese PDF lee la versión que llevó a la reestructuración legal, y eso es peor
 * que no tener PDF.
 *
 * Imprimiéndolo desde la página, la paridad no depende de que alguien se
 * acuerde: es imposible que difieran, porque son el mismo contenido. Si el
 * documento cambia, se corre esto y el PDF cambia con él.
 *
 * Uso (con el servidor levantado):
 *   npm run docs:pdf
 *   BASE=https://mercatren.com npm run docs:pdf
 */
const BASE = process.env.BASE ?? "http://localhost:3000";
const RUTA = "/es/docs/modelo-de-negocio";
const DESTINO = "public/docs/mercatren-modelo-de-negocio.pdf";

async function main() {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();

  const url = `${BASE}${RUTA}`;
  console.log(`Abriendo ${url}`);
  const respuesta = await pagina.goto(url, { waitUntil: "networkidle" });

  if (!respuesta || respuesta.status() >= 400) {
    await navegador.close();
    throw new Error(
      `La página respondió ${respuesta?.status() ?? "sin respuesta"}. ` +
        `¿Está levantado el servidor en ${BASE}?`,
    );
  }

  // Se comprueba que sea la versión nueva antes de imprimir. Sin esto, un
  // servidor viejo dejaría un PDF con el modelo anterior y nadie lo notaría.
  const version = await pagina
    .locator("body")
    .innerText()
    .then((t) => (t.includes("V3") ? "V3" : "desconocida"));
  if (version !== "V3") {
    await navegador.close();
    throw new Error(
      "La página servida no es la V3 del documento. Se detiene para no " +
        "generar un PDF con el modelo anterior.",
    );
  }

  await mkdir("public/docs", { recursive: true });
  await pagina.emulateMedia({ media: "print" });
  await pagina.pdf({
    path: DESTINO,
    format: "A4",
    printBackground: true,
    margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" },
  });

  await navegador.close();
  console.log(`Listo: ${DESTINO}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
