import { describe, expect, it } from "vitest";

import {
  clasificarPagador,
  detectarBanco,
  extraerUltimos4,
  interpretarComprobante,
  limpiarNombre,
  normalizarCuentaReceptora,
} from "@/lib/zelle/clasificar";

/**
 * El nombre que trae el comprobante casi nunca es el de la persona: suele ser
 * el producto bancario de la cuenta de origen. Estas pruebas cuidan que no se
 * confunda un banco con un pagador.
 */

describe("ultimos cuatro digitos de la cuenta", () => {
  it("los saca del formato con guion", () => {
    expect(extraerUltimos4("Adv SafeBalance Banking - 1030")).toBe("1030");
  });

  it("los saca del formato con puntos", () => {
    expect(extraerUltimos4("EVERYDAY CHECKING...1551")).toBe("1551");
  });

  it("los saca del formato entre parentesis", () => {
    expect(extraerUltimos4("BUS COMPLETE CHK (...3873)")).toBe("3873");
  });

  it("devuelve nada cuando el nombre no los trae", () => {
    expect(extraerUltimos4("TD Bank")).toBeNull();
    expect(extraerUltimos4(null)).toBeNull();
  });
});

describe("nombre limpio", () => {
  it("quita el sufijo de la cuenta", () => {
    expect(limpiarNombre("Adv Plus Banking - 1610")).toBe("Adv Plus Banking");
  });

  it("no deja restos de codigos HTML", () => {
    expect(limpiarNombre("WAY2SAVE&reg; SAVINGS ...1052")).toBe(
      "WAY2SAVE SAVINGS",
    );
  });
});

describe("banco de origen", () => {
  it("reconoce los productos de Bank of America", () => {
    expect(detectarBanco("Adv SafeBalance Banking - 0152")).toBe(
      "Bank of America",
    );
    expect(detectarBanco("Advantage Savings - 1081")).toBe("Bank of America");
    expect(detectarBanco("Business Adv Fundamentals")).toBe("Bank of America");
  });

  it("reconoce los de Wells Fargo", () => {
    expect(detectarBanco("WELLS FARGO CLEAR ACCESS BANKING")).toBe(
      "Wells Fargo",
    );
    expect(detectarBanco("EVERYDAY CHECKING...1869")).toBe("Wells Fargo");
  });

  it("reconoce los de Chase", () => {
    expect(detectarBanco("CHASE SECURE BANKING (...3124)")).toBe("Chase");
    expect(detectarBanco("BUS COMPLETE CHK (...6199)")).toBe("Chase");
  });

  it("no adivina cuando no hay marca reconocible", () => {
    expect(detectarBanco("Elensi Llerena")).toBeNull();
    expect(detectarBanco(null)).toBeNull();
  });
});

describe("quien pago", () => {
  it("marca como cuenta bancaria lo que es un producto de banco", () => {
    expect(clasificarPagador("Adv SafeBalance Banking - 1030")).toBe(
      "cuenta_bancaria",
    );
    expect(clasificarPagador("BUSINESS CHECKING")).toBe("cuenta_bancaria");
    expect(clasificarPagador("Cuenta personal - 0224")).toBe("cuenta_bancaria");
  });

  it("reconoce empresas por su razon social", () => {
    expect(clasificarPagador("JC VEGA HANDYMAN LLC")).toBe("empresa");
    expect(clasificarPagador("Jb Lr services Llc - 5189")).toBe("empresa");
    expect(clasificarPagador("Bley Ferreteria")).toBe("empresa");
  });

  it("reconoce personas", () => {
    expect(clasificarPagador("Elensi Llerena")).toBe("persona");
    expect(clasificarPagador("Sergio Ramirez - 0149")).toBe("persona");
    expect(clasificarPagador("ALFREDO")).toBe("persona");
  });

  it("no inventa cuando no hay nombre", () => {
    expect(clasificarPagador(null)).toBe("desconocido");
    expect(clasificarPagador("   ")).toBe("desconocido");
  });
});

describe("cuenta que recibio el pago", () => {
  it("las mayusculas no crean cuentas distintas", () => {
    expect(normalizarCuentaReceptora("cobros@ejemplo.com")).toBe(
      "cobros@ejemplo.com",
    );
    expect(normalizarCuentaReceptora("  cobros@ejemplo.com ")).toBe(
      "cobros@ejemplo.com",
    );
  });

  it("sin correo no hay cuenta", () => {
    expect(normalizarCuentaReceptora(null)).toBeNull();
    expect(normalizarCuentaReceptora("")).toBeNull();
  });
});

describe("lectura completa del comprobante", () => {
  it("separa banco, cuenta y tipo de pagador", () => {
    expect(
      interpretarComprobante({
        sender_name: "Adv Plus Banking - 1610",
        recipient_email: "COBROS@ejemplo.com",
      }),
    ).toEqual({
      pagadorNombre: "Adv Plus Banking",
      pagadorTipo: "cuenta_bancaria",
      bancoOrigen: "Bank of America",
      cuentaUltimos4: "1610",
      cuentaReceptora: "cobros@ejemplo.com",
    });
  });

  it("aguanta un comprobante sin ningun dato leido", () => {
    expect(
      interpretarComprobante({ sender_name: null, recipient_email: null }),
    ).toEqual({
      pagadorNombre: null,
      pagadorTipo: "desconocido",
      bancoOrigen: null,
      cuentaUltimos4: null,
      cuentaReceptora: null,
    });
  });
});
