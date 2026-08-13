import { describe, expect, it } from "vitest";

import {
  baseDelAgente,
  esperaConfirmacion,
  idDeConversacion,
  idValido,
  LARGO_MAXIMO,
  LARGO_MINIMO,
  motivoDelEstado,
  segundosDeEspera,
} from "@/lib/asistente/sesion";

/**
 * EL AGENTE OPERATIVO.
 *
 * Lo que se vigila aquí es de quién es cada conversación. Dos personas con el
 * mismo identificador comparten la suya: lo que una preguntó sobre la
 * operación aparece en la pantalla de la otra.
 */

describe("el identificador de la conversación", () => {
  it("sale del identificador de la cuenta y lo acepta el agente", () => {
    const id = idDeConversacion("lZA5k0Gg6CRFUbjjHNVwik9nnDF4IIOE");
    expect(id).not.toBeNull();
    expect(idValido(id!)).toBe(true);
  });

  it("limpia el guion bajo que mete nanoid", () => {
    /* Es el detalle que rompe en silencio: el identificador parece correcto y
       el agente lo rechaza. */
    const id = idDeConversacion("puGzb9BHie3VHux_rLFw6")!;
    expect(id).not.toContain("_");
    expect(idValido(id)).toBe(true);
  });

  it("dos cuentas distintas nunca comparten conversación", () => {
    const a = idDeConversacion("cuentaUno");
    const b = idDeConversacion("cuentaDos");
    expect(a).not.toBe(b);
  });

  it("la misma cuenta siempre vuelve a la suya", () => {
    expect(idDeConversacion("abcdef")).toBe(idDeConversacion("abcdef"));
  });

  it("una cuenta con identificador corto igual llega al mínimo", () => {
    const id = idDeConversacion("ab")!;
    expect(id.length).toBeGreaterThanOrEqual(LARGO_MINIMO);
    expect(idValido(id)).toBe(true);
  });

  it("uno larguísimo se recorta sin quedar con un guion colgando", () => {
    const id = idDeConversacion("x".repeat(200))!;
    expect(id.length).toBeLessThanOrEqual(LARGO_MAXIMO);
    expect(id.endsWith("-")).toBe(false);
    expect(idValido(id)).toBe(true);
  });

  it("sin cuenta no se inventa ninguno", () => {
    /* Un identificador inventado sería una conversación compartida por todos
       los que llegaran sin sesión. */
    expect(idDeConversacion("")).toBeNull();
    expect(idDeConversacion("   ")).toBeNull();
    expect(idDeConversacion("___")).toBeNull();
  });

  it("no deja pasar lo que el agente rechazaría", () => {
    expect(idValido("corto")).toBe(false);
    expect(idValido("con espacio aqui")).toBe(false);
    expect(idValido("con_guion_bajo")).toBe(false);
    expect(idValido("x".repeat(65))).toBe(false);
  });
});

describe("cuando el agente se detiene a preguntar", () => {
  it("se reconoce que espera una confirmación", () => {
    expect(
      esperaConfirmacion({ respuesta: "…", detenido_por: "confirmacion" }),
    ).toBe(true);
  });

  it("detenerse por otra cosa no es una confirmación", () => {
    /* Un fallo repetido o el tope de vueltas no le piden nada a nadie: no
       pueden dibujar la misma pantalla que una confirmación pendiente. */
    expect(
      esperaConfirmacion({ respuesta: "…", detenido_por: "fallo_repetido" }),
    ).toBe(false);
    expect(
      esperaConfirmacion({
        respuesta: "…",
        detenido_por: "limite_iteraciones",
      }),
    ).toBe(false);
    expect(esperaConfirmacion({ respuesta: "…" })).toBe(false);
  });
});

describe("los errores del agente", () => {
  it("cada código dice lo suyo", () => {
    expect(motivoDelEstado(401)).toBe("token_rechazado");
    expect(motivoDelEstado(403)).toBe("token_rechazado");
    expect(motivoDelEstado(429)).toBe("demasiadas_peticiones");
    expect(motivoDelEstado(503)).toBe("agente_sin_configurar");
    expect(motivoDelEstado(500)).toBe("sin_respuesta");
  });
});

describe("cuánto esperar tras un 429", () => {
  it("respeta lo que diga la cabecera", () => {
    expect(segundosDeEspera("30")).toBe(30);
    expect(segundosDeEspera(" 45 ")).toBe(45);
  });

  it("sin cabecera o con una rara, un minuto", () => {
    /* Mejor un número razonable que dejar a alguien probando cada dos
       segundos y agravando su propio bloqueo. */
    expect(segundosDeEspera(null)).toBe(60);
    expect(segundosDeEspera("")).toBe(60);
    expect(segundosDeEspera("mañana")).toBe(60);
    expect(segundosDeEspera("-5")).toBe(60);
  });

  it("un valor absurdo se acota", () => {
    expect(segundosDeEspera("999999")).toBe(1800);
  });
});

describe("la dirección del agente", () => {
  it("se acepta tal cual si viene bien", () => {
    expect(baseDelAgente("https://agente.ejemplo.dev")).toBe(
      "https://agente.ejemplo.dev",
    );
  });

  it("le quita la barra del final", () => {
    /* Al copiarla del navegador viene con `/`, y pegada tal cual daría
       `.../salud` con dos barras: unos servidores lo aceptan y otros
       devuelven 404. Es el error que se pasa una tarde buscando. */
    expect(baseDelAgente("https://agente.ejemplo.dev/")).toBe(
      "https://agente.ejemplo.dev",
    );
    expect(baseDelAgente("https://agente.ejemplo.dev///")).toBe(
      "https://agente.ejemplo.dev",
    );
    expect(baseDelAgente("  https://agente.ejemplo.dev/  ")).toBe(
      "https://agente.ejemplo.dev",
    );
  });

  it("exige HTTPS: el token viaja en la cabecera", () => {
    /* Por HTTP iría en claro por la red. */
    expect(baseDelAgente("http://agente.ejemplo.dev")).toBeNull();
  });

  it("sin dirección NO se inventa ninguna", () => {
    /* Apuntar a un sitio por defecto sería mandarle el token a una dirección
       que nadie decidió. */
    expect(baseDelAgente(undefined)).toBeNull();
    expect(baseDelAgente(null)).toBeNull();
    expect(baseDelAgente("")).toBeNull();
    expect(baseDelAgente("   ")).toBeNull();
    expect(baseDelAgente("no-es-una-direccion")).toBeNull();
  });
});
