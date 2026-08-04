import { expect, test } from "@playwright/test";

import es from "../messages/es.json";

/**
 * La subida del comprobante, en el telefono.
 *
 * Es la pantalla mas delicada del sitio para el cliente: acaba de pagar de
 * verdad y tiene que mandar la captura. Si aqui algo falla, el pago queda en
 * el aire. Por eso se prueba entrando de verdad y mirando lo que ve.
 *
 * Se salta sola si no existe la cuenta de prueba en la base local: asi la
 * suite sigue sirviendo en una maquina recien clonada.
 */

const CUENTA = { email: "cliente@prueba.local", clave: "MercatrenPrueba2026" };
const PEDIDO = "MT-000001";

test.describe("Subir el comprobante", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("el cliente ve las dos formas de subir su captura", async ({
    page,
    request,
  }) => {
    // Si la base local no tiene la cuenta de prueba, no hay nada que probar.
    const entrada = await request.post("/datos/auth/sign-in/email", {
      data: { email: CUENTA.email, password: CUENTA.clave },
      failOnStatusCode: false,
    });
    test.skip(
      !entrada.ok(),
      "sin cuenta de prueba en la base local (npm run db:local)",
    );

    await page.goto("/es/entrar");
    /* Por ROL y con el texto de los mensajes, no por etiqueta suelta:
       "Contraseña" también casa con el botón del ojito que hay dentro de la
       casilla, y el texto del botón cambió de "Entrar" a "Iniciar sesión". Las
       dos cosas dejaron esta prueba rota sin que nadie lo viera. */
    await page
      .getByRole("textbox", { name: es.entrar.correo })
      .fill(CUENTA.email);
    await page
      .getByRole("textbox", { name: es.entrar.clave })
      .fill(CUENTA.clave);
    await page.getByRole("button", { name: es.entrar.entrar }).click();

    const respuesta = await page.goto(`/es/pedido/${PEDIDO}`);
    test.skip(
      respuesta?.status() === 404,
      "sin pedido de prueba en la base local",
    );

    // Las dos maneras de mandar la captura, con el pulgar.
    await expect(
      page.getByRole("button", { name: /Tomar foto/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Elegir de mis fotos/i }),
    ).toBeVisible();

    // Sin imagen elegida, no se puede enviar: evita el envio en blanco.
    await expect(
      page.getByRole("button", { name: /Enviar comprobante/i }),
    ).toBeDisabled();
  });
});
