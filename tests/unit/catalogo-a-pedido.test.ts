import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { esLaAppMovil } from "@/lib/app-movil";
import { CATALOGO_A_PEDIDO } from "@/lib/catalogo/a-pedido";
import { CERRADO_A_TODOS, robotsTxt } from "@/lib/seo/robots";

/**
 * MERCATREN VACIADO Y EL CATÁLOGO A PEDIDO (3 nov 2026).
 *
 * Orden de Richard: vaciar el catálogo y empezar de cero; la web deja de
 * vender por ahora y Mercatren pasa a ser app. Lo que no puede volver a pasar
 * sin que esto se ponga en rojo: que entre un catálogo entero solo, que una
 * tarea programada lo recorra, que los robots lo rastreen, o que la app
 * escriba en la base en cada pantalla.
 */

const leer = (ruta: string) => readFileSync(ruta, "utf-8");

/** El cuerpo de una función exportada, hasta la siguiente exportación. */
function cuerpoDe(ruta: string, nombre: string): string {
  const texto = leer(ruta);
  const desde = texto.indexOf(`export async function ${nombre}(`);
  expect(desde, `${ruta}: ${nombre}`).toBeGreaterThan(-1);
  const resto = texto.slice(desde + 1);
  const hasta = resto.search(/\nexport /);
  return hasta === -1 ? resto : resto.slice(0, hasta);
}

describe("el catálogo se arma a pedido", () => {
  it("la regla está encendida", () => {
    expect(CATALOGO_A_PEDIDO).toBe(true);
  });

  it.each([
    ["src/lib/cj/masivo-servidor.ts", "arrancarImportacion"],
    ["src/lib/cj/masivo-servidor.ts", "avanzarImportacion"],
    ["src/lib/cj/masivo-servidor.ts", "avanzarImportacionesEnCurso"],
    ["src/lib/cj/masivo-servidor.ts", "reanudarImportacion"],
    ["src/lib/catalogo/sincronizar.ts", "sincronizarCatalogo"],
    ["src/lib/cj/afinar.ts", "afinarImportados"],
    ["src/lib/cj/existencias.ts", "refrescarExistenciasCj"],
  ])("%s · %s mira la regla antes de trabajar", (ruta, nombre) => {
    const cuerpo = cuerpoDe(ruta, nombre);
    const regla = cuerpo.indexOf("CATALOGO_A_PEDIDO");
    expect(regla, `${nombre} no mira la regla`).toBeGreaterThan(-1);
    /* Antes de pedirle nada al proveedor o de escribir en la base. */
    for (const trabajo of ["llamarCjConRitmo(", ".insert(", ".update("]) {
      const i = cuerpo.indexOf(trabajo);
      if (i !== -1) expect(regla, `${nombre}: ${trabajo}`).toBeLessThan(i);
    }
  });

  it("el afinado cerrado NO dice «motivo»: el reloj lo leería como CJ sin puntos y dejaría de mirar los despachos", () => {
    const cuerpo = cuerpoDe("src/lib/cj/afinar.ts", "afinarImportados");
    expect(cuerpo).toMatch(/if \(CATALOGO_A_PEDIDO\) return vacio;/);
  });

  it("el panel no dibuja la importación masiva y dice por qué", () => {
    const pagina = leer("src/app/[locale]/panel/catalogo-usa/page.tsx");
    const aviso = pagina.indexOf("{CATALOGO_A_PEDIDO ? (");
    expect(aviso).toBeGreaterThan(-1);
    expect(pagina.indexOf("<ImportarMasivo")).toBeGreaterThan(aviso);
    for (const idioma of ["es", "en"]) {
      const textos = JSON.parse(leer(`messages/${idioma}.json`)) as {
        panel: { catalogoUsa: { unoPorUno?: string } };
      };
      expect(textos.panel.catalogoUsa.unoPorUno, idioma).toBeTruthy();
    }
  });
});

describe("ninguna tarea programada recorre el catálogo", () => {
  it("ningún flujo de GitHub tiene horario", () => {
    for (const archivo of readdirSync(".github/workflows")) {
      const lineas = leer(`.github/workflows/${archivo}`)
        .split("\n")
        .filter((l) => !l.trim().startsWith("#"));
      expect(
        lineas.some((l) => /^\s*schedule:/.test(l)),
        archivo,
      ).toBe(false);
    }
  });

  it("el sitio no tiene reloj propio en su configuración", () => {
    const config = leer("yadominios.json");
    expect(config).not.toMatch(/"triggers"|"crons"/);
  });
});

describe("los robots no entran", () => {
  it("el robots.txt cierra todo, para todos, sin mapa del sitio", () => {
    expect(CERRADO_A_TODOS).toBe(true);
    const texto = robotsTxt();
    expect(texto).toContain("User-agent: *\nDisallow: /\n");
    expect(texto).not.toMatch(/^Allow:/m);
    expect(texto).not.toMatch(/^Sitemap:/m);
    expect(texto.match(/^User-agent:/gm)).toHaveLength(1);
  });
});

describe("la app no escribe en la base en cada pantalla", () => {
  it("reconoce la app de iPhone, la de Android y la instalada", () => {
    const base = { agente: "Mozilla/5.0", independiente: false, referido: "" };
    expect(esLaAppMovil(base)).toBe(false);
    expect(
      esLaAppMovil({ ...base, agente: "Mozilla/5.0 MercatrenApp-iOS/1.0" }),
    ).toBe(true);
    expect(esLaAppMovil({ ...base, independiente: true })).toBe(true);
    expect(
      esLaAppMovil({ ...base, referido: "android-app://com.mercatren.app/" }),
    ).toBe(true);
  });

  it("el pulso de visitas no escribe dentro de la app", () => {
    const pulso = leer("src/components/analitica/pulso-de-visita.tsx");
    const salida = pulso.indexOf("if (dentroDeLaApp()) return;");
    expect(salida).toBeGreaterThan(-1);
    expect(pulso.indexOf('"/datos/visita"')).toBeGreaterThan(salida);
  });
});
