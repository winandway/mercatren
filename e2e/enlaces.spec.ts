import { expect, test } from "@playwright/test";

/**
 * Ningun enlace del sitio puede llevar a un 404.
 *
 * Esta prueba existe porque paso de verdad: el menu de arriba y el pie de
 * pagina apuntaban a paginas que todavia no estaban hechas, y el 404 lo
 * descubrio el usuario navegando, no nosotros. Ahora lo descubre la
 * compilacion, antes de publicar.
 *
 * Recorre las paginas publicas, junta TODOS sus enlaces internos y comprueba
 * uno por uno que respondan. Si alguien agrega un enlace a una pagina que no
 * existe, esto se pone rojo.
 */

/** Las paginas desde donde se sale a todo lo demas. */
const PUNTOS_DE_PARTIDA = [
  "/es",
  "/es/catalogo",
  "/es/docs",
  "/es/ayuda",
  "/es/vender",
  "/en",
];

/**
 * Rutas que se saltan a proposito:
 * - las del panel y la cuenta redirigen a "entrar" cuando no hay sesion;
 * - el PDF y los archivos se sirven aparte;
 * - el carrito y el checkout dependen de lo que tenga el navegador.
 */
const SE_SALTAN = [
  "/panel",
  "/cuenta",
  "/pedidos",
  "/checkout",
  "/carrito",
  "/entrar",
  "/media/",
  ".pdf",
];

function seSalta(ruta: string) {
  return SE_SALTAN.some((s) => ruta.includes(s));
}

test.describe("ningun enlace roto", () => {
  for (const partida of PUNTOS_DE_PARTIDA) {
    test(`los enlaces de ${partida} responden`, async ({ page, baseURL }) => {
      await page.goto(partida);

      const enlaces = await page
        .locator("a[href^='/']")
        .evaluateAll((nodos) =>
          nodos.map((n) => (n as HTMLAnchorElement).getAttribute("href") ?? ""),
        );

      // Sin duplicados: la misma pagina suele enlazarse desde varios sitios.
      const rutas = [...new Set(enlaces)]
        .filter(Boolean)
        .filter((r) => !seSalta(r));

      expect(
        rutas.length,
        `${partida} no tiene enlaces internos`,
      ).toBeGreaterThan(0);

      const rotos: string[] = [];
      for (const ruta of rutas) {
        const respuesta = await page.request.get(`${baseURL}${ruta}`, {
          maxRedirects: 5,
        });
        if (respuesta.status() >= 400) {
          rotos.push(`${ruta} → ${respuesta.status()}`);
        }
      }

      expect(rotos, `enlaces rotos en ${partida}`).toEqual([]);
    });
  }
});
