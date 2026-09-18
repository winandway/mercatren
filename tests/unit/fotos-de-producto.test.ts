import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  agruparFotos,
  elegirFoto,
  FOTOS_GUARDADAS_MAXIMO,
  type FotoGuardada,
  leerFotosGuardadas,
} from "@/lib/catalogo/fotos-de-producto-armar";

/**
 * ══ LA FOTO DE CADA PRODUCTO SE GUARDA ELEGIDA (emergencia de costo, 18 sep 2026) ══
 *
 * El listado de productos era la consulta más cara de la base (cien
 * millones de filas a la hora) por TRES subconsultas por fila que elegían
 * la foto con funciones de ventana. Ahora la lista sana de cada producto
 * vive en `fotos_de_producto` y se elige en código. Estas pruebas fijan que
 * la elección es la MISMA que hacía el SQL, que la lista se arma bien, y
 * que las piezas del mecanismo (llenado, olvido, refresco) están puestas.
 *
 * Comprobada en rojo el 18 sep 2026 quitando `olvidarFotosDe` de
 * `copiar-foto.ts`.
 */

const leer = (r: string) => readFileSync(join(process.cwd(), r), "utf8");
const foto = (n: number): FotoGuardada => ({
  url: `https://x/${n}.jpg`,
  clave: null,
  altEs: null,
  altEn: null,
});

describe("elegirFoto: la misma regla que el SQL (ORDER BY (fila + semilla) % total)", () => {
  const tres = [foto(1), foto(2), foto(3)];

  it("con semilla 0 sale la última, como (fila + 0) % total = 0 en la fila 3", () => {
    expect(elegirFoto(tres, 0)?.url).toBe("https://x/3.jpg");
  });

  it("rota con la semilla: 1 → la 2.ª, 2 → la 1.ª, 3 → la 3.ª", () => {
    expect(elegirFoto(tres, 1)?.url).toBe("https://x/2.jpg");
    expect(elegirFoto(tres, 2)?.url).toBe("https://x/1.jpg");
    expect(elegirFoto(tres, 3)?.url).toBe("https://x/3.jpg");
    expect(elegirFoto(tres, 4)?.url).toBe("https://x/2.jpg");
  });

  it("nunca clava la primera: en un día distinto sale otra", () => {
    const vistas = new Set(
      [1, 2, 3, 4, 5, 6].map((s) => elegirFoto(tres, s)?.url),
    );
    expect(vistas.size).toBe(3);
  });

  it("una sola foto es esa; sin fotos, nada; semillas raras no revientan", () => {
    expect(elegirFoto([foto(9)], 12345)?.url).toBe("https://x/9.jpg");
    expect(elegirFoto([], 3)).toBeNull();
    expect(elegirFoto(null, 3)).toBeNull();
    expect(elegirFoto(tres, -2)?.url).toBe("https://x/1.jpg");
    expect(elegirFoto(tres, Number.NaN)?.url).toBe("https://x/3.jpg");
  });
});

describe("agruparFotos: por producto, en orden, sin vacías y con tope", () => {
  it("agrupa y respeta el orden de llegada", () => {
    const m = agruparFotos([
      {
        productoId: "a",
        url: "u1",
        clave: null,
        textoAltEs: "x",
        textoAltEn: null,
      },
      {
        productoId: "b",
        url: null,
        clave: "k1",
        textoAltEs: null,
        textoAltEn: "y",
      },
      {
        productoId: "a",
        url: null,
        clave: null,
        textoAltEs: null,
        textoAltEn: null,
      },
      {
        productoId: "a",
        url: "u2",
        clave: null,
        textoAltEs: null,
        textoAltEn: null,
      },
    ]);
    expect(m.get("a")).toEqual([
      { url: "u1", clave: null, altEs: "x", altEn: null },
      { url: "u2", clave: null, altEs: null, altEn: null },
    ]);
    expect(m.get("b")).toEqual([
      { url: null, clave: "k1", altEs: null, altEn: "y" },
    ]);
  });

  it("no guarda más de FOTOS_GUARDADAS_MAXIMO por producto", () => {
    const muchas = Array.from({ length: 30 }, (_, i) => ({
      productoId: "a",
      url: `u${i}`,
      clave: null,
      textoAltEs: null,
      textoAltEn: null,
    }));
    expect(agruparFotos(muchas).get("a")).toHaveLength(FOTOS_GUARDADAS_MAXIMO);
  });
});

describe("leerFotosGuardadas: una fila rara no tumba el listado", () => {
  it("lee lo bueno y descarta lo demás", () => {
    expect(
      leerFotosGuardadas('[{"url":"u","clave":null,"altEs":"a","altEn":null}]'),
    ).toEqual([{ url: "u", clave: null, altEs: "a", altEn: null }]);
    expect(leerFotosGuardadas("{no es json")).toEqual([]);
    expect(leerFotosGuardadas(null)).toEqual([]);
    expect(leerFotosGuardadas('[1, "x", {"otra":1}]')).toEqual([]);
  });
});

describe("el mecanismo: se llena solo, se olvida donde cambian las fotos, y el reloj rehace lo viejo", () => {
  const modulo = leer("src/lib/catalogo/fotos-de-producto.ts");

  it("la tabla existe en el esquema y en schema.sql, con su índice", () => {
    expect(leer("src/lib/db/schema.ts")).toContain(
      'sqliteTable(\n  "fotos_de_producto"',
    );
    const schema = leer("schema.sql");
    expect(schema).toContain("CREATE TABLE IF NOT EXISTS `fotos_de_producto`");
    expect(schema).toContain(
      "CREATE INDEX IF NOT EXISTS `idx_fotos_de_producto_actualizado` ON `fotos_de_producto` (`actualizado_en`);",
    );
  });

  it("lo que falta se calcula UNA vez y se guarda; nunca por visita", () => {
    expect(modulo).toContain(
      "const faltan = unicos.filter((id) => !resultado.has(id));",
    );
    expect(modulo).toContain("await guardarFotos(nuevas)");
    /* Un producto sin fotos también se guarda, para no volver a preguntar. */
    expect(modulo).toContain("if (!agrupadas.has(id)) agrupadas.set(id, []);");
  });

  it("todo sitio que toca las fotos olvida la lista guardada", () => {
    for (const archivo of [
      "src/app/datos/socios/productos/route.ts",
      "src/lib/catalogo/copiar-foto.ts",
      "src/lib/catalogo/fotos-automaticas.ts",
      "src/lib/catalogo/sincronizar.ts",
      "src/lib/productos/acciones.ts",
    ]) {
      expect(leer(archivo), archivo).toContain("olvidarFotosDe(");
    }
    /* Y el borrado de una foto desde el panel también. */
    expect(
      leer("src/lib/productos/acciones.ts").match(/olvidarFotosDe\(/g)?.length,
    ).toBeGreaterThanOrEqual(3);
  });

  it("el reloj rehace las de más de un día, un puñado por latido", () => {
    const tick = leer("src/lib/reloj/tick.ts");
    expect(tick).toContain("refrescarFotosViejas(150)");
    expect(modulo).toContain("FOTOS_VIEJAS_MS = 24 * 60 * 60_000");
  });

  it("respeta el tope de valores por sentencia de la base de la nube", () => {
    expect(modulo).toContain("const FILAS_POR_SENTENCIA = 30;");
  });
});
