import { expect, test } from "@playwright/test";

import en from "../messages/en.json";
import { DESARROLLADOR, SOCIEDAD } from "../src/lib/sociedad";

/**
 * NADA DE TEXTOS ESCRITOS A MANO EN LAS PRUEBAS.
 *
 * El nombre de la sociedad y el titular en inglés salen de su fuente real
 * (`src/lib/sociedad.ts` y `messages/en.json`). Cuando el abogado mandó escribir
 * "Windoce, LLC" con coma, esta prueba —que buscaba "Windoce LLC"— tumbó la
 * publicación entera. Leyéndolo de la fuente, un cambio de copy no puede
 * volver a dejar el sitio sin publicar.
 */

/**
 * La direccion raiz no tiene idioma: el sitio mira el idioma del navegador y
 * manda al visitante a /es o a /en. Por eso cada grupo fija el idioma del
 * navegador antes de abrir la pagina.
 *
 * OJO: el idioma principal es el INGLES. Mercatren cobra en Estados Unidos,
 * asi que quien llega sin senal clara ve el sitio en ingles; el espanol sale
 * cuando el navegador lo pide.
 */

test.describe("Visitante con el navegador en espanol", () => {
  test.use({ locale: "es-US" });

  test("la raiz lo lleva al sitio en espanol y ve el buscador", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/es$/);
    // El buscador se anuncia como "combobox" y no como "searchbox" porque
    // sugiere productos mientras se escribe: esa es la figura correcta para
    // un campo con lista de sugerencias.
    await expect(page.getByRole("combobox", { name: /Buscar/ })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Compra en Estados Unidos/i,
    );
  });

  test("el selector cambia el sitio a ingles", async ({ page }) => {
    await page.goto("/es");

    // El selector es una sola casilla que abre un panel, como en las tiendas
    // grandes: primero se abre, despues se elige.
    await page.getByRole("button", { name: "Idioma" }).click();
    await page.getByRole("button", { name: /Inglés — EN/ }).click();

    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      en.inicio.tituloHero,
    );
  });

  /**
   * EL PIE NOMBRA A DOS EMPRESAS DISTINTAS, Y ESA ES LA PRUEBA.
   *
   * Hasta el 12 de agosto de 2026 la tienda la operaba Windoce, LLC, que es
   * además quien programa el sitio. Al ser la misma, esta prueba buscaba un
   * enlace llamado `SITIO.sociedad` apuntando a windoce.com — y funcionaba de
   * casualidad.
   *
   * Ese día la tienda pasó a Mercatren LLC y la prueba se puso roja buscando un
   * enlace «Mercatren LLC» hacia windoce.com, que no existe ni debe existir.
   * **Tumbó la publicación del cambio de sociedad.**
   *
   * Ahora comprueba lo que de verdad importa: que quien OPERA y quien PROGRAMA
   * salen los dos, por separado y cada uno en su sitio.
   */
  test("el pie distingue quien opera la tienda de quien la programa", async ({
    page,
  }) => {
    await page.goto("/es");

    // El crédito del desarrollador: es el enlace, y va a windoce.com.
    const credito = page.getByRole("link", { name: DESARROLLADOR.nombre });
    await expect(credito).toBeVisible();
    await expect(credito).toHaveAttribute("href", DESARROLLADOR.sitio);
    await expect(credito).toHaveAttribute("target", "_blank");

    // Y la sociedad que opera, que es otra cosa y no es un enlace.
    await expect(page.getByRole("contentinfo")).toContainText(SOCIEDAD.nombre);
  });
});

test.describe("Visitante con el navegador en ingles", () => {
  test.use({ locale: "en-US" });

  test("la raiz lo lleva al sitio en ingles", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      en.inicio.tituloHero,
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
