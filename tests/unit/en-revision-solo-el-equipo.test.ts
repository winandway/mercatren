import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const leer = (r: string) => readFileSync(r, "utf8");

/**
 * ══ EL EQUIPO VE Y ENCUENTRA LO QUE ESTÁ EN REVISIÓN (9 sep 2026) ══
 *
 * Richard: «dame la posibilidad de buscarlos en el buscador y poderlos
 * encontrar; no importa que no estén disponibles, quiero verlos». Un
 * producto de CJ pasa días en revisión esperando su flete real, y no había
 * forma de verlo fuera de la base. Solo con sesión del equipo, solo al
 * buscar, y nunca con botón de comprar. El público, Google, el mapa del
 * sitio y el feed siguen viendo únicamente lo publicado.
 */
describe("lo «en revisión» solo lo ve el equipo", () => {
  it("el muro tiene su segunda puerta, y solo ahí se fabrica", () => {
    const muro = leer("src/lib/mercado/repositorio.ts");
    expect(muro).toContain("export function visibleEnParaElEquipo");
    expect(muro).toContain(
      'inArray(productos.estado, ["publicado", "en_revision"])',
    );
  });

  it("las consultas piden la puerta del equipo solo si se lo dicen", () => {
    const c = leer("src/lib/catalogo/consultas.ts");
    expect(c).toContain(
      "paraElEquipo ? visibleEnParaElEquipo(mercado) : visibleEn(mercado)",
    );
    expect(c).toContain("visibleAqui(mercado, Boolean(filtros.paraElEquipo))");
    expect(c).toContain(
      "visibleAqui(mercado, Boolean(opciones?.paraElEquipo))",
    );
    /* Y las demás consultas (portada, similares, mapa) siguen con la pública. */
    expect(
      c.match(/visibleAqui\(mercado\)/g)?.length ?? 0,
    ).toBeGreaterThanOrEqual(3);
  });

  it("el catálogo solo lo hace AL BUSCAR y CON SESIÓN del equipo", () => {
    const pagina = leer("src/app/[locale]/(tienda)/catalogo/page.tsx");
    expect(pagina).toContain("if (!q) return false;");
    expect(pagina).toContain("return esEquipoInterno().catch(() => false);");
    expect(
      pagina.match(/paraElEquipo: await buscandoComoEquipo\(filtros\.q\)/g)
        ?.length,
    ).toBe(2);
  });

  it("la ficha abre para el equipo, avisa, y NO deja comprar", () => {
    const ficha = leer("src/app/[locale]/(tienda)/producto/[slug]/page.tsx");
    expect(ficha).toContain("paraElEquipo: delEquipo");
    expect(ficha).toContain(
      'const enRevision = producto.estado === "en_revision";',
    );
    expect(ficha).toContain("{enRevision ? null : variantes.length > 0 ? (");
    expect(ficha).toContain('t("enRevisionTexto")');
    /* El equipo se calcula ANTES de pedir la ficha: si no, el 404 llega primero. */
    /* (lastIndexOf: la primera llamada es la de generateMetadata, que es
       pública y no entra aquí.) */
    expect(
      ficha.lastIndexOf("const delEquipo = await esEquipoInterno()"),
    ).toBeLessThan(
      ficha.lastIndexOf("const ficha = await obtenerProductoPorSlug("),
    );
  });

  it("la tarjeta lo marca, y los textos existen en los dos idiomas", () => {
    expect(leer("src/components/catalogo/tarjeta-producto.tsx")).toContain(
      'producto.estado === "en_revision"',
    );
    for (const idioma of ["es", "en"]) {
      const d = JSON.parse(leer(`messages/${idioma}.json`)) as {
        catalogo: { producto: Record<string, string> };
      };
      for (const k of ["enRevision", "enRevisionTexto", "enRevisionCorto"]) {
        expect(d.catalogo.producto[k], `${idioma}.${k}`).toBeTruthy();
      }
    }
  });

  it("lo público no cambió: el feed de Google y el mapa siguen en «publicado»", () => {
    expect(leer("src/app/datos/google/route.ts")).toContain(
      'eq(productos.estado, "publicado")',
    );
    expect(
      leer("src/lib/seo/mapa.ts") + leer("src/lib/catalogo/consultas.ts"),
    ).not.toContain(
      "visibleEnParaElEquipo(mercado)\n  );\n}\n\nexport async function listarParaElMapa",
    );
  });
});
