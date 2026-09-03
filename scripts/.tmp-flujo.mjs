import { chromium } from "playwright";
const OUT =
  "/private/tmp/claude-501/-Users-windocellc-Mercatren-com/a85ff6c9-de4e-4d39-8747-7ca310c85658/scratchpad/prueba";
const S = Date.now().toString(36).slice(-6);
const CORREO = `soporte+p${S}@mercatren.com`;
const CLAVE = `veintidos gatos bailan sobre el tejado ${S}`;
const PRODUCTO =
  "https://mercatren.com/es/producto/usb-c-charger-block-charger-block-24w-pd-power-adapter-529858";
const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 },
  locale: "es-US",
});
const page = await ctx.newPage();
page.setDefaultTimeout(60000);
const red = [];
page.on("response", async (r) => {
  const u = r.url();
  if (u.includes("/datos/auth") && !u.includes("get-session"))
    red.push(
      `← ${r.status()} ${u.replace("https://mercatren.com", "")} ${(await r.text().catch(() => "")).slice(0, 200)}`,
    );
  else if (r.status() >= 400 && !u.includes("favicon"))
    red.push(`← ${r.status()} ${u.slice(0, 100)}`);
});
console.log("correo:", CORREO);
await page.goto("https://mercatren.com/es/registro", {
  waitUntil: "networkidle",
});
await page.waitForTimeout(1200);
const f = page.locator("form").nth(1);
await f.locator('input[name="nombre"]').fill("Soporte Pruebas");
await f.locator('input[name="correo"]').fill(CORREO);
await f.locator('input[name="clave"]').fill(CLAVE);
await f.locator('input[type="checkbox"]').check();
await page.waitForTimeout(3500);
await f.getByRole("button", { name: /crear cuenta/i }).click();
await page.waitForTimeout(9000);
console.log("1) tras registrar → URL:", page.url());
const ses1 = await page.evaluate(async () => {
  const r = await fetch("/datos/auth/get-session", { credentials: "include" });
  const t = await r.text();
  return t === "null" ? "SIN SESIÓN" : "CON SESIÓN";
});
console.log("   sesión:", ses1);
if (ses1 === "SIN SESIÓN") {
  const txt = await f.innerText().catch(() => "");
  console.log("   el formulario dice:", txt.replace(/\s+/g, " ").slice(0, 300));
}
await page.screenshot({ path: `${OUT}/f1-registro.png`, fullPage: true });

// producto → carrito
await page.goto(PRODUCTO, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
await page
  .getByRole("button", { name: /agregar al carrito|agregar/i })
  .first()
  .click()
  .catch((e) => console.log("   agregar falló:", String(e).slice(0, 80)));
await page.waitForTimeout(2500);
console.log(
  "2) carrito:",
  (await page.locator("header").innerText()).replace(/\s+/g, " ").slice(0, 60),
);

// checkout
await page.goto("https://mercatren.com/es/checkout", {
  waitUntil: "domcontentloaded",
});
await page.waitForTimeout(3500);
const t = (await page.locator("main").innerText()).replace(/\s+/g, " ");
console.log("3) checkout:", t.slice(0, 500));
await page.screenshot({ path: `${OUT}/f2-checkout.png`, fullPage: true });
console.log("── incidencias de red ──");
console.log(red.join("\n") || "(ninguna)");
await b.close();
