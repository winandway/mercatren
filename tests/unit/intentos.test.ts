import { describe, expect, it } from "vitest";

import {
  ipDeLaPeticion,
  llaveDeCuenta,
  llaveDeIp,
  puedeIntentar,
  TOPE_POR_CUENTA,
  TOPE_POR_IP,
  trasFallar,
  VENTANA_MS,
} from "@/lib/seguridad/intentos";

/**
 * EL LÍMITE DE INTENTOS.
 *
 * Detrás de esta puerta está el panel donde un comercio ve su dinero. Si una
 * de estas pruebas se pone roja no se ajusta la prueba: se arregla el código.
 */

const AHORA = 1_760_000_000_000;

describe("cuándo se deja intentar", () => {
  it("quien nunca falló, siempre", () => {
    expect(puedeIntentar(null, TOPE_POR_CUENTA, AHORA)).toEqual({
      permitido: true,
    });
  });

  it("por debajo del tope, sí", () => {
    const c = { intentos: TOPE_POR_CUENTA - 1, ventanaDesde: AHORA };
    expect(puedeIntentar(c, TOPE_POR_CUENTA, AHORA + 1000).permitido).toBe(
      true,
    );
  });

  it("llegando al tope, no", () => {
    const c = { intentos: TOPE_POR_CUENTA, ventanaDesde: AHORA };
    expect(puedeIntentar(c, TOPE_POR_CUENTA, AHORA + 1000).permitido).toBe(
      false,
    );
  });

  it("pasada la ventana, vuelve a empezar aunque hubiera fallado mil veces", () => {
    const c = { intentos: 999, ventanaDesde: AHORA };
    expect(
      puedeIntentar(c, TOPE_POR_CUENTA, AHORA + VENTANA_MS).permitido,
    ).toBe(true);
  });

  it("dice cuánto falta, y nunca cero", () => {
    /* «Espera 0 segundos» y seguir rechazando es la peor combinación posible
       para quien está mirando la pantalla. */
    const c = { intentos: TOPE_POR_CUENTA, ventanaDesde: AHORA };

    const casi = puedeIntentar(c, TOPE_POR_CUENTA, AHORA + VENTANA_MS - 1);
    expect(casi).toEqual({ permitido: false, esperaSegundos: 1 });

    const recien = puedeIntentar(c, TOPE_POR_CUENTA, AHORA);
    expect(recien.permitido).toBe(false);
    if (!recien.permitido) {
      expect(recien.esperaSegundos).toBe(VENTANA_MS / 1000);
    }
  });

  it("el tope por dirección es mucho más alto que el de cuenta", () => {
    /* Detrás de una sola dirección puede haber una oficina entera o el móvil
       de media ciudad. Un tope bajo ahí deja fuera a clientes de verdad. */
    expect(TOPE_POR_IP).toBeGreaterThan(TOPE_POR_CUENTA * 3);
  });
});

describe("contar los fallos", () => {
  it("el primero abre la ventana", () => {
    expect(trasFallar(null, AHORA)).toEqual({
      intentos: 1,
      ventanaDesde: AHORA,
    });
  });

  it("los siguientes suman sin mover la ventana", () => {
    const uno = trasFallar(null, AHORA);
    const dos = trasFallar(uno, AHORA + 5000);
    expect(dos).toEqual({ intentos: 2, ventanaDesde: AHORA });
  });

  it("un fallo pasada la ventana abre una nueva", () => {
    const viejo = { intentos: 7, ventanaDesde: AHORA };
    const nuevo = trasFallar(viejo, AHORA + VENTANA_MS + 1);
    expect(nuevo).toEqual({
      intentos: 1,
      ventanaDesde: AHORA + VENTANA_MS + 1,
    });
  });
});

describe("las llaves", () => {
  it("el correo se normaliza", () => {
    /* Si no, bastaría alternar mayúsculas para duplicar los intentos. */
    expect(llaveDeCuenta("  Correo@Ejemplo.COM ")).toBe(
      llaveDeCuenta("correo@ejemplo.com"),
    );
  });

  it("una cuenta y una dirección no se pisan", () => {
    expect(llaveDeCuenta("x")).not.toBe(llaveDeIp("x"));
  });
});

describe("de qué dirección viene", () => {
  it("manda la de Cloudflare, que no se puede falsear", () => {
    expect(
      ipDeLaPeticion({ cfConnectingIp: "1.2.3.4", xForwardedFor: "9.9.9.9" }),
    ).toBe("1.2.3.4");
  });

  it("sin ella, el PRIMER valor de la lista reenviada", () => {
    /* Los demás los pudo escribir el propio atacante. */
    expect(
      ipDeLaPeticion({ xForwardedFor: "5.6.7.8, 10.0.0.1, 10.0.0.2" }),
    ).toBe("5.6.7.8");
  });

  it("sin ninguna devuelve null y no se inventa una llave", () => {
    /* Una llave tipo «desconocido» juntaría a todo el que llegue sin cabecera
       en el mismo contador y los bloquearía a todos a la vez. */
    expect(ipDeLaPeticion({})).toBeNull();
    expect(
      ipDeLaPeticion({ cfConnectingIp: "  ", xForwardedFor: " " }),
    ).toBeNull();
  });
});
