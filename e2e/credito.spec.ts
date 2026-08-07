import { expect, test } from "@playwright/test";

import es from "../messages/es.json";
import { entrarAlPanel, verTitulo } from "./apoyo/entrar";

/**
 * EL MÓDULO DE CRÉDITO, PROBADO DE PUNTA A PUNTA.
 *
 * Se entra como un comercio de verdad, se le da cupo a un cliente, se comprueba
 * que los números salen bien en pantalla y **al final se borra lo que se creó**.
 * Una prueba que deja basura en la base ensucia las siguientes y un día alguien
 * ve un crédito de mentira en una pantalla real.
 *
 * NI UN TEXTO ESCRITO A MANO: todos salen de `messages/es.json`. Cuando el
 * título de una pantalla cambió, las pruebas que buscaban el texto viejo
 * tumbaron cuatro publicaciones seguidas sin que nadie lo notara.
 */

/**
 * Se entra con la cuenta del equipo y se mira el comercio piloto con
 * `?comercio=`. En esta máquina la tienda de prueba no tiene dueño asignado,
 * así que entrar como vendedor manda a "abre tu tienda" — que es, por cierto,
 * exactamente lo que le pasó a MEGAYES en producción.
 */
const CUENTA = { email: "soporte@prueba.local", clave: "MercatrenPrueba2026" };
const COMERCIO_PILOTO = "tienda-bley-ferreteria";
const T = es.panel.creditos;

test.describe("Crédito del comercio a su cliente", () => {
  /* Como la de enlaces: el servidor de desarrollo compila cada ruta la primera
     vez que se la piden, y aquí se recorren varias. */
  test.setTimeout(180_000);

  test("el comercio da un cupo, lo ve y lo quita", async ({ page }) => {
    // ── Entrar ────────────────────────────────────────────────────────────
    const dentro = await entrarAlPanel(page, CUENTA);
    test.skip(!dentro, "esta máquina no tiene la cuenta de prueba");

    // ── La pantalla de créditos ───────────────────────────────────────────
    await page.goto(`/es/panel/creditos?comercio=${COMERCIO_PILOTO}`);
    await verTitulo(page, T.titulo);

    // ── Dar el cupo ───────────────────────────────────────────────────────
    const botonDar = page.getByRole("button", { name: T.darCredito });
    test.skip(
      await botonDar.isDisabled(),
      "esta tienda no tiene clientes a los que darles crédito",
    );
    await botonDar.click();

    // El aviso legal tiene que estar A LA VISTA antes de guardar: lo pidió el
    // abogado, y escondido no serviría de nada.
    await expect(page.getByText(T.avisoLegal)).toBeVisible();

    // Se elige el primer cliente que ofrezca la lista.
    const selector = page.locator('select[name="clienteId"]');
    const opciones = await selector.locator("option").all();
    test.skip(opciones.length < 2, "no hay clientes en la base local");
    await selector.selectOption({ index: 1 });

    await page.getByLabel(T.topeLabel).fill("2000");
    await page.getByLabel(T.plazoLabel).fill("30");

    await page.getByRole("button", { name: T.guardar }).click();

    // ── Los números en pantalla ───────────────────────────────────────────
    await expect(page.getByText(es.panel.mensajes.creditoGuardado)).toBeVisible(
      { timeout: 15_000 },
    );

    /* El cupo entero disponible: es un cliente que todavía no compró nada. Si
       este número saliera mal, un comercio le daría mercancía a alguien que no
       tiene cupo. */
    await expect(page.getByText("$2,000.00").first()).toBeVisible();
    await expect(page.getByText(T.activo).first()).toBeVisible();

    // ── Y SE BORRA LO QUE SE CREÓ ─────────────────────────────────────────
    /* Se acepta el `confirm()` del navegador antes de pulsarlo. */
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: T.acciones }).first().click();
    await page.getByRole("menuitem", { name: T.quitar }).click();

    await expect(page.getByText(es.panel.mensajes.creditoQuitado)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("el menú de tres puntos esconde lo destructivo", async ({ page }) => {
    /* Regla del proyecto: quitar un crédito nunca puede ser un botón a la
       vista. En el celular, un toque mal dado le quitaría el cupo a un cliente
       que sí paga. */
    const dentro = await entrarAlPanel(page, CUENTA);
    test.skip(!dentro, "esta máquina no tiene la cuenta de prueba");

    await page.goto(`/es/panel/creditos?comercio=${COMERCIO_PILOTO}`);
    await verTitulo(page, T.titulo);

    // Con el menú cerrado, la opción de quitar no puede estar en la pantalla.
    await expect(page.getByRole("menuitem", { name: T.quitar })).toHaveCount(0);
  });
});
