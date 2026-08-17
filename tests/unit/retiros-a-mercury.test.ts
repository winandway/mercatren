import { describe, expect, it } from "vitest";

import {
  aDolares,
  destinatarioParaMercury,
  metodoDeMercury,
} from "@/lib/retiros/a-mercury";
import { paisBancario } from "@/lib/retiros/paises";

const CORREO = "comercio@ejemplo.com";

const COLOMBIA = {
  titular: "Comercio de prueba S.A.S",
  banco: "Bancolombia",
  tipoCuenta: "Ahorros",
  cuenta: "1234567890",
  documento: "900123456-7",
  swift: "colo co bb",
  direccion: "Calle 100 # 20-30",
  ciudad: "Bogotá",
  region: "Cundinamarca",
  codigoPostal: "110111",
};

const ESTADOS_UNIDOS = {
  titular: "Test Store LLC",
  banco: "Chase",
  cuenta: "000123456789",
  ruta: "021000021",
  direccion: "500 Main St",
  ciudad: "Miami",
  region: "FL",
  codigoPostal: "33101",
};

describe("el carril que se le pide a Mercury", () => {
  it("Estados Unidos va por ACH", () => {
    expect(metodoDeMercury(paisBancario("US")!)).toBe("ach");
  });

  it("Colombia va por wire internacional", () => {
    /* Con el endpoint de transacciones esto no existiría: solo acepta ACH y
       wire local. Once de los doce países salen por aquí. */
    expect(metodoDeMercury(paisBancario("CO")!)).toBe("internationalWire");
  });
});

describe("el destinatario para Estados Unidos", () => {
  it("va con número de cuenta, ruta y tipo de cuenta de empresa", () => {
    const d = destinatarioParaMercury({
      codigoPais: "US",
      cuenta: ESTADOS_UNIDOS,
      correo: CORREO,
    })!;

    expect(d.name).toBe("Test Store LLC");
    expect(d.emails).toEqual([CORREO]);
    expect(d.electronicRoutingInfo).toMatchObject({
      accountNumber: "000123456789",
      routingNumber: "021000021",
      /* Al comercio se le paga como proveedor. Un tipo equivocado puede hacer
         que el banco receptor devuelva la transferencia. */
      electronicAccountType: "businessChecking",
    });
    // Por ACH no se manda información de wire: son campos excluyentes.
    expect(d.internationalWireRoutingInfo).toBeUndefined();
  });

  it("sin número de ruta NO se arma el destinatario", () => {
    /* Mejor no crearlo que crearlo a medias: Mercury lo aceptaría y el dinero
       saldría a una cuenta incompleta. */
    const d = destinatarioParaMercury({
      codigoPais: "US",
      cuenta: { ...ESTADOS_UNIDOS, ruta: "" },
      correo: CORREO,
    });
    expect(d).toBeNull();
  });
});

describe("el destinatario para Colombia", () => {
  it("va con SWIFT, banco y país en dos letras", () => {
    const d = destinatarioParaMercury({
      codigoPais: "CO",
      cuenta: COLOMBIA,
      correo: CORREO,
    })!;

    expect(d.internationalWireRoutingInfo).toMatchObject({
      iban: "1234567890",
      /* En mayúsculas y sin espacios: la gente lo copia del banco como
         «colo co bb» y así el wire no sale. */
      swiftCode: "COLOCOBB",
    });
    expect(d.electronicRoutingInfo).toBeUndefined();
  });

  it("manda el país como «CO», no como «Colombia»", () => {
    /* El banco espera el código de dos letras. Con el nombre largo, el wire se
       queda dando vueltas entre bancos. */
    const d = destinatarioParaMercury({
      codigoPais: "CO",
      cuenta: COLOMBIA,
      correo: CORREO,
    })!;
    const wire = d.internationalWireRoutingInfo as Record<string, never>;

    expect((wire.bankDetails as unknown as { country: string }).country).toBe(
      "CO",
    );
    expect((wire.address as unknown as { country: string }).country).toBe("CO");
  });

  it("lleva el documento del titular", () => {
    /* En casi toda Latinoamérica el banco receptor compara nombre y documento
       antes de acreditar, y si no cuadran devuelve la transferencia. */
    const d = destinatarioParaMercury({
      codigoPais: "CO",
      cuenta: COLOMBIA,
      correo: CORREO,
    })!;

    expect(d.internationalWireRoutingInfo).toMatchObject({
      recipientTaxId: "900123456-7",
    });
  });

  it("sin SWIFT NO se arma el destinatario", () => {
    const d = destinatarioParaMercury({
      codigoPais: "CO",
      cuenta: { ...COLOMBIA, swift: "" },
      correo: CORREO,
    });
    expect(d).toBeNull();
  });
});

describe("cada país llama a su cuenta de otra forma", () => {
  it("México manda la CLABE como número de cuenta", () => {
    /* Buscar solo `iban` habría mandado a México SIN número de cuenta, y con
       ese campo vacío el wire no llega a ninguna parte. */
    const d = destinatarioParaMercury({
      codigoPais: "MX",
      cuenta: {
        titular: "Tienda MX",
        banco: "BBVA",
        clabe: "0121 8001 2345 6789 05",
        swift: "BCMRMXMM",
        documento: "XAXX010101000",
      },
      correo: CORREO,
    })!;

    expect(d.internationalWireRoutingInfo).toMatchObject({
      iban: "012180012345678905",
    });
  });

  it("Argentina manda el CBU", () => {
    const d = destinatarioParaMercury({
      codigoPais: "AR",
      cuenta: {
        titular: "Tienda AR",
        banco: "Galicia",
        cbu: "0070055530004321234567",
        swift: "GABAARBA",
        documento: "30-12345678-9",
      },
      correo: CORREO,
    })!;

    expect(d.internationalWireRoutingInfo).toMatchObject({
      iban: "0070055530004321234567",
    });
  });

  it("España manda el IBAN, con sus espacios quitados", () => {
    const d = destinatarioParaMercury({
      codigoPais: "ES",
      cuenta: {
        titular: "Tienda ES",
        banco: "Santander",
        iban: "ES91 2100 0418 4502 0005 1332",
        swift: "BSCHESMM",
      },
      correo: CORREO,
    })!;

    expect(d.internationalWireRoutingInfo).toMatchObject({
      iban: "ES9121000418450200051332",
    });
  });
});

describe("los guardarraíles", () => {
  it("un país que no existe no arma nada", () => {
    expect(
      destinatarioParaMercury({
        codigoPais: "XX",
        cuenta: COLOMBIA,
        correo: CORREO,
      }),
    ).toBeNull();
  });

  it("sin correo no se arma: Mercury lo exige para avisar al destinatario", () => {
    expect(
      destinatarioParaMercury({
        codigoPais: "CO",
        cuenta: COLOMBIA,
        correo: "  ",
      }),
    ).toBeNull();
  });

  it("los centavos se convierten a dólares SIN perder un centavo", () => {
    /* Todo el dinero del proyecto va en centavos enteros; el banco es de los
       pocos sitios donde hay que convertir, y un centavo perdido aquí es un
       centavo que no le llega al comercio. */
    expect(aDolares(2_467_611)).toBe(24_676.11);
    expect(aDolares(1)).toBe(0.01);
    expect(aDolares(0)).toBe(0);
  });
});
