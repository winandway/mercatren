import { chromium } from "playwright";
const S = Date.now().toString(36).slice(-6);
const b = await chromium.launch();
const ctx = await b.newContext();
const page = await ctx.newPage();
page.setDefaultTimeout(60000);
await page.goto("https://mercatren.com/es", { waitUntil: "domcontentloaded" });
await page.evaluate(
  async ({ correo, clave }) => {
    await fetch("/datos/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: "Soporte Pruebas",
        email: correo,
        password: clave,
      }),
    });
  },
  {
    correo: `soporte+o${S}@mercatren.com`,
    clave: `veintidos gatos bailan sobre el tejado ${S}`,
  },
);
const cs = await ctx.cookies("https://mercatren.com");
for (const c of cs) {
  const cad =
    c.expires === -1 ? "de sesión" : new Date(c.expires * 1000).toISOString();
  console.log(
    `${c.name}: caduca ${cad} | secure=${c.secure} httpOnly=${c.httpOnly} sameSite=${c.sameSite} dominio=${c.domain} path=${c.path}`,
  );
}
console.log("ahora:", new Date().toISOString());
