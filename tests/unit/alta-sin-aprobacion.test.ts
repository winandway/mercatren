import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import es from "@/../messages/es.json";
import en from "@/../messages/en.json";

/**
 * EL ALTA DE UN COMERCIO NO ESPERA A NADIE (24 ago 2026).
 *
 * Lo dictó el dueño después de recibir un correo del sistema pidiéndole entrar
 * a «verificar» a un comercio que **ya estaba activo y publicado**: sus
 * palabras, «no puede ser que una persona esté esperando que uno entre y
 * verifique… en Amazon no están esperando para verificarlo». El control existe
 * pero va DESPUÉS: se suspende a quien rompa los términos.
 *
 * Esto es el candado. Las tiendas nacen activas desde el 15 ago 2026, pero el
 * correo y los textos se quedaron atrás nueve días sin que nadie lo notara,
 * porque nada se ponía rojo.
 */
describe("la tienda nace activa y nadie la aprueba", () => {
  const alta = readFileSync("src/lib/tiendas/acciones.ts", "utf8");

  it("el alta inserta la tienda en `activa`", () => {
    /* Si alguien vuelve a poner `pendiente` aquí, el comercio se queda con su
       tienda en 404 y creyendo que el sitio perdió su trabajo. */
    expect(alta).toContain('estado: "activa"');
    const cuerpoDelAlta = alta.slice(
      alta.indexOf("export async function solicitarComercio"),
    );
    expect(cuerpoDelAlta).not.toContain('estado: "pendiente"');
  });

  it("el correo al equipo AVISA, no manda a aprobar", () => {
    const correos = readFileSync("src/lib/correo/correos.ts", "utf8");
    const aviso = correos.slice(
      correos.indexOf("export async function correoAvisoComercioNuevo"),
      correos.indexOf("9a-bis"),
    );
    expect(aviso).toContain("ya está activa");
    /* El asunto y el botón no pueden pedir una aprobación que no existe: un
       correo que manda a hacer una tarea inexistente enseña a ignorar los
       correos del sistema. */
    expect(aviso).not.toMatch(
      /por aprobar|espera aprobación|Revisar y aprobar/,
    );
  });
});

describe("los textos no prometen una revisión que no ocurre", () => {
  it("el mensaje del alta dice que ya está publicada, en los dos idiomas", () => {
    for (const [idioma, textos] of [
      ["es", es],
      ["en", en],
    ] as const) {
      const mensajes = textos.panel.mensajes as unknown as Record<
        string,
        string | undefined
      >;
      expect(mensajes.comercioListo, idioma).toBeTruthy();
      /* El texto viejo prometía que «el equipo lo va a revisar». */
      expect(mensajes.comercioEnRevision, idioma).toBeUndefined();
    }
  });

  it("ningún texto del público le dice a un comercio que espere aprobación", () => {
    const prohibido =
      /(en revisi[oó]n|lo va a revisar|espera(ndo)? (la )?aprobaci[oó]n|pendiente de aprobar|submit it for review|pending approval|will review it)/i;
    for (const [idioma, textos] of [
      ["es", es],
      ["en", en],
    ] as const) {
      const noPublica = Object.values(
        textos.tiendaPublica.noPublica,
      ) as string[];
      const comercios = Object.values(
        (textos.panel.comercios as { estados: Record<string, string> }).estados,
      );
      for (const frase of [...noPublica, ...comercios]) {
        expect(frase, `${idioma}: «${frase}»`).not.toMatch(prohibido);
      }
    }
  });
});

describe("qué puede hacer con su cuenta, dicho al crearla", () => {
  it("la pantalla de registro explica comprar Y vender, en los dos idiomas", () => {
    for (const [idioma, textos] of [
      ["es", es],
      ["en", en],
    ] as const) {
      const con = (
        textos.entrar as unknown as {
          conTuCuenta: Record<string, { titulo: string; texto: string }>;
        }
      ).conTuCuenta;
      expect(Object.keys(con).sort(), idioma).toEqual(["comprar", "vender"]);
      for (const bloque of Object.values(con)) {
        expect(bloque.titulo.length, idioma).toBeGreaterThan(3);
        expect(bloque.texto.length, idioma).toBeGreaterThan(20);
      }
    }
  });

  it("y la página las dibuja: no basta con tener los textos", () => {
    const pagina = readFileSync(
      "src/app/[locale]/(tienda)/registro/page.tsx",
      "utf8",
    );
    expect(pagina).toContain("conTuCuenta.");
  });
});
