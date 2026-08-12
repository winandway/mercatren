import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DESARROLLADOR, SOCIEDAD } from "@/lib/sociedad";

/**
 * EL NOMBRE DE LA SOCIEDAD SE ESCRIBE UNA SOLA VEZ.
 *
 * ══ POR QUÉ EXISTE ESTA PRUEBA ══
 *
 * El 11 de agosto de 2026 el nombre estaba escrito a mano en 240 sitios
 * repartidos por 26 archivos. La tienda va a cambiar de sociedad —de
 * Windoce, LLC a Mercatren LLC— y hacer ese cambio a mano, el día del
 * traspaso y con el sitio en producción, era un día entero de trabajo con
 * prisa. Se centralizó en `src/lib/sociedad.ts`.
 *
 * Sin esta prueba, la próxima página que se escriba vuelve a traerlo a mano y
 * en dos meses estamos igual. Aquí se rompe el build antes de que eso pase.
 */

/** El texto que ve el público. Los comentarios del código no cuentan. */
const CARPETAS = ["src", "messages"];

/**
 * Lo que sí puede nombrar a la sociedad.
 *
 * `sociedad.ts` es la fuente. `pie-pagina.tsx` no está aquí: el crédito del
 * desarrollador sale de `DESARROLLADOR`, que es otra cosa y no cambia con el
 * traspaso.
 */
const PERMITIDOS = ["src/lib/sociedad.ts"];

function archivos(dir: string): string[] {
  const salida: string[] = [];
  for (const entrada of readdirSync(dir)) {
    if (entrada === "node_modules" || entrada.startsWith(".")) continue;
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) salida.push(...archivos(ruta));
    else if (/\.(ts|tsx|json)$/.test(entrada)) salida.push(ruta);
  }
  return salida;
}

/**
 * Quita comentarios: cuentan la historia del proyecto y se quedan.
 *
 * Se quitan de verdad —bloques enteros y líneas sueltas— y no mirando cómo
 * empieza cada línea. La primera versión hacía eso y se le colaban tres casos
 * reales: el comentario de JSX (`{'{'}/* … *␘/{'}'}`), las líneas de dentro de
 * un bloque que no empiezan por asterisco, y los títulos en medio de un
 * `/** … *␘/` largo. Un candado con agujeros no es un candado.
 */
function sinComentarios(texto: string): string {
  return texto
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((l) => !l.trim().startsWith("//"))
    .join("\n");
}

describe("el nombre de la sociedad no se escribe a mano", () => {
  const sospechosos: string[] = [];

  for (const carpeta of CARPETAS) {
    for (const ruta of archivos(carpeta)) {
      if (PERMITIDOS.includes(ruta)) continue;
      const cuerpo = sinComentarios(readFileSync(ruta, "utf-8"));
      if (cuerpo.includes(SOCIEDAD.nombre)) sospechosos.push(ruta);
    }
  }

  it("no aparece escrito en ningún texto de cara al público", () => {
    /* Si esto se pone rojo: importa SOCIEDAD de "@/lib/sociedad" y usa
       SOCIEDAD.nombre. En los archivos de idioma (JSON), escribe «SOCIEDAD»,
       que se sustituye al cargar en src/i18n/request.ts. */
    expect(sospechosos).toEqual([]);
  });

  it("el crédito del desarrollador es una cosa aparte", () => {
    /* Hoy los dos dicen lo mismo y por eso es fácil confundirlos. El día del
       traspaso dejarán de decirlo: la tienda pasa a otra sociedad y quien
       programa el sitio sigue siendo el mismo. */
    expect(DESARROLLADOR.nombre).toBe("Windoce, LLC");
    expect(DESARROLLADOR.sitio).toBe("https://windoce.com");
  });

  it("el nombre legal se escribe EXACTAMENTE como está registrado", () => {
    /* «Mercatren LLC», SIN coma: así aparece en los Articles of Organization
       de Michigan y en la carta CP 575 del IRS.

       La coma no es un detalle de estilo. La sociedad anterior —Windoce, LLC,
       de Delaware— sí la llevaba, y omitirla allí causó el rechazo de un
       expediente estatal. Aquí es al revés: ponerla sobra. El nombre se copia
       del papel, letra por letra, y un banco que compara contra los registros
       del IRS rechaza por menos que eso. */
    expect(SOCIEDAD.nombre).toBe("Mercatren LLC");
    expect(SOCIEDAD.estado).toBe("Michigan");
  });
});
