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

  /* ─────────────────────────────────────────────────────────────────────────
     LAS QUE SE ESCAPARON, agregadas el 7 ago 2026.

     La lista de arriba daba verde mientras `/nosotros` —la página que abre un
     banco cuando quiere saber quiénes somos— seguía describiendo el modelo
     viejo palabra por palabra: "nosotros cobramos ese pago en Estados Unidos,
     y con ese mismo dinero —siguiendo la instrucción escrita del comercio—
     pagamos las facturas que ese comercio tiene con su proveedor".

     Ninguna de esas frases estaba prohibida, y las cuatro juntas son la
     definición de money transmission. Se corrigió el texto y se agregan aquí
     las formas exactas, que es lo único que impide que vuelvan.

     Lo que enseña el fallo: no basta prohibir el sustantivo ("remesa"). Hay
     que prohibir el VERBO en primera persona — lo que el sitio dice que
     Mercatren HACE con el dinero.
     ───────────────────────────────────────────────────────────────────────── */
  "cobramos ese pago",
  "cobramos el pago",
  "cobramos por la gestión",
  "por la gestión",
  "con ese mismo dinero",
  "instrucción escrita",
  "pagamos las facturas",
  "pagamos la factura",
  "por cuenta del comercio",
  "dinero del comercio",
  "collect that payment",
  "collect the payment",
  "with that same money",
  "written instruction",
  "we pay the invoices",
  "we pay the invoice",
  "for handling it",
  "the merchant's money",

  /* Y esta, del 7 ago 2026: el centro de ayuda contestaba "¿cuánto cobra
     Mercatren?" con "3 % sobre el valor de cada pedido cobrado". El inglés ya
     estaba corregido y el español se quedó atrás meses, diciendo justo lo que
     el abogado desarmó: un porcentaje retenido sobre un cobro. */
  "sobre el valor de cada pedido",
  "% de comisión",
  "% commission on",
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

/**
 * LAS QUE NO SE SALVAN NEGÁNDOLAS.
 *
 * La regla del dueño (6 ago 2026): la negación explícita es precisión en los
 * términos y en el PDF para bancos, y es un error en todo lo que lee un
 * comprador. Nadie llega a `/nosotros` preguntándose si administramos dinero
 * ajeno; responder a una pregunta que nadie hizo planta la sospecha uno mismo.
 *
 * De dónde salió: `/nosotros` tenía un punto titulado "El dinero de los
 * comercios no es nuestro". El guardián lo dejó pasar **porque negaba** — la
 * salida de emergencia de abajo se lo tragó entero. Pero esa frase presupone
 * que hay dinero de otro en juego, que es exactamente lo que el modelo no
 * tiene: aquí se compra mercancía y se revende, y el cobro es ingreso propio.
 *
 * Aquí la negación no salva: estas palabras no van en una página comercial ni
 * para decir que no. En los textos legales sí, y por eso están exentos.
 */
const NI_NEGANDO = [
  "dinero de los comercios",
  "dinero ajeno",
  "dinero de terceros",
  "aplicado el dinero",
  "merchant money",
  "merchant's money",
  "third-party money",
  "money was applied",
];

/**
 * Dónde la negación SÍ es lo correcto: los textos legales.
 *
 * Un abogado o un oficial de riesgo busca la frase exacta, y en un contrato lo
 * que no se dice no está. Estas páginas no las lee un comprador.
 */
const LEGALES = ["terminos.ts", "privacidad.ts"];

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

  it("las páginas comerciales no hablan de dinero ajeno, ni para negarlo", () => {
    const encontradas: string[] = [];

    for (const ruta of fuentes) {
      if (LEGALES.some((legal) => ruta.endsWith(legal))) continue;

      for (const linea of readFileSync(ruta, "utf8").split("\n")) {
        const limpia = linea.trim();
        if (limpia.startsWith("*") || limpia.startsWith("//")) continue;

        const bajo = limpia.toLowerCase();
        for (const palabra of NI_NEGANDO) {
          if (bajo.includes(palabra)) {
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
