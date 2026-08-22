import { describe, expect, it } from "vitest";

import { esRutaSoloEquipo, tramoDelPanel } from "@/lib/panel/solo-equipo";

/**
 * LO QUE UN COMERCIO NO PUEDE VER, NI ESCRIBIENDO LA DIRECCIÓN.
 *
 * El menú ya ocultaba estas secciones, pero **ocultar no es cerrar**. Y en el
 * modo «ver el panel como este comercio» ni siquiera se ocultaban: el menú
 * miraba el ROL de la sesión, que sigue siendo `soporte`.
 */
describe("qué secciones son solo del equipo", () => {
  it("las del equipo se reconocen en los dos idiomas", () => {
    expect(esRutaSoloEquipo("/es/panel/tiendas")).toBe(true);
    expect(esRutaSoloEquipo("/en/panel/cuentas")).toBe(true);
    expect(esRutaSoloEquipo("/es/panel/configuracion")).toBe(true);
    expect(esRutaSoloEquipo("/es/panel/proveedor")).toBe(true);
    expect(esRutaSoloEquipo("/es/panel/catalogo-usa")).toBe(true);
  });

  it("con lo que venga detrás, también", () => {
    /* La ficha de un comercio concreto es tan del equipo como la lista. */
    expect(esRutaSoloEquipo("/es/panel/tiendas/bley-ferreteria")).toBe(true);
    expect(esRutaSoloEquipo("/es/panel/configuracion?seccion=zelle")).toBe(
      true,
    );
  });

  it("lo del comercio NO se cierra", () => {
    /* Estas son suyas: si se cerraran, el comercio se quedaría sin panel. */
    expect(esRutaSoloEquipo("/es/panel")).toBe(false);
    expect(esRutaSoloEquipo("/es/panel/mi-tienda")).toBe(false);
    expect(esRutaSoloEquipo("/es/panel/productos")).toBe(false);
    expect(esRutaSoloEquipo("/es/panel/retiros")).toBe(false);
    expect(esRutaSoloEquipo("/es/panel/billetera")).toBe(false);
    expect(esRutaSoloEquipo("/es/panel/cobros/enlaces")).toBe(false);
    expect(esRutaSoloEquipo("/es/panel/ordenes")).toBe(false);
  });

  it("«tiendas» y «tiendas-usa» NO se confunden con «mi-tienda»", () => {
    /* Se compara por tramo completo, nunca por prefijo de texto: con un
       `startsWith` a secas, cerrar «tiendas» habría cerrado la pantalla propia
       del comercio y lo habría dejado sin poder editar su ficha. */
    expect(esRutaSoloEquipo("/es/panel/mi-tienda")).toBe(false);
    expect(esRutaSoloEquipo("/es/panel/tiendas")).toBe(true);
    expect(esRutaSoloEquipo("/es/panel/tiendas-usa")).toBe(true);
  });

  it("fuera del panel no decide nada", () => {
    expect(esRutaSoloEquipo("/es/catalogo")).toBe(false);
    expect(esRutaSoloEquipo("/es/tiendas")).toBe(false);
    expect(tramoDelPanel("/es/catalogo")).toBeNull();
  });

  it("el panel a secas no tiene tramo", () => {
    expect(tramoDelPanel("/es/panel")).toBeNull();
    expect(tramoDelPanel("/es/panel/")).toBeNull();
  });
});

describe("EL CANDADO ESTÁ ENCHUFADO, no solo escrito", () => {
  /**
   * Las pruebas de arriba comprueban la lista. Estas comprueban que de verdad
   * se aplique: `esRutaSoloEquipo` puede seguir perfecta mientras alguien la
   * desenchufa del middleware, y entonces todo pasa en verde con las secciones
   * del equipo abiertas otra vez.
   */
  it("el middleware la usa", async () => {
    const { readFileSync } = await import("node:fs");
    const fuente = readFileSync("src/middleware.ts", "utf8");
    expect(
      fuente,
      "el modo «ver su panel» volvió a dejar entrar a las secciones del equipo",
    ).toContain("esRutaSoloEquipo(pathname)");
  });

  it("el nombre de la cookie coincide en los dos sitios", async () => {
    /* El middleware corre en el borde y no puede importar `ver-como.ts`, que
       es `server-only`, así que lee la cookie por su nombre. Si alguien la
       renombra en un sitio y no en el otro, el candado se abre en silencio:
       nada falla, nada avisa, y las secciones del equipo vuelven a ser
       alcanzables desde el modo. */
    const { readFileSync } = await import("node:fs");
    const middleware = readFileSync("src/middleware.ts", "utf8");
    const verComo = readFileSync("src/lib/soporte/ver-como.ts", "utf8");

    const nombre = verComo.match(/const COOKIE = "([^"]+)"/)?.[1];
    expect(nombre, "no se encontró el nombre de la cookie").toBeTruthy();
    expect(middleware).toContain(`"${nombre}"`);
  });

  it("el menú deja de ser interno mientras se mira a un comercio", async () => {
    const { readFileSync } = await import("node:fs");
    const layout = readFileSync("src/app/[locale]/panel/layout.tsx", "utf8");
    expect(
      layout,
      "el menú volvió a mirar el ROL en vez del modo: Soporte vería su menú completo sobre el panel del comercio",
    ).toContain("esInterno={interno && !observado}");
  });
});
