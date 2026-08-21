/**
 * EL FORMULARIO FISCAL DE UN COMERCIO EXTRANJERO (W-8BEN-E).
 *
 * ══ QUÉ ES, EN PALABRAS NORMALES ══
 *
 * Es el papel con el que una empresa de fuera de Estados Unidos declara que no
 * es estadounidense. Lo pide el IRS a quien paga —nosotros— y sirve para no
 * tener que retenerle impuestos ni emitirle un 1099.
 *
 * **No se manda a ninguna parte.** No va al IRS. Se guarda en nuestro archivo
 * por si algún día alguien pregunta. Mucha gente cree que lo está enviando a
 * Hacienda y se pone nerviosa; decirlo en la propia pantalla ahorra esa
 * llamada.
 *
 * ══ POR QUÉ SE CONSTRUYE AQUÍ Y NO SE PIDE POR CORREO ══
 *
 * Es lo que hacen Google, YouTube y Facebook con quien cobra desde fuera: unos
 * campos en pantalla, una firma, y sale el documento lleno. La alternativa
 * —«bájate este PDF, imprímelo, fírmalo, escanéalo y mándanoslo»— la abandona
 * media docena de comercios de cada diez, y con ella se les queda el dinero
 * parado.
 *
 * ══ LA SALVEDAD QUE MANDA SOBRE TODO EL DISEÑO ══
 *
 * **Escribir el nombre en la línea de la firma NO cuenta como firma
 * electrónica.** Lo dice el IRS con esas palabras. Para que valga hay que
 * guardar además **fecha y hora** y una **declaración** de que el documento se
 * firmó electrónicamente.
 *
 * Eso lo hace el sistema, no la persona. Pero si no está, el formulario no
 * sirve — y lo peor es que no se nota hasta que alguien lo pide.
 *
 * Puro a propósito: decide sobre valores, sin tocar la base ni la red.
 */

/** Los tipos de entidad que ofrece el formulario, en el orden en que se usan. */
export const TIPOS_DE_ENTIDAD = [
  "corporacion",
  "sociedad",
  "empresario_individual",
  "otra",
] as const;

export type TipoDeEntidad = (typeof TIPOS_DE_ENTIDAD)[number];

export type DatosW8 = {
  /** Nombre legal de la empresa, como está registrada. */
  nombreLegal: string;
  /** País donde está constituida. Código de dos letras. */
  paisConstitucion: string;
  tipoEntidad: TipoDeEntidad;
  /** Dirección de la empresa. Nunca un apartado de correos. */
  direccion: string;
  ciudad: string;
  /** Provincia, estado o región. Opcional: no todos los países la usan. */
  region?: string | null;
  codigoPostal?: string | null;
  /** Identificación fiscal del país de origen (RIF, NIT, RUT…). */
  identificacionFiscal?: string | null;
  /** Quién firma y con qué cargo. */
  firmanteNombre: string;
  firmanteCargo: string;
};

export type FaltaEnW8 = keyof DatosW8;

/**
 * ¿Está completo?
 *
 * Devuelve la LISTA de lo que falta, no un sí/no. Un «revisa los campos» con
 * ocho casillas delante obliga a la persona a repasarlas adivinando — y esto
 * lo llena alguien a 900 km que no puede preguntar.
 */
export function loQueFalta(datos: Partial<DatosW8>): FaltaEnW8[] {
  const obligatorios: FaltaEnW8[] = [
    "nombreLegal",
    "paisConstitucion",
    "tipoEntidad",
    "direccion",
    "ciudad",
    "firmanteNombre",
    "firmanteCargo",
  ];

  return obligatorios.filter((campo) => {
    const valor = datos[campo];
    return typeof valor !== "string" || valor.trim().length < 2;
  });
}

/**
 * NO SE PUEDE FIRMAR UN APARTADO DE CORREOS.
 *
 * El IRS pide la dirección PERMANENTE de la empresa, y dice expresamente que
 * no vale un apartado postal ni la dirección de un tercero. Es de los motivos
 * más comunes por los que un formulario se rechaza después, cuando ya nadie se
 * acuerda de haberlo llenado.
 */
export function pareceApartadoPostal(direccion: string): boolean {
  const d = direccion.toLowerCase();
  return (
    /\bp\.?\s*o\.?\s*box\b/.test(d) ||
    /\bapartado\b/.test(d) ||
    /\bcasilla\s+(postal|de\s+correo)/.test(d)
  );
}

/**
 * CUÁNDO VENCE, Y NO ES «TRES AÑOS DESDE HOY».
 *
 * La regla del IRS es que el formulario vale hasta el último día del TERCER
 * año natural siguiente al de la firma. Uno firmado en marzo de 2026 y otro
 * firmado en diciembre de 2026 vencen los dos el 31 de diciembre de 2029.
 *
 * Calcularlo como «hoy + 3 años» daría marzo de 2029 para el primero: nueve
 * meses de menos, y un comercio al que se le pide de nuevo el papel sin
 * motivo.
 */
export function venceEl(firmadoEn: Date): Date {
  return new Date(Date.UTC(firmadoEn.getUTCFullYear() + 3, 11, 31, 23, 59, 59));
}

/** ¿Sigue vigente a esta fecha? */
export function estaVigente(vence: Date | null, ahora: Date): boolean {
  return vence !== null && vence.getTime() >= ahora.getTime();
}

/**
 * Los días que faltan para que venza. Negativo si ya venció.
 *
 * Se avisa con 60 días de antelación: es tiempo de sobra para que el comercio
 * lo rehaga sin que se le pare un retiro, y lo bastante cerca para que no sea
 * un aviso que se ignora durante un año.
 */
export const DIAS_DE_AVISO = 60;

export function diasParaVencer(vence: Date, ahora: Date): number {
  return Math.ceil((vence.getTime() - ahora.getTime()) / 86_400_000);
}

export type EstadoFiscal =
  | { estado: "no_hace_falta" }
  | { estado: "falta" }
  | { estado: "por_vencer"; dias: number; vence: Date }
  | { estado: "al_dia"; vence: Date }
  | { estado: "vencido"; vence: Date };

/**
 * En qué situación está un comercio.
 *
 * ══ A UN COMERCIO DE ESTADOS UNIDOS NO SE LE PIDE ══
 *
 * El W-8BEN-E es justamente el papel con el que una empresa declara que NO es
 * estadounidense. Pedírselo a una que sí lo es no tiene sentido y además la
 * confunde: la suya sería otra cosa (un W-9), y ese caso hoy no existe porque
 * las tiendas de Estados Unidos son nuestras.
 */
export function estadoFiscal(
  pais: string | null | undefined,
  vence: Date | null,
  ahora: Date,
): EstadoFiscal {
  if ((pais ?? "").trim().toUpperCase() === "US") {
    return { estado: "no_hace_falta" };
  }

  if (!vence) return { estado: "falta" };

  if (!estaVigente(vence, ahora)) return { estado: "vencido", vence };

  const dias = diasParaVencer(vence, ahora);
  if (dias <= DIAS_DE_AVISO) return { estado: "por_vencer", dias, vence };

  return { estado: "al_dia", vence };
}

/**
 * ¿SE LE PUEDE PAGAR UN RETIRO A ESTE COMERCIO?
 *
 * Este es el candado que convierte todo lo anterior en algo real. Sin él, el
 * formulario es una pantalla más que nadie llena.
 *
 * ══ UN FORMULARIO POR VENCER SÍ COBRA ══
 *
 * Solo se frena el que falta o el que ya venció. Frenarle el dinero a alguien
 * porque su papel vence en cincuenta días sería castigarlo por adelantado —
 * para eso está el aviso.
 */
export function puedeCobrar(estado: EstadoFiscal): boolean {
  return (
    estado.estado === "no_hace_falta" ||
    estado.estado === "al_dia" ||
    estado.estado === "por_vencer"
  );
}

/**
 * LA DECLARACIÓN QUE SE FIRMA.
 *
 * Es la del propio formulario del IRS, traducida. Se guarda con la firma tal
 * como se le mostró: si mañana cambia el texto, el que firmó en 2026 tiene que
 * poder demostrar qué fue lo que aceptó.
 */
export const DECLARACION_ES =
  "Declaro, bajo pena de perjurio, que he revisado la información de este " +
  "formulario y que es verdadera, correcta y completa. Declaro que la " +
  "empresa nombrada es la beneficiaria de todos los pagos relacionados, que " +
  "no es una persona estadounidense, y que estoy autorizado para firmar en " +
  "su nombre.";

export const DECLARACION_EN =
  "Under penalties of perjury, I declare that I have examined the " +
  "information on this form and that it is true, correct and complete. I " +
  "further certify that the entity named is the beneficial owner of all the " +
  "income to which this form relates, that it is not a U.S. person, and that " +
  "I have the capacity to sign for the entity.";
