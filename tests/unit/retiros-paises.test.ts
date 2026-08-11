import { describe, expect, it } from "vitest";

import {
  limpiarCuenta,
  paisBancario,
  PAISES_BANCARIOS,
  revisarCuenta,
} from "@/lib/retiros/paises";

/**
 * LO QUE MOTIVÓ ESTE ARCHIVO.
 *
 * Un comercio de Colombia entró a pedir su dinero, eligió «wire», y no encontró
 * dónde poner su Bancolombia: el formulario solo tenía «número de ruta», que
 * existe únicamente en Estados Unidos. Se quedó bloqueado toda una tarde.
 */
describe("los países que dijo el dueño están todos", () => {
  it("los doce, con Estados Unidos primero", () => {
    const codigos = PAISES_BANCARIOS.map((p) => p.codigo);
    expect(codigos[0]).toBe("US");
    for (const c of [
      "US",
      "CO",
      "VE",
      "MX",
      "BR",
      "AR",
      "CL",
      "PE",
      "EC",
      "PA",
      "ES",
      "RO",
    ]) {
      expect(codigos).toContain(c);
    }
  });

  it("cada país tiene bandera, para reconocerlo sin leer", () => {
    for (const p of PAISES_BANCARIOS) expect(p.bandera).not.toBe("");
  });

  it("solo Estados Unidos va por ACH; el resto por wire", () => {
    /* Mercury manda ACH dentro de Estados Unidos y wire para afuera. Zelle no
       lo hace, y por eso no es una opción de retiro. */
    for (const p of PAISES_BANCARIOS) {
      expect(p.via).toBe(p.codigo === "US" ? "ach" : "wire");
    }
  });

  it("todos piden titular y banco", () => {
    for (const p of PAISES_BANCARIOS) {
      const nombres = p.campos.map((c) => c.nombre);
      expect(nombres).toContain("titular");
      expect(nombres).toContain("banco");
    }
  });
});

/**
 * CADA PAÍS PIDE LO SUYO, Y NO LO DEL VECINO.
 *
 * Enseñarle a un mexicano una casilla de «número de ruta» y a un
 * estadounidense una de CLABE es como se manda una transferencia a una cuenta
 * mal escrita.
 */
describe("cada país pide sus propios campos", () => {
  it("Estados Unidos pide número de ruta y NO pide documento", () => {
    const us = paisBancario("US")!;
    const nombres = us.campos.map((c) => c.nombre);
    expect(nombres).toContain("ruta");
    expect(nombres).not.toContain("documento");
  });

  it("Colombia pide tipo de cuenta y documento, y NO pide número de ruta", () => {
    const co = paisBancario("CO")!;
    const nombres = co.campos.map((c) => c.nombre);
    expect(nombres).toContain("tipoCuenta");
    expect(nombres).toContain("documento");
    expect(nombres).not.toContain("ruta");
  });

  it("México pide CLABE", () => {
    expect(paisBancario("MX")!.campos.map((c) => c.nombre)).toContain("clabe");
  });

  it("España y Rumanía piden IBAN", () => {
    for (const c of ["ES", "RO"]) {
      expect(paisBancario(c)!.campos.map((x) => x.nombre)).toContain("iban");
    }
  });

  it("Argentina pide CBU", () => {
    expect(paisBancario("AR")!.campos.map((c) => c.nombre)).toContain("cbu");
  });

  it("Brasil pide agencia y CPF, y el Pix es opcional", () => {
    const br = paisBancario("BR")!;
    expect(br.campos.map((c) => c.nombre)).toContain("agencia");
    expect(br.campos.find((c) => c.nombre === "pix")?.opcional).toBe(true);
  });

  it("un país que no está devuelve null", () => {
    expect(paisBancario("XX")).toBeNull();
  });
});

describe("los largos que el banco exige", () => {
  it("una CLABE tiene 18 dígitos, ni uno más ni uno menos", () => {
    const base = {
      titular: "Ana Pérez",
      banco: "BBVA",
      documento: "ABCD123456",
      swift: "BCMRMXMM",
    };
    expect(revisarCuenta("MX", { ...base, clabe: "0".repeat(18) })).toEqual([]);
    expect(revisarCuenta("MX", { ...base, clabe: "0".repeat(17) })).toContain(
      "clabe",
    );
    expect(revisarCuenta("MX", { ...base, clabe: "0".repeat(19) })).toContain(
      "clabe",
    );
  });

  it("un número de ruta tiene 9 dígitos", () => {
    const base = {
      titular: "John Doe",
      banco: "Chase",
      cuenta: "12345678",
      tipoCuenta: "Corriente",
    };
    expect(revisarCuenta("US", { ...base, ruta: "021000021" })).toEqual([]);
    expect(revisarCuenta("US", { ...base, ruta: "02100002" })).toContain(
      "ruta",
    );
  });

  it("un CBU tiene 22 dígitos", () => {
    const base = {
      titular: "Juan Gómez",
      banco: "Galicia",
      documento: "20123456789",
      swift: "GABAARBA",
    };
    expect(revisarCuenta("AR", { ...base, cbu: "1".repeat(22) })).toEqual([]);
    expect(revisarCuenta("AR", { ...base, cbu: "1".repeat(21) })).toContain(
      "cbu",
    );
  });
});

/**
 * LO QUE LA GENTE COPIA DEL BANCO TRAE ESPACIOS.
 *
 * Un IBAN se enseña en grupos de cuatro y una cuenta con guiones. Rechazar un
 * dato bueno por un espacio es el error más caro: el comercio pagó de verdad y
 * no puede cobrar.
 */
describe("los espacios y guiones no son un error", () => {
  it("un IBAN copiado en grupos de cuatro se acepta", () => {
    const r = revisarCuenta("ES", {
      titular: "María López",
      banco: "Santander",
      iban: "ES91 2100 0418 4502 0005 1332",
      swift: "BSCHESMM",
    });
    expect(r).toEqual([]);
  });

  it("y se guarda sin espacios y en mayúsculas, listo para pegar en el banco", () => {
    const limpio = limpiarCuenta("ES", {
      titular: "  María   López  ",
      banco: "Santander",
      iban: "es91 2100 0418 4502 0005 1332",
      swift: "bschesmm",
    });
    expect(limpio.iban).toBe("ES9121000418450200051332");
    expect(limpio.swift).toBe("BSCHESMM");
    expect(limpio.titular).toBe("María López");
  });

  it("una cuenta con guiones también", () => {
    expect(
      revisarCuenta("CO", {
        titular: "Carlos Ruiz",
        banco: "Bancolombia",
        tipoCuenta: "Ahorros",
        cuenta: "123-456-789-01",
        documento: "1020304050",
        swift: "COLOCOBM",
      }),
    ).toEqual([]);
  });
});

describe("lo que falta se dice, campo por campo", () => {
  it("una cuenta vacía devuelve todos los obligatorios", () => {
    const malos = revisarCuenta("CO", {});
    expect(malos).toContain("titular");
    expect(malos).toContain("banco");
    expect(malos).toContain("cuenta");
    expect(malos).toContain("documento");
  });

  it("el campo opcional no se reclama", () => {
    const malos = revisarCuenta("BR", {
      titular: "João Silva",
      banco: "Itaú",
      agencia: "1234",
      cuenta: "12345678",
      documento: "12345678901",
      swift: "ITAUBRSP",
    });
    // Sin Pix, y aun así la cuenta está completa.
    expect(malos).toEqual([]);
  });

  it("un número con letras no pasa", () => {
    const malos = revisarCuenta("US", {
      titular: "John Doe",
      banco: "Chase",
      cuenta: "12AB5678",
      ruta: "021000021",
      tipoCuenta: "Corriente",
    });
    expect(malos).toContain("cuenta");
  });

  it("un país desconocido se rechaza entero", () => {
    expect(revisarCuenta("XX", { titular: "Alguien" })).toEqual(["pais"]);
  });
});
