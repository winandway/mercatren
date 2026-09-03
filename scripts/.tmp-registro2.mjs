import { chromium } from "playwright";
const OUT =
  "/private/tmp/claude-501/-Users-windocellc-Mercatren-com/a85ff6c9-de4e-4d39-8747-7ca310c85658/scratchpad/prueba";
const S = Date.now().toString(36).slice(-6);
const CORREO = `soporte+p${S}@mercatren.com`;
const CLAVE = `MercatrenPrueba${S}Larga!`;
const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 },
  locale: "es-US",
});
const page = await ctx.newPage();
page.setDefaultTimeout(60000);
const red = [];
page.on("request", (r) => {
  if (r.url().includes("/datos/auth"))
    red.push(`→ ${r.method()} ${r.url().replace("https://mercatren.com", "")}`);
});
page.on("response", async (r) => {
  if (r.url().includes("/datos/auth"))
    red.push(
      `← ${r.status()} ${(await r.text().catch(() => "")).slice(0, 220)}`,
    );
  else if (r.status() >= 400 && !r.url().includes("favicon"))
    red.push(`← ${r.status()} ${r.url().slice(0, 90)}`);
});
console.log("correo:", CORREO);
await page.goto("https://mercatren.com/es/registro", {
  waitUntil: "networkidle",
});
await page.waitForTimeout(1500);
const f = page.locator("form").nth(1);
await f.locator('input[name="nombre"]').fill("Soporte Pruebas");
await f.locator('input[name="correo"]').fill(CORREO);
await f.locator('input[name="clave"]').fill(CLAVE);
await f.locator('input[type="checkbox"]').check();
await page.waitForTimeout(3500);
await page.screenshot({ path: `${OUT}/r1.png`, fullPage: true });
await f.getByRole("button", { name: /crear cuenta/i }).click();
await page.waitForTimeout(9000);
console.log("URL tras enviar:", page.url());
console.log(
  "formulario dice:",
  (await f.innerText().catch(() => "(el formulario ya no está)"))
    .replace(/\s+/g, " ")
    .slice(0, 400),
);
console.log(
  "pantalla:",
  (await page.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 300),
);
const ses = await page.evaluate(async () => {
  const r = await fetch("/datos/auth/get-session", { credentials: "include" });
  return `${r.status} ${(await r.text()).slice(0, 150)}`;
});
console.log("sesión:", ses);
await page.screenshot({ path: `${OUT}/r2.png`, fullPage: true });
console.log("── red ──");
console.log(red.join("\n") || "(nada a /datos/auth)");
await b.close();
