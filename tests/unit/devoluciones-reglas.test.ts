import { describe, expect, it } from "vitest";

import {
  diasQueQuedan,
  DIAS_PARA_DEVOLVER,
  esMotivoValido,
  estaCerrada,
  exigeFotos,
  puedeDevolver,
  puedeVerLaDireccion,
} from "@/lib/devoluciones/reglas";

const HOY = new Date("2026-08-18T12:00:00Z");
const base = {
  estado: "entregado" as const,
  entregadoEn: new Date("2026-08-10T12:00:00Z"),
  yaHayDevolucion: false,
  hoy: HOY,
};

describe("la dirección de devolución no se enseña sin trámite abierto", () => {
  it("sin devolución pedida, NO se ve", () => {
    /**
     * ES LA REGLA ENTERA DE ESTE MÓDULO. La dirección puede cambiar dentro de
     * un año; una dirección publicada se copia, se reenvía y se queda
     * circulando, y el día que cambie seguirán llegando cajas a un sitio donde
     * ya no hay nadie que las reciba.
     */
    expect(puedeVerLaDireccion(null)).toBe(false);
  });

  it("con el trámite abierto, sí", () => {
    expect(puedeVerLaDireccion("solicitada")).toBe(true);
    expect(puedeVerLaDireccion("en_camino")).toBe(true);
    expect(puedeVerLaDireccion("recibida")).toBe(true);
  });

  it("rechazada NO la ve", () => {
    /* Mandar la caja después de un rechazo es perderla, y encima creyendo que
       el dinero vuelve. */
    expect(puedeVerLaDireccion("rechazada")).toBe(false);
  });
});

describe("quién puede devolver", () => {
  it("un pedido entregado dentro del plazo, sí", () => {
    const v = puedeDevolver(base);
    expect(v.puede).toBe(true);
  });

  it("el plazo cuenta desde la ENTREGA, no desde la compra", () => {
    /**
     * Google rechaza las políticas que cuentan desde la compra. Entre comprar
     * y recibir pueden pasar quince días, y contar desde el pedido le come al
     * comprador la mitad de su plazo por algo que no depende de él.
     */
    const v = puedeDevolver(base);
    if (!v.puede) throw new Error("debería poder");

    const esperado = new Date("2026-08-10T12:00:00Z");
    esperado.setDate(esperado.getDate() + DIAS_PARA_DEVOLVER);
    expect(v.venceEl.toISOString()).toBe(esperado.toISOString());
  });

  it("pasados los 30 días, no", () => {
    const v = puedeDevolver({
      ...base,
      entregadoEn: new Date("2026-07-01T12:00:00Z"),
    });
    expect(v).toEqual({ puede: false, motivo: "fueraDePlazo" });
  });

  it("SIN fecha de entrega el plazo no corre, y puede devolver", () => {
    /**
     * Un pedido sin fecha de entrega es un dato que nos falta a NOSOTROS.
     * Cerrarle la puerta a alguien por un hueco de nuestros registros es
     * cobrarle nuestro descuido.
     */
    const v = puedeDevolver({ ...base, entregadoEn: null });
    expect(v.puede).toBe(true);
  });
});

describe("cuándo NO se puede, y por qué motivo exacto", () => {
  it("sin pagar no hay nada que devolver", () => {
    expect(puedeDevolver({ ...base, estado: "pendiente_pago" })).toEqual({
      puede: false,
      motivo: "sinPagar",
    });
  });

  it("pagado o armándose: no se devuelve lo que todavía no salió", () => {
    /* Ahí lo que toca es cancelar, que es otra cosa y otra pantalla. */
    expect(puedeDevolver({ ...base, estado: "pagado" })).toEqual({
      puede: false,
      motivo: "sinEntregar",
    });
    expect(puedeDevolver({ ...base, estado: "preparando" })).toEqual({
      puede: false,
      motivo: "sinEntregar",
    });
  });

  it("PERO un pedido enviado que no aparece SÍ se puede reclamar", () => {
    /**
     * Casi lo bloqueo al escribir esto, y habría sido un error caro: «no me
     * llegó» es exactamente el reclamo de un paquete que salió y no aparece.
     * Cerrarle esa puerta no evita nada — manda a la persona a pedirle a su
     * banco que revierta el cargo, que nos cuesta el dinero, la comisión de la
     * disputa y el historial con el procesador.
     */
    const v = puedeDevolver({ ...base, estado: "enviado", entregadoEn: null });
    expect(v.puede).toBe(true);
  });

  it("con un trámite ya abierto no se abre otro", () => {
    expect(puedeDevolver({ ...base, yaHayDevolucion: true })).toEqual({
      puede: false,
      motivo: "yaSolicitada",
    });
  });

  it("un pedido ya reembolsado o cancelado, tampoco", () => {
    expect(puedeDevolver({ ...base, estado: "reembolsado" }).puede).toBe(false);
    expect(puedeDevolver({ ...base, estado: "cancelado" }).puede).toBe(false);
  });

  it("el motivo se comprueba ANTES que el plazo", () => {
    /* A quien nunca pagó no se le dice «se te venció el plazo»: se le dice que
       no pagó. Un motivo equivocado manda a la persona a reclamar donde no es. */
    const v = puedeDevolver({
      ...base,
      estado: "pendiente_pago",
      entregadoEn: new Date("2026-01-01T12:00:00Z"),
    });
    expect(v).toEqual({ puede: false, motivo: "sinPagar" });
  });
});

describe("los días que quedan", () => {
  it("cuenta los que faltan", () => {
    expect(diasQueQuedan(new Date("2026-08-20T12:00:00Z"), HOY)).toBe(2);
  });

  it("fuera de plazo es CERO, nunca negativo", () => {
    /* Un «te quedan -3 días» en pantalla es un sistema roto a ojos de quien
       lo lee. */
    expect(diasQueQuedan(new Date("2026-08-15T12:00:00Z"), HOY)).toBe(0);
  });
});

describe("las fotos no se piden siempre", () => {
  it("se piden cuando lo que se afirma es el estado de la mercancía", () => {
    expect(exigeFotos("llegoDanado")).toBe(true);
    expect(exigeFotos("noEsLoQuePedi")).toBe(true);
    expect(exigeFotos("noFunciona")).toBe(true);
  });

  it("de algo que NO llegó no hay foto que sacar", () => {
    /**
     * Exigirla ahí es poner una pared donde no hay nada que comprobar: la
     * persona se queda mirando un formulario que no puede completar y termina
     * llamando al banco, que es el camino al contracargo.
     */
    expect(exigeFotos("noLlego")).toBe(false);
  });

  it("y de uno que simplemente ya no se quiere, tampoco", () => {
    expect(exigeFotos("yaNoLoQuiero")).toBe(false);
  });
});

describe("motivos y cierre", () => {
  it("solo se aceptan los motivos de la lista", () => {
    expect(esMotivoValido("llegoDanado")).toBe(true);
    expect(esMotivoValido("porque si")).toBe(false);
    expect(esMotivoValido("")).toBe(false);
  });

  it("reembolsada y rechazada están cerradas; las demás no", () => {
    expect(estaCerrada("reembolsada")).toBe(true);
    expect(estaCerrada("rechazada")).toBe(true);
    expect(estaCerrada("solicitada")).toBe(false);
    expect(estaCerrada("en_camino")).toBe(false);
  });
});
