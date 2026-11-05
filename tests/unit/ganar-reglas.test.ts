import { describe, expect, it } from "vitest";

import {
  cargoDelClic,
  CPC_CENTAVOS,
  diaDelGasto,
  esRobot,
  mezclarPromocionados,
  nuevaPrueba,
  PRECIO_PRO_CENTAVOS,
  presupuestoDesdeTexto,
  presupuestoValido,
  puedeEmpezarPrueba,
  puedePublicarOtro,
  sigueSaliendoHoy,
  tienePro,
  TOPE_PRO,
  TOPE_SIN_PLAN,
} from "@/lib/ganar/reglas";

/**
 * FASE 4 · GANAR MÁS (5 nov 2026). Lo que no puede pasar sin que esto se
 * ponga en rojo: cobrar un clic por encima del presupuesto del día, cobrar
 * clics de robots, dar un segundo mes gratis, quitarle a un comercio lo que
 * ya tenía publicado, o tapar el catálogo con promocionados.
 */
const DIA = 24 * 60 * 60 * 1000;
const AHORA = Date.UTC(2026, 10, 5, 12);

describe("el plan Pro", () => {
  it("cuesta lo decidido: 9,99 al mes", () => {
    expect(PRECIO_PRO_CENTAVOS).toBe(999);
  });

  it("el mes gratis dura 30 días y es uno por tienda", () => {
    const plan = nuevaPrueba(AHORA);
    expect(tienePro(plan, AHORA + 29 * DIA)).toBe(true);
    expect(tienePro(plan, AHORA + 30 * DIA)).toBe(false);
    expect(puedeEmpezarPrueba(null)).toBe(true);
    expect(puedeEmpezarPrueba(plan)).toBe(false);
  });

  it("cancelar no quita lo que ya corre; lo pagado alarga", () => {
    const cancelada = { ...nuevaPrueba(AHORA), estado: "cancelada" as const };
    expect(tienePro(cancelada, AHORA + DIA)).toBe(true);
    const pagada = {
      estado: "activa" as const,
      pruebaHasta: AHORA,
      pagadoHasta: AHORA + 60 * DIA,
    };
    expect(tienePro(pagada, AHORA + 45 * DIA)).toBe(true);
    expect(tienePro(null, AHORA)).toBe(false);
  });

  it("sin plan, 100 publicados; con Pro, 5.000; lo publicado no se pierde", () => {
    expect(TOPE_SIN_PLAN).toBe(100);
    expect(TOPE_PRO).toBe(5000);
    expect(
      puedePublicarOtro({
        publicados: 99,
        pro: false,
        yaEstabaPublicado: false,
      }),
    ).toBe(true);
    expect(
      puedePublicarOtro({
        publicados: 100,
        pro: false,
        yaEstabaPublicado: false,
      }),
    ).toBe(false);
    expect(
      puedePublicarOtro({
        publicados: 100,
        pro: true,
        yaEstabaPublicado: false,
      }),
    ).toBe(true);
    /* Quien ya pasa del tope edita lo suyo sin que nadie lo frene. */
    expect(
      puedePublicarOtro({
        publicados: 1197,
        pro: false,
        yaEstabaPublicado: true,
      }),
    ).toBe(true);
  });
});

describe("los promocionados", () => {
  it("0,15 por clic y un presupuesto diario de 1 a 50 dólares", () => {
    expect(CPC_CENTAVOS).toBe(15);
    expect(presupuestoValido(100)).toBe(true);
    expect(presupuestoValido(5000)).toBe(true);
    expect(presupuestoValido(99)).toBe(false);
    expect(presupuestoValido(5001)).toBe(false);
    expect(presupuestoValido(150.5)).toBe(false);
  });

  it("el presupuesto se lee como lo escribe la persona", () => {
    expect(presupuestoDesdeTexto("5")).toBe(500);
    expect(presupuestoDesdeTexto(" 12,5 ")).toBe(1250);
    expect(presupuestoDesdeTexto("50.00")).toBe(5000);
    for (const malo of [
      "",
      "0.99",
      "50.01",
      "1.234",
      "1.2.3",
      "-5",
      "5e1",
      "abc",
    ])
      expect(presupuestoDesdeTexto(malo), malo).toBeNull();
  });

  it("nunca se cobra más que el presupuesto del día", () => {
    expect(
      cargoDelClic({ gastadoHoyCentavos: 0, presupuestoCentavos: 100 }),
    ).toBe(15);
    /* Quedan 10: se cobran 10, no 15. */
    expect(
      cargoDelClic({ gastadoHoyCentavos: 90, presupuestoCentavos: 100 }),
    ).toBe(10);
    /* Ya se llegó: el clic es gratis. */
    expect(
      cargoDelClic({ gastadoHoyCentavos: 100, presupuestoCentavos: 100 }),
    ).toBe(0);
    expect(
      sigueSaliendoHoy({ gastadoHoyCentavos: 100, presupuestoCentavos: 100 }),
    ).toBe(false);
    /* Sumando cien clics, el total nunca pasa del tope. */
    let gastado = 0;
    for (let i = 0; i < 100; i++)
      gastado += cargoDelClic({
        gastadoHoyCentavos: gastado,
        presupuestoCentavos: 100,
      });
    expect(gastado).toBe(100);
  });

  it("el día se cuenta en UTC", () => {
    expect(diaDelGasto(Date.UTC(2026, 10, 5, 23, 59))).toBe("2026-11-05");
    expect(diaDelGasto(Date.UTC(2026, 10, 6, 0, 0))).toBe("2026-11-06");
  });

  it("los robots no pagan clics", () => {
    expect(esRobot("Googlebot/2.1 (+http://www.google.com/bot.html)")).toBe(
      true,
    );
    expect(esRobot("curl/8.4.0")).toBe(true);
    expect(esRobot("")).toBe(true);
    expect(esRobot(null)).toBe(true);
    expect(
      esRobot(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15",
      ),
    ).toBe(false);
    expect(esRobot("Mercatren/1.0 CFNetwork/1568 Darwin/24.0.0")).toBe(false);
  });

  it("como mucho 2 de cada 12, con su etiqueta y sin salir dos veces", () => {
    const lista = Array.from({ length: 24 }, (_, i) => ({ id: `p${i}` }));
    const promos = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "p3" }];
    const mezcla = mezclarPromocionados(lista, promos);
    const patrocinados = mezcla.filter((p) => p.enPuestoPagado);
    /* El que ya estaba en la lista SUBE a su puesto patrocinado. */
    expect(patrocinados.map((p) => p.id)).toEqual(["a", "b", "c", "p3"]);
    expect(mezcla.filter((p) => p.id === "p3")).toHaveLength(1);
    /* En cada docena de la mezcla, no más de 2. */
    for (let i = 0; i < mezcla.length; i += 12) {
      expect(
        mezcla.slice(i, i + 12).filter((p) => p.enPuestoPagado).length,
      ).toBeLessThanOrEqual(2);
    }
    /* El resto de la lista sale entero y en su orden. */
    expect(mezcla.filter((p) => !p.enPuestoPagado)).toEqual(
      lista.filter((p) => p.id !== "p3"),
    );
  });

  it("la marca no pisa los datos del producto (la firma del clic)", () => {
    const promo = { id: "x", patrocinado: { promocionId: "pr", firma: "f" } };
    const [uno] = mezclarPromocionados<{
      id: string;
      patrocinado?: { promocionId: string; firma: string };
    }>([{ id: "x" }], [promo]);
    expect(uno).toMatchObject({
      patrocinado: { promocionId: "pr", firma: "f" },
      enPuestoPagado: true,
    });
  });

  it("un catálogo de un solo producto promocionado lo enseña patrocinado", () => {
    expect(mezclarPromocionados([{ id: "x" }], [{ id: "x" }])).toEqual([
      { id: "x", enPuestoPagado: true },
    ]);
    expect(mezclarPromocionados([{ id: "x" }], [])).toEqual([{ id: "x" }]);
  });
});
