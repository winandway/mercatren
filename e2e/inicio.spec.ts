import { expect, test } from "@playwright/test";

/**
 * La direccion raiz no tiene idioma: el sitio mira el idioma del navegador y
 * manda al visitante a /es o a /en. Por eso cada grupo fija el idioma del
 * navegador antes de abrir la pagina.
 */

test.describe("Visitante con el navegador en espanol", () => {
  test.use({ locale: "es-US" });

  test("la raiz lo lleva al sitio en espanol y ve el buscador", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/es$/);
    await expect(page.getByRole("searchbox")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Compra en Estados Unidos/i,
    );
  });

  test("el selector cambia el sitio a ingles", async ({ page }) => {
    await page.goto("/es");
    await page.getByRole("button", { name: "Inglés" }).click();

    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Shop in the U\.S\./i,
    );
  });

  test("el pie de pagina lleva el credito de Windoce LLC", async ({ page }) => {
    await page.goto("/es");

    const credito = page.getByRole("link", { name: "Windoce LLC" });
    await expect(credito).toBeVisible();
    await expect(credito).toHaveAttribute("href", "https://windoce.com");
    await expect(credito).toHaveAttribute("target", "_blank");
  });
});

test.describe("Visitante con el navegador en ingles", () => {
  test.use({ locale: "en-US" });

  test("la raiz lo lleva al sitio en ingles", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Shop in the U\.S\./i,
    );
  });

  test("no queda ningun texto sin traducir en la pagina", async ({ page }) => {
    await page.goto("/en");

    // Si falta una traduccion, next-intl imprime la clave cruda,
    // por ejemplo "inicio.tituloHero".
    const cuerpo = await page.locator("body").innerText();
    expect(cuerpo).not.toMatch(/\b(inicio|encabezado|piePagina)\.[a-zA-Z]+/);
  });
});
