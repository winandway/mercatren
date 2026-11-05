import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  articulosDe,
  buscarArticulo,
  publicados,
  todosLosSlugs,
} from "@/contenido/articulos";
import { ARTICULOS_EN } from "@/contenido/articulos/en";
import { ARTICULOS_ES } from "@/contenido/articulos/es";
import type { Articulo } from "@/contenido/articulos/tipos";
import { GET as legal } from "@/app/datos/app/v1/legal/route";
import { destinoLegal, esPaginaLegal } from "@/lib/app-movil/legal";
import { enLaApp } from "@/lib/mercado/interruptores";

/**
 * FASE 5 PREPARADA Y APAGADA (5 nov 2026). Venezuela y España ya tienen su
 * guía en Docs y sus textos legales en la app, pero NADA se ve hasta que
 * Richard encienda cada país. Lo que no puede pasar sin que esto se ponga en
 * rojo:
 * - que la guía de un país apagado salga en Docs, en el buscador, en el mapa
 *   del sitio o en su dirección (contarle a la gente cómo comprar donde
 *   todavía no se vende);
 * - que la app abra los términos de Estados Unidos a quien eligió Venezuela
 *   o España;
 * - que el enlace legal de la app sirva para saltar a cualquier página.
 */
const RAIZ = join(import.meta.dirname, "..", "..");
const GUIAS = {
  VE: "mercatren-venezuela-in-the-app",
  ES: "mercatren-spain-in-the-app",
} as const;

describe("la guía de cada país, escrita y escondida", () => {
  it("existe en los dos idiomas, marcada con su país", () => {
    for (const [pais, slug] of Object.entries(GUIAS)) {
      for (const lista of [ARTICULOS_ES, ARTICULOS_EN]) {
        const guia = lista.find((a) => a.slug === slug);
        expect(guia, `${slug}`).toBeDefined();
        expect(guia!.soloConPais).toBe(pais);
      }
    }
  });

  it("con el país apagado no sale en Docs, ni en el buscador, ni en el mapa", () => {
    for (const [pais, slug] of Object.entries(GUIAS)) {
      if (enLaApp(pais)) continue; /* el día que se encienda, se publica */
      for (const idioma of ["es", "en"]) {
        expect(articulosDe(idioma).some((a) => a.slug === slug)).toBe(false);
        expect(buscarArticulo(idioma, slug)).toBeUndefined();
      }
      expect(todosLosSlugs()).not.toContain(slug);
    }
  });

  it("el interruptor decide: encendido se publica, apagado no", () => {
    const base = ARTICULOS_ES[0]!;
    const conPais = (p: string): Articulo => ({ ...base, soloConPais: p });
    expect(publicados([conPais("US")])).toHaveLength(1);
    expect(publicados([conPais("VE")])).toHaveLength(0);
    expect(publicados([{ ...base, soloConPais: undefined }])).toHaveLength(1);
  });

  it("cada captura de las guías existe", () => {
    for (const lista of [ARTICULOS_ES, ARTICULOS_EN]) {
      for (const guia of lista.filter((a) => a.soloConPais)) {
        for (const b of guia.cuerpo) {
          if (b.tipo !== "imagen") continue;
          expect(existsSync(join(RAIZ, "public", b.src)), b.src).toBe(true);
        }
      }
    }
  });
});

describe("los textos legales del país, desde la app", () => {
  it("Venezuela abre los de su dominio", () => {
    expect(destinoLegal("VE", "es", "terminos")).toMatchObject({
      destino: "https://mercatren.com.ve/es/terminos",
      cookie: "nada",
    });
  });

  it("España se abre dentro de mercatren.com, con su país puesto", () => {
    expect(destinoLegal("ES", "en", "privacidad")).toMatchObject({
      destino: "/en/privacidad",
      cookie: "poner",
    });
  });

  it("Estados Unidos quita el país que hubiera quedado", () => {
    expect(destinoLegal("US", "es", "ayuda")).toMatchObject({
      destino: "/es/ayuda",
      cookie: "quitar",
    });
  });

  it("solo las páginas legales y de ayuda, nunca cualquier dirección", () => {
    expect(esPaginaLegal("terminos")).toBe(true);
    expect(esPaginaLegal("devoluciones")).toBe(true);
    expect(esPaginaLegal("../panel")).toBe(false);
    expect(esPaginaLegal("//otro-sitio.com")).toBe(false);
    const r = legal(
      new Request(
        "https://mercatren.com/datos/app/v1/legal?pais=ES&idioma=es&pagina=panel",
      ),
    );
    expect(r.status).toBe(400);
  });

  it("la ruta responde con la redirección y la galleta, sin caché", () => {
    const r = legal(
      new Request(
        "https://mercatren.com/datos/app/v1/legal?pais=ES&idioma=es&pagina=terminos",
      ),
    );
    expect(r.status).toBe(303);
    expect(r.headers.get("Location")).toBe("/es/terminos");
    expect(r.headers.get("Set-Cookie")).toContain("mercatren_pais=ES");
    expect(r.headers.get("Cache-Control")).toBe("no-store");
  });

  it("la app abre las páginas legales por esa ruta, con el país de la persona", () => {
    const leer = (r: string) => readFileSync(join(RAIZ, r), "utf-8");
    for (const pantalla of [
      "app-movil/src/app/(tabs)/cuenta.tsx",
      "app-movil/src/app/crear-cuenta.tsx",
      "app-movil/src/app/crear-tienda.tsx",
    ]) {
      const fuente = leer(pantalla);
      expect(fuente, pantalla).toContain("urlLegal(pais, idioma,");
      expect(fuente, pantalla).not.toMatch(
        /\$\{idioma\}\/(terminos|privacidad|ayuda)/,
      );
    }
  });

  it("términos y privacidad enseñan las secciones del país de la visita", () => {
    const leer = (r: string) => readFileSync(join(RAIZ, r), "utf-8");
    for (const pagina of ["terminos", "privacidad"]) {
      const fuente = leer(
        `src/app/[locale]/(tienda)/(docs)/${pagina}/page.tsx`,
      );
      expect(fuente, pagina).toContain("paraElMercado(");
      expect(fuente, pagina).toContain("await mercadoActual()");
    }
  });
});

describe("la lista de países nunca se queda vieja en el teléfono", () => {
  it("se pide siempre fresca, en todas las pantallas", () => {
    const leer = (r: string) => readFileSync(join(RAIZ, r), "utf-8");
    expect(leer("app-movil/src/lib/api.ts")).toContain(
      'headers: { "Cache-Control": "no-cache" }',
    );
    for (const archivo of [
      "app-movil/src/app/(tabs)/cuenta.tsx",
      "app-movil/src/app/crear-tienda.tsx",
      "app-movil/src/contexto/preferencias.tsx",
      "app-movil/src/components/elegir-pais.tsx",
    ]) {
      const fuente = leer(archivo);
      expect(fuente, archivo).toContain("pedirPaises(");
      expect(fuente, archivo).not.toContain("urlPaises(");
    }
  });
});
