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

  it("UN FALLO NO SE QUEDA A LA CABEZA: pasa al final y el canario dice por qué", () => {
    /* Medido el 9 sep por la noche: «stock: 4 mirados, 3 fallidos» en cada
       latido, los mismos tres. */
    const bucle = existencias.slice(
      existencias.indexOf("for (const p of cola)"),
    );
    const desde = bucle.indexOf("if (!r.ok) {");
    const fallo = bucle.slice(desde, bucle.indexOf("continue;", desde));
    expect(fallo).toContain("ultimoFallo = r.motivo");
    expect(fallo).toContain(".set({ actualizadoEn: new Date() })");
    const orden = existencias.slice(existencias.indexOf(".orderBy("));
    expect(orden).toContain(
      "case when ${casiListo()} then ${productos.actualizadoEn} else 0 end",
    );
    expect(leer("src/lib/reloj/tick.ts")).toContain(
      "último fallo: ${r.ultimoFallo}",
    );
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
    expect(afinar).toContain("variantes: ${r.motivo}");
    expect(afinar).toContain("flete: ${cotizacion.motivo");
    expect(afinar).toMatch(/ultimoFallo =\s*`guardar:/);
    const tick = leer("src/lib/reloj/tick.ts");
    expect(tick).toContain("último fallo: ${r.ultimoFallo}");
    const flete = leer("src/lib/cj/flete.ts");
    expect(flete).toContain("return { motivo: respuesta.motivo }");
  });
});

/**
 * ══ POR QUÉ EL AFINADO LLEVABA UN DÍA EN «0 OK» (8 sep 2026, noche) ══
 *
 * Con el motivo ya visible salieron dos causas: (1) «la ropa primero»
 * mandaba sobre «lo nunca intentado primero», así que un puñado de prendas
 * cuyo flete CJ no cotiza volvía a la cabeza de la cola en cada vuelta y los
 * 44.000 sin tallas no tuvieron turno; (2) el flujo de GitHub afinaba 240 s
 * cada 10 min A LA VEZ que el reloj: «Too Many Requests, QPS limit» en los
 * dos lados. Y entre los dos se gastaron los 100.700 puntos del día sin
 * publicar nada.
 */
describe("el afinado no se atasca en lo que ya falló", () => {
  it("lo nunca intentado va antes que lo que ya falló", () => {
    const afinar = leer("src/lib/cj/afinar.ts");
    const orden = afinar.slice(
      afinar.indexOf(".orderBy("),
      afinar.indexOf(".limit(o.limite)"),
    );
    const nunca = orden.indexOf("cotizadoEn} is not null");
    const fecha = orden.indexOf("asc(enviosProducto.cotizadoEn)");
    expect(nunca).toBeGreaterThan(0);
    expect(fecha).toBeGreaterThan(nunca);
  });

  it("cuando CJ no da precio, el motivo enseña lo que mandó", () => {
    const flete = leer("src/lib/cj/flete.ts");
    expect(flete).toContain("sin precio válido en ${opciones.length}");
    expect(flete).toMatch(
      /logisticName \?\? "\?"\}=\$\{String\(o\.logisticPrice/,
    );
  });

  it("GitHub no le habla a CJ mientras el reloj late", () => {
    const ruta = leer("src/app/datos/sincronizar/route.ts");
    expect(ruta).toMatch(
      /const relojLate =\s*\(?await ultimoLatidoHaceMs\(db\)\)? < 5 \* 60_000/,
    );
    /* Las tres puertas a CJ: stock, importación masiva y afinado. */
    expect(ruta.match(/!relojLate/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(ruta).toContain("el reloj late: CJ es suyo");
  });
});
