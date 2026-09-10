import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const leer = (r: string) => readFileSync(r, "utf8");

/**
 * ══ LA DESCRIPCIÓN DE UNA FICHA CONCRETA (9 sep 2026) ══
 *
 * Un cliente preguntó por dos monitores de estudio recién publicados si son
 * amplificadas y si el precio es por el par. La ficha no lo decía: la
 * importación masiva no pide el detalle de CJ. Esto trae ESA ficha sin
 * esperar turno en la cola de miles.
 */
describe("describir una ficha suelta", () => {
  const m = leer("src/lib/cj/describir-uno.ts");

  it("REUSA el traedor que ya existía, no lo vuelve a escribir", () => {
    /* `descripcionDeCj` lleva dentro el ritmo de 1 llamada/segundo y los
       motivos de fallo, que costaron 989 productos sin descripción. */
    expect(m).toContain('from "@/lib/cj/descripcion"');
    expect(m).toContain("await descripcionDeCj(p.pid)");
    expect(m).not.toContain("/product/query?pid=");
    expect(m).not.toContain("replace(/<[^>]+>/g");
  });

  it("el texto sale de CJ: no hay forma de escribir uno a mano", () => {
    /* La regla está escrita en `descripcion.ts`: inventar una descripción
       es una afirmación falsa nuestra, y las devoluciones las paga
       Mercatren. */
    const ruta = leer("src/app/datos/probar-compra/route.ts");
    const bloque = ruta.slice(
      ruta.indexOf('z.literal("describir")'),
      ruta.indexOf('z.literal("describir")') + 200,
    );
    expect(bloque).not.toContain("textoEn");
    /* La firma recibe SOLO el enlace: `textoEn` aparece en lo que devuelve
       (para poder mirar lo que se guardó), nunca en lo que acepta. */
    const firma = m.slice(
      m.indexOf("export async function describirUnProducto"),
      m.indexOf("): Promise<"),
    );
    expect(firma).toContain("enlace: string");
    expect(firma).not.toContain("textoEn");
  });

  it("un fallo de CJ queda anotado sin pisar lo que ve el comprador", () => {
    expect(m).toContain("insert(intentosDescripcion)");
    const desde = m.indexOf("if (!r.ok)");
    const hasta = m.indexOf("return", desde);
    expect(m.slice(desde, hasta)).not.toContain("descripcionEn:");
  });

  it("guarda el inglés y traduce en el acto, y si la traducción falla el inglés queda", () => {
    expect(m).toContain("set({ descripcionEn: r.texto");
    expect(m).toContain(
      "traducirDescripciones([{ id: p.id, textoEn: r.texto }])",
    );
    expect(m.indexOf("set({ descripcionEn: r.texto")).toBeLessThan(
      m.indexOf("traducirDescripciones("),
    );
  });
});
