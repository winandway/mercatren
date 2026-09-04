import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * EL CANARIO TIENE QUE PODER RESPONDER «¿POR QUÉ NADIE PUEDE ENTRAR?» (3 sep 2026).
 *
 * El día que la plataforma empezó a comerse la cabecera `cookie`, el sitio se
 * veía perfecto por fuera y nadie podía iniciar sesión. Costó media hora de
 * sospechas equivocadas porque no había forma de mirar dentro. Estos campos
 * son los que convierten eso en un minuto, y por eso no se quitan.
 */
const salud = readFileSync("src/app/datos/salud/route.ts", "utf-8");
const piezas = readFileSync("src/lib/salud/piezas.ts", "utf-8");

describe("el canario diagnostica las sesiones", () => {
  it("dice si las cookies llegan al servidor — la primera pregunta", () => {
    expect(salud).toContain('peticion.headers.get("cookie")');
    expect(salud).toContain("cookies: {");
  });

  it("prueba el ciclo completo dentro del servidor", () => {
    expect(piezas).toContain("auth.api.signUpEmail");
    expect(piezas).toContain("auth.api.getSession");
  });

  it("compara la clave que de verdad usa el sistema de cuentas", () => {
    expect(piezas).toContain('await import("@/lib/auth")');
    expect(piezas).toContain("secretoDeSesiones(");
  });

  it("comprueba que las cuatro tablas de cuentas se leen", () => {
    for (const tabla of ["session", "user", "account", "verification"]) {
      expect(piezas).toContain(`schema.${tabla}`);
    }
  });

  it("NO enseña ni la clave, ni un token, ni un correo", () => {
    /* Huellas de ocho caracteres y conteos: nada reconstruible. */
    expect(piezas).toContain("slice(0, 4)");
    expect(piezas).toContain("length(token)");
    expect(piezas).not.toMatch(/huella:\s*valor/);
  });
});
