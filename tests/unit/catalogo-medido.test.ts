import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * LO QUE SE MIDE DEL CATÁLOGO TIENE QUE SER LO QUE SE GUARDA (4 sep 2026).
 *
 * El dueño preguntó si estamos traduciendo los títulos y si el envío ya está
 * consultado a CJ y metido en el precio. La respuesta estaba en el Tablero…
 * y era MENTIRA: la tarjeta leía `sinTraducir`, `sinFlete` y
 * `conFleteEstimado` de un JSON que **nunca los tuvo**, porque el vigilante
 * guarda `PlazaVista` (cinco campos) y el tipo prometía `PlazaInventario`
 * (once). Salían en cero desde que existe la tarjeta.
 *
 * El compilador no puede verlo solo: un `JSON.parse` devuelve `any` y ahí se
 * puede prometer la forma que uno quiera. Por eso el candado es este.
 */
describe("el conteo del catálogo", () => {
  const reglas = readFileSync("src/lib/vigilante/reglas.ts", "utf8");
  const hechos = readFileSync("src/lib/vigilante/hechos.ts", "utf8");
  const inventario = readFileSync("src/lib/vigilante/inventario.ts", "utf8");
  const tarjeta = readFileSync(
    "src/components/panel/catalogo-de-un-vistazo.tsx",
    "utf8",
  );
  const canario = readFileSync("src/lib/salud/piezas.ts", "utf8");

  /** Los campos declarados en `PlazaVista`, que es lo que viaja en el latido. */
  const declarados = (() => {
    const desde = reglas.indexOf("export type PlazaVista = {");
    const bloque = reglas.slice(desde, reglas.indexOf("};", desde));
    return [...bloque.matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1]!);
  })();

  it("PlazaVista declara los campos que el dueño pregunta", () => {
    /* «¿ya se tradujeron los títulos?» y «¿el envío ya se consultó a CJ y
       está sumado al precio?» son las dos preguntas, y las dos se contestan
       con un número que alguien tiene que estar midiendo. */
    expect(declarados).toContain("sinTraducir");
    expect(declarados).toContain("conFleteReal");
    expect(declarados).toContain("porAfinar");
  });

  it("el vigilante GUARDA cada campo que declara, no solo lo promete", () => {
    /* Un campo declarado que nadie escribe llega como `undefined` y se dibuja
       como cero: se lee igual que «ya está todo hecho». */
    for (const campo of declarados) {
      if (campo === "mercado") continue;
      expect(hechos, `el vigilante no mide «${campo}»`).toContain(
        `${campo}: Number(fila?.${campo} ?? 0)`,
      );
    }
  });

  it("lo que se lee del latido se declara como PlazaVista, nunca como el inventario largo", () => {
    /* `PlazaInventario` es la medida del panel, que se cuenta al vuelo con
       once columnas. El latido lleva la corta. Prometer la larga sobre el
       JSON de la corta es exactamente el fallo que esto cierra. */
    expect(inventario).toContain("plazas?: PlazaVista[]");
    expect(inventario).not.toContain("plazas?: PlazaInventario[]");
  });

  it("la tarjeta del Tablero solo usa campos que existen en el latido", () => {
    const usados = [...tarjeta.matchAll(/\bp\.(\w+)/g)].map((m) => m[1]!);
    for (const campo of new Set(usados)) {
      expect(
        declarados,
        `la tarjeta lee «${campo}», que no se guarda`,
      ).toContain(campo);
    }
  });

  it("el canario sirve el conteo sin volver a contarlo", () => {
    /* `/datos/salud` lo consulta cualquiera cada minuto; contar cincuenta mil
       fichas ahí convertiría el canario en el problema. */
    expect(canario).toContain("inventarioDelUltimoLatido");
    expect(canario).not.toContain("inventarioPorPlaza");
  });
});
