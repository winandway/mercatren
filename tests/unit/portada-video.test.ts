import { existsSync } from "node:fs";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { videoDePortada } from "@/lib/mercado/portada";

/**
 * EL VIDEO DEL HERO POR PAÍS (28 ago 2026).
 *
 * Pedido del dueño: en mercatren.cl el banner corre un video CHILENO
 * (Santiago con los Andes), no la cinta de cajas genérica. La tabla vive en
 * `src/lib/mercado/portada.ts`; aquí se fija que no se rompa en silencio.
 */
describe("el video de la portada por mercado", () => {
  it("Chile y Colombia tienen su propio video; el resto usa el genérico", () => {
    expect(videoDePortada("CL").video).toBe("/video/portada-cl.mp4");
    expect(videoDePortada("CO").video).toBe("/video/portada-co.mp4");
    expect(videoDePortada("US").video).toBe("/video/portada.mp4");
    /* Un país recién abierto SIN video propio cae en el genérico, nunca en
       un hueco negro. */
    expect(videoDePortada("RO").video).toBe("/video/portada.mp4");
    expect(videoDePortada(" cl ").video).toBe("/video/portada-cl.mp4");
  });

  it("CADA ARCHIVO DECLARADO EXISTE EN public/ — declarar sin subir es el hueco negro", () => {
    for (const codigo of ["US", "CL", "CO"]) {
      const { video, poster } = videoDePortada(codigo);
      for (const ruta of [video, poster]) {
        expect(existsSync(join("public", ruta)), `falta public${ruta}`).toBe(
          true,
        );
      }
    }
  });

  it("ningún video del hero pasa de 1 MB — la portada tiene que abrir en un teléfono", () => {
    for (const codigo of ["US", "CL", "CO"]) {
      const { video } = videoDePortada(codigo);
      expect(statSync(join("public", video)).size).toBeLessThan(1_000_000);
    }
  });

  it("la portada usa la tabla, no una ruta escrita a mano", () => {
    const fuente = readFileSync("src/app/[locale]/(tienda)/page.tsx", "utf-8");
    expect(fuente).toContain("videoDePortada(");
    /* Si alguien vuelve a clavar el genérico en el atributo, Chile pierde su
       video sin que nada se ponga rojo. Se busca el atributo, no el texto: la
       ruta legítima vive en la tabla, no aquí. */
    expect(fuente).not.toContain('src="/video/portada.mp4"');
  });
});
