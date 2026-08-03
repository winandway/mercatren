import { expect, test } from "@playwright/test";

/**
 * El panel muestra dinero real de comercios y datos de quienes pagaron.
 * Estas pruebas cuidan que no se pueda mirar sin permiso.
 */

test.describe("Panel sin sesion", () => {
  test.use({ locale: "es-US" });

  const RUTAS = [
    "/es/panel",
    "/es/panel/pagos-zelle",
    "/es/panel/validacion",
    "/es/panel/clientes",
  ];

  for (const ruta of RUTAS) {
    test(`${ruta} manda a la pantalla de entrar`, async ({ page }) => {
      await page.goto(ruta);
      await expect(page).toHaveURL(/\/es\/entrar/);
      await expect(
        page.getByRole("heading", { level: 1, name: "Entrar" }),
      ).toBeVisible();
    });
  }

  test("no se filtra ningun dato de los pagos en la respuesta", async ({
    request,
  }) => {
    const respuesta = await request.get("/es/panel/pagos-zelle", {
      maxRedirects: 0,
    });

    expect(respuesta.status()).toBe(307);
    expect(respuesta.headers().location).toContain("/es/entrar");

    const cuerpo = await respuesta.text();
    // Ni montos, ni nombres de comercios, ni direcciones de comprobantes.
    expect(cuerpo).not.toContain("337,261");
    expect(cuerpo).not.toContain("Bley");
    expect(cuerpo).not.toContain("income-receipts");
  });
});
