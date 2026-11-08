import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const leer = (p: string) => readFileSync(`app-movil/${p}`, "utf8");

/**
 * Google Play: el Plan Pro y los promocionados son servicios digitales y no
 * se pueden ofrecer en Android sin su sistema de cobro (dictamen del 8 nov).
 */
describe("Android no ofrece el Plan Pro ni promocionar", () => {
  it("la regla dice que en Android no", () => {
    expect(leer("src/lib/servicios-digitales.ts")).toMatch(
      /sistema !== "android"/,
    );
  });
  it("los botones de entrada pasan por la regla", () => {
    expect(leer("src/app/mi-tienda.tsx")).toMatch(
      /ofreceServiciosDigitales\(\) \?/,
    );
    expect(leer("src/components/formulario-producto.tsx")).toContain(
      "ofreceServiciosDigitales()",
    );
  });
  it("las pantallas tampoco abren por enlace", () => {
    for (const p of ["src/app/plan-pro.tsx", "src/app/promocionar/[id].tsx"]) {
      expect(leer(p)).toMatch(
        /if \(!ofreceServiciosDigitales\(\)\) return <Redirect/,
      );
    }
  });
});
