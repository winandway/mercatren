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
await page.screenshot({
  path: `${OUT}/2-datos-empresa.png`,
  fullPage: true,
  clip: { x: 0, y: yTitulo - 16, width: 390, height: 620 },
});
console.log("✓ 2-datos-empresa.png");
await navegador.close();
