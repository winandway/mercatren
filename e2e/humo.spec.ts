import { expect, test } from "@playwright/test";

/**
 * LA PRUEBA DE HUMO: ¿el sitio está de pie?
 *
 * Es la red mínima. No comprueba que las páginas digan lo correcto —de eso se
 * encargan las otras—, solo que **respondan 200**. Si algo tumba la aplicación
 * entera (un import mal puesto, una variable de entorno que falta, una consulta
 * que revienta), salta aquí antes de publicar.
 *
 * Se escribió el 6 ago 2026 como parte del blindaje. Hasta ese día, la única
 * forma de enterarse de que una página se había caído era que la abriera una
 * persona.
 *
 * NO LLEVA NI UN TEXTO DE LA INTERFAZ. Solo códigos de respuesta, que no
 * cambian cuando alguien reescribe un título. Cuatro publicaciones seguidas se
 * cayeron en agosto porque las pruebas buscaban textos que habían cambiado.
 */

/** Las páginas que ve el público, en los dos idiomas. */
const PAGINAS = [
  "/es",
  "/en",
  "/es/catalogo",
  "/en/catalogo",
  "/es/docs",
  "/en/docs",
  "/es/docs/modelo-de-negocio",
  "/es/como-funciona",
  "/es/transparencia",
  "/es/ayuda",
  "/es/vender",
  "/es/entrega",
  "/es/devoluciones",
  "/es/entrar",
  "/es/registro",
  "/es/olvide-mi-clave",
];

/**
 * Las direcciones que leen las máquinas. Son las más fáciles de romper sin
 * darse cuenta, porque nadie las abre a mano — y son justo de las que depende
 * que Google publique los productos.
 */
const PARA_MAQUINAS = [
  "/sitemap.xml",
  "/robots.txt",
  // El catálogo que lee Google Merchant Center. Si esto deja de responder, los
  // productos se caen de Google y no se entera nadie.
  "/datos/google",
  "/manifest.webmanifest",
];

test.describe("el sitio está de pie", () => {
  /* Igual que en la prueba de enlaces: el servidor de desarrollo compila cada
     ruta la primera vez que se la piden. Con veinte rutas, la primera corrida
     son veinte compilaciones. */
  test.setTimeout(180_000);

  test("las páginas del público responden 200", async ({ page, baseURL }) => {
    const caidas: string[] = [];

    for (const ruta of PAGINAS) {
      const respuesta = await page.request.get(`${baseURL}${ruta}`, {
        maxRedirects: 5,
      });
      if (respuesta.status() !== 200) {
        caidas.push(`${ruta} → ${respuesta.status()}`);
      }
    }

    expect(caidas, "páginas que no respondieron 200").toEqual([]);
  });

  test("las direcciones que leen las máquinas responden 200", async ({
    page,
    baseURL,
  }) => {
    const caidas: string[] = [];

    for (const ruta of PARA_MAQUINAS) {
      const respuesta = await page.request.get(`${baseURL}${ruta}`, {
        maxRedirects: 5,
      });
      if (respuesta.status() !== 200) {
        caidas.push(`${ruta} → ${respuesta.status()}`);
      }
    }

    expect(caidas, "direcciones de máquina caídas").toEqual([]);
  });

  test("el catálogo de Google trae productos de verdad", async ({
    page,
    baseURL,
  }) => {
    /* Responder 200 con un archivo vacío sería igual de malo que no responder:
       Google lo leería sin quejarse y borraría todos los productos. */
    const respuesta = await page.request.get(`${baseURL}/datos/google`);
    const xml = await respuesta.text();

    const productos = (xml.match(/<item>/g) ?? []).length;
    expect(productos, "el catálogo de Google salió vacío").toBeGreaterThan(0);
  });

  test("el panel no se abre sin sesión", async ({ page, baseURL }) => {
    /* Ahí adentro hay dinero de comercios y datos de quienes pagaron. Sin
       sesión tiene que mandar a la pantalla de entrar, no abrirse ni reventar
       con un error del servidor. */
    const respuesta = await page.request.get(`${baseURL}/es/panel`, {
      maxRedirects: 0,
    });

    expect(
      respuesta.status(),
      "el panel debería redirigir, no responder directo",
    ).toBeGreaterThanOrEqual(300);
    expect(respuesta.status()).toBeLessThan(400);
  });
});
