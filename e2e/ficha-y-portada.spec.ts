import { expect, test } from "@playwright/test";

import es from "../messages/es.json";

/**
 * LA FICHA DEL PRODUCTO Y LA PORTADA: la flecha, los similares y «lo que
 * estabas mirando».
 *
 * ══ POR QUÉ ESTO SE PRUEBA DE PUNTA A PUNTA Y NO SOLO EN UNIDAD ══
 *
 * Los tres comportamientos dependen del NAVEGADOR: el rastro de navegación
 * vive en `sessionStorage` (porque dentro del sitio Next navega sin recargar
 * y `document.referrer` no se actualiza), el historial de fichas abiertas vive
 * en `localStorage`, y la banda de la portada se decide hidratada. La regla
 * pura tiene sus pruebas de unidad; aquí se comprueba que el conjunto haga lo
 * que el dueño pidió, en celular y en escritorio.
 *
 * ══ OJO AL CORRERLA EN UN NAVEGADOR CON LA PESTAÑA OCULTA ══
 *
 * React 19.2 revela los límites de Suspense en un `requestAnimationFrame`: con
 * la pestaña `hidden`, la ficha en carga fría NO termina de hidratar y los
 * efectos no corren. Playwright arranca la pestaña visible, así que aquí no
 * pasa; en el panel integrado del editor sí pasó.
 *
 * Nada de textos escritos a mano: salen de `messages/es.json`.
 */

const PREFIJO_VOLVER_A =
  es.catalogo.producto.volverATienda.split("{tienda}")[0];
const PREFIJO_MAS_DE = es.afinidad.titulo.split("{categoria}")[0];

function escapar(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test.describe("La ficha del producto", () => {
  test.use({ locale: "es-US" });

  test("desde la tienda: la flecha dice «Volver», enseña similares y vuelve A LA TIENDA", async ({
    page,
    baseURL,
  }) => {
    const lista = (await (
      await page.request.get(`${baseURL}/datos/catalogo`)
    ).json()) as {
      productos?: { slug: string; tiendaSlug: string }[];
    };
    const uno = lista.productos?.[0];
    test.skip(!uno, "la base de esta máquina no tiene productos");

    await page.goto(`/es/tienda/${uno!.tiendaSlug}`);
    const enlaceProducto = page.locator('a[href^="/es/producto/"]').first();
    await expect(enlaceProducto).toBeVisible();
    await enlaceProducto.click();
    await expect(page).toHaveURL(/\/es\/producto\//);

    /* Hidratada, la flecha sabe que se vino de la tienda: «← Volver» a secas.
       `toHaveText` reintenta, así que espera a la hidratación sola. */
    const flecha = page.locator("a", { hasText: "←" }).first();
    await expect(flecha).toHaveText(
      new RegExp(`^←\\s*${escapar(es.catalogo.producto.volver)}$`),
      {
        timeout: 30_000,
      },
    );
    /* Y el enlace de verdad sigue siendo la tienda: sirve sin JavaScript. */
    await expect(flecha).toHaveAttribute(
      "href",
      `/es/tienda/${uno!.tiendaSlug}`,
    );

    /* Los similares, al pie. Con un solo producto en la base no habría ninguno. */
    if ((lista.productos?.length ?? 0) >= 2) {
      await expect(
        page.getByRole("heading", { name: es.catalogo.producto.similares }),
      ).toBeVisible();
    }

    await flecha.click();
    await expect(page).toHaveURL(
      new RegExp(`/es/tienda/${escapar(uno!.tiendaSlug)}$`),
    );
  });

  test("llegando de fuera (sin referrer): la flecha lleva a la tienda del producto, nunca al catálogo", async ({
    page,
    baseURL,
  }) => {
    const lista = (await (
      await page.request.get(`${baseURL}/datos/catalogo`)
    ).json()) as {
      productos?: { slug: string; tiendaSlug: string }[];
    };
    const uno = lista.productos?.[0];
    test.skip(!uno, "la base de esta máquina no tiene productos");

    await page.goto(`/es/producto/${uno!.slug}`);
    const flecha = page.locator("a", { hasText: "←" }).first();
    await expect(flecha).toHaveText(
      new RegExp(`^←\\s*${escapar(PREFIJO_VOLVER_A)}`),
    );
    await flecha.click();
    await expect(page).toHaveURL(
      new RegExp(`/es/tienda/${escapar(uno!.tiendaSlug)}$`),
    );
    expect(new URL(page.url()).pathname.endsWith("/catalogo")).toBe(false);
  });
});

test.describe("La portada sigue lo que la persona estuvo mirando", () => {
  test.use({ locale: "es-US" });

  test("dos fichas de la misma categoría → banda «Más de …», sin repetir lo ya visto", async ({
    page,
    baseURL,
  }) => {
    type Vista = { slug: string; categoriaSlug: string | null };
    const historial = () =>
      page.evaluate(
        () =>
          (
            JSON.parse(localStorage.getItem("mercatren-vistos") ?? "{}") as {
              state?: { vistas?: Vista[] };
            }
          ).state?.vistas ?? [],
      );

    /* Se espera la SEÑAL de que la visita quedó anotada —el slug en el
       historial del navegador—, no un tiempo: `goto` vuelve en `load`, y el
       efecto que anota corre después de hidratar. */
    const visitar = async (slug: string) => {
      await page.goto(`/es/producto/${slug}`);
      await page.waitForFunction(
        (s) =>
          (
            (
              JSON.parse(localStorage.getItem("mercatren-vistos") ?? "{}") as {
                state?: { vistas?: { slug: string }[] };
              }
            ).state?.vistas ?? []
          ).some((v) => v.slug === s),
        slug,
        { timeout: 30_000 },
      );
    };

    /* Se abre un producto cualquiera y se lee de qué categoría HOJA es (la que
       guarda el historial). Los mosaicos de la portada son departamentos y dos
       productos del mismo departamento pueden ser de hojas distintas — y ahí
       la banda, correctamente, no sale. El segundo producto se elige de la
       misma hoja, con al menos cinco en total (dos que se abren y tres para
       la banda). */
    const lista = (await (
      await page.request.get(`${baseURL}/datos/catalogo`)
    ).json()) as {
      productos?: { slug: string }[];
    };
    test.skip(
      !lista.productos?.length,
      "la base de esta máquina no tiene productos",
    );

    let elegida: { categoria: string; a: string; b: string } | null = null;
    for (const candidato of lista.productos!.slice(0, 6)) {
      await visitar(candidato.slug);
      const categoria = (await historial()).find(
        (v) => v.slug === candidato.slug,
      )?.categoriaSlug;
      if (!categoria) continue;
      const r = (await (
        await page.request.get(
          `${baseURL}/datos/catalogo?categoria=${encodeURIComponent(categoria)}&todas=1&limite=14`,
        )
      ).json()) as { productos?: { slug: string }[] };
      const otros = (r.productos ?? []).filter(
        (p) => p.slug !== candidato.slug,
      );
      if (otros.length >= 4) {
        elegida = { categoria, a: candidato.slug, b: otros[0]!.slug };
        break;
      }
    }
    test.skip(!elegida, "ninguna categoría de esta base tiene cinco productos");

    await visitar(elegida!.a);
    await visitar(elegida!.b);
    await page.goto("/es");

    const banda = page
      .locator(`section[aria-label^="${PREFIJO_MAS_DE}"]`)
      .first();
    /* El servidor de desarrollo compila la ruta la primera vez: más margen. */
    await expect(banda).toBeVisible({ timeout: 30_000 });
    await expect(banda.getByText(es.afinidad.porque)).toBeVisible();
    /* No se le vuelve a enseñar lo que ya abrió. */
    await expect(
      banda.locator(`a[href="/es/producto/${elegida!.a}"]`),
    ).toHaveCount(0);
    await expect(
      banda.locator(`a[href="/es/producto/${elegida!.b}"]`),
    ).toHaveCount(0);
    /* Y «Ver todo» lleva a esa categoría del catálogo. */
    await expect(
      banda.locator(
        `a[href="/es/catalogo?categoria=${encodeURIComponent(elegida!.categoria)}"]`,
      ),
    ).toHaveCount(1);
  });
});
