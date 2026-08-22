import { describe, expect, it } from "vitest";

import {
  cargosAGuardar,
  MAXIMO_CARGO_CENTAVOS,
  revisarCargos,
  totalDelCobro,
} from "@/lib/cobros/cargos";

/**
 * FLETE Y MANEJO: LO QUE NO ES MERCANCÍA.
 *
 * El caso real: una ferretería vende diez sacos de cemento por $540, el camión
 * son $40 y subirlos a un tercer piso con dos ayudantes, $20. El cliente paga
 * $600.
 */
describe("el total suma la mercancía y los cargos", () => {
  it("540 + 40 de flete + 20 de manejo son 600", () => {
    expect(
      totalDelCobro(54_000, [
        { tipo: "flete", concepto: null, montoCentavos: 4_000 },
        { tipo: "manejo", concepto: null, montoCentavos: 2_000 },
      ]),
    ).toBe(60_000);
  });

  it("sin cargos, el total es la mercancía", () => {
    /* La mayoría de las ventas no llevan ninguno. */
    expect(totalDelCobro(54_000, [])).toBe(54_000);
  });

  it("un negativo no le resta al total", () => {
    /* Un cargo en negativo sería un descuento disfrazado, y los descuentos no
       se hacen por aquí: se hacen bajando el precio de la mercancía. */
    expect(
      totalDelCobro(10_000, [
        { tipo: "flete", concepto: null, montoCentavos: -5_000 },
      ]),
    ).toBe(10_000);
  });
});

describe("qué se rechaza y qué no", () => {
  it("un cargo vacío NO es un error", () => {
    /* Exigirlos convertiría el caso normal —una venta sin flete— en un
       formulario que no deja pasar. */
    expect(
      revisarCargos([
        { tipo: "flete", montoCentavos: null },
        { tipo: "manejo", montoCentavos: null },
      ]),
    ).toEqual([]);
  });

  it("un monto absurdo se para, y dice cuál", () => {
    /* Un dedo de más convierte $40 en $4.000 y quien paga lo ve como un robo.
       El tope corta el error de tecleo, no el negocio. */
    const fallos = revisarCargos([
      { tipo: "flete", montoCentavos: MAXIMO_CARGO_CENTAVOS + 1 },
    ]);
    expect(fallos).toContain("flete_muy_alto");
  });

  it("distingue cuál de los dos está mal", () => {
    /* Un «revisa los campos» con dos casillas iguales delante obliga a
       adivinar cuál. */
    const fallos = revisarCargos([
      { tipo: "flete", montoCentavos: 4_000 },
      { tipo: "manejo", montoCentavos: Number.NaN },
    ]);
    expect(fallos).toEqual(["manejo_invalido"]);
  });
});

describe("qué se guarda de verdad", () => {
  it("un cargo en CERO no se guarda", () => {
    /* En la página de pago saldría «Flete: $0.00», que no significa nada y
       hace dudar de si falta algo por cobrar. */
    expect(
      cargosAGuardar([
        { tipo: "flete", concepto: "", montoCentavos: 0 },
        { tipo: "manejo", concepto: "", montoCentavos: null },
      ]),
    ).toEqual([]);
  });

  it("el concepto se guarda, y vacío queda en nulo", () => {
    const [flete] = cargosAGuardar([
      {
        tipo: "flete",
        concepto: "  Entrega en Av. Bolívar  ",
        montoCentavos: 4_000,
      },
    ]);
    expect(flete?.concepto).toBe("Entrega en Av. Bolívar");

    const [manejo] = cargosAGuardar([
      { tipo: "manejo", concepto: "   ", montoCentavos: 2_000 },
    ]);
    expect(manejo?.concepto).toBeNull();
  });

  it("el concepto NO es obligatorio", () => {
    /* Obligar a explicar cada cargo haría que un comercio con prisa lo sumara
       al precio de la mercancía — que es justo lo que esto viene a evitar. */
    const guardados = cargosAGuardar([
      { tipo: "flete", concepto: "", montoCentavos: 4_000 },
    ]);
    expect(guardados).toHaveLength(1);
    expect(guardados[0]?.montoCentavos).toBe(4_000);
  });
});
