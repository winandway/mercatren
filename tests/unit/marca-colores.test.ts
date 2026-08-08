import { describe, expect, it } from "vitest";

import {
  COLOR_POR_DEFECTO,
  COLORES_BANNER,
  colorDerivado,
  colorDeBanner,
} from "@/lib/marca/colores";

/**
 * EL COLOR DEL BANNER.
 *
 * Lo que hay que proteger es que **el mismo comercio tenga siempre el mismo
 * color**. Si cambiara entre una visita y otra, su tienda se vería distinta
 * cada vez y nadie la reconocería.
 */
describe("el color que se le asigna solo a un comercio", () => {
  it("el mismo nombre da siempre el mismo color", () => {
    const nombre = "Ferremateriales Bley C.A";
    const primero = colorDerivado(nombre);
    for (let i = 0; i < 50; i++) {
      expect(colorDerivado(nombre).id).toBe(primero.id);
    }
  });

  it("no le importan los espacios ni las mayúsculas", () => {
    /* Un comercio que corrige "FERRETERIA MORA" a "Ferretería Mora" no debería
       cambiar de color por eso... salvo por la tilde, que sí es otro nombre. */
    expect(colorDerivado("Ferretería Mora").id).toBe(
      colorDerivado("  FERRETERÍA MORA  ").id,
    );
  });

  it("siempre devuelve un color de la lista, nunca uno inventado", () => {
    const ids = new Set(COLORES_BANNER.map((c) => c.id));
    for (const nombre of [
      "A",
      "Ferretería Bley",
      "Megayes repuestos de moto",
      "Inversiones Multiservicios AC0803",
      "李记五金",
      "🔧🔩",
      "x".repeat(500),
    ]) {
      expect(ids.has(colorDerivado(nombre).id), nombre).toBe(true);
    }
  });

  it("un nombre vacío cae en el de la marca, no revienta", () => {
    expect(colorDerivado("").id).toBe(COLOR_POR_DEFECTO.id);
    expect(colorDerivado("   ").id).toBe(COLOR_POR_DEFECTO.id);
  });

  it("reparte de verdad: no le da el mismo a todos", () => {
    /* Un hash que devolviera siempre lo mismo pasaría todas las pruebas de
       arriba y no serviría para nada. Con veinte nombres tiene que usar al
       menos la mitad de la paleta. */
    const nombres = Array.from({ length: 20 }, (_, i) => `Comercio ${i} C.A`);
    const usados = new Set(nombres.map((n) => colorDerivado(n).id));
    expect(usados.size).toBeGreaterThanOrEqual(COLORES_BANNER.length / 2);
  });
});

describe("el color que se pinta", () => {
  it("lo que eligió el comercio manda sobre el derivado", () => {
    expect(colorDeBanner("vino", "Ferretería Bley").id).toBe("vino");
    expect(colorDeBanner("ciruela", "Ferretería Bley").id).toBe("ciruela");
  });

  it("sin elección, cae en el derivado de su nombre", () => {
    const nombre = "Ferretería Bley";
    expect(colorDeBanner(null, nombre).id).toBe(colorDerivado(nombre).id);
    expect(colorDeBanner(undefined, nombre).id).toBe(colorDerivado(nombre).id);
    expect(colorDeBanner("", nombre).id).toBe(colorDerivado(nombre).id);
  });

  it("un color que ya no existe no deja el banner en blanco", () => {
    /* Si algún día se quita un color de la paleta, las tiendas que lo tenían
       guardado no pueden quedarse sin fondo: caen en el derivado. */
    const nombre = "Ferretería Bley";
    expect(colorDeBanner("turquesa-que-no-existe", nombre).id).toBe(
      colorDerivado(nombre).id,
    );
  });
});

describe("la paleta", () => {
  it("no hay dos colores con el mismo identificador", () => {
    const ids = COLORES_BANNER.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("no hay dos con el mismo tono", () => {
    const hex = COLORES_BANNER.map((c) => c.hex.toLowerCase());
    expect(new Set(hex).size).toBe(hex.length);
  });

  it("TODOS son oscuros: el texto blanco encima tiene que leerse", () => {
    /* Esta es la prueba que de verdad protege el diseño. Todo el banner —el
       nombre, el RIF, el correo— va en blanco encima. Si alguien agrega un
       color claro a la paleta, la ficha de ese comercio queda ilegible y él no
       va a saber por qué no le compran.

       Se mide la luminancia relativa (la fórmula de WCAG). Con 0.18 el
       contraste contra el blanco pasa de 4.5:1, que es el mínimo para texto. */
    for (const color of COLORES_BANNER) {
      expect(
        luminancia(color.hex),
        `${color.id} es demasiado claro`,
      ).toBeLessThan(0.18);
    }
  });

  it("todos son hex de seis dígitos", () => {
    for (const color of COLORES_BANNER) {
      expect(color.hex, color.id).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

/** Luminancia relativa según WCAG, para comprobar el contraste. */
function luminancia(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  const canales = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * canales[0]! + 0.7152 * canales[1]! + 0.0722 * canales[2]!;
}
