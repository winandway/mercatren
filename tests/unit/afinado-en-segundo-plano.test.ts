import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * EL AFINADO TIENE QUE AVANZAR SIN NADIE DELANTE (4 sep 2026).
 *
 * Palabras del dueño: «que quede trabajando en el fondo, que no tenga yo que
 * tener la computadora mía prendida o estar vigilando esto». Y el segundo
 * problema del mismo día: la pantalla decía «fallidos 6» cuando lo que
 * pasaba era que CJ se había quedado sin puntos de API — un fallo de nadie
 * leído como avería nuestra.
 */
const flujo = readFileSync(".github/workflows/afinar.yml", "utf-8");
const afinar = readFileSync("src/lib/cj/afinar.ts", "utf-8");
const tick = readFileSync("src/lib/reloj/tick.ts", "utf-8");
const puerta = readFileSync("src/app/datos/sincronizar/route.ts", "utf-8");

describe("el robot que afina en segundo plano", () => {
  it("corre en GitHub, no en la máquina de nadie, y varias veces por hora", () => {
    expect(flujo).toContain('cron: "5,35 * * * *"');
    expect(flujo).toContain("runs-on: ubuntu-latest");
  });

  it("trabaja en BUCLE CINCO HORAS: GitHub arranca unas cuatro veces al día, no cada media hora", () => {
    /* Medido el 4 sep: 4 arranques en 14 h, y la corrida con puntos de CJ
       afinó 715 y se detuvo por tiempo. Con cinco horas por corrida, cuatro
       arranques cubren el día. */
    expect(flujo).toContain("timeout-minutes: 330");
    expect(flujo).toContain("+ 18000");
    expect(flujo).toContain("while [");
  });

  it("no se solapa consigo mismo", () => {
    expect(flujo).toContain("group: afinar-catalogo");
    expect(flujo).toContain("cancel-in-progress: false");
  });

  it("pide SOLO el afinado: releer catálogos y traducir en cada vuelta sería trabajo repetido", () => {
    expect(flujo).toContain("?solo=afinado");
    expect(puerta).toContain('searchParams.get("solo") === "afinado"');
    /* Y la puerta de verdad se salta esos pasos. */
    expect(puerta).toContain("if (!soloAfinado) {");
  });

  it("sin puntos de CJ se detiene y NO marca rojo: no es un fallo nuestro", () => {
    expect(flujo).toContain("::notice::$motivo");
    expect(flujo).not.toContain("::error::$motivo");
  });
});

describe("«sin puntos» no se lee como avería", () => {
  it("el afinado corta antes de gastar la vuelta y dice cuándo vuelve", () => {
    expect(afinar).toContain("sigueSinPuntos(fila?.valor, Date.now())");
    expect(afinar).toContain("CJ no tiene puntos de API para hoy");
    expect(afinar).toContain("Sigue solo en");
  });

  it("el reloj lo anota como pausa, no como fallo", () => {
    expect(tick).toContain("afinado en pausa:");
  });
});
