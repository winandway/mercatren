import { expect, test } from "@playwright/test";

import { entrar } from "./apoyo/entrar";
import es from "../messages/es.json";

/**
 * PEDIR UNA DEVOLUCIÓN, DE PUNTA A PUNTA.
 *
 * ══ LO QUE ESTA PRUEBA PROTEGE ══
 *
 * **Que la dirección de devolución no exista en la página hasta que el trámite
 * esté abierto.** Es la regla entera del módulo, y es de las que se rompen sin
 * hacer ruido: basta que alguien la ponga en un componente «para tenerla a
 * mano» y quede dibujada, aunque esté escondida con CSS. Desde fuera se ve
 * igual; en el código fuente está a la vista de cualquiera.
 *
 * Y todo esto existe porque **esa dirección va a cambiar**: publicada se copia,
 * se reenvía y se queda circulando, y el día que cambie seguirán llegando cajas
 * a un sitio donde ya no hay nadie que las reciba.
 *
 * Se salta sola si la base local no tiene la cuenta o el pedido de prueba, para
 * que la suite siga sirviendo en una máquina recién clonada.
 */

const CUENTA = { email: "cliente@prueba.local", clave: "MercatrenPrueba2026" };
const PEDIDO = "MT-000001";

/**
 * El bloque donde sale la dirección. Se busca por identificador, y hubo que
 * llegar hasta aquí por dos fallos que solo se vieron probando en ROJO:
 *
 * 1. Buscar el texto visible (`toContainText`) **no ve lo que está escondido
 *    con CSS**, que es justo como se colaría: nadie escribe la dirección a la
 *    vista, se cuela «para tenerla a mano» dentro de un `display:none`.
 * 2. Buscar la ETIQUETA en el HTML tampoco sirve: next-intl manda el paquete
 *    de idiomas entero al navegador, así que «Mándalo a esta dirección» está
 *    en TODAS las páginas aunque no se dibuje nada.
 *
 * (Y de paso, la primera expresión regular estaba mal escrita —`Mand[áa]lo`
 * cuando la palabra es «M-á-ndalo»— así que no casaba con nada y la prueba
 * pasaba siempre. Por eso una prueba nunca lleva textos escritos a mano.)
 *
 * Lo que de verdad importa es que **el bloque no se dibuje**. Que la dirección
 * no esté escrita en ningún archivo de `src/` lo vigila aparte
 * `tests/unit/direccion-devolucion.test.ts`, que es donde se puede mirar el
 * código fuente de verdad.
 */
const BLOQUE_DIRECCION = "[data-testid=direccion-devolucion]";

test.describe("Devolver un pedido", () => {
  /**
   * UNA SOLA PRUEBA, CON UN SOLO LOGIN.
   *
   * Eran dos y cada una entraba por su cuenta. En el perfil de celular el
   * segundo login se quedaba colgado y la prueba salía roja por algo que no
   * tenía nada que ver con las devoluciones — el fallo más caro de una suite:
   * el que enseña a ignorar el rojo.
   *
   * Las dos cosas que se comprueban ocurren en la misma pantalla y con el mismo
   * pedido, así que no hay motivo para entrar dos veces.
   */
  test("la dirección no aparece hasta pedirla, y las fotos solo cuando hacen falta", async ({
    page,
  }) => {
    /**
     * SI NO HAY CUENTA DE PRUEBA, SE SALTA. NO SE CAE.
     *
     * En la máquina que compila la base nace vacía, así que el login no lleva a
     * ninguna parte y `entrar()` revienta por tiempo agotado. **Esta prueba
     * tumbó una publicación entera por eso**, que es exactamente el fallo del
     * que avisa el proyecto: una prueba que se cae por algo que no es un fallo
     * del producto deja el sitio sin recibir nada mientras todo parece normal.
     *
     * Es el mismo patrón que ya usa `entrarAlPanel`.
     */
    const entro = await entrar(page, CUENTA)
      .then(() => true)
      .catch(() => false);
    test.skip(!entro, "sin cuenta de prueba en la base local (npm run db:local)");

    const respuesta = await page.goto(`/es/pedido/${PEDIDO}`);
    test.skip(
      respuesta?.status() === 404,
      "sin pedido de prueba en la base local",
    );

    /* Por el `summary`, no por el texto suelto: `getByText` con la frase entera
       casa también con el `<details>` que la contiene, y ahí `isVisible` da
       falso — la prueba se saltaba sola sin fallar, que es la peor forma de no
       probar nada. Y se ESPERA, no se pregunta una vez: preguntar corre antes
       de que la página hidrate. */
    const bloque = page
      .locator("summary")
      .filter({ hasText: es.pedido.devolver.abrir });

    const hayBloque = await bloque
      .waitFor({ state: "visible", timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    test.skip(!hayBloque, "el pedido de prueba no está pagado");

    await bloque.click();
    await expect(page.getByText(es.pedido.devolver.porQue)).toBeVisible();

    /* LO QUE IMPORTA: el bloque de la dirección NO existe todavía. */
    await expect(page.locator(BLOQUE_DIRECCION)).toHaveCount(0);

    /**
     * Y las fotos solo cuando el motivo las necesita.
     *
     * De algo que NO llegó no hay foto que sacar. Pedirla ahí es una pared
     * donde no hay nada que comprobar: la persona se queda mirando un
     * formulario que no puede completar y termina llamando al banco, que es el
     * camino al contracargo.
     */
    const foto = page.locator('input[type="file"]');

    await page
      .getByRole("radio", { name: es.pedido.devolver.motivos.noLlego })
      .check();
    await expect(foto).toHaveCount(0);

    await page
      .getByRole("radio", { name: es.pedido.devolver.motivos.llegoDanado })
      .check();
    await expect(foto).toHaveCount(1);

    /* Lista ABIERTA, nunca cerrada: el HEIC es el formato por defecto del
       iPhone, y con una lista de tipos el carrete se le ve en gris a media
       clientela. Ya pasó con las fotos de producto. */
    await expect(foto).toHaveAttribute("accept", "image/*");

    /* Y sigue sin haber dirección: llenar el formulario no la revela. */
    await expect(page.locator(BLOQUE_DIRECCION)).toHaveCount(0);
  });
});
