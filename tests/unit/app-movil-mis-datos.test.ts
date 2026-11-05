import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import * as app from "../../app-movil/src/lib/mis-datos";
import {
  NOMBRE_MAXIMO,
  NOMBRE_MINIMO,
  problemaDelCambio,
} from "@/lib/cuenta/cambio-de-datos";

/**
 * «MIS DATOS» (5 nov 2026): cambiar el nombre y la contraseña desde la app.
 *
 * Lo que no puede pasar sin que esto se ponga en rojo: que la puerta de
 * cuentas acepte un país, un idioma, un teléfono, una foto o un nombre
 * cualquiera; que la app y el servidor tengan reglas distintas; que la
 * contraseña se cambie sin pedir la actual o sin cerrar las demás sesiones; o
 * que una contraseña termine en el borrador.
 */
const leer = (ruta: string) => readFileSync(ruta, "utf-8");

describe("la puerta de cuentas revisa lo que cada uno cambia de sí mismo", () => {
  it("lo bueno pasa, y lo que no viene no se mira", () => {
    expect(problemaDelCambio({ name: "Ana Ruiz" })).toBeNull();
    expect(problemaDelCambio({ idioma: "en", paisEntrega: "US" })).toBeNull();
    expect(problemaDelCambio({ telefono: "+1 (305) 555-0100" })).toBeNull();
    expect(problemaDelCambio({})).toBeNull();
    expect(problemaDelCambio(null)).toBeNull();
  });

  it("lo malo se rechaza con su motivo", () => {
    expect(problemaDelCambio({ name: " a " })).toBe("NOMBRE_NO_VALIDO");
    expect(problemaDelCambio({ name: "x".repeat(101) })).toBe(
      "NOMBRE_NO_VALIDO",
    );
    expect(problemaDelCambio({ name: 7 })).toBe("NOMBRE_NO_VALIDO");
    expect(problemaDelCambio({ paisEntrega: "XX" })).toBe("PAIS_NO_VALIDO");
    expect(problemaDelCambio({ idioma: "fr" })).toBe("IDIOMA_NO_VALIDO");
    expect(problemaDelCambio({ telefono: "llámame" })).toBe(
      "TELEFONO_NO_VALIDO",
    );
    expect(problemaDelCambio({ image: "https://x.example/a.png" })).toBe(
      "IMAGEN_NO_VALIDA",
    );
  });

  it("la puerta lo revisa antes de Better Auth", () => {
    const ruta = leer("src/app/datos/auth/[...all]/route.ts");
    const puerta = ruta.indexOf('pathname.endsWith("/update-user")');
    expect(puerta).toBeGreaterThan(-1);
    expect(ruta.indexOf("problemaDelCambio(cuerpo)", puerta)).toBeGreaterThan(
      puerta,
    );
  });

  it("el rol sigue cerrado: nadie se lo cambia a sí mismo", () => {
    const auth = leer("src/lib/auth.ts");
    const rol = auth.slice(auth.indexOf("rol: {"), auth.indexOf("idioma: {"));
    expect(rol).toContain("input: false");
  });
});

describe("la app usa las mismas reglas", () => {
  it("el nombre: de 2 a 100, igual que el servidor", () => {
    expect(app.NOMBRE_MINIMO).toBe(NOMBRE_MINIMO);
    expect(app.NOMBRE_MAXIMO).toBe(NOMBRE_MAXIMO);
    expect(app.nombreValido("  Ana ")).toBe(true);
    expect(app.nombreValido("A")).toBe(false);
  });

  it("la contraseña: la actual, mínimo la del servidor y repetida igual", () => {
    const minimo = Number(
      /minPasswordLength:\s*(\d+)/.exec(leer("src/lib/auth.ts"))?.[1],
    );
    expect(app.CLAVE_MINIMA).toBe(minimo);
    expect(app.problemaDeClave("", "x".repeat(12), "x".repeat(12))).toBe(
      "faltaClave",
    );
    expect(app.problemaDeClave("a", "corta", "corta")).toBe("claveCorta");
    expect(app.problemaDeClave("a", "x".repeat(12), "y".repeat(12))).toBe(
      "clavesNoCoinciden",
    );
    expect(app.problemaDeClave("a", "x".repeat(12), "x".repeat(12))).toBeNull();
  });

  it("la pantalla pide la actual, cierra las demás sesiones y no guarda claves", () => {
    const pantalla = leer("app-movil/src/app/mis-datos.tsx");
    expect(pantalla).toContain("authClient.changePassword({");
    expect(pantalla).toContain("currentPassword: actual,");
    expect(pantalla).toContain("revokeOtherSessions: true,");
    expect(pantalla.match(/<CampoClave/g)?.length).toBe(3);
    /* El borrador lleva solo el nombre. */
    const borrador = pantalla.slice(
      pantalla.indexOf("useBorrador("),
      pantalla.indexOf("(g) =>"),
    );
    expect(borrador).toContain("nombre:");
    expect(borrador).not.toMatch(/actual|nueva|repetida/);
  });

  it("se llega desde Cuenta y la pantalla está registrada", () => {
    expect(leer("app-movil/src/app/(tabs)/cuenta.tsx")).toContain(
      'router.push("/mis-datos")',
    );
    expect(leer("app-movil/src/app/_layout.tsx")).toContain('name="mis-datos"');
  });
});

describe("lo que salió bien va en verde (regla de la casa)", () => {
  it("el aviso tiene su tono verde y los éxitos lo usan", () => {
    const aviso = leer("app-movil/src/components/formulario.tsx");
    expect(aviso).toContain('tono === "bien"');
    expect(aviso).toContain("COLORES.verde");
    const exitos: [string, RegExp][] = [
      ["app-movil/src/app/mis-datos.tsx", /"nombreGuardado",\s*tono:\s*"bien"/],
      ["app-movil/src/app/mis-datos.tsx", /"claveCambiada",\s*tono:\s*"bien"/],
      [
        "app-movil/src/app/venta/[numero].tsx",
        /"ventaActualizada"\),\s*tono:\s*"bien"/,
      ],
      [
        "app-movil/src/app/mis-pedidos.tsx",
        /"pedidoPagado"\),\s*tono:\s*"bien"/,
      ],
    ];
    for (const [archivo, patron] of exitos) {
      expect(leer(archivo), archivo).toMatch(patron);
    }
  });
});
