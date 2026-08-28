import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { aplicarAjustes } from "@/lib/mercado/ajustes-tasa";

/**
 * LA TASA AUTOMÁTICA (28 ago 2026). La pidió el dueño tumbando la casilla
 * manual: «pasará una semana sin actualizarla y nos hará perder dinero».
 */
describe("los ajustes sobre la tasa de la API", () => {
  it("EL ORDEN ES % PRIMERO, FIJO DESPUÉS, y queda fijado aquí", () => {
    /* 925.25 + 2% = 943.76 (943.755 redondeado), + $5 fijos = 948.76.
       Al revés (fijo primero, % después) daría 948.86 — diez centavos por
       dólar de diferencia, multiplicados por el catálogo entero. */
    expect(aplicarAjustes(92_525, 200, 500)).toBe(94_876);
  });

  it("sin ajustes, la tasa de la API pasa tal cual", () => {
    expect(aplicarAjustes(92_380, 0, 0)).toBe(92_380);
  });

  it("los ajustes negativos también funcionan: bajar es decisión del dueño", () => {
    expect(aplicarAjustes(100_000, -100, -200)).toBe(98_800);
  });
});

describe("los candados del módulo, mirando el código", () => {
  const fuente = readFileSync("src/lib/mercado/tasa-automatica.ts", "utf8");

  it("SE USA LA VENTA, no la compra", () => {
    /* «Venta» es lo que cuesta comprar dólares — el lado que nos toca. Usar
       «compra» abarataría el catálogo y la diferencia saldría del margen. */
    expect(fuente).toContain("datos.venta");
    expect(fuente).not.toContain("datos.compra");
  });

  it("una tasa fuera de rango SE DESCARTA, no se usa", () => {
    /* Un dato roto de un servicio ajeno no puede fijar el precio del
       catálogo: ni un peso por dólar, ni un millón. */
    expect(fuente).toContain("centesimas < piso");
    expect(fuente).toContain("centesimas > techo");
  });

  it("la guardada vieja tiene TOPE de vigencia", () => {
    /* Sin el tope, una caída larga de la API publicaría con la tasa de hace
       un mes — el mismo fallo de la casilla manual, con otro disfraz. */
    expect(fuente).toContain("VIGENCIA_MS");
    expect(fuente).toMatch(/Date\.now\(\) - fecha <= VIGENCIA_MS/);
  });

  it("la lectura de la API lleva su corte de tiempo", () => {
    /* Sin timeout, DolarApi lento congela el botón de agregar del catálogo. */
    expect(fuente).toContain("AbortController");
  });
});
