import { paisBancario, type PaisBancario } from "@/lib/retiros/paises";

/**
 * TRADUCIR UN RETIRO NUESTRO AL FORMATO DE MERCURY.
 *
 * ══ POR QUÉ ESTO VIVE APARTE Y ES PURO ══
 *
 * Es la pieza donde un error cuesta dinero de verdad: un SWIFT en el campo
 * equivocado, o el país mandado como «Colombia» donde el banco espera «CO», y
 * el wire se queda dando vueltas entre bancos durante semanas. Separada del
 * cliente HTTP se puede probar entera, sin tocar el banco ni una vez.
 *
 * ══ LOS NOMBRES NO COINCIDEN, Y ESO ES EL TRABAJO ══
 *
 * Nuestro formulario guarda `titular`, `banco`, `cuenta`, `swift`, `documento`.
 * Mercury espera `accountHolderName`, `bankName`, `accountNumber`, `swiftCode`.
 * Traducir eso a mano en cada llamada es como se acaban mandando pagos con el
 * número de cuenta en la casilla del documento.
 */

/** Lo que guarda nuestro formulario, ya limpio. */
export type CuentaDelComercio = Record<string, string | undefined>;

/**
 * El motivo del pago que se le declara al banco.
 *
 * Mercury lo EXIGE en todos los wires —locales e internacionales— y sin él
 * rechaza la solicitud. Va fijo porque en Mercatren siempre es lo mismo: se le
 * paga a un comercio la mercancía que nos vendió.
 */
export const MOTIVO_DEL_PAGO = {
  simple: {
    category: "Vendor payment",
    additionalInfo: "Pago al comercio por mercancía vendida en Mercatren",
  },
} as const;

/** Cómo se llama en Mercury el carril que decidió el país. */
export function metodoDeMercury(
  pais: PaisBancario,
): "ach" | "internationalWire" {
  /* `domesticWire` existe, pero para Estados Unidos usamos ACH: es gratis y
     llega en uno a tres días. El wire local solo tendría sentido si hiciera
     falta el mismo día, y eso hoy no lo pide nadie. */
  return pais.via === "ach" ? "ach" : "internationalWire";
}

/**
 * Lo que hay dentro de un valor guardado, sin espacios ni guiones.
 *
 * La gente copia el IBAN del banco en grupos de cuatro y el SWIFT con espacios.
 * Aceptarlo así al escribir es correcto —rechazar un dato bueno es el error más
 * caro—, pero al banco hay que mandarlo pegado.
 */
function limpio(valor: string | undefined): string {
  return (valor ?? "").replace(/[\s-]/g, "").trim();
}

function texto(valor: string | undefined): string {
  return (valor ?? "").trim();
}

export type DatosDestinatario = {
  name: string;
  emails: string[];
  electronicRoutingInfo?: Record<string, unknown>;
  internationalWireRoutingInfo?: Record<string, unknown>;
};

/**
 * Arma el destinatario tal como lo espera Mercury.
 *
 * Devuelve `null` si falta algo imprescindible, en vez de mandar un
 * destinatario a medias: el banco lo aceptaría y el dinero saldría a una
 * cuenta incompleta.
 */
export function destinatarioParaMercury(datos: {
  codigoPais: string;
  cuenta: CuentaDelComercio;
  /** A quién avisa Mercury. Es el correo del comercio. */
  correo: string;
}): DatosDestinatario | null {
  const pais = paisBancario(datos.codigoPais);
  if (!pais) return null;

  const titular = texto(datos.cuenta.titular);
  const correo = texto(datos.correo);
  if (!titular || !correo) return null;

  const direccion = {
    address1: texto(datos.cuenta.direccion),
    city: texto(datos.cuenta.ciudad),
    /* Mercury pide región y código postal por separado. Lo que el formulario
       llama «departamento / estado / provincia» es la región. */
    region: texto(datos.cuenta.region),
    postalCode: texto(datos.cuenta.codigoPostal),
    country: pais.codigo,
  };

  if (pais.via === "ach") {
    const cuenta = limpio(datos.cuenta.cuenta);
    const ruta = limpio(datos.cuenta.ruta);
    if (!cuenta || !ruta) return null;

    return {
      name: titular,
      emails: [correo],
      electronicRoutingInfo: {
        accountNumber: cuenta,
        routingNumber: ruta,
        /* Se declara cuenta de EMPRESA: al comercio se le paga como
           proveedor, no como persona. Un tipo equivocado puede hacer que el
           banco receptor devuelva la transferencia. */
        electronicAccountType: "businessChecking",
        address: direccion,
      },
    };
  }

  /**
   * Wire internacional. El número de cuenta y el SWIFT son lo que de verdad
   * dirige el dinero; sin uno de los dos no sale.
   *
   * ══ CADA PAÍS LLAMA A SU CUENTA DE OTRA FORMA ══
   *
   * España y Rumanía tienen IBAN, México CLABE, Argentina CBU, Perú CCI, y el
   * resto «cuenta» a secas. Buscar solo `iban` habría mandado a México sin
   * número de cuenta —y con `null` en ese campo Mercury acepta el
   * destinatario pero el wire no llega a ninguna parte—.
   *
   * El orden importa: se prueba primero el identificador específico del país y
   * «cuenta» queda de último, porque algunos países traen los dos y el
   * específico es el que el banco receptor entiende.
   */
  const cuenta = limpio(
    datos.cuenta.iban ??
      datos.cuenta.clabe ??
      datos.cuenta.cbu ??
      datos.cuenta.cci ??
      datos.cuenta.cuenta,
  );
  const swift = limpio(datos.cuenta.swift).toUpperCase();
  if (!cuenta || !swift) return null;

  return {
    name: titular,
    emails: [correo],
    internationalWireRoutingInfo: {
      iban: cuenta,
      swiftCode: swift,
      correspondentInfo: undefined,
      bankDetails: {
        bankName: texto(datos.cuenta.banco),
        cityState: texto(datos.cuenta.ciudad),
        country: pais.codigo,
      },
      address: direccion,
      /* El documento del titular, donde el país lo exige. En casi toda
         Latinoamérica el banco receptor compara nombre y documento antes de
         acreditar, y si no cuadran devuelve la transferencia. */
      ...(texto(datos.cuenta.documento)
        ? { recipientTaxId: texto(datos.cuenta.documento) }
        : {}),
    },
  };
}

/**
 * Dólares con decimales, que es como los quiere Mercury.
 *
 * Todo el dinero del proyecto viaja en centavos enteros; el banco es de los
 * pocos sitios donde hay que convertir, y se hace en UN solo lugar para que no
 * aparezca un `/100` suelto en medio de una llamada de pago.
 */
export function aDolares(centavos: number): number {
  return Math.round(centavos) / 100;
}
