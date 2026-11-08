import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  fichaDeGooglePlay,
  insigniaDeGooglePlay,
  ofrecerLaApp,
} from "@/lib/app-android/google-play";

/**
 * EL BOTÓN DE GOOGLE PLAY (8 nov 2026): la web ofrece la app en el pie, la
 * portada y la cuenta, con el distintivo oficial en el idioma de la página,
 * y un aviso discreto solo en Android y fuera de la app.
 */
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
const TABLETA =
  "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/130 Safari/537.36";

const base = { referente: "", pantallaCompleta: false, cerradoAntes: false };

describe("el enlace y el distintivo", () => {
  it("van a la ficha de la app en el idioma de la página", () => {
    expect(fichaDeGooglePlay("es")).toBe(
      "https://play.google.com/store/apps/details?id=com.mercatren.app&hl=es",
    );
    expect(fichaDeGooglePlay("en")).toContain("&hl=en");
  });

  it("el distintivo existe en los dos idiomas", () => {
    for (const idioma of ["es", "en"]) {
      const { src } = insigniaDeGooglePlay(idioma);
      expect(src).toContain(`google-play-${idioma}`);
      expect(existsSync(`public${src}`), src).toBe(true);
    }
  });

  it("sale en el pie, la portada y la cuenta", () => {
    for (const archivo of [
      "src/components/layout/pie-pagina.tsx",
      "src/app/[locale]/(tienda)/page.tsx",
      "src/app/[locale]/(tienda)/cuenta/page.tsx",
    ]) {
      expect(readFileSync(archivo, "utf-8"), archivo).toContain(
        "<BotonGooglePlay",
      );
    }
    expect(
      readFileSync("src/app/[locale]/(tienda)/layout.tsx", "utf-8"),
    ).toContain("<AvisoAppAndroid");
  });
});

describe("el aviso de Android", () => {
  it("sale en un celular Android", () => {
    expect(ofrecerLaApp({ ...base, agente: ANDROID })).toBe(true);
  });

  it("no sale en iPhone ni en tableta", () => {
    expect(ofrecerLaApp({ ...base, agente: IPHONE })).toBe(false);
    expect(ofrecerLaApp({ ...base, agente: TABLETA })).toBe(false);
  });

  it("no sale dentro de la app ni después de cerrarlo", () => {
    expect(
      ofrecerLaApp({ ...base, agente: ANDROID, pantallaCompleta: true }),
    ).toBe(false);
    expect(
      ofrecerLaApp({
        ...base,
        agente: ANDROID,
        referente: "android-app://com.mercatren.app/",
      }),
    ).toBe(false);
    expect(ofrecerLaApp({ ...base, agente: ANDROID, cerradoAntes: true })).toBe(
      false,
    );
  });
});
