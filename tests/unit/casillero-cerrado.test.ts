import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import { CASILLERO_ABIERTO } from "@/lib/casillero/abierto";
import en from "../../messages/en.json";
import es from "../../messages/es.json";

/**
 * EL CASILLERO, CERRADO (7 nov 2026, orden de Richard): la empresa del
 * casillero en Miami está cerrada y un paquete mandado ahí no lo recibe nadie.
 * Lo que no puede pasar sin que esto se ponga en rojo:
 * - que se abra sin querer (abrirlo es cambiar esta prueba, a propósito);
 * - que una página del casillero enseñe la dirección o el formulario;
 * - que un enlace, botón o recuadro del sitio lo ofrezca sin el interruptor;
 * - que se pueda crear un casillero o avisar un paquete por un POST directo.
 */
const RAIZ = join(import.meta.dirname, "..", "..");
const leer = (r: string) => readFileSync(join(RAIZ, r), "utf-8");
const GUARDA = "if (!CASILLERO_ABIERTO)";

function archivos(dir: string): string[] {
  return readdirSync(join(RAIZ, dir)).flatMap((n) => {
    const r = join(dir, n);
    if (statSync(join(RAIZ, r)).isDirectory()) return archivos(r);
    return /\.tsx?$/.test(n) ? [r] : [];
  });
}

describe("el interruptor", () => {
  it("está cerrado", () => {
    expect(CASILLERO_ABIERTO).toBe(false);
  });
});

describe("las páginas del casillero solo dicen que no está disponible", () => {
  const paginas = archivos("src/app/[locale]/(tienda)/casillero").filter((r) =>
    r.endsWith("page.tsx"),
  );

  it("son las seis de siempre", () => {
    expect(paginas.length).toBeGreaterThanOrEqual(6);
  });

  it.each(paginas)("%s corta antes de leer nada", (r) => {
    const s = leer(r);
    const corte = s.indexOf(`${GUARDA} return <CasilleroCerrado />;`);
    expect(corte).toBeGreaterThan(-1);
    for (const despues of [
      "obtenerUsuario(",
      "casilleroDe(",
      "redirect(",
      "paisesCotizables(",
    ]) {
      const i = s.indexOf(despues, s.indexOf("export default"));
      if (i > -1) expect(corte).toBeLessThan(i);
    }
  });

  it("y no se le ofrecen a Google", () => {
    expect(leer("src/app/[locale]/(tienda)/casillero/layout.tsx")).toContain(
      "robots: { index: false",
    );
  });

  it("el aviso existe en los dos idiomas", () => {
    expect(es.casillero.cerrado.titulo).toBeTruthy();
    expect(en.casillero.cerrado.titulo).toBeTruthy();
    expect(es.casillero.cerrado.texto).toContain("No envíes");
    expect(en.casillero.cerrado.texto).toContain("don't ship");
  });
});

describe("nada del sitio lo ofrece sin el interruptor", () => {
  const fuera = [
    "src/app/[locale]/(tienda)/casillero/",
    "src/app/[locale]/panel/",
  ];
  const conEnlace = [
    ...archivos("src/app/[locale]"),
    ...archivos("src/components"),
    ...archivos("src/contenido"),
  ]
    .filter((r) => !fuera.some((f) => r.startsWith(f)))
    .filter((r) => !r.startsWith("src/components/panel/"))
    .filter((r) =>
      /["'`]\/casillero|casillero de Mercatren|Mercatren mailbox/.test(leer(r)),
    );

  it("hay enlaces que revisar (si no, la prueba no mira nada)", () => {
    expect(conEnlace.length).toBeGreaterThan(3);
  });

  it.each(conEnlace.map((r) => relative(RAIZ, join(RAIZ, r))))(
    "%s pasa por CASILLERO_ABIERTO",
    (r) => {
      expect(leer(r)).toContain("CASILLERO_ABIERTO");
    },
  );

  it("el recuadro «¿Compras en Estados Unidos?» no se dibuja", () => {
    const s = leer("src/components/casillero/invitacion-casillero.tsx");
    expect(s.indexOf(`${GUARDA} return null;`)).toBeGreaterThan(-1);
    expect(s.indexOf(`${GUARDA} return null;`)).toBeLessThan(
      s.indexOf("getTranslations("),
    );
  });

  it("la cuenta ni pregunta por el casillero", () => {
    expect(leer("src/app/[locale]/(tienda)/cuenta/page.tsx")).toContain(
      "CASILLERO_ABIERTO ? casilleroDe(usuario.id)",
    );
  });
});

describe("no se abre ni se avisa un paquete por la puerta de atrás", () => {
  it.each([
    "src/lib/casillero/acciones.ts",
    "src/lib/casillero/prealerta.ts",
    "src/app/datos/widget/route.ts",
    "src/app/widget/form/page.tsx",
  ])("%s corta con el interruptor", (r) => {
    expect(leer(r)).toContain(GUARDA);
  });
});
