/**
 * LOS DATOS BANCARIOS QUE PIDE CADA PAÍS.
 *
 * ══ POR QUÉ EXISTE ESTE ARCHIVO ══
 *
 * El formulario de retiros se escribió cuando el único destino era Estados
 * Unidos: titular, banco, cuenta y **número de ruta**. Ese número de ruta solo
 * existe allá. Un comercio en Colombia entraba, elegía «wire», y no encontraba
 * dónde poner su Bancolombia — la pantalla hasta le decía que solo se
 * transfiere a bancos de Estados Unidos.
 *
 * Se quedó bloqueado de verdad, esperando, mientras del otro lado nadie sabía
 * qué contestarle.
 *
 * ══ POR QUÉ NO UN FORMULARIO ÚNICO CON TODOS LOS CAMPOS ══
 *
 * Porque quien lo llena no sabe cuáles le tocan. Un mexicano no tiene «número
 * de ruta» y un estadounidense no tiene CLABE; enseñar los dos y dejar que
 * adivine es como se manda una transferencia a una cuenta mal escrita, que en
 * un wire internacional cuesta el dinero y la semana.
 *
 * Cada país declara SUS campos, y el formulario dibuja solo esos.
 *
 * ══ LOS PAÍSES SON LOS QUE DIJO EL DUEÑO ══
 *
 * Estados Unidos es el principal. Colombia y Venezuela son de donde vienen los
 * comercios de hoy. Rumanía entra porque van a operar allá pronto. El resto es
 * el mapa de crecimiento: México, Brasil, Argentina, Chile, Perú, Ecuador,
 * Panamá y España.
 */

/** Cómo se valida y se teclea un campo. */
export type FormaDelCampo =
  | "texto"
  | "numero"
  /** Letras y números sin espacios: IBAN, CLABE, CBU. Se guarda en mayúsculas. */
  | "codigo";

export type CampoBancario = {
  /** La llave con la que se guarda. No se traduce. */
  nombre: string;
  /** La clave del texto en `panel.retiros.campos`. */
  etiqueta: string;
  forma: FormaDelCampo;
  /** Largo exacto que tiene que tener. Si no se sabe, se usa `minimo`/`maximo`. */
  largoExacto?: number;
  minimo?: number;
  maximo: number;
  /** Un campo puede ser opcional: el Pix de Brasil, por ejemplo. */
  opcional?: boolean;
  /** Clave del texto de ayuda, cuando hace falta explicarlo. */
  ayuda?: string;
};

export type PaisBancario = {
  /** ISO 3166-1 alfa-2. Es lo que se guarda en el destino del retiro. */
  codigo: string;
  /** La bandera, para que se reconozca de un vistazo sin leer. */
  bandera: string;
  /** Cómo se manda el dinero desde Mercury a ese país. */
  via: "ach" | "wire";
  campos: CampoBancario[];
};

/** El titular y el banco los pide todo el mundo. */
const TITULAR: CampoBancario = {
  nombre: "titular",
  etiqueta: "titular",
  forma: "texto",
  minimo: 3,
  maximo: 120,
};

const BANCO: CampoBancario = {
  nombre: "banco",
  etiqueta: "banco",
  forma: "texto",
  minimo: 2,
  maximo: 120,
};

/**
 * El documento de identidad del titular.
 *
 * En casi toda Latinoamérica el banco receptor lo exige para acreditar una
 * transferencia del exterior: si el nombre y el documento no coinciden con los
 * de la cuenta, la devuelven. En Estados Unidos y Europa no hace falta.
 */
const DOCUMENTO: CampoBancario = {
  nombre: "documento",
  etiqueta: "documento",
  forma: "texto",
  minimo: 5,
  maximo: 30,
  ayuda: "documentoAyuda",
};

const TIPO_CUENTA: CampoBancario = {
  nombre: "tipoCuenta",
  etiqueta: "tipoCuenta",
  forma: "texto",
  minimo: 5,
  maximo: 20,
  ayuda: "tipoCuentaAyuda",
};

const CUENTA = (maximo = 34): CampoBancario => ({
  nombre: "cuenta",
  etiqueta: "cuenta",
  forma: "numero",
  minimo: 5,
  maximo,
});

const SWIFT: CampoBancario = {
  nombre: "swift",
  etiqueta: "swift",
  forma: "codigo",
  minimo: 8,
  maximo: 11,
  ayuda: "swiftAyuda",
};

const IBAN = (largoExacto: number): CampoBancario => ({
  nombre: "iban",
  etiqueta: "iban",
  forma: "codigo",
  largoExacto,
  maximo: largoExacto,
  ayuda: "ibanAyuda",
});

/**
 * LA LISTA. Estados Unidos primero porque es el destino principal y el único
 * que no cuesta una comisión de wire.
 */
export const PAISES_BANCARIOS: PaisBancario[] = [
  {
    codigo: "US",
    bandera: "🇺🇸",
    via: "ach",
    campos: [
      TITULAR,
      BANCO,
      CUENTA(17),
      {
        nombre: "ruta",
        etiqueta: "ruta",
        forma: "numero",
        largoExacto: 9,
        maximo: 9,
        ayuda: "rutaAyuda",
      },
      TIPO_CUENTA,
    ],
  },
  {
    codigo: "CO",
    bandera: "🇨🇴",
    via: "wire",
    campos: [TITULAR, BANCO, TIPO_CUENTA, CUENTA(20), DOCUMENTO, SWIFT],
  },
  {
    codigo: "VE",
    bandera: "🇻🇪",
    via: "wire",
    campos: [
      TITULAR,
      BANCO,
      {
        nombre: "cuenta",
        etiqueta: "cuenta",
        forma: "numero",
        largoExacto: 20,
        maximo: 20,
        ayuda: "cuentaVeAyuda",
      },
      DOCUMENTO,
      SWIFT,
    ],
  },
  {
    codigo: "MX",
    bandera: "🇲🇽",
    via: "wire",
    campos: [
      TITULAR,
      BANCO,
      {
        nombre: "clabe",
        etiqueta: "clabe",
        forma: "numero",
        largoExacto: 18,
        maximo: 18,
        ayuda: "clabeAyuda",
      },
      DOCUMENTO,
      SWIFT,
    ],
  },
  {
    codigo: "BR",
    bandera: "🇧🇷",
    via: "wire",
    campos: [
      TITULAR,
      BANCO,
      {
        nombre: "agencia",
        etiqueta: "agencia",
        forma: "numero",
        minimo: 3,
        maximo: 10,
      },
      CUENTA(20),
      DOCUMENTO,
      SWIFT,
      {
        nombre: "pix",
        etiqueta: "pix",
        forma: "texto",
        minimo: 5,
        maximo: 80,
        opcional: true,
        ayuda: "pixAyuda",
      },
    ],
  },
  {
    codigo: "AR",
    bandera: "🇦🇷",
    via: "wire",
    campos: [
      TITULAR,
      BANCO,
      {
        nombre: "cbu",
        etiqueta: "cbu",
        forma: "numero",
        largoExacto: 22,
        maximo: 22,
        ayuda: "cbuAyuda",
      },
      DOCUMENTO,
      SWIFT,
    ],
  },
  {
    codigo: "CL",
    bandera: "🇨🇱",
    via: "wire",
    campos: [TITULAR, BANCO, TIPO_CUENTA, CUENTA(20), DOCUMENTO, SWIFT],
  },
  {
    codigo: "PE",
    bandera: "🇵🇪",
    via: "wire",
    campos: [
      TITULAR,
      BANCO,
      CUENTA(20),
      {
        nombre: "cci",
        etiqueta: "cci",
        forma: "numero",
        largoExacto: 20,
        maximo: 20,
        ayuda: "cciAyuda",
      },
      DOCUMENTO,
      SWIFT,
    ],
  },
  {
    codigo: "EC",
    bandera: "🇪🇨",
    via: "wire",
    campos: [TITULAR, BANCO, TIPO_CUENTA, CUENTA(20), DOCUMENTO, SWIFT],
  },
  {
    codigo: "PA",
    bandera: "🇵🇦",
    via: "wire",
    campos: [TITULAR, BANCO, TIPO_CUENTA, CUENTA(20), DOCUMENTO, SWIFT],
  },
  {
    codigo: "ES",
    bandera: "🇪🇸",
    via: "wire",
    campos: [TITULAR, BANCO, IBAN(24), SWIFT],
  },
  {
    codigo: "RO",
    bandera: "🇷🇴",
    via: "wire",
    campos: [TITULAR, BANCO, IBAN(24), SWIFT],
  },
];

export function paisBancario(codigo: string): PaisBancario | null {
  return PAISES_BANCARIOS.find((p) => p.codigo === codigo) ?? null;
}

/**
 * Comprueba los datos de una cuenta contra las reglas de su país.
 *
 * Devuelve las CLAVES de los campos que están mal, no frases: esto corre en el
 * servidor y en el navegador, y en el navegador no se sabe el idioma.
 *
 * ══ POR QUÉ SE VALIDA EN SERIO ══
 *
 * Un wire internacional a una cuenta mal escrita no rebota al día siguiente:
 * se queda dando vueltas entre bancos, cuesta la comisión de vuelta y puede
 * tardar semanas. Comprobar que una CLABE tiene 18 dígitos es gratis; que el
 * comercio se quede sin su dinero dos semanas, no.
 */
export function revisarCuenta(
  codigoPais: string,
  valores: Record<string, string | undefined>,
): string[] {
  const pais = paisBancario(codigoPais);
  if (!pais) return ["pais"];

  const malos: string[] = [];

  for (const campo of pais.campos) {
    const crudo = (valores[campo.nombre] ?? "").trim();

    if (!crudo) {
      if (!campo.opcional) malos.push(campo.nombre);
      continue;
    }

    /* Los espacios y guiones que la gente copia del banco no son un error:
       se quitan antes de medir. Un IBAN se enseña en grupos de cuatro. */
    const limpio =
      campo.forma === "texto" ? crudo : crudo.replace(/[\s-]/g, "");

    if (campo.forma === "numero" && !/^\d+$/.test(limpio)) {
      malos.push(campo.nombre);
      continue;
    }
    if (campo.forma === "codigo" && !/^[A-Za-z0-9]+$/.test(limpio)) {
      malos.push(campo.nombre);
      continue;
    }

    if (campo.largoExacto && limpio.length !== campo.largoExacto) {
      malos.push(campo.nombre);
      continue;
    }
    if (campo.minimo && limpio.length < campo.minimo) {
      malos.push(campo.nombre);
      continue;
    }
    if (limpio.length > campo.maximo) malos.push(campo.nombre);
  }

  return malos;
}

/**
 * Deja los valores como se van a guardar: sin espacios de sobra y con los
 * códigos en mayúsculas.
 *
 * Se guarda limpio porque es lo que alguien va a copiar y pegar en Mercury. Un
 * IBAN con un espacio de más pegado en el formulario del banco es una
 * transferencia rechazada.
 */
export function limpiarCuenta(
  codigoPais: string,
  valores: Record<string, string | undefined>,
): Record<string, string> {
  const pais = paisBancario(codigoPais);
  if (!pais) return {};

  const salida: Record<string, string> = {};

  for (const campo of pais.campos) {
    const crudo = (valores[campo.nombre] ?? "").trim();
    if (!crudo) continue;

    salida[campo.nombre] =
      campo.forma === "texto"
        ? crudo.replace(/\s+/g, " ")
        : campo.forma === "codigo"
          ? crudo.replace(/[\s-]/g, "").toUpperCase()
          : crudo.replace(/[\s-]/g, "");
  }

  return salida;
}
