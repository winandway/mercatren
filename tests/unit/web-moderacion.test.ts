import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { estiloParaBloqueados } from "@/lib/moderacion/estilo-bloqueados";

const leer = (p: string) => readFileSync(p, "utf8");

describe("denunciar y bloquear también en la web (dictamen de Play, 8 nov 2026)", () => {
  it("esconde las tarjetas de los vendedores bloqueados", () => {
    const css = estiloParaBloqueados(["tienda-uno"]);
    expect(css).toContain('a[data-tienda="tienda-uno"]');
    expect(css).toContain("li:has(>");
    expect(css).toContain("display:none");
  });
  it("sin bloqueados no hay hoja, y un slug raro no entra", () => {
    expect(estiloParaBloqueados([])).toBe("");
    expect(estiloParaBloqueados(['x"]{}body{display:none'])).toBe("");
  });
  it("la tarjeta lleva la tienda para poder esconderla", () => {
    expect(leer("src/components/catalogo/tarjeta-producto.tsx")).toMatch(
      /data-tienda=\{producto\.tiendaSlug\}/,
    );
  });
  it("la ficha y la tienda tienen los tres puntos y respetan el bloqueo", () => {
    for (const p of [
      "src/app/[locale]/(tienda)/producto/[slug]/page.tsx",
      "src/app/[locale]/(tienda)/tienda/[slug]/page.tsx",
    ]) {
      const f = leer(p);
      expect(f).toContain("<ModeracionFicha");
      expect(f).toContain("bloqueoAlVendedor(");
    }
  });
  it("el encabezado monta el escondite con sesión y la cuenta enlaza los bloqueados", () => {
    expect(leer("src/components/layout/encabezado.tsx")).toContain(
      "<EsconderBloqueados",
    );
    expect(leer("src/app/[locale]/(tienda)/cuenta/page.tsx")).toContain(
      '"/cuenta/bloqueados"',
    );
  });
});
