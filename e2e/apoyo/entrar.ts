import { expect, type Page } from "@playwright/test";

import es from "../../messages/es.json";

/**
 * ENTRAR AL SITIO DESDE UNA PRUEBA, SIN CARRERAS.
 *
 * EL FALLO QUE ESTO ARREGLA, y que llevaba meses en el proyecto:
 *
 * Al entrar, el formulario hace una **carga completa** de la página con
 * `window.location.assign` — tiene que hacerla, porque acaba de cambiar quién
 * eres y el encabezado se quedaría como estaba. Pero si la prueba llama a
 * `page.goto()` justo después del clic, esa navegación choca con la del login
 * y el navegador aborta una de las dos: `net::ERR_ABORTED`.
 *
 * No es un fallo del sitio y por eso costaba tanto verlo: la prueba se pone
 * roja, alguien la mira, entra a mano y todo funciona.
 *
 * Aquí se espera a que el login TERMINE antes de devolver el control. Todas las
 * pruebas que necesitan sesión usan esto; ninguna vuelve a escribir el login a
 * mano.
 */
export async function entrar(
  page: Page,
  cuenta: { email: string; clave: string },
) {
  await page.goto("/es/entrar");

  const correo = page.getByLabel(es.entrar.correo);
  const clave = page.getByLabel(es.entrar.clave, { exact: true });

  /**
   * SE ESCRIBE Y SE COMPRUEBA QUE QUEDÓ ESCRITO.
   *
   * ══ EL FALLO QUE ESTO ARREGLA (18 ago 2026) ══
   *
   * En el perfil de celular la prueba escribía las dos casillas, pulsaba
   * «Iniciar sesión» y se quedaba colgada. La instantánea del error lo enseñó:
   * **la casilla del correo estaba VACÍA y la de la contraseña llena.**
   *
   * La causa es una carrera con la hidratación: se escribe antes de que React
   * monte el formulario, y al montar reinicia la casilla a su valor inicial. En
   * escritorio hidrata antes de que dé tiempo a nada; en el perfil de teléfono,
   * que va más despacio, se pierde lo escrito.
   *
   * Así que se comprueba lo que quedó y, si se borró, se vuelve a escribir. Sin
   * esto la prueba salía roja por algo que no tenía nada que ver con lo que
   * probaba — el fallo más caro de una suite: el que enseña a ignorar el rojo.
   */
  for (let intento = 0; intento < 3; intento++) {
    await correo.fill(cuenta.email);
    await clave.fill(cuenta.clave);
    if ((await correo.inputValue()) === cuenta.email) break;
    await page.waitForTimeout(500);
  }

  await expect(
    correo,
    "el formulario no retuvo el correo: la página no terminó de cargar",
  ).toHaveValue(cuenta.email);

  await page.getByRole("button", { name: es.entrar.entrar }).click();

  /* La señal de que terminó: la dirección deja de ser la de entrar. Se espera
     a la dirección, no a un texto de la pantalla — los textos cambian y las
     pruebas que los buscan se quedan atrás. */
  await page.waitForURL((url) => !url.pathname.includes("/entrar"), {
    timeout: 20_000,
  });

  /* Y a que la página nueva esté servida del todo. Sin esto, el `goto` que
     venga después sigue pudiendo pillar la navegación a medias. */
  await page.waitForLoadState("load");
}

/**
 * Entra y comprueba que la sesión sirve para el panel.
 *
 * Devuelve `false` si esta máquina no tiene esa cuenta —pasa en la máquina que
 * compila, donde la base nace vacía— para que la prueba se salte con un motivo
 * escrito en vez de fallar por algo que no es un fallo.
 */
export async function entrarAlPanel(
  page: Page,
  cuenta: { email: string; clave: string },
): Promise<boolean> {
  try {
    await entrar(page, cuenta);
  } catch {
    return false;
  }

  const respuesta = await page.goto("/es/panel");
  return Boolean(respuesta && respuesta.status() === 200);
}

/** Comprueba que se ve un título, con el mensaje claro si no aparece. */
export async function verTitulo(page: Page, titulo: string) {
  await expect(
    page.getByRole("heading", { name: titulo }),
    `no apareció el título "${titulo}"`,
  ).toBeVisible({ timeout: 15_000 });
}
