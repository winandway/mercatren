import { chromium } from "playwright";
const OUT =
  "/private/tmp/claude-501/-Users-windocellc-Mercatren-com/a85ff6c9-de4e-4d39-8747-7ca310c85658/scratchpad/prueba";
const SUFIJO = Date.now().toString(36).slice(-6);
const CORREO = `soporte+prueba${SUFIJO}@mercatren.com`;
const CLAVE = `PruebaMercatren${SUFIJO}!Larga`;
const PRODUCTO =
  "https://mercatren.com/es/producto/usb-c-charger-block-charger-block-24w-pd-power-adapter-529858";

const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 },
  locale: "es-US",
});
const page = await ctx.newPage();
page.setDefaultTimeout(60000);
const errores = [];
page.on("pageerror", (e) => errores.push("JS: " + String(e).slice(0, 160)));
page.on("response", (r) => {
  if (r.status() >= 400 && !r.url().includes("favicon"))
    errores.push(`${r.status()} ${r.url().slice(0, 110)}`);
});

console.log("correo de prueba:", CORREO);

// 1. REGISTRO
await page.goto("https://mercatren.com/es/registro", {
  waitUntil: "domcontentloaded",
});
await page.screenshot({ path: `${OUT}/1-registro.png` });
const campos = await page
  .locator("input:visible")
  .evaluateAll((els) => els.map((e) => `${e.getAttribute("name")}|${e.type}`));
console.log("campos:", campos.join("  "));
await page
  .fill('input[name="nombre"], input[name="name"]', "Soporte Pruebas")
  .catch(() => {});
await page.fill('input[type="email"]', CORREO);
const claves = page.locator('input[type="password"]');
const n = await claves.count();
for (let i = 0; i < n; i++) await claves.nth(i).fill(CLAVE);
await page.waitForTimeout(2500); // que Turnstile emita su pase
await page.screenshot({ path: `${OUT}/2-registro-lleno.png` });
await page
  .getByRole("button", { name: /crear|registr|sign/i })
  .first()
  .click();
await page.waitForTimeout(6000);
console.log("tras registrar → URL:", page.url());
const texto1 = (await page.locator("body").innerText())
  .replace(/\s+/g, " ")
  .slice(0, 400);
console.log("pantalla:", texto1);
await page.screenshot({ path: `${OUT}/3-tras-registro.png` });

// 2. ¿QUEDÓ LA SESIÓN?
const sesion = await page.evaluate(async () => {
  const r = await fetch("/datos/auth/get-session", { credentials: "include" });
  return `${r.status} ${(await r.text()).slice(0, 200)}`;
});
console.log("sesión:", sesion);

// 3. AL PRODUCTO Y AL CARRITO
await page.goto(PRODUCTO, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
const botonCarrito = page
  .getByRole("button", { name: /agregar|añadir|add/i })
  .first();
console.log(
  "botón de agregar visible:",
  await botonCarrito.isVisible().catch(() => false),
);
await botonCarrito
  .click()
  .catch((e) => console.log("no se pudo pulsar:", String(e).slice(0, 90)));
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/4-producto.png` });

// 4. CHECKOUT
await page.goto("https://mercatren.com/es/checkout", {
  waitUntil: "domcontentloaded",
});
await page.waitForTimeout(3000);
console.log("checkout → URL:", page.url());
const texto2 = (await page.locator("body").innerText())
  .replace(/\s+/g, " ")
  .slice(0, 700);
console.log("checkout dice:", texto2);
await page.screenshot({ path: `${OUT}/5-checkout.png`, fullPage: true });

console.log("── incidencias ──");
console.log(errores.slice(0, 12).join("\n") || "(ninguna)");
await b.close();
