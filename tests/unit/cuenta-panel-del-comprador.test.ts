import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * ══ EL PANEL DEL COMPRADOR Y EL CASILLERO CON SESIÓN (16 sep 2026) ══
 *
 * Richard: «si ya está logueado, debe salirle un botón verde de ver
 * casillero… hace falta un dashboard serio para los usuarios… la cuenta es
 * la misma: si le da la gana de vender, vende».
 */
const leer = (r: string) => readFileSync(r, "utf8");

describe("la página del casillero sabe si ya tienes casillero", () => {
  const pagina = leer("src/app/[locale]/(tienda)/casillero/page.tsx");
  it("tres estados: con casillero (verde), con sesión sin casillero, sin sesión", () => {
    expect(pagina).toContain("casilleroDe(usuario.id)");
    expect(pagina).toMatch(
      /\{casillero \? \([\s\S]*?\) : usuario \? \([\s\S]*?\) : \(/,
    );
    expect(pagina).toContain('t("verMiCasillero")');
    expect(pagina).toContain('t("activar")');
    /* Los dos botones que se contradecían solo salen SIN sesión. */
    expect(pagina.indexOf('t("yaTengo")')).toBeGreaterThan(
      pagina.indexOf(") : ("),
    );
  });
});

describe("con sesión, «Casillero» del encabezado va directo al suyo", () => {
  it("la ruta depende del usuario", () => {
    const enc = leer("src/components/layout/encabezado.tsx");
    expect(enc).toContain(
      'const rutaCasillero = usuario ? "/casillero/mi-casillero" : "/casillero";',
    );
    expect(enc).not.toContain('href="/casillero"');
  });
});

describe("el panel del comprador", () => {
  const cuenta = leer("src/app/[locale]/(tienda)/cuenta/page.tsx");
  it("al entrar, el comprador aterriza en su cuenta; el equipo, en el panel", () => {
    expect(leer("src/components/cuenta/formulario-entrar.tsx")).toContain(
      'trabajaEnElPanel ? "/panel" : "/cuenta"',
    );
  });
  it("enseña pedidos en camino, entregados y paquetes en Miami, y el casillero en grande", () => {
    expect(cuenta).toContain("listarPedidosPropios()");
    expect(cuenta).toContain("casilleroDe(usuario.id)");
    expect(cuenta).toContain("paquetesDe(casillero.id)");
    expect(cuenta).toContain('t("tarjetas.casillero.ver")');
    expect(cuenta).toContain('t("tarjetas.casillero.activar")');
  });
  it("vender es la misma cuenta: la tarjeta lleva a abrir la tienda; al equipo, al panel", () => {
    expect(cuenta).toContain('href: "/vender/empezar" as const');
    expect(cuenta).toContain('href: "/panel" as const');
    const menu = leer("src/components/layout/menu-cuenta.tsx");
    expect(menu).toContain('href: "/casillero/mi-casillero" as const');
    expect(menu).toContain('href: "/vender/empezar" as const');
  });
  it("al comprador no se le habla de roles", () => {
    expect(cuenta).toMatch(/\{trabajaEnElPanel \? \(\s*<div[\s\S]*?t\("rol"\)/);
  });
  it("ninguna lectura tumba la página", () => {
    expect(cuenta).toContain("listarPedidosPropios().catch(() => [])");
    expect(cuenta).toContain("casilleroDe(usuario.id).catch(() => null)");
  });
});
