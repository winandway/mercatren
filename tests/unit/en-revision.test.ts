import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * NADA DE CJ SE VENDE SIN PASAR EL ÚLTIMO FILTRO (2 sep 2026). Palabras del
 * dueño: «hasta que no pase el último filtro —precio correcto, tallas
 * correctas, cálculo del envío correcto— no debería ponerse a la venta».
 */
const leer = (r: string) => readFileSync(r, "utf-8");

describe("el estado «en revisión»", () => {
  it("existe y NO es «publicado»: lo que está en revisión no sale en la tienda ni en Google", () => {
    /* Se lee el esquema como texto: importarlo arrastra medio proyecto a la
       medición de cobertura y la tumba. */
    expect(leer("src/lib/db/schema.ts")).toMatch(
      /ESTADOS_PRODUCTO = \[[\s\S]*?"en_revision"[\s\S]*?\] as const/,
    );
    /* Todo lo público filtra por publicado; con eso basta para que lo que
       está en revisión sea invisible. */
    for (const ruta of [
      "src/lib/catalogo/consultas.ts",
      "src/app/datos/google/route.ts",
      "src/app/mapa/[parte]/route.ts",
    ]) {
      expect(leer(ruta), ruta).toContain('"publicado"');
      expect(leer(ruta), ruta).not.toContain("en_revision");
    }
  });

  it("lo que trae la importación masiva NACE en revisión, nunca publicado", () => {
    const fuente = leer("src/lib/cj/masivo-servidor.ts");
    expect(fuente).toContain('estado: "en_revision" as const');
    expect(fuente).not.toContain('estado: "publicado" as const');
  });

  it("el afinado publica SOLO lo que estaba en revisión, y solo con flete real y stock", () => {
    const fuente = leer("src/lib/cj/afinar.ts");
    expect(fuente).toContain(
      "case when ${productos.estado} = 'en_revision' then 'publicado' else ${productos.estado} end",
    );
    expect(fuente).toMatch(/stock > 0\s*\?/);
    /* Y toma también los cotizados con repartidor regional. */
    expect(fuente).toContain("REGIONALES.map(");
  });

  it("el barrido retira lo publicado sin flete real y publica lo verificado; corre en el reloj y en el vigilante", () => {
    const barrido = leer("src/lib/cj/verificados.ts");
    expect(barrido).toContain(
      '.set({ estado: "en_revision", actualizadoEn: ahora })',
    );
    expect(barrido).toContain(
      '.set({ estado: "publicado", actualizadoEn: ahora })',
    );
    expect(barrido).toContain('eq(enviosProducto.origen, "estimado")');
    expect(barrido).toContain("lte(productos.precioBaseCentavos, 0)");
    expect(leer("src/app/datos/sincronizar/route.ts")).toContain(
      "barrerNoVerificados()",
    );
    expect(leer("src/lib/vigilante/correr.ts")).toContain(
      "barrerNoVerificados()",
    );
  });

  it("el panel lo enseña con su pestaña y su texto en los dos idiomas", () => {
    expect(leer("src/app/[locale]/panel/productos/page.tsx")).toContain(
      'clave: "en_revision"',
    );
    const es = JSON.parse(leer("messages/es.json"));
    const en = JSON.parse(leer("messages/en.json"));
    expect(es.panel.misProductos.estados.en_revision).toBeTruthy();
    expect(en.panel.misProductos.estados.en_revision).toBeTruthy();
  });
});
