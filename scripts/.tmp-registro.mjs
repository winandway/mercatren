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
      `← ${r.status()} ${r.url().replace("https://mercatren.com", "")} ${(await r.text().catch(() => "")).slice(0, 180)}`,
    );
  else if (r.status() >= 400 && !r.url().includes("favicon"))
    red.push(`← ${r.status()} ${r.url().slice(0, 90)}`);
});
await page.goto("https://mercatren.com/es/registro", {
  waitUntil: "networkidle",
});
await page.waitForTimeout(2000);
const campos = await page
  .locator("form input")
  .evaluateAll((els) =>
    els.map((e) => `${e.name || "(sin nombre)"}:${e.type}`),
  );
console.log("campos del formulario:", campos.join("  "));
const etiquetas = await page.locator("form label").allInnerTexts();
console.log("etiquetas:", etiquetas.join(" | "));
// llenar por posición dentro del formulario
const ins = page.locator("form input:visible");
const total = await ins.count();
for (let i = 0; i < total; i++) {
  const tipo = await ins.nth(i).getAttribute("type");
  const nombre = (await ins.nth(i).getAttribute("name")) ?? "";
  if (tipo === "email" || /correo|email/i.test(nombre))
    await ins.nth(i).fill(CORREO);
  else if (tipo === "password") await ins.nth(i).fill(CLAVE);
  else if (tipo === "text") await ins.nth(i).fill("Soporte Pruebas");
}
await page.waitForTimeout(3500); // Turnstile
await page.screenshot({ path: `${OUT}/r1-lleno.png`, fullPage: true });
const botones = await page
  .locator("form button, form input[type=submit]")
  .allInnerTexts();
console.log("botones:", botones.join(" | "));
await page.locator("form button[type=submit], form button").last().click();
await page.waitForTimeout(8000);
console.log("URL:", page.url());
const cuerpo = (await page.locator("form").innerText()).replace(/\s+/g, " ");
console.log("formulario dice:", cuerpo.slice(0, 500));
const sesion = await page.evaluate(async () => {
  const r = await fetch("/datos/auth/get-session", { credentials: "include" });
  return `${r.status} ${(await r.text()).slice(0, 120)}`;
});
console.log("sesión:", sesion);
await page.screenshot({ path: `${OUT}/r2-tras-enviar.png`, fullPage: true });
console.log("── red ──");
console.log(red.join("\n") || "(no hubo llamadas a /datos/auth)");
await b.close();
