import { describe, expect, it } from "vitest";

import { LARGO_MINIMO, medirClave } from "@/lib/validacion/fortaleza";

/**
 * EL MEDIDOR DE CONTRASEÑAS.
 *
 * Lo que se comprueba aquí no es cosmético: la misma cuenta que entra al panel
 * ve el dinero de un comercio y los datos de quienes le pagaron. Una contraseña
 * de las que prueba cualquier robot en el primer minuto no puede pasar.
 */

describe("lo que NO se puede aceptar nunca", () => {
  it("una casilla vacía", () => {
    const r = medirClave("");
    expect(r.aceptable).toBe(false);
    expect(r.porcentaje).toBe(0);
  });

  it("las contraseñas más usadas del mundo", () => {
    for (const mala of ["password", "123456", "qwerty", "iloveyou", "admin"]) {
      expect(medirClave(mala).aceptable, `pasó "${mala}"`).toBe(false);
    }
  });

  it("las que se le ocurren a cualquiera en ESTE sitio", () => {
    /* Un atacante que sabe dónde está entrando prueba primero el nombre del
       sitio y el de la empresa. */
    for (const mala of ["mercatren", "mercatren123", "windoce", "venezuela"]) {
      expect(medirClave(mala).aceptable, `pasó "${mala}"`).toBe(false);
    }
  });

  it("el mismo carácter repetido, por larga que sea", () => {
    const r = medirClave("aaaaaaaaaaaaaaaaaaaa");
    expect(r.aceptable).toBe(false);
    expect(r.consejos).toContain("todoIgual");
  });

  it("una tirada del teclado o del abecedario", () => {
    for (const mala of ["12345678", "abcdefgh", "qwertyui", "87654321"]) {
      expect(medirClave(mala).aceptable, `pasó "${mala}"`).toBe(false);
    }
  });

  it("cualquier cosa por debajo del mínimo", () => {
    const r = medirClave("Ab3!x");
    expect(r.aceptable).toBe(false);
    expect(r.consejos).toContain("muyCorta");
    expect(LARGO_MINIMO).toBe(8);
  });

  it("la que lleva dentro el correo o el nombre de la persona", () => {
    /* Quien intenta entrar a una cuenta ajena casi siempre conoce esos dos
       datos: son lo primero que prueba. */
    const r = medirClave("carlos2024!", ["carlos@correo.com", "Carlos Pérez"]);
    expect(r.aceptable).toBe(false);
    expect(r.consejos).toContain("llevaTusDatos");
  });

  it("pero un trozo cortito del contexto no la descalifica", () => {
    /* Si bastara con dos letras, "de" o "la" tumbarían media contraseña
       legítima. Solo cuentan los trozos que significan algo. */
    const r = medirClave("Montanas-Azules-77", ["a@b.co", "Ana"]);
    expect(r.aceptable).toBe(true);
  });
});

describe("qué tan fuerte es la que sí pasa", () => {
  it("una corta pero variada apenas aprueba", () => {
    const r = medirClave("Perro24!");
    expect(r.aceptable).toBe(true);
    expect(r.nivel).toBeLessThanOrEqual(2);
    expect(r.consejos).toContain("hazlaMasLarga");
  });

  it("UNA FRASE LARGA SACA MÁS QUE UNA CORTA LLENA DE SÍMBOLOS", () => {
    /* Esto es lo contrario de lo que pide la mayoría de los formularios, y es
       lo correcto: contra un ataque por fuerza bruta, cada carácter de más
       multiplica el trabajo mucho más que cambiar una `a` por una `@`. */
    const frase = medirClave("mi perro come tres veces al dia");
    const simbolos = medirClave("P@ss1!x");

    expect(frase.aceptable).toBe(true);
    expect(simbolos.aceptable).toBe(false); // ni siquiera llega al mínimo
    expect(frase.nivel).toBeGreaterThanOrEqual(3);
  });

  it("una larga y variada llega a lo más alto", () => {
    const r = medirClave("Mercado-Verde-88-Trueno!");
    expect(r.nivel).toBe(4);
    expect(r.porcentaje).toBe(100);
    expect(r.consejos).toContain("vaMuyBien");
  });

  it("estirar dos letras no engaña al medidor", () => {
    /* "abababababababab" es larga, pero solo tiene dos letras distintas: de
       fuerte no tiene nada y no puede puntuar como una de verdad. */
    const falsa = medirClave("abababababababab");
    const buena = medirClave("Ventana-Roja-2026");

    expect(falsa.nivel).toBeLessThan(buena.nivel);
  });

  it("el porcentaje siempre va de 0 a 100", () => {
    const claves = [
      "",
      "abc",
      "Perro24!",
      "mi perro come tres veces al dia",
      "x".repeat(200),
    ];
    for (const c of claves) {
      const p = medirClave(c).porcentaje;
      expect(
        p,
        `fuera de rango con "${c.slice(0, 20)}"`,
      ).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(100);
    }
  });

  it("nunca revienta, le den lo que le den", () => {
    const raros = [
      "   ",
      "🔐🔐🔐🔐🔐🔐🔐🔐",
      "\n\t\n\t",
      "ñ".repeat(30),
      "'; DROP TABLE--",
    ];
    for (const r of raros) {
      expect(() => medirClave(r), `reventó con "${r}"`).not.toThrow();
    }
  });
});
