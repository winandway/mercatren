import { describe, expect, it } from "vitest";

import {
  ajustarAlMonto,
  cuadrarFactura,
  cuantoCobrarParaRecibir,
  lasDosCifras,
} from "@/lib/facturar/cuadrar";

/**
 * CUADRAR UNA FACTURA CON CANTIDADES ENTERAS (26 ago 2026).
 *
 * El caso real: un comercio vende tubo estructural a $199.05 y tiene que
 * cobrar $7,475.00 exactos. 7475 / 199.05 = 37,55 unidades — no da entero, y
 * se puso a probar a mano.
 */
const TUBOS = [
  { id: "a", titulo: "Tubo estructural", precioCentavos: 19_905 },
  { id: "b", titulo: "Tubo 160x65x3mmx12mts", precioCentavos: 19_161 },
];

describe("cuadrarFactura", () => {
  it("encuentra la combinación EXACTA cuando existe", () => {
    /* 3 × $199.05 = $597.15 justo. */
    const r = cuadrarFactura(TUBOS, 59_715)!;
    expect(r.exacto).toBe(true);
    expect(r.totalCentavos).toBe(59_715);
    expect(r.diferenciaCentavos).toBe(0);
  });

  it("y cuando NO existe, da la más cercana de verdad", () => {
    /* Con $199.05 y $191.61 no hay combinación exacta para $7,475 (el máximo
       común divisor de los dos precios no divide al objetivo). La primera
       versión caía a un llenado voraz y devolvía $81 de más; la búsqueda da
       26 + 12 unidades = $7,474.62, treinta y ocho centavos. */
    const r = cuadrarFactura(TUBOS, 747_500)!;
    expect(r.exacto).toBe(false);
    expect(Math.abs(r.diferenciaCentavos)).toBeLessThanOrEqual(100);
  });

  it("las líneas cuadran con el total: no hay cuentas sueltas", () => {
    const r = cuadrarFactura(TUBOS, 747_500)!;
    const suma = r.lineas.reduce((s, l) => s + l.subtotalCentavos, 0);
    expect(suma).toBe(r.totalCentavos);
    for (const l of r.lineas) {
      expect(l.subtotalCentavos).toBe(l.cantidad * l.precioCentavos);
      /* Una línea con cantidad cero no se enseña: sería ruido. */
      expect(l.cantidad).toBeGreaterThan(0);
    }
  });

  it("un solo producto: cae en el múltiplo más cercano", () => {
    const uno = [TUBOS[0]!];
    const r = cuadrarFactura(uno, 747_500)!;
    expect(r.lineas).toHaveLength(1);
    expect(r.lineas[0]!.cantidad).toBeGreaterThan(0);
    expect(r.totalCentavos % 19_905).toBe(0);
    /* 37 o 38 unidades: nunca se aleja más de un tubo. */
    expect(Math.abs(r.diferenciaCentavos)).toBeLessThan(19_905);
  });

  it("sin productos usables no inventa nada", () => {
    expect(cuadrarFactura([], 100_000)).toBeNull();
    expect(
      cuadrarFactura(
        [{ id: "x", titulo: "Gratis", precioCentavos: 0 }],
        100_000,
      ),
    ).toBeNull();
    expect(cuadrarFactura(TUBOS, 0)).toBeNull();
  });

  it("el signo de la diferencia dice si falta o sobra", () => {
    const corto = cuadrarFactura([TUBOS[0]!], 19_000)!;
    /* $190 con tubos de $199.05: lo más cercano es uno, y se pasa. */
    expect(corto.diferenciaCentavos).toBeGreaterThan(0);
  });
});

describe("las dos cifras de una factura", () => {
  it("separa lo que paga el cliente de lo que recibe el comercio", () => {
    /* De aquí venía la confusión: «$7,475 con el 3% dentro» y «$2,775 menos
       el 3%» son dos cosas distintas. Se calculan las dos, siempre. */
    const c = lasDosCifras(747_500, 300);
    expect(c.pagaElCliente).toBe(747_500);
    expect(c.margen).toBe(22_425);
    expect(c.recibeElComercio).toBe(725_075);
    expect(c.recibeElComercio + c.margen).toBe(c.pagaElCliente);
  });

  it("al revés: cuánto cobrar para que lleguen X limpios", () => {
    const cobrar = cuantoCobrarParaRecibir(747_500, 300);
    /* Redondeo hacia ARRIBA: hacia abajo llegaría un centavo de menos, y en
       una pantalla de dinero eso es una llamada. */
    expect(lasDosCifras(cobrar, 300).recibeElComercio).toBeGreaterThanOrEqual(
      747_500,
    );
    expect(cobrar).toBe(770_619);
  });

  it("con comisión cero, las dos cifras son la misma", () => {
    const c = lasDosCifras(100_000, 0);
    expect(c.recibeElComercio).toBe(100_000);
    expect(cuantoCobrarParaRecibir(100_000, 0)).toBe(100_000);
  });
});
describe("las unidades que pone la persona mandan (21 sep 2026)", () => {
  /* Richard: «tengo que agregar dos laptops y no me da la opción». */
  const laptop = { id: "l", titulo: "Laptop", precioCentavos: 303_847 };
  const morral = { id: "m", titulo: "Morral", precioCentavos: 19_063 };
  const guante = { id: "g", titulo: "Guante", precioCentavos: 245 };

  it("dos laptops fijas se respetan, y el resto se cuadra con lo demás", () => {
    const r = cuadrarFactura(
      [{ ...laptop, fijas: 2 }, morral, guante],
      648_377,
    )!;
    const suLinea = r.lineas.find((l) => l.id === "l")!;
    expect(suLinea.cantidad).toBe(2);
    expect(r.totalCentavos).toBeGreaterThanOrEqual(648_377 - 300);
    expect(r.totalCentavos).toBeLessThanOrEqual(648_377 + 300);
  });

  it("sin fijar nada, sigue decidiendo el cuadre", () => {
    const r = cuadrarFactura([laptop, morral, guante], 648_377)!;
    expect(r.lineas.reduce((s, l) => s + l.subtotalCentavos, 0)).toBe(
      r.totalCentavos,
    );
  });

  it("si lo fijado ya pasa del monto, se respeta igual y se avisa", () => {
    const r = cuadrarFactura([{ ...laptop, fijas: 3 }, guante], 303_847)!;
    expect(r.lineas.find((l) => l.id === "l")!.cantidad).toBe(3);
    expect(r.exacto).toBe(false);
    expect(r.diferenciaCentavos).toBe(303_847 * 3 - 303_847);
  });

  it("fijar TODO lo marcado no rompe nada", () => {
    const r = cuadrarFactura(
      [
        { ...laptop, fijas: 2 },
        { ...morral, fijas: 1 },
      ],
      648_377,
    )!;
    expect(r.totalCentavos).toBe(303_847 * 2 + 19_063);
  });
});

describe("ajustar el precio de las unidades al monto exacto (21 sep 2026)", () => {
  /* Richard: «los 6.483,77 se dividen en dos y ajusta tú misma los precios». */
  const dosLaptops = {
    id: "l",
    titulo: "Laptop",
    precioCentavos: 303_847,
    cantidad: 2,
    subtotalCentavos: 607_694,
  };

  it("EL CASO: dos laptops a $6.483,77 exactos, hasta el último centavo", () => {
    const r = ajustarAlMonto([dosLaptops], 648_377)!;
    expect(r.totalCentavos).toBe(648_377);
    expect(r.lineas[0]!.subtotalCentavos).toBe(648_377);
    /* 6.483,77 / 2 = 3.241,885: el unitario se guarda con milésimas. */
    expect(r.lineas[0]!.precioAjustadoMilesimas).toBe(324_188_500);
    expect(r.lineas[0]!.precioOriginalCentavos).toBe(303_847);
  });

  it("con varias líneas reparte en proporción y el total sigue exacto", () => {
    const r = ajustarAlMonto(
      [
        dosLaptops,
        {
          id: "m",
          titulo: "Morral",
          precioCentavos: 19_063,
          cantidad: 1,
          subtotalCentavos: 19_063,
        },
      ],
      648_377,
    )!;
    expect(r.lineas.reduce((s, l) => s + l.subtotalCentavos, 0)).toBe(648_377);
    /* La más cara se lleva la mayor parte. */
    expect(r.lineas[0]!.subtotalCentavos).toBeGreaterThan(
      r.lineas[1]!.subtotalCentavos,
    );
  });

  it("ningún centavo se pierde por el redondeo, sea cual sea el reparto", () => {
    for (const objetivo of [100_001, 648_377, 999_999, 1]) {
      const r = ajustarAlMonto(
        [
          {
            id: "a",
            titulo: "A",
            precioCentavos: 333,
            cantidad: 3,
            subtotalCentavos: 999,
          },
          {
            id: "b",
            titulo: "B",
            precioCentavos: 777,
            cantidad: 7,
            subtotalCentavos: 5_439,
          },
        ],
        objetivo,
      )!;
      expect(r.lineas.reduce((s, l) => s + l.subtotalCentavos, 0)).toBe(
        objetivo,
      );
    }
  });

  it("sin unidades no hay nada que repartir", () => {
    expect(ajustarAlMonto([], 648_377)).toBeNull();
    expect(ajustarAlMonto([dosLaptops], 0)).toBeNull();
  });
});
