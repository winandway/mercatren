/* Las capturas de la guía «Impuestos para comercios fuera de Estados Unidos»,
   sacadas del panel de verdad (npm run dev + cuenta de prueba local). Se corre
   con `node scripts/capturas-docs-impuestos.mjs` desde la raíz del proyecto. */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const es = JSON.parse(readFileSync("messages/es.json", "utf-8"));
const BASE = "http://localhost:3000";
const OUT = "public/docs/impuestos";
const navegador = await chromium.launch();
const ctx = await navegador.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  locale: "es-VE",
});
const page = await ctx.newPage();
page.setDefaultTimeout(90000);
await page.goto(`${BASE}/es/entrar`, { waitUntil: "domcontentloaded" });
const correo = page.getByLabel(es.entrar.correo);
const clave = page.getByLabel(es.entrar.clave, { exact: true });
await correo.fill("bley@prueba.local");
await clave.fill("MercatrenPrueba2026");
await page
  .getByRole("button", {
    name: es.entrar.entrar ?? es.entrar.boton ?? /iniciar/i,
  })
  .click();
await page.waitForURL(/\/panel/, { timeout: 90000 });
// 1) el precio del formulario de producto nuevo
await page.goto(`${BASE}/es/panel/productos/nuevo`, {
  waitUntil: "networkidle",
});
const precio = page.locator('input[name="precio"]').first();
await precio.waitFor();
await precio.scrollIntoViewIfNeeded();
const caja = await precio.boundingBox();
const alto = 844;
await page.evaluate((y) => window.scrollBy(0, y - 120), caja.y);
await page.waitForTimeout(400);
await page.screenshot({
  path: `${OUT}/1-precio.png`,
  clip: { x: 0, y: 0, width: 390, height: Math.min(alto, 420) },
});
console.log("✓ 1-precio.png");
// 2) los datos de la empresa en Mi tienda: se busca el TÍTULO de la sección
//    (hay dos casillas «identificación fiscal» en la página: la del W-8BEN-E
//    y la de la empresa; la del título es la que no se confunde).
await page.goto(`${BASE}/es/panel/mi-tienda`, { waitUntil: "networkidle" });
const yTitulo = await page.evaluate(() => {
  const h = [...document.querySelectorAll("h2")].find((e) =>
    /datos de la empresa/i.test(e.textContent ?? ""),
  );
  return h ? Math.round(h.getBoundingClientRect().top + window.scrollY) : null;
});
if (yTitulo === null)
  throw new Error("no encontré la sección Datos de la empresa");
/* DATOS INVENTADOS EN LA CAPTURA, NUNCA LOS DEL COMERCIO (3 sep 2026).
   La base local trae los datos reales del comercio piloto; una guía pública no
   puede enseñar el RIF, el correo ni la dirección de un cliente. Se cambian en
   el DOM justo antes de la foto — la base no se toca — por un comercio que no
   existe, con el mismo formato (RIF J-8 dígitos-1, teléfono +58, ciudad). */
const INVENTADOS = {
  razonSocial: "Ferretería La Esquina C.A",
  identificacionFiscal: "J-41265780-3",
  correoContacto: "ventas@ferrelaesquina.com.ve",
  telefono: "+58 414 5550123",
  direccion: "Av. Principal, local 12, Valencia",
  ciudad: "Valencia",
};
await page.evaluate((datos) => {
  for (const [nombre, valor] of Object.entries(datos)) {
    const lista = [...document.querySelectorAll(`input[name="${nombre}"]`)];
    /* La casilla de la EMPRESA es la que está debajo del título; la del W-8
       vive más arriba. Se toma la última. */
    const casilla = lista.at(-1);
    if (casilla) casilla.value = valor;
  }
}, INVENTADOS);

await page.screenshot({
  path: `${OUT}/2-datos-empresa.png`,
  fullPage: true,
  clip: { x: 0, y: yTitulo - 16, width: 390, height: 620 },
});
console.log("✓ 2-datos-empresa.png");
// 3) el documento W-8BEN-E firmado (para la guía del W-8): el nombre del
//    comercio se reemplaza en el DOM por el inventado antes de la foto.
await page.goto(`${BASE}/es/panel/mi-tienda/formulario-fiscal`, {
  waitUntil: "networkidle",
});
const hayDocumento = await page.evaluate(() =>
  /SUBSTITUTE/.test(document.body.innerText),
);
console.log("documento W-8 en pantalla:", hayDocumento);
if (hayDocumento) {
  await page.evaluate((nombre) => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      if (/Ferremateriales Bley/i.test(n.nodeValue))
        n.nodeValue = n.nodeValue.replace(
          /Ferremateriales Bley C\.?A\.?/gi,
          nombre,
        );
    }
  }, "Ferretería La Esquina C.A");
  await page.screenshot({
    path: "public/docs/w8bene/4-documento.png",
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
  console.log("✓ w8bene/4-documento.png (rehecha con nombre inventado)");
}
await navegador.close();
