import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  aBolivares,
  tasaDeDolarApi,
  tasaDelBcv,
  textoBolivares,
} from "@/lib/precios/bcv";

/**
 * EL EQUIVALENTE EN BOLÍVARES (5 nov 2026, Venezuela). Lo que no puede pasar
 * sin que esto se ponga en rojo: leer mal la tasa del BCV (el punto de miles
 * y la coma decimal), aceptar una tasa que no sea la oficial, que la página
 * del BCV caída tumbe la ficha, o que esto escriba en la base.
 */
const RAIZ = join(import.meta.dirname, "..", "..");
const leer = (r: string) => readFileSync(join(RAIZ, r), "utf-8");

/* Un trozo con la forma de la portada del BCV (5 nov 2026). */
const PORTADA = `
<div id="dolar" class="col-sm-12 col-xs-12 "> <div class="field-content" >
<div class="row recuadrotsmc"><div class="col-sm-6 col-xs-6"><span> USD</span></div>
<div class="col-sm-6 col-xs-6 centrado textp"><strong class="strong-tb">1.896,12250000</strong></div>
</div></div></div>
<div class="pull-right dinpro center"> Fecha Valor: <span property="dc:date"
datatype="xsd:dateTime" content="2026-11-06T00:00:00-04:00">Viernes, 06 Noviembre 2026</span></div>`;

describe("la tasa oficial", () => {
  it("se lee de la portada del BCV, con su punto de miles y su coma", () => {
    expect(tasaDelBcv(PORTADA)).toEqual({
      bsPorUsd: 1896.1225,
      fechaValor: "2026-11-06",
    });
    expect(tasaDelBcv("<html>sin tasa</html>")).toBeNull();
  });

  it("o de DolarAPI, pero solo la fuente oficial", () => {
    expect(
      tasaDeDolarApi({
        fuente: "oficial",
        promedio: 894.8876,
        fechaActualizacion: "2026-11-05T00:00:00-04:00",
      }),
    ).toEqual({ bsPorUsd: 894.8876, fechaValor: "2026-11-05" });
    expect(
      tasaDeDolarApi({
        fuente: "paralelo",
        promedio: 1000,
        fechaActualizacion: "2026-11-05",
      }),
    ).toBeNull();
    expect(tasaDeDolarApi(null)).toBeNull();
  });

  it("la cuenta y cómo se escribe", () => {
    const tasa = { bsPorUsd: 894.8876, fechaValor: "2026-11-05" };
    expect(aBolivares(316, tasa)).toBe(2827.84);
    expect(textoBolivares(2827.84)).toBe("Bs. 2.827,84");
    expect(textoBolivares(2827.84, "en")).toBe("Bs. 2,827.84");
  });
});

describe("no tumba la ficha y no escribe en la base", () => {
  const servidor = leer("src/lib/precios/bcv-servidor.ts");

  it("solo la caché del borde; nada de base de datos", () => {
    expect(servidor).toContain('recordadoEnElBorde("tasa-bcv"');
    expect(servidor).not.toContain("getDb");
    expect(servidor).not.toContain("registrarError");
  });

  it("si nadie responde, devuelve null y espera antes de volver a preguntar", () => {
    expect(servidor).toContain(
      "noPreguntarHasta = Date.now() + ESPERA_SI_FALLA_MS;",
    );
    expect(servidor).toContain(
      "(await desdeElBcv()) ?? (await desdeDolarApi())",
    );
  });

  it("solo en las fichas de Venezuela con precio en dólares", () => {
    expect(
      leer("src/app/[locale]/(tienda)/producto/[slug]/page.tsx"),
    ).toContain('(await mercadoDeLaPeticion()).codigo === "VE" &&');
  });
});
