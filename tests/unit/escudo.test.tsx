import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Escudo } from "@/components/cuenta/escudo";

/**
 * EL ESCUDO ANTI-ROBOTS DE LA ENTRADA.
 *
 * Lo que se vigila aquí es el fallo que tuvo la primera versión y que estuvo
 * meses sin verse: usaba `<Script onReady>` de Next, que **no vuelve a
 * dispararse en una navegación de cliente**. Al entrar directo a /entrar
 * funcionaba; al llegar desde otra página del sitio, no se dibujaba nada.
 *
 * Con el escudo exigido del lado del servidor, eso es la entrada cerrada para
 * todos los clientes. No se había detectado porque nunca había corrido con las
 * claves cargadas.
 */

afterEach(() => {
  document.querySelectorAll("script").forEach((s) => s.remove());
  delete (window as { turnstile?: unknown }).turnstile;
  vi.restoreAllMocks();
});

describe("el escudo", () => {
  it("NO dibuja nada si no está configurado", () => {
    /* Sin claves, la entrada funciona como siempre. Dejar a todos los clientes
       afuera por una variable sin cargar es peor que no tener escudo. */
    const { container } = render(<Escudo idioma="es" onPase={() => {}} />);
    expect(container.querySelector("[data-escudo]")).toBeNull();
  });

  it("pone la caja cuando sí hay clave", () => {
    const { container } = render(
      <Escudo
        claveSitio="1x00000000000000000000AA"
        idioma="es"
        onPase={() => {}}
      />,
    );
    expect(container.querySelector("[data-escudo]")).not.toBeNull();
  });

  it("carga el guion de Cloudflare por su cuenta", async () => {
    /* A mano, no con `<Script>` de Next: ver el comentario de arriba. */
    render(
      <Escudo
        claveSitio="1x00000000000000000000AA"
        idioma="es"
        onPase={() => {}}
      />,
    );

    await waitFor(() => {
      const guion = document.querySelector(
        'script[src*="challenges.cloudflare.com"]',
      );
      expect(guion, "no cargó el guion del escudo").not.toBeNull();
    });
  });

  it("SE DIBUJA AUNQUE EL GUION YA ESTUVIERA CARGADO", async () => {
    /* Este es el caso que rompía: se llega a /entrar desde otra página, el
       guion ya está en el documento de antes, su evento `load` ya pasó y no
       vuelve. Sin el reloj de respaldo, el recuadro no aparecería nunca. */
    const dibujar = vi.fn(
      (_caja: HTMLElement, _opciones: { sitekey: string; language: string }) =>
        "cf-widget-1",
    );
    (window as { turnstile?: unknown }).turnstile = {
      render: dibujar,
      reset: vi.fn(),
    };

    render(
      <Escudo
        claveSitio="1x00000000000000000000AA"
        idioma="es"
        onPase={() => {}}
      />,
    );

    await waitFor(() => expect(dibujar).toHaveBeenCalled());

    // Y se le pasa la clave y el idioma que le dieron.
    const opciones = dibujar.mock.calls[0]?.[1];
    expect(opciones?.sitekey).toBe("1x00000000000000000000AA");
    expect(opciones?.language).toBe("es");
  });

  it("avisa del pase cuando Cloudflare lo suelta", async () => {
    const recibido: (string | null)[] = [];
    let soltarPase: ((pase: string) => void) | undefined;

    (window as { turnstile?: unknown }).turnstile = {
      render: (
        _caja: HTMLElement,
        opciones: { callback: (pase: string) => void },
      ) => {
        soltarPase = opciones.callback;
        return "cf-widget-1";
      },
      reset: vi.fn(),
    };

    render(
      <Escudo
        claveSitio="1x00000000000000000000AA"
        idioma="es"
        onPase={(p) => recibido.push(p)}
      />,
    );

    await waitFor(() => expect(soltarPase).toBeDefined());
    soltarPase?.("PASE-DE-PRUEBA");

    expect(recibido).toContain("PASE-DE-PRUEBA");
  });

  it("borra el pase si caduca, para que el formulario lo vuelva a pedir", async () => {
    const recibido: (string | null)[] = [];
    let caducar: (() => void) | undefined;

    (window as { turnstile?: unknown }).turnstile = {
      render: (
        _caja: HTMLElement,
        opciones: { "expired-callback"?: () => void },
      ) => {
        caducar = opciones["expired-callback"];
        return "cf-widget-1";
      },
      reset: vi.fn(),
    };

    render(
      <Escudo
        claveSitio="1x00000000000000000000AA"
        idioma="es"
        onPase={(p) => recibido.push(p)}
      />,
    );

    await waitFor(() => expect(caducar).toBeDefined());
    caducar?.();

    expect(recibido).toContain(null);
  });

  it("no dibuja el recuadro dos veces", async () => {
    /* El formulario pasa una función nueva en cada render. Si el efecto se
       relanzara por eso, saldrían dos recuadros. */
    const dibujar = vi.fn(() => "cf-widget-1");
    (window as { turnstile?: unknown }).turnstile = {
      render: dibujar,
      reset: vi.fn(),
    };

    const { rerender } = render(
      <Escudo
        claveSitio="1x00000000000000000000AA"
        idioma="es"
        onPase={() => {}}
      />,
    );
    await waitFor(() => expect(dibujar).toHaveBeenCalled());

    rerender(
      <Escudo
        claveSitio="1x00000000000000000000AA"
        idioma="es"
        onPase={() => {}}
      />,
    );
    rerender(
      <Escudo
        claveSitio="1x00000000000000000000AA"
        idioma="es"
        onPase={() => {}}
      />,
    );

    expect(dibujar).toHaveBeenCalledTimes(1);
  });
});
