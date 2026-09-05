import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  COLA_QUE_MANDA,
  MINUTOS_ENTRE_STOCK,
  STOCK_POR_LATIDO,
  cuantosDeStock,
  puntosLiberadosAlDia,
} from "@/lib/cj/reparto-de-puntos";

/**
 * LOS PUNTOS DE CJ SON EL PRESUPUESTO DEL DÍA (4 sep 2026).
 *
 * El dueño preguntó por qué iban tan lentos los 44.850 en revisión. La causa
 * medida: CJ da 50.000 puntos al día (+100 por dólar comprado) y **el
 * refresco de stock se estaba llevando la mitad** — usa la misma llamada de
 * 10 puntos que el afinado, a 2 por latido, con el sitio latiendo cada
 * minuto. Y no publica ni un producto.
 */
describe("el reparto de los puntos de CJ", () => {
  it("con cola grande, el stock casi no gasta", () => {
    /* 44.850 esperando: cada punto que se va en refrescar stock es un
       producto que no sale a la venta. */
    const enUnaHora = Array.from({ length: 60 }, (_, m) =>
      cuantosDeStock(44_850, m),
    ).reduce((a, b) => a + b, 0);
    expect(enUnaHora).toBe(60 / MINUTOS_ENTRE_STOCK);
    /* Contra lo que gastaba antes: 2 por latido, 120 a la hora. */
    expect(enUnaHora).toBeLessThan(60 * STOCK_POR_LATIDO * 0.1);
  });

  it("PERO NUNCA SE APAGA DEL TODO", () => {
    /* Un producto publicado cuyo stock no se mira jamás se queda diciendo
       «quedan 5» para siempre. El checkout lo atrapa antes de cobrar, pero
       la ficha estaría mintiendo. Se espacia, no se apaga. */
    const enUnDia = Array.from({ length: 1440 }, (_, m) =>
      cuantosDeStock(44_850, m),
    ).reduce((a, b) => a + b, 0);
    expect(enUnDia).toBeGreaterThan(0);
  });

  it("CON CJ SIN PUNTOS NADIE LLAMA, ni el stock", () => {
    /* Se vio en producción diez minutos después de publicar la primera
       versión: el afinado decía «en pausa, CJ no tiene puntos» y el stock
       seguía pidiendo sus dos por latido. Misma API, sin puntos: llamadas
       que fallan, y al día siguiente los primeros puntos se los llevaba el
       refresco en vez del afinado. */
    expect(cuantosDeStock(0, 0, true)).toBe(0);
    expect(cuantosDeStock(0, 7, true)).toBe(0);
    expect(cuantosDeStock(44_850, 0, true)).toBe(0);
  });

  it("la pausa se toma del afinado, no se adivina", () => {
    const tick = readFileSync("src/lib/reloj/tick.ts", "utf8");
    /* Y `colaPorAfinar` se asigna FUERA de las ramas: dentro del `else if`
       se quedaba en null cada vez que el afinado no llegaba a correr. */
    expect(tick).toContain("cjEnPausa = true");
    expect(tick).toMatch(/cuantosDeStock\([\s\S]{0,120}cjEnPausa,?\s*\)/);
    const dentroDelElseIf = tick.slice(
      tick.indexOf("} else if (r.afinados"),
      tick.indexOf("colaPorAfinar = r.restantes"),
    );
    expect(dentroDelElseIf).toContain("}");
  });

  it("sin cola, el stock vuelve a su ritmo normal", () => {
    /* Cuando ya no hay nada esperando a publicarse, los puntos son suyos. */
    expect(cuantosDeStock(0, 7)).toBe(STOCK_POR_LATIDO);
    expect(cuantosDeStock(COLA_QUE_MANDA - 1, 7)).toBe(STOCK_POR_LATIDO);
    expect(cuantosDeStock(COLA_QUE_MANDA, 7)).toBe(0);
  });

  it("libera decenas de miles de puntos al día", () => {
    /* Medido: ~1.584 latidos al día (22 latidos en 20 minutos). */
    expect(puntosLiberadosAlDia(1584)).toBeGreaterThan(25_000);
  });

  it("el reloj usa la regla en vez de gastar 2 fijos", () => {
    /* El candado de verdad: la regla puede estar perfecta mientras el reloj
       sigue llamando `refrescarExistenciasCj(2)` a secas. */
    const tick = readFileSync("src/lib/reloj/tick.ts", "utf8");
    /* NO BASTA CON QUE LA IMPORTE: importar la regla y después llamar
       `refrescarExistenciasCj(2)` deja el gasto igual y la prueba en verde.
       Se exige que lo que se le pasa SEA lo que la regla decidió. */
    expect(tick).toContain("const cuantos = cuantosDeStock(");
    expect(tick).toContain("refrescarExistenciasCj(cuantos)");
    expect(tick).toMatch(/refrescarExistenciasCj\(\s*cuantos\s*\)/);
    expect(tick).not.toMatch(/refrescarExistenciasCj\(\s*\d/);
    /* Y la cola tiene que salir del afinado, no de un número escrito a mano. */
    expect(tick).toContain("colaPorAfinar = r.restantes");
  });

  it("el afinado sigue siendo el primero en gastar", () => {
    /* El orden del latido importa: si el stock corriera antes, se llevaría
       los puntos que el afinado necesita para publicar. */
    const tick = readFileSync("src/lib/reloj/tick.ts", "utf8");
    expect(tick.indexOf("afinarImportados")).toBeLessThan(
      tick.indexOf("refrescarExistenciasCj"),
    );
  });
});
