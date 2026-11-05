import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  absoluta,
  FalloDeRed,
  paisSigueEncendido,
  pedirJson,
  urlCatalogo,
  urlPaises,
  urlProducto,
} from "../../app-movil/src/lib/api";
import { divisorDe, precioTexto } from "../../app-movil/src/lib/dinero";
import { idiomaDelTelefono, TEXTOS } from "../../app-movil/src/lib/textos";
import { formatearPrecio } from "@/lib/dinero";
import { MERCADOS } from "@/lib/mercado/mercados";
import {
  divisorDe as divisorDeLaWeb,
  monedaDelMercado,
} from "@/lib/mercado/moneda";

/**
 * LA APP NATIVA (5 nov 2026, Parte 2 de la sección 10 del plan). Lo que no puede
 * pasar sin que esto se ponga en rojo: que la app escriba un precio distinto
 * del de la web (un peso chileno dividido entre 100 es una venta a pérdida),
 * que pida a una ruta que no existe, que falte un texto en un idioma, o que el
 * selector de idioma deje de ser el de Amazon con la bandera de España.
 */

const APP = "app-movil/src";

function archivosDe(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? archivosDe(p) : [p];
  });
}

describe("el precio de la app es el mismo de la web", () => {
  const monedas = [...new Set(MERCADOS.map((m) => monedaDelMercado(m)))];

  it("el divisor de cada moneda de cada país coincide con el de la web", () => {
    expect(monedas.length).toBeGreaterThan(1);
    for (const moneda of monedas) {
      expect(divisorDe(moneda), moneda).toBe(divisorDeLaWeb(moneda));
    }
  });

  it("el texto del precio coincide, en los dos idiomas", () => {
    for (const moneda of monedas) {
      for (const idioma of ["es", "en"] as const) {
        expect(
          precioTexto(1299000, moneda, idioma),
          `${moneda} ${idioma}`,
        ).toBe(formatearPrecio(1299000, idioma, moneda));
      }
    }
  });

  it("los casos que ya costaron caro", () => {
    expect(precioTexto(2599, "USD", "en")).toBe("$25.99");
    expect(precioTexto(1250, "EUR", "es")).toMatch(/^12,50\s€$/);
    expect(divisorDe("CLP")).toBe(1);
    expect(divisorDe("clp")).toBe(1);
  });
});

describe("las direcciones que pide la app", () => {
  it("van a la puerta de datos, con país e idioma, nunca a /api", () => {
    expect(urlPaises("es")).toBe(
      "https://mercatren.com/datos/app/v1/paises?idioma=es",
    );
    expect(urlCatalogo({ pais: "US", idioma: "en" })).toBe(
      "https://mercatren.com/datos/app/v1/catalogo?pais=US&idioma=en",
    );
  });

  it("la búsqueda va limpia, la página 1 no se escribe y la 2 sí", () => {
    const u = new URL(
      urlCatalogo({ pais: "US", idioma: "es", q: "  silla  ", pagina: 1 }),
    );
    expect(u.searchParams.get("q")).toBe("silla");
    expect(u.searchParams.has("pagina")).toBe(false);
    expect(
      new URL(
        urlCatalogo({ pais: "US", idioma: "es", pagina: 2 }),
      ).searchParams.get("pagina"),
    ).toBe("2");
    expect(
      new URL(
        urlCatalogo({ pais: "US", idioma: "es", q: "   " }),
      ).searchParams.has("q"),
    ).toBe(false);
  });

  it("el slug va escapado y las fotos de /media salen del mismo servidor", () => {
    expect(urlProducto("a b", "US", "en")).toContain("/producto/a%20b?");
    expect(absoluta("/media/p/1.webp")).toBe(
      "https://mercatren.com/media/p/1.webp",
    );
    expect(absoluta("https://cdn.x/1.webp")).toBe("https://cdn.x/1.webp");
    expect(absoluta(null)).toBeNull();
  });

  it("cada ruta que pide la app existe en el sitio", () => {
    for (const ruta of ["paises", "catalogo", "producto/[slug]"]) {
      expect(
        statSync(`src/app/datos/app/v1/${ruta}/route.ts`).isFile(),
        ruta,
      ).toBe(true);
    }
  });
});

describe("un país que se apaga devuelve a la bienvenida", () => {
  const paises = [
    { codigo: "US", nombre: "United States", moneda: "USD", encendido: true },
    { codigo: "VE", nombre: "Venezuela", moneda: "USD", encendido: false },
  ];

  it("encendido se queda; apagado o desconocido, no", () => {
    expect(paisSigueEncendido("US", paises)).toBe(true);
    expect(paisSigueEncendido("VE", paises)).toBe(false);
    expect(paisSigueEncendido("XX", paises)).toBe(false);
  });

  it("la app lo comprueba al abrir, y sin red no echa a nadie", () => {
    const contexto = readFileSync(`${APP}/contexto/preferencias.tsx`, "utf-8");
    expect(contexto).toContain("!paisSigueEncendido(guardado, r.paises)");
    expect(contexto).toContain(".catch(() => undefined)");
  });
});

describe("pedirJson dice qué pasó", () => {
  const respuesta = (estado: number, cuerpo: unknown = {}) =>
    (async () =>
      new Response(JSON.stringify(cuerpo), { status: estado })) as typeof fetch;

  it("lo bueno llega como JSON", async () => {
    await expect(
      pedirJson("https://x/y", respuesta(200, { ok: true })),
    ).resolves.toEqual({
      ok: true,
    });
  });

  it("404 es «no existe», 503 es «servidor», sin red es «sin conexión»", async () => {
    await expect(pedirJson("https://x", respuesta(404))).rejects.toMatchObject({
      motivo: "no_existe",
    });
    await expect(pedirJson("https://x", respuesta(503))).rejects.toMatchObject({
      motivo: "servidor",
    });
    const sinRed = (async () => {
      throw new TypeError("Network request failed");
    }) as typeof fetch;
    const fallo = await pedirJson("https://x", sinRed).catch((e: unknown) => e);
    expect(fallo).toBeInstanceOf(FalloDeRed);
    expect((fallo as FalloDeRed).motivo).toBe("sin_conexion");
  });
});

describe("los textos, en los dos idiomas", () => {
  it("las mismas claves y ninguna vacía", () => {
    expect(Object.keys(TEXTOS.es).sort()).toEqual(
      Object.keys(TEXTOS.en).sort(),
    );
    for (const idioma of ["es", "en"] as const) {
      for (const [clave, valor] of Object.entries(TEXTOS[idioma])) {
        expect(valor.trim(), `${idioma}.${clave}`).not.toBe("");
      }
    }
  });

  it("el idioma del teléfono: español si es español, inglés en lo demás", () => {
    expect(idiomaDelTelefono("es")).toBe("es");
    expect(idiomaDelTelefono("ES-mx")).toBe("es");
    expect(idiomaDelTelefono("pt")).toBe("en");
    expect(idiomaDelTelefono(null)).toBe("en");
  });

  it("ninguna pantalla escribe texto a mano fuera de TEXTOS (salvo la marca)", () => {
    for (const archivo of archivosDe(`${APP}/app`)) {
      const fuente = readFileSync(archivo, "utf-8");
      const sueltos = [
        ...fuente.matchAll(/>\s*([A-Za-zÁÉÍÓÚáéíóúñ][^<>{}]{2,})\s*</g),
      ]
        .map((m) => m[1]?.trim())
        .filter((t) => t && !/^Mercatren/.test(t));
      expect(sueltos, archivo).toEqual([]);
    }
  });
});

describe("las reglas de la casa, dentro de la app", () => {
  const selector = readFileSync(
    `${APP}/components/selector-idioma.tsx`,
    "utf-8",
  );

  it("el selector de idioma es el de Amazon, en ventana flotante, con la bandera de España", () => {
    expect(selector).toContain('"English - EN"');
    expect(selector).toContain('"español - ES"');
    expect(selector).toContain("🇪🇸");
    expect(selector).toContain("🇺🇸");
    expect(selector).toContain("<Modal");
    expect(selector).toContain('accessibilityRole="radio"');
    expect(selector).toContain("COLORES.naranja");
    for (const ajena of ["🇲🇽", "🇨🇴", "🇻🇪", "🇦🇷"]) {
      expect(selector, ajena).not.toContain(ajena);
    }
  });

  it("nada de /api/ ni de servidores escritos a mano", () => {
    for (const archivo of archivosDe(APP)) {
      const fuente = readFileSync(archivo, "utf-8");
      expect(fuente, archivo).not.toMatch(/["'`]\/api\//);
      expect(fuente, archivo).not.toMatch(
        /["'`]https?:\/\/(localhost|127\.0\.0\.1)/,
      );
    }
  });

  it("la configuración de tipos de la app no depende de sus paquetes (GitHub no los instala)", () => {
    /* `expo start` vuelve a meter el «extends» si no se arranca con
       EXPO_NO_TYPESCRIPT_SETUP=1 (pasó el 5 nov 2026 y tumbó la publicación). */
    const tipos = JSON.parse(
      readFileSync("app-movil/tsconfig.json", "utf-8"),
    ) as Record<string, unknown>;
    expect(tipos.extends).toBeUndefined();
    expect(readFileSync("app-movil/package.json", "utf-8")).toContain(
      "EXPO_NO_TYPESCRIPT_SETUP=1",
    );
  });

  it("la app se llama Mercatren, con su identificador y la cuenta de Expo de la empresa", () => {
    const app = JSON.parse(readFileSync("app-movil/app.json", "utf-8")).expo;
    expect(app.name).toBe("Mercatren");
    expect(app.owner).toBe("windoce-llc");
    expect(app.ios.bundleIdentifier).toBe("com.mercatren.app");
    expect(app.android.package).toBe("com.mercatren.app");
  });
});
