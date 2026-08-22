import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { sePuedeAnular } from "@/lib/cobros/anular";

/**
 * DEVOLVERLE EL DINERO A QUIEN PAGÓ UN COBRO POR ENLACE.
 *
 * Lo pidió el dueño: «ese botón téngalo a la mano porque el cliente lo tiene
 * que tener a la mano. Muchas veces toca». Hasta el 22 de agosto de 2026 NO
 * existía: un comercio que cobró de más tenía que escribir a soporte, y
 * mientras tanto quien pagó llamaba a su banco.
 */
describe("la devolución está enchufada, no solo escrita", () => {
  const fuente = readFileSync("src/lib/cobros/devolver.ts", "utf8");

  it("solo se devuelve lo pagado con tarjeta", () => {
    /* Un Zelle no tiene marcha atrás: el dinero está en una cuenta de banco y
       volver a mandarlo es una transferencia nueva hecha por una persona.
       Fingir que el botón lo resuelve es peor que decirlo. */
    expect(fuente).toContain('metodo !== "tarjeta"');
    expect(fuente).toContain("no se puede devolver desde aquí");
  });

  it("el motivo es obligatorio", () => {
    /* Una devolución sin explicación es un movimiento de dinero que nadie
       puede justificar tres meses después. */
    expect(fuente).toContain("motivo.length < 4");
  });

  it("el alcance va DENTRO de la búsqueda del cobro", () => {
    /* Un comercio solo devuelve lo suyo. Si el cobro es de otro no aparece, y
       no hay forma de devolver el dinero de nadie escribiendo su id a mano. */
    const donde = fuente.indexOf(".where(");
    const limite = fuente.indexOf(".limit(1)");
    expect(fuente.slice(donde, limite)).toContain("alcance.tiendaId");
  });

  it("no se puede devolver más de lo cobrado", () => {
    expect(fuente).toContain("centavos > cobro.montoCentavos");
  });

  it("solo una devolución TOTAL cierra el cobro", () => {
    /* Con una parcial sigue pagado: el comercio entregó mercancía y cobró por
       ella, solo devolvió una parte. */
    expect(fuente).toContain("centavos >= cobro.montoCentavos");
  });

  it("queda escrito quién, cuánto y por qué", () => {
    expect(fuente).toContain("insert(devolucionesCobro)");
    expect(fuente).toContain("hechaPorId");
  });

  it("el botón está en la pantalla de enlaces", () => {
    const ui = readFileSync(
      "src/app/[locale]/panel/cobros/enlaces/page.tsx",
      "utf8",
    );
    expect(ui, "desapareció el botón de devolver").toContain("<DevolverCobro");
  });
});

describe("un cobro devuelto está cerrado", () => {
  it("no se puede cancelar encima", () => {
    /* El dinero entró y volvió a salir. Cancelarlo encima borraría el rastro
       de las dos cosas. */
    const d = sePuedeAnular("devuelto");
    expect(d.sePuede).toBe(false);
    expect(d).toMatchObject({ motivo: "devuelto" });
  });

  it("la página de pago lo dice", () => {
    /* Sin esto, quien pagó abre el enlace, ve «cancelado» o nada, y llama al
       banco — que es como empieza un contracargo sobre un dinero que ya se le
       devolvió. */
    const pagina = readFileSync(
      "src/app/[locale]/cobro/[enlace]/page.tsx",
      "utf8",
    );
    expect(pagina).toContain('estado === "devuelto"');
  });
});
