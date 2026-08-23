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
  /* LO QUE SE LE PUBLICA A LOS AGENTES (23 ago 2026): si una de estas cae, el
     sitio vuelve a ser invisible para las máquinas sin que nadie lo note. */
  "/.well-known/api-catalog",
  "/.well-known/oauth-protected-resource",
  "/.well-known/mcp/server-card.json",
  "/.well-known/agent-skills/index.json",
  "/.well-known/agent-skills/comprar-en-mercatren/SKILL.md",
  "/.well-known/ai-catalog.json",
  "/auth.md",
  "/datos/openapi.json",
  "/datos/salud",
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

    /**
     * PRIMERO SE MIRA SI HAY CATÁLOGO QUE PUBLICAR.
     *
     * En la máquina que compila, la base nace vacía a propósito: los datos
     * reales no viven en el repositorio. Ahí el catálogo de Google sale vacío
     * porque **no hay ni un producto**, no porque algo se haya roto.
     *
     * Sin esta comprobación, esta prueba tumbó la publicación del 6 ago 2026 —
     * y con ella se quedó sin subir el arreglo urgente de un comercio que
     * llevaba una tarde sin poder trabajar. La prueba tenía razón en lo que
     * miraba y estaba equivocada en dónde lo miraba.
     *
     * Es justo el fallo contra el que avisa el CLAUDE.md: una prueba que se
     * pone roja por algo que no es un fallo del sitio deja de publicar sin que
     * nadie lo note.
     */
    const catalogo = await page.request.get(`${baseURL}/datos/catalogo`);
    const datos = (await catalogo.json()) as { productos?: unknown[] };
    test.skip(
      !datos.productos?.length,
      "la base de esta máquina no tiene productos: no hay catálogo que publicar",
    );

    const respuesta = await page.request.get(`${baseURL}/datos/google`);
    const xml = await respuesta.text();

    /**
     * SE COMPRUEBA QUE EL ARCHIVO ESTÉ BIEN ARMADO, NO QUE TENGA PRODUCTOS.
     *
     * Antes esto exigía más de un producto, y estaba bien mientras el archivo
     * llevara el catálogo entero. Desde el 19 ago 2026 lleva **solo lo que se
     * puede entregar en Estados Unidos** (`pais_origen = 'US'`), porque
     * mandarle a Merchant Center mercancía que se retira en Venezuela es el
     * patrón por el que suspenden cuentas.
     *
     * Así que una máquina con catálogo venezolano y sin catálogo de EE. UU.
     * produce un archivo vacío **y eso es lo correcto**. Exigir productos ahí
     * sería una prueba que se pone roja por hacer lo que debe.
     *
     * Lo que sí tiene que cumplirse siempre es que el archivo sea un feed
     * válido: si la ruta revienta o devuelve HTML, esto lo atrapa.
     */
    expect(xml, "el feed de Google no es XML").toContain("<?xml");
    expect(xml, "el feed de Google no tiene canal").toContain("<channel>");

    /* Y si trae productos, tienen que ser productos de verdad, con su enlace
       y su precio: un <item> sin precio lo rechaza Google entero. */
    const items = (xml.match(/<item>/g) ?? []).length;
    if (items > 0) {
      expect(xml).toContain("<g:price>");
      expect(xml).toContain("<link>");
    }
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
