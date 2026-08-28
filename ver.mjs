import { chromium } from "@playwright/test";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1000, height: 1200 } });

await p.goto("http://localhost:3000/es/entrar", { waitUntil: "networkidle" });
await p.getByLabel("Correo electrónico").fill("soporte@prueba.local");
await p.locator('input[type="password"]').first().fill("MercatrenPrueba2026");
await p
  .getByRole("button", { name: /iniciar sesión|entrar/i })
  .first()
  .click();
await p.waitForURL(/panel|cuenta/, { timeout: 20000 }).catch(() => {});

// 1) Configuración: tasas y F129
await p.goto("http://localhost:3000/es/panel/configuracion", {
  waitUntil: "networkidle",
});
const t1 = await p.locator("body").innerText();
console.log(
  "tasas del dólar:",
  t1.includes("La tasa del dólar (Chile y Colombia)") ? "SÍ" : "NO",
);
console.log("F129:", t1.includes("resumen para el F129") ? "SÍ" : "NO");
console.log(
  "sin ventas chilenas:",
  t1.includes("no hay nada que declarar") ? "SÍ" : "NO",
);

// 2) guardar la tasa de Chile
const formCl = p
  .locator("form")
  .filter({ hasText: "Chile · pesos chilenos" })
  .first();
await formCl.locator('input[name="tasa"]').fill("967.42");
await formCl.getByRole("button", { name: "Guardar" }).click();
await p.waitForTimeout(1500);
const t2 = await p.locator("body").innerText();
console.log(
  "tasa guardada:",
  t2.includes("Tasa guardada") || t2.includes("Última actualización")
    ? "SÍ"
    : "NO",
);

// 3) el catálogo de CJ avisa la plaza al cambiar el selector a Chile
const selector = p
  .locator("select")
  .filter({ hasText: "Estados Unidos" })
  .first();
await selector.selectOption({ label: "Chile" }).catch(async () => {
  const s2 = p.locator('select[name="mercado"], select#mercado').first();
  await s2.selectOption({ index: 1 }).catch(() => {});
});
await p.waitForTimeout(1200);
await p.goto("http://localhost:3000/es/panel/catalogo-usa", {
  waitUntil: "networkidle",
});
const t3 = await p.locator("body").innerText();
console.log(
  "aviso de plaza en el catálogo:",
  t3.includes("mercatren.cl") ? "SÍ" : "NO",
);
await p.screenshot({ path: "/tmp/catalogo-cl.png" });
await b.close();
