import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { NOMBRES_DECLARADOS, revisarEntorno } from "@/env";

/**
 * NINGUNA VARIABLE DE ENTORNO SIN DECLARAR.
 *
 * El fallo que esto atrapa ya pasó y es de los peores, porque no se ve al
 * probar: alguien escribe `env.COSA_NUEVA` en el código, le funciona perfecto
 * en su computadora —la tiene en `.dev.vars`— y en producción no está, porque
 * nadie la cargó en el panel de YaDominios. La pantalla revienta para un
 * cliente y en local todo sigue verde.
 *
 * Aquí se recorre el código de verdad, se sacan todas las variables que usa y
 * se comparan con las declaradas en `src/env.ts` y con `.env.example`. Agregar
 * una variable obliga a documentarla en la misma compilación.
 */

const RAIZ = join(import.meta.dirname, "..", "..");

/** Nombres que parecen variables de entorno pero no lo son. */
const NO_SON_VARIABLES = new Set([
  // Los bindings de la plataforma que ya están declarados aparte.
  "ASSETS",
  // Constantes en mayúsculas que se leen de otros objetos llamados `env`.
  "NODE_ENV",
]);

function archivosDeCodigo(carpeta: string, acumulado: string[] = []): string[] {
  for (const entrada of readdirSync(carpeta)) {
    const ruta = join(carpeta, entrada);
    if (statSync(ruta).isDirectory()) {
      archivosDeCodigo(ruta, acumulado);
    } else if (/\.(ts|tsx)$/.test(entrada)) {
      acumulado.push(ruta);
    }
  }
  return acumulado;
}

/** Saca los `env.NOMBRE` y `process.env.NOMBRE` que usa el código. */
function variablesQueUsaElCodigo(): Map<string, string[]> {
  const encontradas = new Map<string, string[]>();

  for (const archivo of archivosDeCodigo(join(RAIZ, "src"))) {
    // El propio declarante no cuenta: ahí están escritas todas a propósito.
    if (archivo.endsWith(join("src", "env.ts"))) continue;

    const texto = readFileSync(archivo, "utf8");
    for (const coincidencia of texto.matchAll(
      /(?:process\.)?env\.([A-Z][A-Z0-9_]{2,})/g,
    )) {
      const nombre = coincidencia[1];
      if (!nombre || NO_SON_VARIABLES.has(nombre)) continue;

      const donde = archivo.slice(RAIZ.length + 1);
      const lista = encontradas.get(nombre) ?? [];
      if (!lista.includes(donde)) lista.push(donde);
      encontradas.set(nombre, lista);
    }
  }

  return encontradas;
}

function variablesDelEjemplo(): string[] {
  return readFileSync(join(RAIZ, ".env.example"), "utf8")
    .split("\n")
    .map((linea) => linea.trim())
    .filter((linea) => linea && !linea.startsWith("#"))
    .map((linea) => linea.split("=")[0]?.trim() ?? "")
    .filter(Boolean);
}

describe("las variables de entorno", () => {
  it("todas las que usa el código están declaradas en src/env.ts", () => {
    const usadas = variablesQueUsaElCodigo();
    const sinDeclarar: string[] = [];

    for (const [nombre, archivos] of usadas) {
      if (!NOMBRES_DECLARADOS.includes(nombre)) {
        sinDeclarar.push(`${nombre} (en ${archivos.join(", ")})`);
      }
    }

    expect(
      sinDeclarar,
      "Estas variables se usan en el código pero no están en src/env.ts.\n" +
        "Sin declararlas, nadie sabe que hay que cargarlas en el panel de\n" +
        "YaDominios Cloud, y la pantalla revienta en producción.",
    ).toEqual([]);
  });

  it("todas las declaradas están en .env.example", () => {
    /* .env.example es la lista que mira una persona cuando monta el sitio. Si
       una variable no está ahí, no la carga, y se descubre en producción. */
    const enElEjemplo = variablesDelEjemplo();
    const bindings = ["DB", "BUCKET"]; // los pone la plataforma sola

    const faltan = NOMBRES_DECLARADOS.filter(
      (n) => !bindings.includes(n) && !enElEjemplo.includes(n),
    );

    expect(
      faltan,
      "Están declaradas en src/env.ts pero faltan en .env.example",
    ).toEqual([]);
  });

  it("el ejemplo no trae ni un valor de verdad", () => {
    /* El repositorio es público. Un solo valor real en .env.example queda en la
       historia para siempre. */
    const lineas = readFileSync(join(RAIZ, ".env.example"), "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"));

    const conValor: string[] = [];
    for (const linea of lineas) {
      const valor = (linea.split("=")[1] ?? "")
        .trim()
        .replace(/^["']|["']$/g, "");
      if (!valor) continue;

      // Se permiten los valores de ejemplo evidentes.
      const inofensivo =
        valor.startsWith("http://localhost") ||
        /^(Mercatren|Mercatren <avisos@mercatren\.com>)$/.test(valor);

      if (!inofensivo) conValor.push(linea.trim());
    }

    expect(conValor, "hay valores de verdad en .env.example").toEqual([]);
  });

  it("avisa cuando falta lo imprescindible", () => {
    const sinNada = revisarEntorno({});
    expect(sinNada.bien).toBe(false);
    expect(sinNada.faltanImprescindibles).toContain("DB");
    expect(sinNada.faltanImprescindibles).toContain("BUCKET");
  });

  it("da por bueno un entorno mínimo pero completo", () => {
    /* El sitio tiene que poder levantar solo con lo que da la plataforma: sin
       correo, sin escudo y sin Stripe. Está hecho así a propósito. */
    const minimo = revisarEntorno({ DB: {}, BUCKET: {} });
    expect(minimo.bien, minimo.malFormadas.join(" · ")).toBe(true);
  });

  it("rechaza una clave de Stripe que no lo parece", () => {
    const malo = revisarEntorno({
      DB: {},
      BUCKET: {},
      STRIPE_SECRET_KEY: "esto-no-es-una-clave",
    });
    expect(malo.bien).toBe(false);
    expect(malo.malFormadas.join(" ")).toContain("STRIPE_SECRET_KEY");
  });
});
