import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { CORREO_EQUIPO } from "@/lib/correo/direcciones";
import {
  metodosDisponibles,
  seEnsenaDirecto,
} from "@/lib/cobros/metodos-visibles";
import { queSeEnsena } from "@/lib/cobros/presentacion";

/**
 * ══ EL CALLEJÓN SIN SALIDA DE $6.483,77 (22 sep 2026) ══
 *
 * El dueño emitió el cobro MT-C-000004 sin tarjeta y abrió su propio enlace
 * como lo ve el cliente. Encontró una sola instrucción de ACH —ni la segunda
 * cuenta ni el cable— y una pantalla que le decía «esta ruta es SOLO para
 * ACH; si vas a mandar un cable, no uses esta», sin decirle a dónde.
 *
 * Sus palabras: «destruiste el link que teníamos de cobrar; era espectacular
 * […] el otro era mucho más profesional».
 */
const SOLO = {
  tarjeta: false,
  zelle: false,
  transferencia: false,
  wire: false,
};

describe("qué formas de pago ve quien va a pagar", () => {
  it("EL FALLO DEL DUEÑO: sin tarjeta, la ACH no se come el cable", () => {
    const d = metodosDisponibles({ ...SOLO, transferencia: true, wire: true });
    expect(d).toEqual(["transferencia", "wire"]);
    /* Dos opciones = se elige. Enseñar la ACH directa dejaba al cliente sin
       el cable teniéndolo disponible. */
    expect(seEnsenaDirecto(d, false)).toBe(false);
  });

  it("la segunda cuenta también cuenta como opción", () => {
    const d = metodosDisponibles({ ...SOLO, transferencia: true });
    expect(d).toEqual(["transferencia"]);
    /* Con una sola forma de pago pero DOS cuentas, hay que dibujar el
       selector: la alterna se elige ahí dentro. */
    expect(seEnsenaDirecto(d, true)).toBe(false);
    expect(seEnsenaDirecto(d, false)).toBe(true);
  });

  it("un cobro que solo acepta cable NO dice «no hay forma de pagar»", () => {
    const d = metodosDisponibles({ ...SOLO, wire: true });
    expect(d).toEqual(["wire"]);
    expect(d.length).toBeGreaterThan(0);
    /* Y se enseña directa, que es el cable: antes arrancaba en «zelle» y
       debajo del selector no se dibujaba nada. */
    expect(seEnsenaDirecto(d, false)).toBe(true);
    expect(d[0]).toBe("wire");
  });

  it("sin ninguna forma sí se dice que no se puede pagar", () => {
    expect(metodosDisponibles(SOLO)).toEqual([]);
  });

  it("la tarjeta va primera, que es la que se confirma sola", () => {
    const d = metodosDisponibles({
      tarjeta: true,
      zelle: true,
      transferencia: true,
      wire: true,
    });
    expect(d[0]).toBe("tarjeta");
    expect(d).toEqual(["tarjeta", "zelle", "transferencia", "wire"]);
  });
});

/**
 * ══ «NO APARECE EL CORREO DE SELLER. ¿DÓNDE PUTAS ESTÁ?» (22 sep 2026) ══
 *
 * La página nombraba al comercio arriba y abajo y no daba forma de contactar
 * a nadie. Quien duda de una pantalla que le pide seis mil dólares y no tiene
 * a quién escribirle, cierra.
 */
describe("a quién le escribe quien paga", () => {
  it("el cobro normal enseña el comercio y SU correo", () => {
    const p = queSeEnsena("comercio", "Ferretería del Sur", "ventas@sur.com");
    expect(p.contacto.nombre).toBe("Ferretería del Sur");
    expect(p.contacto.correo).toBe("ventas@sur.com");
  });

  it("un comercio sin correo cargado NO deja un hueco: contesta Mercatren", () => {
    for (const vacio of [null, undefined, "", "   "]) {
      const p = queSeEnsena("comercio", "Ferretería del Sur", vacio);
      expect(p.contacto.correo).toBe(CORREO_EQUIPO);
      expect(p.contacto.nombre).toBe("Ferretería del Sur");
    }
  });

  it("EL MODO CALLADO no filtra el correo del comercio", () => {
    const p = queSeEnsena(
      "solo_mercatren",
      "Ferretería del Sur",
      "ventas@sur.com",
    );
    expect(p.comercio).toBeNull();
    expect(p.nombrarEnElPie).toBe(false);
    /* Ni el nombre ni el correo: sería la misma filtración por otra puerta. */
    expect(p.contacto.nombre).toBeNull();
    expect(p.contacto.correo).toBe(CORREO_EQUIPO);
    expect(JSON.stringify(p)).not.toContain("Ferretería del Sur");
    expect(JSON.stringify(p)).not.toContain("ventas@sur.com");
  });

  it("un cobro viejo sin modo se comporta como el normal", () => {
    const p = queSeEnsena(null, "Ferretería del Sur", "ventas@sur.com");
    expect(p.contacto.correo).toBe("ventas@sur.com");
  });

  it("el buzón de respaldo se importa, no se copia a mano", () => {
    /* Copiarlo crearía dos verdades: el día que cambie el buzón del equipo,
       esta página seguiría mandando a la gente al viejo. */
    const fuente = readFileSync("src/lib/cobros/presentacion.ts", "utf8");
    expect(fuente).toContain('from "@/lib/correo/direcciones"');
    expect(fuente).not.toContain("@mercatren.com");
  });
});

/**
 * LOS CANDADOS EN LA PANTALLA, que es donde esto se deshace sin que nada
 * falle: la pieza pura puede estar perfecta y el componente volver a decidir
 * por su cuenta, que es exactamente lo que había.
 */
describe("la pantalla decide con la pieza pura, no por su cuenta", () => {
  const componente = readFileSync(
    "src/components/cobro/metodos-de-cobro.tsx",
    "utf8",
  );

  it("el selector filtra por la lista, no por cada dato suelto", () => {
    expect(componente).toContain("metodosDisponibles({");
    expect(componente).toContain("disponibles.includes(m.clave)");
    /* La cuenta corta de antes: si vuelve, el cable se cae otra vez. */
    expect(componente).not.toContain('m.clave === "wire" && wire');
  });

  it("el atajo pregunta a `seEnsenaDirecto`, con la segunda cuenta dentro", () => {
    expect(componente).toContain(
      "seEnsenaDirecto(disponibles, Boolean(transferenciaAlterna))",
    );
    expect(componente).not.toContain("!conTarjeta && transferencia && !zelle");
  });

  it("el método preseleccionado sale de la lista", () => {
    expect(componente).toContain('disponibles[0] ?? "tarjeta"');
  });

  it("«no hay forma de pagar» se decide con la lista entera", () => {
    expect(componente).toContain("disponibles.length === 0");
    expect(componente).not.toContain("if (!zelle && !transferencia) {");
  });
});

/** El pie de esta página se saltaba el crédito del desarrollador. */
describe("el pie de la página de pago", () => {
  it("lleva el crédito de Windoce con nofollow", () => {
    const marco = readFileSync("src/app/[locale]/cobro/layout.tsx", "utf8");
    expect(marco).toContain("DESARROLLADOR");
    expect(marco).toContain("nofollow");
    expect(marco).toContain("data-nosnippet");
  });
});
