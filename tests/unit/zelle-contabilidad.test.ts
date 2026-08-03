import { describe, expect, it } from "vitest";

import {
  cuentaComoIngreso,
  totalizarIngresos,
  type MovimientoContable,
} from "@/lib/zelle/contabilidad";

/**
 * Esta es la regla que no se puede romper nunca: los retiros no son ventas.
 * Si alguien cambia esto, los cierres de venta del comercio quedan inflados.
 */

const entradaAprobada: MovimientoContable = {
  tipo: "entrada",
  estado: "aprobado",
  montoCentavos: 25000,
  comisionCentavos: 750,
  netoCentavos: 24250,
};

const retiroAprobado: MovimientoContable = {
  tipo: "retiro",
  estado: "aprobado",
  montoCentavos: 100000,
};

describe("que cuenta como ingreso", () => {
  it("una entrada aprobada si cuenta", () => {
    expect(cuentaComoIngreso(entradaAprobada)).toBe(true);
  });

  it("un retiro NO cuenta, aunque este aprobado", () => {
    expect(cuentaComoIngreso(retiroAprobado)).toBe(false);
  });

  it("una entrada pendiente todavia no entro a caja", () => {
    expect(cuentaComoIngreso({ ...entradaAprobada, estado: "pendiente" })).toBe(
      false,
    );
  });

  it("una entrada rechazada nunca entro a caja", () => {
    expect(cuentaComoIngreso({ ...entradaAprobada, estado: "rechazado" })).toBe(
      false,
    );
  });
});

describe("totales", () => {
  it("un retiro grande no mueve el total ni un centavo", () => {
    const soloEntrada = totalizarIngresos([entradaAprobada]);
    const conRetiro = totalizarIngresos([entradaAprobada, retiroAprobado]);

    expect(conRetiro).toEqual(soloEntrada);
    expect(conRetiro.montoCentavos).toBe(25000);
  });

  it("suma monto, comision y neto de las entradas aprobadas", () => {
    const total = totalizarIngresos([
      entradaAprobada,
      entradaAprobada,
      retiroAprobado,
      { ...entradaAprobada, estado: "rechazado" },
    ]);

    expect(total).toEqual({
      pagos: 2,
      montoCentavos: 50000,
      comisionCentavos: 1500,
      netoCentavos: 48500,
    });
  });

  it("sin movimientos el total es cero, no un error", () => {
    expect(totalizarIngresos([])).toEqual({
      pagos: 0,
      montoCentavos: 0,
      comisionCentavos: 0,
      netoCentavos: 0,
    });
  });

  it("la comision mas el neto da el monto cobrado", () => {
    const total = totalizarIngresos([entradaAprobada, entradaAprobada]);
    expect(total.comisionCentavos + total.netoCentavos).toBe(
      total.montoCentavos,
    );
  });
});
