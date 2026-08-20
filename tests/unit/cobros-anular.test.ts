import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  MOTIVO_MAXIMO,
  motivoLimpio,
  sePuedeAnular,
} from "@/lib/cobros/anular";

/**
 * Lo que protegen estas pruebas es dinero y es confianza: que un cobro pagado
 * no se pueda tapar, que uno cancelado no reviva, y que al cancelar no se
 * filtre el nombre del comercio en el modo sin nombre.
 */

describe("qué cobro se puede cancelar", () => {
  it("uno abierto sí — es el caso que lo pidió", () => {
    /* El enlace que salió a «hernandezbleider@gmai.com», sin la «l» de gmail:
       nació muerto y seguía cobrable. */
    expect(sePuedeAnular("abierto")).toEqual({ sePuede: true });
  });

  it("uno vencido también, y por un motivo concreto", () => {
    /* Un vencido se puede REACTIVAR. Cancelarlo es justo lo que impide que
       reviva por esa otra puerta. */
    expect(sePuedeAnular("vencido")).toEqual({ sePuede: true });
  });

  it("UNO PAGADO NO SE CANCELA NUNCA", () => {
    /* Taparía dinero que ya entró: el comercio dejaría de verlo en su cola, la
       conciliación no cuadraría, y el cliente se quedaría sin comprobante de
       algo que sí pagó. */
    expect(sePuedeAnular("pagado")).toEqual({
      sePuede: false,
      yaEstaba: false,
      motivo: "pagado",
    });
  });

  it("uno ya cancelado NO es un error", () => {
    /* Es idempotente a propósito: si a alguien se le va el doble clic, el
       segundo intento no puede parecer un fallo o se queda dudando de si de
       verdad se apagó. */
    expect(sePuedeAnular("cancelado")).toEqual({
      sePuede: false,
      yaEstaba: true,
    });
  });
});

describe("el motivo", () => {
  it("se recorta en vez de rechazar la cancelación", () => {
    /* Rechazar por un motivo largo dejaría el enlace VIVO, que es lo único que
       de verdad importa apagar. */
    const largo = "x".repeat(500);
    expect(motivoLimpio(largo)).toHaveLength(MOTIVO_MAXIMO);
  });

  it("un motivo normal pasa entero", () => {
    expect(motivoLimpio("  el correo estaba mal escrito  ")).toBe(
      "el correo estaba mal escrito",
    );
  });

  it("vacío o que no es texto queda en nulo", () => {
    expect(motivoLimpio("")).toBeNull();
    expect(motivoLimpio("   ")).toBeNull();
    expect(motivoLimpio(undefined)).toBeNull();
    expect(motivoLimpio(42)).toBeNull();
    expect(motivoLimpio({ motivo: "hola" })).toBeNull();
  });
});

describe("los candados que se miran en el archivo", () => {
  /**
   * Estos tres no se pueden comprobar con una función pura, y son justo los
   * que más caro cuestan si alguien los relaja sin darse cuenta.
   */

  it("EL MOTIVO NO SALE EN LA PÁGINA DE PAGO", () => {
    /* Lo escribe una persona y puede nombrar al comercio. En el modo sin
       nombre, ese nombre no puede llegarle a quien iba a pagar. */
    const pagina = readFileSync(
      "src/app/[locale]/cobro/[enlace]/page.tsx",
      "utf8",
    );
    expect(pagina).not.toContain("anulacionesCobro");
    expect(pagina).not.toMatch(/\bmotivo\b/);
  });

  it("el mensaje de cancelado solo nombra al comercio si se puede", () => {
    /* `presentacion.comercio` viene en null en el modo sin nombre. Si alguien
       lo cambiara por `cobro.comercio` a secas, el nombre se filtraría al
       cliente de la ferretería que revende — y esa es la razón entera de que
       ese modo exista. */
    const pagina = readFileSync(
      "src/app/[locale]/cobro/[enlace]/page.tsx",
      "utf8",
    );
    const bloque = pagina.slice(
      pagina.indexOf('estado === "cancelado"'),
      pagina.indexOf("enRevision ?", pagina.indexOf('estado === "cancelado"')),
    );
    expect(bloque).toContain("presentacion.comercio");
    expect(bloque).toContain("canceladoPorComercio");
    /* Y jamás el nombre crudo del comercio. */
    expect(bloque).not.toContain("cobro.comercio");
  });

  it("un cobro cancelado NO puede revivir por /reactivar", () => {
    /* Cancelar es decidir que ese cobro no va. Revivirlo por la otra puerta lo
       desharía sin que nadie lo pida. */
    const ruta = readFileSync(
      "src/app/datos/socios/cobro/reactivar/route.ts",
      "utf8",
    );
    expect(ruta).toContain('cobro.estado !== "abierto"');
    expect(ruta).toContain('eq(cobrosSolicitados.estado, "abierto")');
  });

  it("el estado se re-comprueba DENTRO del update al cancelar", () => {
    /* Entre leer y escribir puede entrar el pago del cliente. Sin esto, un
       cobro recién pagado quedaría marcado como cancelado y el dinero estaría
       en la cuenta sin que nadie lo asocie a nada. */
    const ruta = readFileSync(
      "src/app/datos/socios/cobro/anular/route.ts",
      "utf8",
    );
    const update = ruta.slice(ruta.indexOf(".update(cobrosSolicitados)"));
    expect(update.slice(0, 400)).toContain(
      'inArray(cobrosSolicitados.estado, ["abierto", "vencido"])',
    );
  });
});
