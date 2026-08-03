/**
 * Lectura de los datos que vienen del comprobante de Zelle.
 *
 * El campo "sender_name" del comprobante NO siempre trae el nombre de quien
 * paga: la mayoria de las veces trae el nombre del producto bancario de la
 * cuenta de origen ("Adv SafeBalance Banking - 1030"). Aqui se separa lo que
 * de verdad se puede saber:
 *
 *   - de que banco salio el pago,
 *   - los ultimos cuatro digitos de la cuenta de origen,
 *   - si detras hay una persona, una empresa, o solo una cuenta bancaria.
 *
 * Nada se inventa: si el dato no permite saberlo, queda como desconocido.
 */

export type TipoPagador =
  "persona" | "empresa" | "cuenta_bancaria" | "desconocido";

/** Bancos que se reconocen por el nombre del producto que sale en la captura. */
const BANCOS: { banco: string; patrones: RegExp[] }[] = [
  {
    banco: "Bank of America",
    patrones: [
      /\badv\s+safebalance\b/i,
      /\badv\s+plus\s+banking\b/i,
      /\badvantage\s+savings\b/i,
      /\badv\s+relationship\s+banking\b/i,
      /\bbusiness\s+adv\s+fundamentals\b/i,
    ],
  },
  {
    banco: "Wells Fargo",
    patrones: [
      /\bwells\s*fargo\b/i,
      /\beveryday\s+checking\b/i,
      /\bway2save\b/i,
      /\bclear\s+access\s+banking\b/i,
    ],
  },
  {
    banco: "Chase",
    patrones: [
      /\bchase\b/i,
      /\bbus\s+complete\s+chk\b/i,
      /\btotal\s+checking\b/i,
    ],
  },
  { banco: "TD Bank", patrones: [/\btd\s*bank\b/i] },
  { banco: "NBT Bank", patrones: [/\bnbt\b/i] },
  { banco: "Truist", patrones: [/\btruist\b/i] },
  { banco: "Regions Bank", patrones: [/\bregions\s*bank\b/i] },
];

/** Palabras que delatan una razon social. */
const SENAL_EMPRESA =
  /\b(llc|l\.l\.c|inc|inc\.|corp|corporation|company|co\.|s\.a|c\.a|ca\b|srl|ltd|services|service|handyman|ferreteria|ferretería|ferremateriales|store|shop|market|group|holdings)\b/i;

/** Palabras genericas de producto bancario, sin marca reconocible. */
const SENAL_CUENTA_GENERICA =
  /\b(banking|checking|savings|chk|account|cuenta\s+personal|mi\s+dinero|ahorros|bank)\b/i;

/**
 * Saca los ultimos cuatro digitos de la cuenta, que en las capturas vienen
 * pegados al nombre de varias formas: "- 1030", "...1551", "(...3873)".
 */
export function extraerUltimos4(nombre: string | null | undefined) {
  if (!nombre) return null;
  const m = nombre.match(/(?:-\s*|\.{2,}\s*|\(\s*\.{2,}\s*)(\d{4})\s*\)?\s*$/);
  return m ? m[1] : null;
}

/** Quita el sufijo de la cuenta para quedarse con el nombre limpio. */
export function limpiarNombre(nombre: string | null | undefined) {
  if (!nombre) return null;
  const limpio = nombre
    .replace(/(?:-\s*|\.{2,}\s*|\(\s*\.{2,}\s*)\d{4}\s*\)?\s*$/, "")
    .replace(/&reg;/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return limpio || null;
}

/** De que banco salio el pago, si se puede reconocer. */
export function detectarBanco(nombre: string | null | undefined) {
  if (!nombre) return null;
  for (const { banco, patrones } of BANCOS) {
    if (patrones.some((p) => p.test(nombre))) return banco;
  }
  return null;
}

/**
 * Que hay detras del pago: una persona, una empresa, o solo una cuenta
 * bancaria de la que no se sabe el titular.
 */
export function clasificarPagador(
  nombre: string | null | undefined,
): TipoPagador {
  const limpio = limpiarNombre(nombre);
  if (!limpio) return "desconocido";

  if (SENAL_EMPRESA.test(limpio)) return "empresa";
  if (detectarBanco(limpio) || SENAL_CUENTA_GENERICA.test(limpio)) {
    return "cuenta_bancaria";
  }

  // Lo que queda son nombres propios: "Elensi Llerena", "ALFREDO", "chiqui".
  return "persona";
}

/**
 * La cuenta que recibio el pago. El nombre que lee el lector automatico llega
 * con muchas variantes ("WINDOC", "Windows Llc", "Wind Once Llc"), asi que la
 * cuenta se identifica por el correo, que si es exacto.
 */
export function normalizarCuentaReceptora(
  correo: string | null | undefined,
): string | null {
  const limpio = (correo ?? "").trim().toLowerCase();
  return limpio || null;
}

/** Datos ya interpretados de un comprobante. */
export function interpretarComprobante(datos: {
  sender_name?: string | null;
  recipient_email?: string | null;
}) {
  return {
    pagadorNombre: limpiarNombre(datos.sender_name),
    pagadorTipo: clasificarPagador(datos.sender_name),
    bancoOrigen: detectarBanco(datos.sender_name),
    cuentaUltimos4: extraerUltimos4(datos.sender_name),
    cuentaReceptora: normalizarCuentaReceptora(datos.recipient_email),
  };
}
