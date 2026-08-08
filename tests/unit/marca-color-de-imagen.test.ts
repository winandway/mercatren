import { describe, expect, it } from "vitest";

import {
  aRgb,
  colorDeBannerDesdeLogo,
  colorDeLogo,
  masCercanoDeLaPaleta,
} from "@/lib/marca/color-de-imagen";
import { COLOR_POR_DEFECTO, COLORES_BANNER } from "@/lib/marca/colores";

/** Arma los píxeles de un canvas a partir de una lista de colores. */
function pixeles(
  colores: [r: number, g: number, b: number, a?: number][],
): Uint8ClampedArray {
  const datos = new Uint8ClampedArray(colores.length * 4);
  colores.forEach(([r, g, b, a = 255], i) => {
    datos[i * 4] = r;
    datos[i * 4 + 1] = g;
    datos[i * 4 + 2] = b;
    datos[i * 4 + 3] = a;
  });
  return datos;
}

/** Repite un color n veces, para simular superficie. */
const veces = (
  n: number,
  color: [number, number, number, number?],
): [number, number, number, number?][] =>
  Array.from({ length: n }, () => color);

const BLANCO: [number, number, number] = [255, 255, 255];
const NEGRO: [number, number, number] = [10, 10, 10];
const AZUL_BLEY: [number, number, number] = [34, 51, 204];
const ROJO_BLEY: [number, number, number] = [237, 28, 36];

/**
 * EL COLOR DEL BANNER SACADO DEL LOGO.
 *
 * De dónde salió (8 ago 2026): el color se derivaba del NOMBRE del comercio, y
 * a Ferremateriales Bley —logo azul y rojo, dueño que quiere azul— le tocó
 * marrón. Un color que pelea con la marca es peor que no tener color.
 */
describe("qué color representa a un logo", () => {
  it("ignora el fondo blanco, que es el color más repetido de casi todos", () => {
    /* Si contara la superficie a secas, TODOS los logos saldrían blancos. */
    const logo = pixeles([...veces(500, BLANCO), ...veces(20, AZUL_BLEY)]);
    const color = colorDeLogo(logo);
    expect(color).not.toBeNull();
    expect(color!.b).toBeGreaterThan(color!.r);
  });

  it("ignora el negro del contorno", () => {
    const logo = pixeles([...veces(300, NEGRO), ...veces(20, ROJO_BLEY)]);
    const color = colorDeLogo(logo)!;
    expect(color.r).toBeGreaterThan(color.b);
  });

  it("ignora los grises, que no identifican a nadie", () => {
    const logo = pixeles([
      ...veces(200, [128, 128, 128]),
      ...veces(10, AZUL_BLEY),
    ]);
    const color = colorDeLogo(logo)!;
    expect(color.b).toBeGreaterThan(color.r);
  });

  it("no cuenta lo transparente", () => {
    const logo = pixeles([
      ...veces(400, [255, 0, 0, 0]),
      ...veces(10, AZUL_BLEY),
    ]);
    const color = colorDeLogo(logo)!;
    expect(color.b).toBeGreaterThan(color.r);
  });

  it("un logo sin color devuelve nulo en vez de inventarse uno", () => {
    expect(colorDeLogo(pixeles(veces(100, BLANCO)))).toBeNull();
    expect(colorDeLogo(pixeles(veces(100, NEGRO)))).toBeNull();
    expect(colorDeLogo(pixeles(veces(100, [140, 140, 140])))).toBeNull();
    expect(colorDeLogo(pixeles([]))).toBeNull();
  });
});

describe("un logo de DOS colores no da un tercero inventado", () => {
  it("azul y rojo NO dan morado: gana el que domina", () => {
    /* LA PRUEBA QUE JUSTIFICA TODO EL DISEÑO. El logo de Bley tiene un arco
       azul y letras rojas. Promediando los píxeles saldría morado — un color
       que no está en el logo y que no representa a nadie. Se vota por franja
       de tono y gana una de las dos, nunca la mezcla. */
    const masAzul = pixeles([
      ...veces(400, BLANCO),
      ...veces(120, AZUL_BLEY),
      ...veces(40, ROJO_BLEY),
    ]);
    const ganador = colorDeLogo(masAzul)!;

    // Azul de verdad, no morado: el azul manda con claridad sobre el rojo.
    expect(ganador.b).toBeGreaterThan(150);
    expect(ganador.r).toBeLessThan(80);
  });

  it("y si domina el rojo, gana el rojo", () => {
    const masRojo = pixeles([
      ...veces(400, BLANCO),
      ...veces(40, AZUL_BLEY),
      ...veces(120, ROJO_BLEY),
    ]);
    const ganador = colorDeLogo(masRojo)!;
    expect(ganador.r).toBeGreaterThan(180);
    expect(ganador.b).toBeLessThan(80);
  });
});

describe("a qué color de la paleta se parece", () => {
  it("un logo azul cae en un azul, no en un marrón", () => {
    const elegido = masCercanoDeLaPaleta(aRgb("#2233CC"));
    expect(elegido.id).toMatch(/azul/);
  });

  it("un logo rojo cae en el vino", () => {
    expect(masCercanoDeLaPaleta(aRgb("#ED1C24")).id).toBe("vino");
  });

  it("un logo verde cae en el bosque", () => {
    expect(masCercanoDeLaPaleta(aRgb("#22AA44")).id).toBe("bosque");
  });

  it("un logo naranja o marrón cae en tierra", () => {
    expect(masCercanoDeLaPaleta(aRgb("#D2691E")).id).toBe("tierra");
  });

  it("un gris no tiene parecido: se queda con el de la marca", () => {
    expect(masCercanoDeLaPaleta({ r: 120, g: 120, b: 120 }).id).toBe(
      COLOR_POR_DEFECTO.id,
    );
  });

  it("NUNCA devuelve un color que no esté en la paleta", () => {
    /* La paleta es cerrada a propósito: pintar el hex del logo tal cual dejaría
       un banner amarillo con el nombre ilegible. */
    const ids = new Set(COLORES_BANNER.map((c) => c.id));
    for (const hex of ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF"]) {
      expect(ids.has(masCercanoDeLaPaleta(aRgb(hex)).id), hex).toBe(true);
    }
  });
});

describe("el atajo de punta a punta", () => {
  it("del logo de Bley sale un azul", () => {
    const bley = pixeles([
      ...veces(600, BLANCO),
      ...veces(150, AZUL_BLEY),
      ...veces(60, ROJO_BLEY),
      ...veces(80, NEGRO),
    ]);
    expect(colorDeBannerDesdeLogo(bley)!.id).toMatch(/azul/);
  });

  it("un logo sin color devuelve nulo, y quien llame decide qué hacer", () => {
    expect(colorDeBannerDesdeLogo(pixeles(veces(50, BLANCO)))).toBeNull();
  });
});
