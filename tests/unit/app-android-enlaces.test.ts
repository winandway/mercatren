import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  enlacesDeLaApp,
  HUELLAS_SHA256,
  PAQUETE_ANDROID,
} from "@/lib/app-android/enlaces";

/**
 * ══ LA APP DE ANDROID Y EL SITIO SE RECONOCEN (27 oct 2026) ══
 *
 * Si `/.well-known/assetlinks.json` no trae la huella correcta, la app abre
 * con la barra del navegador arriba y deja de verse como una app. Esto tranca
 * el formato y que el paquete sea el mismo que el del proyecto de Android.
 */
const RAIZ = join(__dirname, "..", "..");

describe("assetlinks.json", () => {
  it("es el formato oficial de Digital Asset Links", () => {
    const [enlace] = enlacesDeLaApp();
    expect(enlace?.relation).toEqual([
      "delegate_permission/common.handle_all_urls",
    ]);
    expect(enlace?.target.namespace).toBe("android_app");
    expect(enlace?.target.package_name).toBe("com.mercatren.app");
  });

  it("trae al menos una huella, y cada una es SHA-256 en mayúsculas con dos puntos", () => {
    expect(HUELLAS_SHA256.length).toBeGreaterThan(0);
    for (const h of HUELLAS_SHA256) {
      expect(h).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
    }
    expect(new Set(HUELLAS_SHA256).size).toBe(HUELLAS_SHA256.length);
  });

  it("la ruta existe donde Android la busca", () => {
    expect(
      existsSync(join(RAIZ, "src/app/.well-known/assetlinks.json/route.ts")),
    ).toBe(true);
  });

  it("el paquete es el mismo que compila el proyecto de Android", () => {
    const gradle = join(RAIZ, "app-android/app/build.gradle");
    if (!existsSync(gradle)) return;
    expect(readFileSync(gradle, "utf8")).toContain(
      `applicationId "${PAQUETE_ANDROID}"`,
    );
  });
});
