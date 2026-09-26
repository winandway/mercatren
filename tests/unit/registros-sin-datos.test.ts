import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * ══ LOS REGISTROS DE GITHUB SON PÚBLICOS (25 sep 2026) ══
 *
 * El repositorio es público, y cualquiera puede leer los registros de las
 * corridas de Actions. La puerta de pruebas imprimía la respuesta de CJ
 * entera: dos consultas de ese día dejaron publicados el nombre de una
 * persona real, una dirección y un teléfono. Con un cliente de verdad habría
 * publicado su nombre y la dirección de su casa.
 *
 * Cada flujo que imprime una respuesta del sitio la pasa por un filtro que
 * tapa nombre, teléfono, dirección, correo y código postal. Si alguien vuelve
 * a poner un `cat respuesta.json` o un `jq .` a secas, esto se pone en rojo.
 */
const CARPETA = ".github/workflows";
const flujos = readdirSync(CARPETA)
  .filter((f) => f.endsWith(".yml"))
  .map((f) => ({ f, texto: readFileSync(`${CARPETA}/${f}`, "utf8") }));

describe("ningún flujo publica datos de quien compra", () => {
  it("nadie imprime la respuesta sin taparla", () => {
    for (const { f, texto } of flujos) {
      expect(texto, f).not.toMatch(/^\s*cat respuesta\.json/m);
      expect(texto, f).not.toMatch(/jq \. respuesta\.json/);
    }
  });

  it("los que leen una respuesta del sitio la pasan por el filtro", () => {
    const conRespuesta = flujos.filter(({ texto }) =>
      texto.includes("respuesta.json"),
    );
    expect(conRespuesta.length).toBeGreaterThan(0);
    for (const { f, texto } of conRespuesta) {
      expect(texto, f).toContain("[oculto]");
      expect(texto, f).toContain("customername|phone|address|email");
    }
  });
});

/**
 * Y EL FILTRO FUNCIONA DE VERDAD, no solo está escrito: se corre `jq` sobre
 * la forma exacta que devolvió CJ el 25 sep 2026 (con datos inventados).
 */
describe("el filtro tapa lo personal y deja lo útil", () => {
  const filtro = (() => {
    const texto = flujos.find(({ f }) => f === "probar-compra.yml")!.texto;
    const m = texto.match(/jq '(walk\(.+\))' respuesta\.json/);
    return m?.[1] ?? "";
  })();

  const correr = (json: unknown): string =>
    execFileSync("jq", ["-c", filtro], {
      input: JSON.stringify(json),
      encoding: "utf8",
    });

  it("encuentra el filtro en el flujo", () => {
    expect(filtro).toContain("walk(");
  });

  it("tapa nombre, teléfono, dirección y correo, aunque vengan anidados", () => {
    const salida = correr({
      ok: true,
      resultado: {
        datos: {
          orderNum: "PRUEBA-1",
          shippingCustomerName: "Nombre Inventado",
          shippingPhone: "15550000000",
          shippingAddress: "123 Calle Inventada",
          email: "persona@ejemplo.com",
          trackNumber: "YWE000",
          orderStatus: "SHIPPED",
        },
      },
    });
    expect(salida).not.toContain("Nombre Inventado");
    expect(salida).not.toContain("15550000000");
    expect(salida).not.toContain("123 Calle Inventada");
    expect(salida).not.toContain("persona@ejemplo.com");
    /* Lo que sirve para trabajar sigue ahí. */
    expect(salida).toContain("PRUEBA-1");
    expect(salida).toContain("YWE000");
    expect(salida).toContain("SHIPPED");
  });
});
