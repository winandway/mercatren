import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { routing } from "@/i18n/routing";
import {
  CACHE_PUBLICA,
  FICHAS_PUBLICAS,
  PAGINA_PUBLICA_PARA_TODOS,
  PAGINAS_PUBLICAS,
  reglasDeCachePublica,
  sePuedeGuardarEnElBorde,
} from "@/lib/trafico/cache-del-borde";

/**
 * ══ EL CANDADO DE LA CACHÉ DEL BORDE (emergencia de costo, 17 sep 2026) ══
 *
 * GPTBot y el robot de Meta pedían las mismas diecisiete páginas miles de
 * veces al día y cada visita armaba el encabezado contra la base. La
 * plataforma guarda en el borde lo que diga `Cache-Control: public,
 * s-maxage=300, stale-while-revalidate=3600`, pero NUNCA una visita con
 * cookie ni una respuesta con `Set-Cookie`. Esto fija las tres cosas que
 * lo hacen posible y seguro: sin cookie de idioma, la lista cerrada de
 * páginas públicas, y que nada con sesión lleve `public` jamás.
 *
 * Comprobado en rojo el 17 sep 2026 metiendo «carrito» en la lista.
 *
 * Y la lección del mismo día: la cabecera NO puede ponerla el middleware.
 * Next le quita las cabeceras RSC antes de invocarlo, y el 307 con que Next
 * contesta a una petición RSC sin `_rsc` salía «public»: el borde lo guardó
 * bajo la dirección del HTML y `/es/como-funciona` devolvía un 307 a todo el
 * mundo. Las reglas viven en `headers()` de next.config, con `missing`.
 */

const sinCookie = (pathname: string, method = "GET") =>
  sePuedeGuardarEnElBorde({
    method,
    pathname,
    tieneCookie: false,
    pideRsc: false,
  });

describe("la cookie de idioma no existe", () => {
  it("next-intl no pone NEXT_LOCALE: el idioma ya va en la ruta", () => {
    expect(routing.localeCookie).toBe(false);
  });
});

describe("qué páginas se guardan en el borde", () => {
  it("la cabecera es la que entiende la plataforma", () => {
    expect(CACHE_PUBLICA).toBe(
      "public, s-maxage=300, stale-while-revalidate=3600",
    );
  });

  it("las iguales para todos, en los dos idiomas, con y sin barra final", () => {
    for (const ruta of [
      "/es",
      "/en",
      "/es/",
      "/es/catalogo",
      "/en/catalogo",
      "/es/tiendas",
      "/es/tienda/bley-ferreteria",
      "/es/producto/un-slug-cualquiera",
      "/es/seccion/ofertas",
      "/es/videos",
      "/es/video/abc123",
      "/es/blog",
      "/es/blog/un-articulo",
      "/es/buscar-con-foto",
      "/es/casillero",
      "/es/casillero/calculadora",
      "/es/ayuda",
      "/es/como-funciona",
      "/es/devoluciones",
      "/es/docs",
      "/es/docs/una-guia",
      "/es/docs/modelo-de-negocio",
      "/es/entrega",
      "/es/nosotros",
      "/es/privacidad",
      "/es/terminos",
      "/es/transparencia",
      "/es/vender",
    ]) {
      expect(sinCookie(ruta), ruta).toBe(true);
    }
  });

  it("NUNCA lo que cambia por quién mira, ni sin cookie", () => {
    for (const ruta of [
      "/",
      "/es/carrito",
      "/es/checkout",
      "/es/cuenta",
      "/es/pedidos",
      "/es/pedido/12345",
      "/es/entrar",
      "/es/registro",
      "/es/olvide-mi-clave",
      "/es/nueva-clave",
      "/es/factura/abc",
      "/es/casillero/crear",
      "/es/casillero/mi-casillero",
      "/es/casillero/mis-paquetes",
      "/es/casillero/avisar",
      "/es/vender/empezar",
      "/es/panel",
      "/es/panel/pedidos",
      "/es/cobro/abc",
      "/es/subir/abc",
      "/datos/salud",
      "/es/producto/uno/otro",
    ]) {
      expect(sinCookie(ruta), ruta).toBe(false);
    }
  });

  it("con CUALQUIER cookie no se guarda nada, ni la página más pública", () => {
    expect(
      sePuedeGuardarEnElBorde({
        method: "GET",
        pathname: "/es/ayuda",
        tieneCookie: true,
        pideRsc: false,
      }),
    ).toBe(false);
  });

  it("solo GET y HEAD, y nunca el árbol de React", () => {
    expect(sinCookie("/es/ayuda", "POST")).toBe(false);
    expect(sinCookie("/es/ayuda", "HEAD")).toBe(true);
    expect(
      sePuedeGuardarEnElBorde({
        method: "GET",
        pathname: "/es/ayuda",
        tieneCookie: false,
        pideRsc: true,
      }),
    ).toBe(false);
  });

  it("la lista es de lo permitido: una ruta nueva nace sin caché", () => {
    expect(PAGINA_PUBLICA_PARA_TODOS.test("/es/algo-nuevo")).toBe(false);
  });
});

describe("las reglas viven en next.config, y solo ahí", () => {
  const reglas = reglasDeCachePublica();

  it("cada regla exige que falten cookie, rsc, prefetch y next-action", () => {
    expect(reglas.length).toBeGreaterThanOrEqual(4);
    for (const r of reglas) {
      expect(r.headers).toEqual([
        { key: "Cache-Control", value: CACHE_PUBLICA },
      ]);
      expect(r.missing.map((m) => m.key).sort()).toEqual(
        [
          "cookie",
          "next-action",
          "next-router-prefetch",
          "next-router-segment-prefetch",
          "next-router-state-tree",
          "rsc",
        ].sort(),
      );
      expect(r.missing.every((m) => m.type === "header")).toBe(true);
    }
  });

  it("las reglas y la expresión de las pruebas cuentan la misma lista", () => {
    const fuentes = reglas.map((r) => r.source).join("\n");
    for (const p of [...PAGINAS_PUBLICAS, ...FICHAS_PUBLICAS]) {
      expect(fuentes, p).toContain(p);
    }
    expect(fuentes).toContain("casillero/calculadora");
    expect(fuentes).not.toMatch(/carrito|checkout|cuenta|pedidos|panel|entrar/);
  });

  it("next.config.ts las usa y el middleware NO pone la cabecera", () => {
    const config = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");
    expect(config).toContain("...reglasDeCachePublica()");
    const middleware = readFileSync(
      join(process.cwd(), "src/middleware.ts"),
      "utf8",
    );
    /* Next le quita al middleware las cabeceras RSC: desde ahí no se puede
       distinguir el 307 del árbol de React, y el borde lo guardaba como si
       fuera la página (17 sep 2026). */
    expect(middleware).not.toContain("Cache-Control");
    expect(middleware).not.toContain("CACHE_PUBLICA");
  });

  it("ninguna página ni ruta escribe «public, s-maxage» por su cuenta", () => {
    /* Una cabecera pública suelta en una página con sesión es una fuga. */
    const salida = execSync(
      "grep -rl 's-maxage' src/app src/components src/lib src/middleware.ts --include='*.ts' --include='*.tsx' || true",
      { cwd: process.cwd(), encoding: "utf8" },
    )
      .split("\n")
      .filter(Boolean)
      .filter((f) => !f.includes("lib/trafico/cache-del-borde.ts"));
    expect(salida).toEqual([]);
  });
});
