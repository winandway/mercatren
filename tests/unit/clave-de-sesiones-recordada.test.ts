import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { leerUnaVezYRecordar } from "@/lib/sesion/clave-recordada";

/**
 * ══ LA CLAVE DE SESIONES SE LEÍA DE LA BASE EN CADA VISITA (7 oct 2026) ══
 *
 * Y cada vez que la base tardaba, la visita no reconocía la sesión: 187 veces
 * entre el 5 sep y el 4 oct en el registro de fallos (`sesion/leer`). Para
 * quien estaba dentro, eso era «me sacó sin razón».
 */
describe("leer una vez y recordar", () => {
  it("lee la base una sola vez, por muchas visitas que lleguen", async () => {
    let lecturas = 0;
    const clave = leerUnaVezYRecordar(async () => {
      lecturas++;
      return "la-clave";
    });
    for (let i = 0; i < 50; i++) expect(await clave.obtener()).toBe("la-clave");
    expect(lecturas).toBe(1);
  });

  it("EL CASO REAL: si la base tarda una vez, reintenta y la visita entra", async () => {
    let lecturas = 0;
    const clave = leerUnaVezYRecordar(async () => {
      lecturas++;
      if (lecturas === 1) throw new Error("Failed query: la base tardó");
      return "la-clave";
    });
    expect(await clave.obtener()).toBe("la-clave");
    expect(lecturas).toBe(2);
  });

  it("si falla dos veces seguidas, avisa el error y NO lo recuerda", async () => {
    let lecturas = 0;
    let caida = true;
    const clave = leerUnaVezYRecordar(async () => {
      lecturas++;
      if (caida) throw new Error("base caída");
      return "la-clave";
    });
    await expect(clave.obtener()).rejects.toThrow("base caída");
    /* La base vuelve: la visita siguiente lee de nuevo y entra. */
    caida = false;
    expect(await clave.obtener()).toBe("la-clave");
    expect(lecturas).toBe(3);
  });
});

describe("la clave de sesiones usa la pieza", () => {
  const auth = readFileSync("src/lib/auth.ts", "utf8");

  it("la variable del panel sigue mandando primero", () => {
    const primero = auth.indexOf("if (env.BETTER_AUTH_SECRET) return");
    const recordada = auth.indexOf("claveDeLaBase.obtener()");
    expect(primero).toBeGreaterThan(-1);
    expect(recordada).toBeGreaterThan(primero);
  });

  it("la lectura de la base pasa por leerUnaVezYRecordar", () => {
    expect(auth).toContain("leerUnaVezYRecordar(leerOCrearClaveEnLaBase)");
  });
});
