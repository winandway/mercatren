import { describe, expect, it } from "vitest";

import {
  cuantoSeAhorro,
  LADO_MAXIMO_LOGO,
  LADO_MAXIMO_PRODUCTO,
  medidaDestino,
  pesoLegible,
} from "@/lib/imagenes/medidas";

/**
 * ENCOGER LA FOTO ANTES DE SUBIRLA.
 *
 * De dónde salió (9 ago 2026): los comercios no podían subir sus fotos. El
 * sitio mandaba el archivo tal como salía del teléfono —entre 3 y 8 MB— y con
 * la conexión de Venezuela eso son minutos, o un corte a mitad de camino.
 */
describe("a qué medida se encoge una foto", () => {
  it("una foto de celular apaisada baja al lado largo permitido", () => {
    // Lo típico de un teléfono: 4032 x 3024.
    const r = medidaDestino({ ancho: 4032, alto: 3024 }, LADO_MAXIMO_PRODUCTO);
    expect(r.ancho).toBe(1600);
    expect(r.alto).toBe(1200);
  });

  it("y una vertical también, sin voltearse", () => {
    const r = medidaDestino({ ancho: 3024, alto: 4032 }, LADO_MAXIMO_PRODUCTO);
    expect(r.alto).toBe(1600);
    expect(r.ancho).toBe(1200);
  });

  it("no deforma: la proporción se respeta", () => {
    const origen = { ancho: 4000, alto: 2250 };
    const r = medidaDestino(origen, LADO_MAXIMO_PRODUCTO);
    const antes = origen.ancho / origen.alto;
    const despues = r.ancho / r.alto;
    expect(Math.abs(antes - despues)).toBeLessThan(0.01);
  });

  /**
   * EL ERROR FÁCIL DE COMETER.
   *
   * Estirar una foto de 300px hasta 1600 no le agrega ni un detalle: la deja
   * borrosa y pesando más que el original. Encoger es lo único que ayuda.
   */
  it("una foto que YA es pequeña no se agranda", () => {
    const r = medidaDestino({ ancho: 300, alto: 200 }, LADO_MAXIMO_PRODUCTO);
    expect(r).toEqual({ ancho: 300, alto: 200 });
  });

  it("una que mide justo el máximo se queda igual", () => {
    const r = medidaDestino({ ancho: 1600, alto: 900 }, LADO_MAXIMO_PRODUCTO);
    expect(r).toEqual({ ancho: 1600, alto: 900 });
  });

  it("el logo se encoge más, porque se dibuja pequeño", () => {
    const r = medidaDestino({ ancho: 2000, alto: 2000 }, LADO_MAXIMO_LOGO);
    expect(r).toEqual({ ancho: 512, alto: 512 });
    expect(LADO_MAXIMO_LOGO).toBeLessThan(LADO_MAXIMO_PRODUCTO);
  });
});

describe("las medidas raras no rompen nada", () => {
  it("una foto muy alargada nunca da un lado en cero", () => {
    /* 4000x20 redondeando hacia abajo daría alto 0, y un lienzo con un lado en
       cero no dibuja nada: la foto saldría en negro. */
    const r = medidaDestino({ ancho: 4000, alto: 20 }, LADO_MAXIMO_PRODUCTO);
    expect(r.alto).toBeGreaterThanOrEqual(1);
    expect(r.ancho).toBe(1600);
  });

  it("y al revés tampoco", () => {
    const r = medidaDestino({ ancho: 20, alto: 4000 }, LADO_MAXIMO_PRODUCTO);
    expect(r.ancho).toBeGreaterThanOrEqual(1);
    expect(r.alto).toBe(1600);
  });

  it("sin medidas se devuelve tal cual, en vez de inventar un lienzo vacío", () => {
    for (const raro of [
      { ancho: 0, alto: 0 },
      { ancho: -5, alto: 100 },
      { ancho: Number.NaN, alto: 100 },
      { ancho: Number.POSITIVE_INFINITY, alto: 100 },
    ]) {
      expect(medidaDestino(raro, LADO_MAXIMO_PRODUCTO)).toEqual(raro);
    }
  });

  it("NUNCA devuelve un lado mayor que el máximo pedido", () => {
    const medidas = [
      { ancho: 8000, alto: 6000 },
      { ancho: 1601, alto: 1 },
      { ancho: 1, alto: 12000 },
      { ancho: 5000, alto: 5000 },
    ];
    for (const m of medidas) {
      const r = medidaDestino(m, LADO_MAXIMO_PRODUCTO);
      expect(Math.max(r.ancho, r.alto), JSON.stringify(m)).toBeLessThanOrEqual(
        LADO_MAXIMO_PRODUCTO,
      );
    }
  });
});

describe("lo que se le dice a quien sube", () => {
  it("cuánto se ahorró, en porcentaje", () => {
    // 6 MB → 300 KB es el caso normal de una foto de celular.
    expect(cuantoSeAhorro(6 * 1024 * 1024, 300 * 1024)).toBe(95);
  });

  it("si no se ahorró nada, es cero y no un negativo", () => {
    /* Una foto ya optimizada puede salir un pelín más grande. Decirle al
       comerciante "-3 %" lo confunde; cero es honesto y no alarma. */
    expect(cuantoSeAhorro(100, 110)).toBe(0);
    expect(cuantoSeAhorro(0, 500)).toBe(0);
  });

  it("el peso se dice en algo que se entiende", () => {
    expect(pesoLegible(6 * 1024 * 1024)).toBe("6.0 MB");
    expect(pesoLegible(300 * 1024)).toBe("300 KB");
  });

  it("un archivo diminuto nunca dice «0 KB»", () => {
    // "0 KB" se lee como que algo falló.
    expect(pesoLegible(100)).toBe("1 KB");
  });
});
