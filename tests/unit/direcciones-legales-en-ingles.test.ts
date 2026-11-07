import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { direccionLegalNueva } from "@/lib/direcciones-legales";

/**
 * CANDADO — LAS DIRECCIONES LEGALES VAN EN INGLÉS (7 nov 2026).
 *
 * `/privacy` y `/terms` son las direcciones; `/privacidad` y `/terminos`
 * (declaradas en Google Play y App Store Connect) redirigen con 301 y nunca
 * se rompen. Ninguna referencia interna vuelve a usar las viejas.
 */

const RAIZ = process.cwd();
const leer = (r: string) => readFileSync(join(RAIZ, r), "utf-8");
const PAGINAS = "src/app/[locale]/(tienda)/(docs)";

function archivos(dir: string, salida: string[] = []): string[] {
  for (const nombre of readdirSync(join(RAIZ, dir))) {
    const ruta = `${dir}/${nombre}`;
    if (statSync(join(RAIZ, ruta)).isDirectory()) archivos(ruta, salida);
    else if (/\.(tsx?|json|md|mjs|txt)$/.test(nombre)) salida.push(ruta);
  }
  return salida;
}

describe("las páginas legales viven en inglés", () => {
  it("existen privacy y terms, y ya no existen privacidad ni terminos", () => {
    expect(existsSync(join(RAIZ, `${PAGINAS}/privacy/page.tsx`))).toBe(true);
    expect(existsSync(join(RAIZ, `${PAGINAS}/terms/page.tsx`))).toBe(true);
    expect(existsSync(join(RAIZ, `${PAGINAS}/privacidad`))).toBe(false);
    expect(existsSync(join(RAIZ, `${PAGINAS}/terminos`))).toBe(false);
  });

  it("existen support, returns y shipping, y ya no ayuda, devoluciones ni entrega", () => {
    for (const nueva of ["support", "returns", "shipping"])
      expect(
        existsSync(join(RAIZ, `${PAGINAS}/${nueva}/page.tsx`)),
        nueva,
      ).toBe(true);
    for (const vieja of ["ayuda", "devoluciones", "entrega"])
      expect(existsSync(join(RAIZ, `${PAGINAS}/${vieja}`)), vieja).toBe(false);
    expect(
      existsSync(join(RAIZ, `${PAGINAS}/support/caso/[codigo]/page.tsx`)),
    ).toBe(true);
  });

  it("cada página se declara con su dirección en inglés", () => {
    for (const nueva of ["support", "returns", "shipping"])
      expect(leer(`${PAGINAS}/${nueva}/page.tsx`)).toContain(
        `const RUTA = "/${nueva}";`,
      );
    expect(leer(`${PAGINAS}/privacy/page.tsx`)).toContain(
      'const RUTA = "/privacy";',
    );
    expect(leer(`${PAGINAS}/terms/page.tsx`)).toContain(
      'const RUTA = "/terms";',
    );
  });
});

describe("las viejas redirigen con 301 conservando el idioma", () => {
  it.each([
    ["/privacidad", "/privacy"],
    ["/es/privacidad", "/es/privacy"],
    ["/en/privacidad", "/en/privacy"],
    ["/terminos", "/terms"],
    ["/es/terminos", "/es/terms"],
    ["/en/terminos", "/en/terms"],
    ["/ayuda", "/support"],
    ["/es/ayuda", "/es/support"],
    ["/en/ayuda", "/en/support"],
    ["/es/ayuda/caso/abc123", "/es/support/caso/abc123"],
    ["/devoluciones", "/returns"],
    ["/es/devoluciones", "/es/returns"],
    ["/en/devoluciones", "/en/returns"],
    ["/entrega", "/shipping"],
    ["/es/entrega", "/es/shipping"],
    ["/en/entrega", "/en/shipping"],
  ])("%s → %s", (vieja, nueva) => {
    expect(direccionLegalNueva(vieja)).toBe(nueva);
  });

  it("las nuevas y las demás no se tocan", () => {
    for (const r of [
      "/privacy",
      "/es/terms",
      "/es/privacidad-falsa",
      "/es/terminosx",
      "/es/support",
      "/es/returns",
      "/en/shipping",
      "/es/panel/devoluciones",
      "/datos/app/v1/entrega",
      "/upload/ayuda/abc",
      "/es/ayudante",
      "/es/delete-account",
    ]) {
      expect(direccionLegalNueva(r), r).toBeNull();
    }
  });

  it("el middleware la devuelve con 301 explícito, antes del cierre de la tienda", () => {
    const f = leer("src/middleware.ts");
    const redir = f.indexOf("direccionLegalNueva(pathname)");
    expect(redir).toBeGreaterThan(-1);
    expect(f.slice(redir, redir + 400)).toContain(
      "NextResponse.redirect(destino, 301)",
    );
    expect(redir).toBeLessThan(f.indexOf("tiendaCerradaAqui() &&"));
  });
});

describe("ninguna referencia interna usa las direcciones viejas", () => {
  /* Una dirección: empieza tras una comilla, espacio o paréntesis, con el idioma
     opcional delante. Así no salta con los archivos de contenido
     (`paginas/privacidad`) ni con las etiquetas de texto (`<terminos>`). */
  const VIEJA =
    /(?:^|["'`\s(\[=])(?:\/(?:es|en|\$\{[^}]*\}|\{idioma\}))?\/(?:privacidad|terminos|ayuda|devoluciones|entrega)(?![\w-])/;
  /* Aquí viven a propósito: el mecanismo de la redirección y este candado. */
  const PERMITIDOS = new Set([
    "src/lib/direcciones-legales.ts",
    "tests/unit/direcciones-legales-en-ingles.test.ts",
  ]);

  it("ni src, ni la app, ni las fichas de las tiendas, ni public, ni messages", () => {
    const sospechosos: string[] = [];
    for (const dir of [
      "src",
      "app-movil/src",
      "tienda-apps",
      "public",
      "messages",
      "tests",
      "e2e",
    ]) {
      if (!existsSync(join(RAIZ, dir))) continue;
      for (const f of archivos(dir)) {
        if (PERMITIDOS.has(f)) continue;
        leer(f)
          .split("\n")
          .forEach((linea, i) => {
            if (VIEJA.test(linea))
              sospechosos.push(`${f}:${i + 1}: ${linea.trim()}`);
          });
      }
    }
    expect(sospechosos).toEqual([]);
  });
});
