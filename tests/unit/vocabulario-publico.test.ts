import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * EL VOCABULARIO PROHIBIDO, EN TODO LO QUE LEE EL PÚBLICO.
 *
 * Hasta ahora esto solo vigilaba los correos. Pero la figura jurídica del
 * negocio (CLAUDE.md, 5 ago 2026) manda sobre TODO el texto de cara al
 * público: Windoce, LLC compra y revende por cuenta propia, no cobra por
 * cuenta de nadie ni administra dinero ajeno.
 *
 * Las palabras de la lista describen palabra por palabra la definición de
 * *money transmission* en Estados Unidos, que exige licencias estatales y
 * registro FinCEN. Es la razón por la que procesadores y bancos cierran
 * cuentas, y por la que el abogado reescribió el sitio entero.
 *
 * QUÉ SE REVISA: los archivos de `src/contenido/`, que es donde vive el texto
 * largo del público (términos, privacidad, ayuda, devoluciones, entrega, el
 * documento del modelo). Los identificadores del código (`billetera`,
 * `saldo`, `comision`) son deuda técnica conocida y no entran: esto mira lo
 * que se lee, no cómo se llaman las variables.
 *
 * SE ADMITEN COMO NEGACIÓN EXPLÍCITA. Los términos dicen "Windoce, LLC no
 * actúa como agente, fiduciario ni depositario": ahí la palabra aparece para
 * negarla, que es justo lo contrario del problema. Por eso una línea que
 * empieza negando no cuenta.
 */

const CONTENIDO = join(import.meta.dirname, "..", "..", "src", "contenido");

/**
 * Las de CLAUDE.md. Son formas de DESCRIBIRNOS: lo que el sitio no puede
 * decir que Mercatren hace.
 *
 * `money transmission` NO está en la lista a propósito. Es el nombre de la
 * figura legal, y el documento del modelo lo usa justamente para explicar por
 * qué el negocio no lo es — ese texto lo escribió el abogado. Prohibir el
 * término obligaría a hablar de él con rodeos, que es peor.
 */
const PROHIBIDAS = [
  "cobrar por cuenta de",
  "liquidamos",
  "liquidar el pago",
  "liquidación de pagos",
  "en custodia",
  "retener fondos",
  "los fondos del",
  "billetera",
  "remesa",
  "comisión sobre el pago",
  "transferencia de dinero",
  "intermediario financiero",
  "agente de cobro",
  "actuamos en nombre de",
  "instrucción de pago",
  "collect on behalf of",
  "hold funds",
  "remittance",
];

/**
 * Archivos donde estas palabras SÍ tienen que aparecer.
 *
 * - `diccionario.ts`: es la guía "se dice / no se dice" del panel. Existe
 *   para nombrar las palabras prohibidas y explicar por qué lo están; sin
 *   ellas no enseña nada. Además vive en el panel, no de cara al público.
 * - `docs/modelo.*`: explica la figura jurídica y la contrasta con la que no
 *   somos. Lo revisó el abogado.
 */
const EXENTOS = ["diccionario.ts", "modelo.es.ts", "modelo.en.ts"];

/** Una frase que NIEGA no es una que afirma. */
const NIEGA =
  /\bno\s+(es|son|actúa|actuamos|somos|hay|se|tenemos|recibe)\b|\bnever\b|\bdoes not\b|\bis not\b|\bwe don't\b/i;

function archivos(carpeta: string): string[] {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) return archivos(ruta);
    return /\.tsx?$/.test(nombre) ? [ruta] : [];
  });
}

describe("el vocabulario de las páginas públicas", () => {
  const fuentes = archivos(CONTENIDO).filter(
    (ruta) => !EXENTOS.some((exento) => ruta.endsWith(exento)),
  );

  it("hay contenido público que revisar", () => {
    expect(fuentes.length).toBeGreaterThan(4);
  });

  it("ninguna página usa vocabulario de money transmission", () => {
    const encontradas: string[] = [];

    for (const ruta of fuentes) {
      for (const linea of readFileSync(ruta, "utf8").split("\n")) {
        // Los comentarios del código explican POR QUÉ están prohibidas esas
        // palabras; nombrarlas ahí es el punto.
        const limpia = linea.trim();
        if (limpia.startsWith("*") || limpia.startsWith("//")) continue;

        const bajo = limpia.toLowerCase();
        for (const palabra of PROHIBIDAS) {
          if (bajo.includes(palabra) && !NIEGA.test(limpia)) {
            const corto = ruta.split("/").slice(-2).join("/");
            encontradas.push(`${corto}: "${palabra}" → ${limpia.slice(0, 90)}`);
          }
        }
      }
    }

    expect(encontradas, encontradas.join("\n")).toEqual([]);
  });

  it("el nombre legal siempre lleva la coma", () => {
    // "Windoce, LLC" es el nombre registrado en Delaware. Sin la coma ya se
    // rechazó un expediente estatal.
    const sinComa: string[] = [];

    for (const ruta of fuentes) {
      const codigo = readFileSync(ruta, "utf8");
      // Se busca "Windoce LLC" sin coma, en cualquier idioma.
      if (/Windoce\s+LLC/.test(codigo)) {
        sinComa.push(ruta.split("/").slice(-2).join("/"));
      }
    }

    expect(sinComa, sinComa.join("\n")).toEqual([]);
  });
});
