import {
  COLOR_POR_DEFECTO,
  COLORES_BANNER,
  type ColorBanner,
} from "@/lib/marca/colores";

/**
 * EL COLOR DEL BANNER, SACADO DEL LOGO DEL COMERCIO.
 *
 * ══ POR QUÉ SE CAMBIÓ (8 ago 2026) ══
 *
 * Antes el color se derivaba del NOMBRE. Repartía bien, pero era arbitrario: a
 * Ferremateriales Bley —cuyo logo es azul y rojo, y cuyo dueño quiere azul— le
 * tocó marrón. Un color que pelea con la marca del comercio es peor que no
 * tener color propio.
 *
 * Sacarlo del logo resuelve las dos cosas a la vez: cada tienda se ve distinta
 * **y** se ve suya.
 *
 * ══ CÓMO SE ELIGE, Y POR QUÉ NO ES EL COLOR MÁS REPETIDO ══
 *
 * El píxel más repetido de casi cualquier logo es el BLANCO del fondo, y el
 * segundo el negro del contorno. Ninguno de los dos dice nada de la marca. Por
 * eso se descartan los píxeles casi blancos, casi negros y los grises, y se
 * pesa cada color por su intensidad: manda el color con el que se identifica
 * la marca, no el que más superficie ocupa.
 *
 * Después se busca el más parecido de la paleta. La paleta sigue siendo
 * CERRADA: nunca se pinta el hex del logo tal cual, porque un logo amarillo
 * dejaría el banner ilegible. Se elige el tono oscuro que más se le acerca.
 */

export type Rgb = { r: number; g: number; b: number };

/**
 * El color que representa a un logo, o `null` si no hay ninguno claro.
 *
 * Recibe los píxeles tal como los da un canvas: r, g, b, a, r, g, b, a…
 */
export function colorDeLogo(pixeles: Uint8ClampedArray): Rgb | null {
  /* SE VOTA POR TONO, NO SE PROMEDIA — y esta es la parte que hay que
     entender antes de tocar nada.

     El logo de Ferremateriales Bley tiene un arco AZUL y letras ROJAS. Si se
     promediaran los píxeles, azul + rojo daría MORADO: un color que no está en
     el logo, que no representa a nadie y que además no se parece a ninguno de
     la paleta.

     Así que cada píxel vota por su franja de tono, pesado por lo intenso que
     sea. Gana la franja con más votos y se promedia SOLO dentro de ella. En un
     logo azul y rojo sale azul o rojo — el que domine — pero nunca un morado
     inventado. */
  const FRANJAS = 12; // de 30 grados cada una
  const peso = new Array<number>(FRANJAS).fill(0);
  const sumaR = new Array<number>(FRANJAS).fill(0);
  const sumaG = new Array<number>(FRANJAS).fill(0);
  const sumaB = new Array<number>(FRANJAS).fill(0);

  for (let i = 0; i < pixeles.length; i += 4) {
    const r = pixeles[i]!;
    const g = pixeles[i + 1]!;
    const b = pixeles[i + 2]!;
    const alfa = pixeles[i + 3]!;

    // Lo transparente no cuenta: muchos logos vienen en PNG recortado.
    if (alfa < 128) continue;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    if (min > 215) continue; // casi blanco: el fondo, no la marca
    if (max < 40) continue; // casi negro: el contorno
    if (max - min < 30) continue; // gris: no identifica a nadie

    const tono = matiz({ r, g, b });
    if (tono === null) continue;

    /* Pesado por saturación al cuadrado: el rojo intenso de un logo cuenta más
       que un beige apagado de la misma superficie. */
    const saturacion = (max - min) / max;
    const p = saturacion * saturacion;

    const franja = Math.min(FRANJAS - 1, Math.floor(tono / (360 / FRANJAS)));
    peso[franja] += p;
    sumaR[franja] += r * p;
    sumaG[franja] += g * p;
    sumaB[franja] += b * p;
  }

  let ganadora = -1;
  let mejor = 0;
  for (let f = 0; f < FRANJAS; f++) {
    if (peso[f]! > mejor) {
      mejor = peso[f]!;
      ganadora = f;
    }
  }

  if (ganadora === -1) return null;

  return {
    r: Math.round(sumaR[ganadora]! / mejor),
    g: Math.round(sumaG[ganadora]! / mejor),
    b: Math.round(sumaB[ganadora]! / mejor),
  };
}

/** De "#10263A" a sus tres canales. */
export function aRgb(hex: string): Rgb {
  const n = Number.parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/**
 * El color de la paleta que más se parece a uno dado.
 *
 * Compara por TONO y no por distancia cruda entre canales. La distancia cruda
 * mira sobre todo el brillo, y como todos los de la paleta son oscuros y el
 * color de un logo suele ser vivo, casi siempre ganaba el mismo. Comparando el
 * ángulo del tono, un logo azul cae en un azul y uno rojo en el vino, que es
 * lo que uno esperaría.
 */
export function masCercanoDeLaPaleta(color: Rgb): ColorBanner {
  const tono = matiz(color);

  // Sin tono definido (un gris) no hay parecido posible: el de la marca.
  if (tono === null) return COLOR_POR_DEFECTO;

  let mejor = COLOR_POR_DEFECTO;
  let mejorDistancia = Number.POSITIVE_INFINITY;

  for (const candidato of COLORES_BANNER) {
    const suyo = matiz(aRgb(candidato.hex));
    if (suyo === null) continue;

    // El tono es un círculo: entre 350° y 10° hay 20 grados, no 340.
    const bruta = Math.abs(tono - suyo);
    const distancia = Math.min(bruta, 360 - bruta);

    if (distancia < mejorDistancia) {
      mejorDistancia = distancia;
      mejor = candidato;
    }
  }

  return mejor;
}

/** El ángulo del color en la rueda, de 0 a 360. `null` si es un gris. */
function matiz({ r, g, b }: Rgb): number | null {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return null;

  let h: number;
  if (max === r) h = ((g - b) / delta) % 6;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h *= 60;
  return h < 0 ? h + 360 : h;
}

/** El atajo: de los píxeles de un logo al color de la paleta que le toca. */
export function colorDeBannerDesdeLogo(
  pixeles: Uint8ClampedArray,
): ColorBanner | null {
  const dominante = colorDeLogo(pixeles);
  return dominante ? masCercanoDeLaPaleta(dominante) : null;
}
