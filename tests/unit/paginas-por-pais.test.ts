import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DEVOLUCIONES_EN,
  DEVOLUCIONES_ES,
} from "@/contenido/paginas/devoluciones";
import { ENTREGA_US_EN, ENTREGA_US_ES } from "@/contenido/paginas/entrega-us";
import { paraElMercado } from "@/contenido/paginas/por-mercado";
import type { PaginaContenido } from "@/contenido/paginas/tipos";

/**
 * ══ CADA DOMINIO HABLA DE SU PAÍS (20 sep 2026) ══
 *
 * Al preparar la evaluación de Merchant Center apareció que mercatren.com —que
 * desde el 7 sep vende y entrega SOLO en Estados Unidos— seguía enseñando la
 * página de entrega de Venezuela («No enviamos a Estados Unidos ni a otros
 * países») y tres secciones «Venezuela · …» en su política de devoluciones.
 * Google cruza esas páginas con lo que declara la cuenta: era motivo de
 * rechazo por información contradictoria.
 */

const todoElTexto = (p: PaginaContenido) => JSON.stringify(p);
const leer = (relativo: string) =>
  readFileSync(join(process.cwd(), relativo), "utf8");

describe("la política de devoluciones, por país", () => {
  for (const [idioma, pagina] of [
    ["es", DEVOLUCIONES_ES],
    ["en", DEVOLUCIONES_EN],
  ] as const) {
    it(`Estados Unidos no ve nada de Venezuela (${idioma})`, () => {
      const us = paraElMercado(pagina, "US");
      expect(us.secciones.map((s) => s.id)).toContain("estados-unidos");
      for (const s of us.secciones) {
        expect(s.titulo, s.id).not.toMatch(/Venezuela/);
        expect(s.id).not.toMatch(/retirar/);
      }
    });

    it(`Venezuela no empieza por «entrega en Estados Unidos» (${idioma})`, () => {
      const ve = paraElMercado(pagina, "VE");
      expect(ve.secciones.map((s) => s.id)).not.toContain("estados-unidos");
      expect(ve.secciones.map((s) => s.id)).toContain("antes-de-retirar");
    });

    it(`se vuelve a numerar de corrido: nada de «1, 5, 6, 7» (${idioma})`, () => {
      for (const m of ["US", "VE", "CL"]) {
        const numeros = paraElMercado(pagina, m).secciones.map((s) => s.numero);
        expect(numeros).toEqual(numeros.map((_, i) => String(i + 1)));
      }
    });

    it(`no se pierde ni se reescribe ninguna sección (${idioma})`, () => {
      const juntas = new Set(
        ["US", "VE"].flatMap((m) =>
          paraElMercado(pagina, m).secciones.map((s) => s.id),
        ),
      );
      expect(juntas).toEqual(new Set(pagina.secciones.map((s) => s.id)));
    });
  }
});

describe("la página de entrega de Estados Unidos", () => {
  it("dice lo que la tienda hace, y nada de retirar ni de Venezuela", () => {
    for (const p of [ENTREGA_US_ES, ENTREGA_US_EN]) {
      const texto = todoElTexto(p);
      expect(texto).not.toMatch(
        /Venezuela|retir[ao]|pickup|pick up|depósito del comercio/i,
      );
      expect(texto).not.toMatch(/No enviamos a Estados Unidos/i);
    }
    expect(todoElTexto(ENTREGA_US_ES)).toContain("50 estados");
    expect(todoElTexto(ENTREGA_US_EN)).toContain("all 50 U.S. states");
  });

  it("promete EL MISMO plazo que cada ficha de producto", () => {
    const es = JSON.parse(leer("messages/es.json")) as {
      catalogo: { producto: { entregaUs: { plazo: string } } };
    };
    const plazo = es.catalogo.producto.entregaUs.plazo.match(/\d+ a \d+/)?.[0];
    expect(plazo).toBeTruthy();
    expect(todoElTexto(ENTREGA_US_ES)).toContain(`${plazo} días hábiles`);
  });

  it("no promete un correo de «ya salió» que el sitio todavía no manda", () => {
    expect(todoElTexto(ENTREGA_US_ES)).not.toMatch(/avisamos por correo/i);
    expect(todoElTexto(ENTREGA_US_EN)).not.toMatch(/email you when it ships/i);
  });

  it("la página, y su versión para agentes, eligen por el país del dominio", () => {
    const entrega = leer("src/app/[locale]/(tienda)/(docs)/entrega/page.tsx");
    expect(entrega).toContain('mercado.codigo === "US"');
    expect(entrega).toContain("ENTREGA_US_ES");
    const devoluciones = leer(
      "src/app/[locale]/(tienda)/(docs)/devoluciones/page.tsx",
    );
    expect(devoluciones).toContain("paraElMercado(");
    const agentes = leer("src/app/datos/markdown/route.ts");
    expect(agentes).toContain("paraElMercado(");
    expect(agentes).toContain("ENTREGA_US_ES");
  });
});
