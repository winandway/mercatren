import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * ══ UNA DESCRIPCIÓN DE CJ POR LATIDO (14 sep 2026) ══
 *
 * Chile: 1.245 fichas a la venta sin descripción en ningún idioma, porque
 * traerlas de CJ era un botón del panel y nadie lo pulsaba 250 veces.
 */
const reloj = readFileSync("src/lib/traduccion/descripcion-reloj.ts", "utf8");
const tick = readFileSync("src/lib/reloj/tick.ts", "utf8");

describe("traer una descripción desde el reloj", () => {
  it("es UNA por latido, de cualquier plaza, la publicada más vieja sin texto ni intento", () => {
    expect(reloj).toContain(".limit(1)");
    expect(reloj).toContain("asc(productos.creadoEn)");
    expect(reloj).toContain('eq(productos.estado, "publicado")');
    expect(reloj).toContain("isNull(intentosDescripcion.productoId)");
    /* Nada de «plaza del panel»: el reloj no tiene selector. */
    expect(reloj).not.toContain("mercadoDelPanel");
    expect(reloj).not.toContain("paisOrigen");
  });
  it("si CJ no trae texto, el motivo queda en intentos_descripcion y no se inventa nada", () => {
    expect(reloj).toMatch(/\.insert\(intentosDescripcion\)/);
    expect(reloj).not.toMatch(/tituloEs|imagen/);
  });
  it("el reloj la llama solo con puntos de CJ y cada tres minutos", () => {
    expect(tick).toMatch(
      /!cjEnPausa && queda\(\) > 6_000 && new Date\(\)\.getUTCMinutes\(\) % 3 === 0/,
    );
    expect(tick).toContain("traerDescripcionDesdeElReloj");
  });
});
