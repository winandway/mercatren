import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DENUNCIAS_PARA_OCULTAR,
  esMotivoDeDenuncia,
  esTipoDenunciable,
  puedeModerar,
  seOcultaPorDenuncias,
} from "@/lib/moderacion/reglas";

/**
 * ══ DENUNCIAR Y BLOQUEAR (27 oct 2026) ══
 *
 * Google Play exige, para el contenido de usuarios que ve el público, poder
 * denunciarlo y bloquear a quien lo publicó desde la app. Esto tranca las
 * reglas y que las tres listas (comentarios, opiniones, preguntas) apliquen
 * los filtros y enseñen el menú.
 */
const RAIZ = join(__dirname, "..", "..");
const leer = (ruta: string) => readFileSync(join(RAIZ, ruta), "utf8");

describe("las reglas", () => {
  it("con tres denuncias abiertas se oculta solo, con dos no", () => {
    expect(DENUNCIAS_PARA_OCULTAR).toBe(3);
    expect(seOcultaPorDenuncias(2)).toBe(false);
    expect(seOcultaPorDenuncias(3)).toBe(true);
  });

  it("sin sesión no se denuncia, y nadie se denuncia a sí mismo", () => {
    expect(puedeModerar(null, "u1")).toBe("sesion");
    expect(puedeModerar("u1", "u1")).toBe("propio");
    expect(puedeModerar("u2", "u1")).toBe("ok");
    expect(puedeModerar("u2", null)).toBe("ok");
  });

  it("solo tipos y motivos conocidos", () => {
    expect(esTipoDenunciable("comentario")).toBe(true);
    expect(esTipoDenunciable("pedido")).toBe(false);
    expect(esMotivoDeDenuncia("spam")).toBe(true);
    expect(esMotivoDeDenuncia("me cae mal")).toBe(false);
  });
});

describe("las tres listas aplican los filtros", () => {
  it("comentarios: ocultos por denuncias y por bloqueo", () => {
    const s = leer("src/lib/videos/social.ts");
    expect(s).toMatch(/noOcultoPorDenuncias\("comentario"/);
    expect(s).toMatch(/autorNoBloqueado\(comentariosVideo\.usuarioId/);
  });

  it("opiniones: ocultas por denuncias y por bloqueo", () => {
    const s = leer("src/lib/valoraciones/consultas.ts");
    expect(s).toMatch(/noOcultoPorDenuncias\("opinion"/);
    expect(s).toMatch(/autorNoBloqueado\(valoraciones\.usuarioId/);
  });

  it("preguntas: ocultas por denuncias", () => {
    expect(leer("src/lib/preguntas/consultas.ts")).toMatch(
      /noOcultoPorDenuncias\("pregunta"/,
    );
  });

  it("los filtros nombran la tabla de afuera (trampa del 25 sep)", () => {
    const s = leer("src/lib/moderacion/filtros.ts");
    expect(s.match(/columnaDeFuera\(/g)?.length).toBeGreaterThanOrEqual(2);
    // Un autor vacío no puede desaparecer por el NULL de NOT IN.
    expect(s).toMatch(/coalesce\(/);
  });
});

describe("el menú está en las tres pantallas, y borrar ya no está a la vista", () => {
  it("comentarios de videos", () => {
    const s = leer("src/components/videos/acciones-social.tsx");
    expect(s).toMatch(/<MenuModeracion\s+tipo="comentario"/);
    expect(s).not.toMatch(/<Trash2/);
  });

  it("opiniones y preguntas de productos", () => {
    expect(leer("src/components/catalogo/opiniones-producto.tsx")).toMatch(
      /<MenuModeracion\s+tipo="opinion"/,
    );
    expect(leer("src/components/catalogo/preguntas-producto.tsx")).toMatch(
      /<MenuModeracion tipo="pregunta"/,
    );
  });

  it("los textos existen en los dos idiomas", () => {
    for (const idioma of ["es", "en"]) {
      const m = JSON.parse(leer(`messages/${idioma}.json`));
      expect(m.moderacion.denunciar).toBeTruthy();
      expect(m.moderacion.bloquear).toBeTruthy();
      for (const motivo of [
        "spam",
        "ofensivo",
        "sexual",
        "odio",
        "fraude",
        "otro",
      ]) {
        expect(m.moderacion.motivos[motivo]).toBeTruthy();
      }
    }
  });
});
