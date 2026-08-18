import type { Mercado } from "@/lib/mercado/mercados";

/**
 * CÓMO SE LLAMA Y CÓMO SE COMPRUEBA EL DOCUMENTO DE UNA EMPRESA, POR PAÍS.
 *
 * ══ POR QUÉ HACÍA FALTA (17 ago 2026) ══
 *
 * El formulario de alta pedía «Identificación fiscal» con la ayuda «RIF, EIN o
 * el que corresponda» y, cuando fallaba, el ejemplo que daba era
 * `J-12345678-9` — un RIF venezolano. A un comercio chileno eso no le dice
 * nada: en Chile ese dato se llama **RUT** y tiene una forma concreta.
 *
 * No es un problema de traducción. Alguien que no reconoce el nombre del
 * campo escribe cualquier cosa o abandona el formulario, y lo primero es peor:
 * queda un comercio dado de alta con una identificación que no sirve para
 * facturarle.
 *
 * ══ Y POR QUÉ SE COMPRUEBA DE VERDAD, NO SOLO SE RENOMBRA ══
 *
 * El RUT lleva **dígito verificador**: el último carácter se calcula de los
 * demás. Comprobarlo atrapa el dedazo en el momento —un dígito cambiado, dos
 * traspuestos— en vez de descubrirlo semanas después, cuando haya que emitirle
 * una factura o pagarle.
 *
 * ══ LO QUE NO SE HACE ══
 *
 * **No se inventa una regla para un país que no conocemos.** Un mercado sin
 * documento declarado se queda con la comprobación genérica de siempre (letras,
 * números y guiones). Rechazar un dato bueno es el error más caro: el comercio
 * ya decidió vender con nosotros y no puede ni darse de alta.
 */

export type DocumentoDelMercado = {
  /** Cómo lo llama la gente de ese país. Va como etiqueta del campo. */
  nombre: string;
  /** Un ejemplo con la forma correcta. NUNCA el documento de alguien real. */
  ejemplo: string;
  /** Deja el valor como se guarda: sin puntos, sin espacios, en mayúsculas. */
  normalizar: (valor: string) => string;
  /** `null` si es válido; si no, la clave del aviso que se le enseña. */
  revisar: (valor: string) => string | null;
};

/** Quita todo lo que es adorno de escritura: puntos, espacios y guiones. */
function pelado(valor: string): string {
  return valor.replace(/[.\s-]/g, "").toUpperCase();
}

/**
 * EL DÍGITO VERIFICADOR DEL RUT CHILENO (módulo 11).
 *
 * Se recorren los dígitos del cuerpo de derecha a izquierda multiplicando por
 * 2, 3, 4, 5, 6, 7 y volviendo a empezar. El resto de dividir la suma entre 11
 * decide el dígito: 11 → «0», 10 → «K», y el resto tal cual.
 *
 * La «K» no es un capricho ni una letra de relleno: es el once, que no cabe en
 * un solo dígito. Un validador que solo acepte números rechaza a una de cada
 * once empresas chilenas.
 */
export function digitoVerificadorRut(cuerpo: string): string {
  let suma = 0;
  let factor = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }

  const resto = 11 - (suma % 11);
  if (resto === 11) return "0";
  if (resto === 10) return "K";
  return String(resto);
}

/** El RUT como se enseña en Chile: `12.345.678-9`. */
export function formatearRut(valor: string): string {
  const limpio = pelado(valor);
  if (limpio.length < 2) return limpio;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${conPuntos}-${dv}`;
}

const RUT: DocumentoDelMercado = {
  nombre: "RUT",
  /* Ejemplo con dígito verificador correcto y obviamente ficticio: nunca el
     RUT de una empresa real, que es la regla de placeholders del proyecto. */
  ejemplo: "76.123.456-0",
  normalizar: pelado,
  revisar: (valor) => {
    const limpio = pelado(valor);
    if (!limpio) return "faltaRut";

    /* Cuerpo de 7 u 8 dígitos más el verificador. Las empresas chilenas
       empiezan en 7 y las personas tienen menos, así que se aceptan los dos:
       un comercio puede darse de alta como persona natural. */
    if (!/^\d{7,8}[0-9K]$/.test(limpio)) return "rutFormato";

    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);
    if (digitoVerificadorRut(cuerpo) !== dv) return "rutDigito";

    return null;
  },
};

/** Lo de siempre, para los mercados sin regla propia. */
const GENERICO: DocumentoDelMercado = {
  nombre: "identificacionFiscal",
  ejemplo: "J-12345678-9",
  normalizar: (v) =>
    v
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, ""),
  revisar: (valor) => {
    const limpio = valor.trim().toUpperCase();
    if (!limpio) return "faltaIdentificacion";
    return /^[A-Z0-9-]{5,20}$/.test(limpio) ? null : "identificacionInvalida";
  },
};

const POR_MERCADO: Record<string, DocumentoDelMercado> = {
  CL: RUT,
};

/**
 * El documento que le toca a este país.
 *
 * Devuelve el genérico para lo que no esté declarado, que hoy es todo salvo
 * Chile. mercatren.com sigue exactamente como estaba.
 */
export function documentoDelMercado(mercado: Mercado): DocumentoDelMercado {
  return POR_MERCADO[mercado.codigo] ?? GENERICO;
}

/** ¿Este país tiene una regla propia, o va con la genérica? */
export function tieneDocumentoPropio(mercado: Mercado): boolean {
  return mercado.codigo in POR_MERCADO;
}
