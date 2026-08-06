import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * EL IDENTIFICADOR DE CADA PRODUCTO EN EL CATÁLOGO DE GOOGLE.
 *
 * Google corta en 50 caracteres el atributo `id` y rechaza el producto
 * entero si se pasa. En la primera lectura del 6 ago 2026 se quedaron fuera
 * 17 productos de una ferretería, con nombres como "lamina-de-zinc-canal-
 * maracucho-color-azul-medida-3-60-x-8-30" — 69 caracteres.
 *
 * Se prueba aquí, con la misma cuenta que hace la ruta, porque un fallo de
 * este tipo no se ve: el archivo sale bien, Google lo lee sin error visible,
 * y simplemente hay productos que nunca aparecen.
 */

/** La misma que `src/app/datos/google/route.ts`. Si cambia allá, cambia aquí. */
const LARGO_MAXIMO_ID = 50;

function identificador(slug: string): string {
  if (slug.length <= LARGO_MAXIMO_ID) return slug;

  let firma = 5381;
  for (let i = 0; i < slug.length; i++) {
    firma = ((firma << 5) + firma + slug.charCodeAt(i)) | 0;
  }
  const sufijo = Math.abs(firma).toString(36);

  return `${slug.slice(0, LARGO_MAXIMO_ID - sufijo.length - 1)}-${sufijo}`;
}

/** Los tres más largos del catálogo real de Bley. */
const LARGOS = [
  "lamina-de-zinc-canal-maracucho-color-azul-medida-3-60-x-8-30-cal-0-20",
  "base-para-pasta-ajustable-sistema-giratorio-funcional-4cm-x-8cm",
  "tornillo-con-cabeza-hexagonal-10-x-2-1-2-paquete-de-100und",
];

describe("el identificador del catálogo de Google", () => {
  it("ninguno pasa de 50 caracteres", () => {
    for (const slug of [...LARGOS, "a".repeat(200)]) {
      expect(identificador(slug).length, slug).toBeLessThanOrEqual(50);
    }
  });

  it("un slug que cabe se deja tal cual", () => {
    // Legible y estable: no hay razón para tocarlo.
    expect(identificador("tubo-pvc-2")).toBe("tubo-pvc-2");
  });

  it("es el MISMO cada vez que se pide", () => {
    /* Si cambiara entre una lectura y otra, Google borraría el producto
       viejo y crearía uno nuevo, perdiendo su historial. */
    const slug = LARGOS[0];
    expect(identificador(slug)).toBe(identificador(slug));
  });

  it("dos nombres parecidos NO chocan", () => {
    /* Cortar a secas los dejaría con el mismo identificador y Google
       publicaría solo uno, tratando al otro como duplicado. */
    const a = "lamina-de-zinc-canal-maracucho-color-azul-medida-3-60-x-8-30";
    const b = "lamina-de-zinc-canal-maracucho-color-azul-medida-3-60-x-9-40";
    expect(a.slice(0, 50)).toBe(b.slice(0, 50)); // comparten el recorte
    expect(identificador(a)).not.toBe(identificador(b)); // pero no el id
  });
});

describe("la ruta del catálogo", () => {
  const codigo = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "..",
      "src",
      "app",
      "datos",
      "google",
      "route.ts",
    ),
    "utf8",
  );

  it("el id pasa por la función que lo recorta", () => {
    // Un `<g:id>${p.slug}` suelto trae de vuelta el fallo de los 17.
    expect(codigo).toContain("identificador(p.slug)");
  });

  it("sigue declarando que no hay código de barras", () => {
    /* Casi nada del catálogo de una ferretería tiene GTIN. Sin esta línea,
       Google rechaza cientos de productos de golpe. */
    expect(codigo).toContain("identifier_exists");
  });

  it("el tope de 50 sigue escrito", () => {
    expect(codigo).toContain("LARGO_MAXIMO_ID = 50");
  });
});
