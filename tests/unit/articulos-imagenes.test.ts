import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ARTICULOS_EN } from "@/contenido/articulos/en";
import { ARTICULOS_ES } from "@/contenido/articulos/es";

/**
 * LAS CAPTURAS DE LOS TUTORIALES TIENEN QUE EXISTIR.
 *
 * El bloque `imagen` se agregó el 22 ago 2026 para el tutorial del W-8BEN-E,
 * que el dueño va a mandar a la mayoría de los comercios. Una captura que
 * apunta a un archivo que no está se ve como un cuadro roto en mitad del paso
 * que la persona estaba siguiendo — y ese enlace ya se mandó.
 *
 * Se comprueba contra el disco, no contra una lista: la próxima captura que
 * alguien referencie y olvide subir, salta aquí.
 */
describe("toda imagen de un artículo existe en public/", () => {
  for (const [idioma, articulos] of [
    ["es", ARTICULOS_ES],
    ["en", ARTICULOS_EN],
  ] as const) {
    for (const a of articulos) {
      const imagenes = a.cuerpo.filter((b) => b.tipo === "imagen");
      if (imagenes.length === 0) continue;

      it(`${idioma} · ${a.slug}: sus ${imagenes.length} capturas están en disco`, () => {
        for (const img of imagenes) {
          const ruta = join(process.cwd(), "public", img.src);
          expect(
            existsSync(ruta),
            `falta public${img.src} — la referencia el artículo «${a.slug}»`,
          ).toBe(true);
          /* El alt no es decorativo: es lo que lee quien no ve la imagen y lo
             que lee Google. Vacío es lo mismo que no tenerlo. */
          expect(
            img.alt.trim().length,
            `alt vacío en ${img.src}`,
          ).toBeGreaterThan(10);
        }
      });
    }
  }

  it("el tutorial del W-8BEN-E existe en los dos idiomas y lleva capturas", () => {
    const es = ARTICULOS_ES.find((a) => a.slug === "formulario-fiscal-w8ben-e");
    const en = ARTICULOS_EN.find((a) => a.slug === "formulario-fiscal-w8ben-e");
    expect(es, "falta en español").toBeTruthy();
    expect(en, "falta en inglés").toBeTruthy();
    /* «Un tutorial de solo texto no está terminado» — regla de la casa. */
    expect(
      es!.cuerpo.filter((b) => b.tipo === "imagen").length,
    ).toBeGreaterThanOrEqual(3);
    expect(
      en!.cuerpo.filter((b) => b.tipo === "imagen").length,
    ).toBeGreaterThanOrEqual(3);
  });
});
