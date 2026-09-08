import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const leer = (r: string) => readFileSync(r, "utf8");

/**
 * ══ LAS RETIRADAS CON FLETE REAL VUELVEN SOLAS (8 sep 2026) ══
 *
 * La mochila de Richard: en revisión, 3 variantes con stock en CJ, flete
 * cotizado, y dando 404. La retiró el barrido por el cero viejo de sus
 * tallas, y NADIE la iba a volver a leer: el afinado solo toma lo que no
 * tiene flete, y el refresco de stock miraba primero las ~6.000 publicadas a
 * una cada quince minutos. Estas pruebas fijan el camino de vuelta.
 */
describe("los casi listos van primero en el refresco de stock", () => {
  const existencias = leer("src/lib/cj/existencias.ts");

  it("existe la cuenta de casi listos, con su definición completa", () => {
    expect(existencias).toContain("export async function contarCasiListos");
    const def = existencias.slice(
      existencias.indexOf("function casiListo()"),
      existencias.indexOf("const PLAZAS_CON_ALMACEN"),
    );
    expect(def).toContain('eq(productos.estado, "en_revision")');
    expect(def).toContain("gt(productos.precioBaseCentavos, 0)");
    expect(def).toContain("inArray(productos.id, envioBueno())");
    /* Sin esto, una ficha que CJ confirma en cero se leería cada minuto. */
    expect(def).toContain("lt(productos.sincronizadoEn, HACE_24_H())");
  });

  it("en la cola del refresco van ANTES que lo publicado", () => {
    const orden = existencias.slice(existencias.indexOf(".orderBy("));
    const casi = orden.indexOf("casiListo()");
    const publicado = orden.indexOf("'publicado' then 1");
    expect(casi).toBeGreaterThan(0);
    expect(publicado).toBeGreaterThan(casi);
  });

  it("el reloj cuenta los casi listos y se los pasa a la regla, y lo dice", () => {
    const tick = leer("src/lib/reloj/tick.ts");
    expect(tick).toContain("await contarCasiListos()");
    expect(tick).toMatch(
      /cuantosDeStock\([\s\S]{0,160}cjEnPausa,\s*casiListos,?\s*\)/,
    );
    expect(tick).toContain("casi listos por mirar");
  });
});

describe("el afinado dice por qué falla", () => {
  it("cada camino de fallo deja su motivo, y el reloj lo publica", () => {
    const afinar = leer("src/lib/cj/afinar.ts");
    expect(afinar).toContain("ultimoFallo?: string");
    expect(afinar).toMatch(/ultimoFallo =\s*`variantes: \$\{r\.motivo\}`/);
    expect(afinar).toMatch(/ultimoFallo =\s*`flete: \$\{cotizacion\.motivo/);
    expect(afinar).toMatch(/ultimoFallo =\s*`guardar:/);
    const tick = leer("src/lib/reloj/tick.ts");
    expect(tick).toContain("último fallo: ${r.ultimoFallo}");
    const flete = leer("src/lib/cj/flete.ts");
    expect(flete).toContain("return { motivo: respuesta.motivo }");
  });
});
