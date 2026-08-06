import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import en from "../../messages/en.json";
import es from "../../messages/es.json";

/**
 * LOS CORREOS SON LA CARA DEL NEGOCIO CUANDO NADIE ESTÁ MIRANDO EL SITIO.
 *
 * Un aviso mal escrito llega a la bandeja de un cliente o de un banco y ahí se
 * queda: no se puede corregir después como una pantalla. Esta prueba vigila
 * dos cosas que ya nos han costado caro.
 */

const CORREOS_ES = es.correos as Record<string, unknown>;
const CORREOS_EN = en.correos as Record<string, unknown>;

/**
 * LA FIGURA JURÍDICA (CLAUDE.md, 5 ago 2026). Windoce, LLC compra y revende
 * por cuenta propia; NO cobra por cuenta de nadie ni administra dinero ajeno.
 *
 * Estas palabras describen palabra por palabra la definición de *money
 * transmission* en Estados Unidos, que exige licencias estatales y registro
 * FinCEN. El abogado y el contable las prohibieron en todo texto de cara al
 * público, y un correo es tan público como una página — más, porque queda
 * guardado en la bandeja de quien lo recibe.
 *
 * Los identificadores internos del código (`billetera`, `saldo`, `comision`)
 * son deuda técnica conocida y NO entran aquí: esto solo mira lo que se lee.
 */
const PROHIBIDAS_ES = [
  "cobrar por cuenta de",
  "liquidar",
  "liquidación",
  "custodia",
  "retener fondos",
  "los fondos",
  "billetera",
  "remesa",
  "comisión sobre el pago",
  "transferencia de dinero",
  "intermediario financiero",
  "agente de cobro",
  "actuamos en nombre de",
  "el pagador",
  "el beneficiario",
  "instrucción de pago",
];

const PROHIBIDAS_EN = [
  "collect on behalf of",
  "settle",
  "settlement",
  "custody",
  "hold funds",
  "the funds",
  "wallet",
  "remittance",
  "money transmission",
  "financial intermediary",
  "collection agent",
  "on behalf of the",
  "the payer",
  "the beneficiary",
  "payment instruction",
];

function textos(objeto: unknown): string[] {
  if (typeof objeto === "string") return [objeto];
  if (Array.isArray(objeto)) return objeto.flatMap(textos);
  if (objeto && typeof objeto === "object") {
    return Object.values(objeto).flatMap(textos);
  }
  return [];
}

describe("los correos del sistema", () => {
  it("cada correo del código tiene sus textos en los dos idiomas", () => {
    // Se lee el archivo real: así, agregar una función de envío nueva sin sus
    // textos falla aquí y no en la bandeja de un cliente.
    const codigo = readFileSync(
      join(
        import.meta.dirname,
        "..",
        "..",
        "src",
        "lib",
        "correo",
        "correos.ts",
      ),
      "utf8",
    );

    // Los espacios que usa el código: t("loQueSea.algo") → "loQueSea".
    const usados = new Set(
      [...codigo.matchAll(/\bt\("([a-zA-Z]+)\./g)].map((m) => m[1]),
    );

    const faltanEs = [...usados].filter((e) => !(e in CORREOS_ES));
    const faltanEn = [...usados].filter((e) => !(e in CORREOS_EN));

    expect(faltanEs, "espacios de correo sin textos en español").toEqual([]);
    expect(faltanEn, "espacios de correo sin textos en inglés").toEqual([]);
  });

  it("hay al menos los quince correos del negocio", () => {
    // Sin contar `comun`, que son las etiquetas compartidas.
    const cuantos = Object.keys(CORREOS_ES).filter((k) => k !== "comun").length;
    expect(cuantos).toBeGreaterThanOrEqual(14);
  });

  it("ningún correo usa el vocabulario prohibido en español", () => {
    const encontradas: string[] = [];

    for (const texto of textos(CORREOS_ES)) {
      const bajo = texto.toLowerCase();
      for (const palabra of PROHIBIDAS_ES) {
        if (bajo.includes(palabra)) {
          encontradas.push(`"${palabra}" en: ${texto.slice(0, 80)}`);
        }
      }
    }

    expect(encontradas, encontradas.join("\n")).toEqual([]);
  });

  it("ningún correo usa el vocabulario prohibido en inglés", () => {
    const encontradas: string[] = [];

    for (const texto of textos(CORREOS_EN)) {
      const bajo = texto.toLowerCase();
      for (const palabra of PROHIBIDAS_EN) {
        if (bajo.includes(palabra)) {
          encontradas.push(`"${palabra}" en: ${texto.slice(0, 80)}`);
        }
      }
    }

    expect(encontradas, encontradas.join("\n")).toEqual([]);
  });
});
