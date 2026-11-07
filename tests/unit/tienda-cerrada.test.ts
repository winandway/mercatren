import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  abiertaConTiendaCerrada,
  idiomaDe,
  PAGINAS_LEGALES,
  paginaCerrada,
  TIENDA_CERRADA,
  tiendaCerradaAqui,
} from "@/lib/tienda-cerrada";

/**
 * LA TIENDA CERRADA Y LAS PÁGINAS LEGALES QUE NUNCA SE APAGAN (5 nov 2026).
 *
 * Google Play rechazó la app porque el enlace de privacidad daba la página de
 * pausa. Lo que no puede volver a pasar sin que esto se ponga en rojo: que con
 * la tienda cerrada alguna dirección declarada en las tiendas de apps
 * (privacidad, términos, borrar la cuenta, ayuda) deje de responder.
 */

const leer = (ruta: string) => readFileSync(ruta, "utf-8");

/** Todas las direcciones de mercatren.com que declaran las dos fichas. */
function direccionesDeclaradas(): string[] {
  const fuentes = [
    leer("tienda-apps/google-play/FICHA.md"),
    leer("tienda-apps/app-store/ficha.mjs"),
  ].join("\n");
  const rutas = new Set<string>();
  for (const m of fuentes.matchAll(
    /https:\/\/mercatren\.com(\/[^\s|)`"'&]*)/g,
  )) {
    const ruta = (m[1] ?? "").replace(/\/$/, "");
    /* La portada es la tienda (cerrada) y `.well-known` es un archivo que el
       middleware ni toca. */
    if (ruta === "" || ruta.startsWith("/.well-known")) continue;
    rutas.add(ruta);
  }
  return [...rutas];
}

describe("la tienda cerrada", () => {
  it("hoy está ABIERTA (5 nov 2026, Richard: «todas las páginas funcionales»)", () => {
    expect(TIENDA_CERRADA).toBe(false);
    expect(tiendaCerradaAqui("production")).toBe(false);
  });

  it("cerrada, se cierra solo en producción: desarrollo y pruebas la ven abierta", () => {
    expect(tiendaCerradaAqui("production", true)).toBe(true);
    expect(tiendaCerradaAqui("development", true)).toBe(false);
    expect(tiendaCerradaAqui("test", true)).toBe(false);
  });

  it("toda dirección declarada en Google Play y App Store sigue abierta", () => {
    const rutas = direccionesDeclaradas();
    expect(rutas.length).toBeGreaterThanOrEqual(4);
    for (const ruta of rutas) {
      expect(abiertaConTiendaCerrada(ruta), ruta).toBe(true);
    }
  });

  it.each(PAGINAS_LEGALES)(
    "«%s» abre en los dos idiomas y sin idioma",
    (pagina) => {
      for (const ruta of [`/es/${pagina}`, `/en/${pagina}`, `/${pagina}`]) {
        expect(abiertaConTiendaCerrada(ruta), ruta).toBe(true);
      }
    },
  );

  it("la ayuda abre con sus casos, y se puede entrar para borrar la cuenta", () => {
    for (const ruta of [
      "/es/support/caso/abc",
      "/en/entrar",
      "/es/olvide-mi-clave",
      "/en/nueva-clave",
      "/es/panel",
    ]) {
      expect(abiertaConTiendaCerrada(ruta), ruta).toBe(true);
    }
  });

  it("la tienda NO abre", () => {
    for (const ruta of [
      "/",
      "/es",
      "/en",
      "/es/catalogo",
      "/en/producto/una-ficha",
      "/es/tiendas",
      "/es/carrito",
      "/en/checkout",
      "/es/privacy-falsa",
      "/es/termsx",
    ]) {
      expect(abiertaConTiendaCerrada(ruta), ruta).toBe(false);
    }
  });

  it("la página «cerrado» enlaza las cuatro legales en su idioma y lleva el crédito de Windoce", () => {
    const es = paginaCerrada("/es/catalogo", "mercatren.com");
    const en = paginaCerrada("/", "mercatren.com");
    expect(idiomaDe("/es/catalogo")).toBe("es");
    expect(idiomaDe("/")).toBe("en");
    for (const pagina of PAGINAS_LEGALES) {
      expect(es).toContain(`href="/es/${pagina}"`);
      expect(en).toContain(`href="/en/${pagina}"`);
    }
    expect(es).toContain('<meta name="robots" content="noindex">');
    expect(en).toMatch(
      /href="https:\/\/windoce\.com" target="_blank" rel="noopener noreferrer nofollow"/,
    );
  });

  it("el middleware cierra ANTES de todo lo demás, con 503", () => {
    const fuente = leer("src/middleware.ts");
    const cierre = fuente.indexOf("tiendaCerradaAqui() &&");
    expect(cierre).toBeGreaterThan(-1);
    expect(
      fuente.indexOf("!abiertaConTiendaCerrada(pathname)"),
    ).toBeGreaterThan(cierre);
    expect(fuente.indexOf("redireccionDeMudanza(request)")).toBeGreaterThan(
      cierre,
    );
    expect(fuente.indexOf("return idiomas(request)")).toBeGreaterThan(cierre);
    expect(fuente.slice(cierre, cierre + 900)).toContain("status: 503");
  });
});
