import { describe, expect, it } from "vitest";

import { fechaCorta, fechaHora, fechaLarga } from "@/lib/fechas";

/**
 * LAS FECHAS NO PUEDEN CORRERSE UN DÍA.
 *
 * EL FALLO QUE ESTO ARREGLA (7 ago 2026). Un artículo del blog fechado
 * "2026-08-07" salía publicado **"6 ago 2026"**. La causa: `new Date()` sobre
 * una fecha sin hora la interpreta como medianoche UTC, y la operación se
 * muestra en la zona del este, que va cuatro o cinco horas atrás — así que
 * caía en el día anterior.
 *
 * No era un artículo: era TODO el sitio. Cada nota del blog y cada página de
 * documentación mostraba un día menos del que tiene escrito, desde siempre.
 * Es de esos fallos que nadie reporta porque un día de diferencia parece un
 * despiste de quien escribió, no un error del sistema.
 *
 * La prueba fija el comportamiento: una fecha suelta se muestra el día que
 * dice, y un instante con hora se respeta tal cual.
 */
describe("una fecha suelta se muestra el día que dice", () => {
  it("no se corre al día anterior por la zona horaria", () => {
    expect(fechaCorta("2026-08-07")).toContain("7");
    expect(fechaCorta("2026-08-07")).toContain("ago");
    expect(fechaCorta("2026-08-07")).toContain("2026");
  });

  it("aguanta el caso peor: el primero de enero", () => {
    /* Si algo va a correrse de día, aquí además se lleva el mes y el AÑO por
       delante: medianoche UTC del 1 de enero es el 31 de diciembre anterior en
       Nueva York. */
    const texto = fechaCorta("2026-01-01");
    expect(texto).toContain("1");
    expect(texto).toContain("2026");
    expect(texto).not.toContain("2025");
  });

  it("y el último día del año tampoco salta", () => {
    const texto = fechaCorta("2026-12-31");
    expect(texto).toContain("31");
    expect(texto).toContain("2026");
    expect(texto).not.toContain("2027");
  });

  it("vale igual en inglés", () => {
    const texto = fechaCorta("2026-08-07", "en");
    expect(texto).toContain("7");
    expect(texto).toContain("2026");
  });

  it("y en la versión larga", () => {
    expect(fechaLarga("2026-08-07")).toContain("7");
    expect(fechaLarga("2026-08-07")).not.toContain("6 ");
  });

  it("todos los días de un mes se muestran tal cual", () => {
    /* La comprobación de verdad: no basta con que funcione el día que se
       escribió la prueba. Ninguno de los 31 puede correrse. */
    for (let dia = 1; dia <= 31; dia++) {
      const clave = `2026-03-${String(dia).padStart(2, "0")}`;
      expect(fechaCorta(clave), `el día ${dia} se corrió`).toContain(
        String(dia),
      );
    }
  });
});

describe("un instante con hora se respeta tal cual", () => {
  it("no se le toca la hora a una fecha completa", () => {
    /* Los comprobantes y los movimientos llegan con su hora de verdad. El
       arreglo de arriba solo puede aplicarse a las fechas SIN hora; si tocara
       estas, cambiaría la hora de operaciones reales. */
    const texto = fechaHora("2026-08-07T16:30:00.000Z");
    expect(texto).toContain("12:30"); // 16:30 UTC son las 12:30 en Nueva York
  });

  it("un Date se usa como viene", () => {
    const f = new Date(Date.UTC(2026, 7, 7, 16, 30));
    expect(fechaHora(f)).toContain("12:30");
  });
});

describe("lo que no es una fecha no revienta la pantalla", () => {
  it("nulo y vacío devuelven nulo", () => {
    expect(fechaCorta(null)).toBeNull();
    expect(fechaCorta(undefined)).toBeNull();
    expect(fechaCorta("no soy una fecha")).toBeNull();
  });
});
