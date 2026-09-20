import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ══ EL PAÍS DE UN VIDEO LO DECIDE SU TIENDA (20 sep 2026) ══
 *
 * En la portada de mercatren.com (Estados Unidos) salían los videos de los
 * comercios de Venezuela —«Envíos a toda Venezuela, mayor y detal»— dos
 * semanas después de haber mudado Venezuela a su dominio. Se destapó al
 * preparar la evaluación de Merchant Center: Google tiene que ver una tienda
 * de Estados Unidos, y su mapa de videos también traía los de Venezuela.
 *
 * La causa: `videos_tienda.mercado` se llenaba con el DOMINIO de la petición,
 * y el panel de todos los comercios vive en mercatren.com. La mudanza movió
 * tiendas y productos; los videos siguieron marcados «US».
 */

const leer = (relativo: string) =>
  readFileSync(join(process.cwd(), relativo), "utf8");
const sinComentarios = (codigo: string) =>
  codigo.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("los videos salen donde vende su tienda", () => {
  const consultas = sinComentarios(leer("src/lib/videos/consultas.ts"));
  const acciones = sinComentarios(leer("src/lib/videos/acciones.ts"));

  it("ninguna consulta pública filtra por el mercado del video a secas", () => {
    expect(consultas).not.toContain("eq(videosTienda.mercado");
    /* La portada y el visor (`visibles`) y los dos mapas para Google. */
    expect(consultas.match(/deEsteMercado\(/g)?.length).toBeGreaterThanOrEqual(
      4,
    );
  });

  it("manda la tienda; solo los de la casa se rigen por el video", () => {
    const regla = consultas.slice(
      consultas.indexOf("function deEsteMercado("),
      consultas.indexOf("function visibles("),
    );
    expect(regla).toContain(
      "${videosTienda.tiendaId} = ${TIENDA_EDITORIAL_ID}",
    );
    expect(regla).toMatch(
      /THEN \$\{videosTienda\.mercado\} ELSE \$\{tiendas\.mercado\}/,
    );
  });

  it("al subir, el video hereda el país de su tienda y no el del dominio", () => {
    expect(acciones).toContain("mercado: mercadoDelVideo,");
    expect(acciones).toContain(": tienda.mercado;");
    expect(acciones).not.toContain(
      "mercado: mercado.codigo,\n        creadoEn",
    );
  });
});
