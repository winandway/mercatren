/**
 * PAGAR POR CABLE (WIRE), CON SU COSTO A LA VISTA.
 *
 * ══ POR QUÉ EXISTE, SI YA HAY ACH ══
 *
 * Porque no todos los bancos dejan hacer un ACH a un tercero desde la banca en
 * línea, y porque un wire llega el mismo día. Para una factura grande, quien
 * paga a veces solo tiene esa vía.
 *
 * ══ EL COSTO SE SUMA Y SE DICE, NUNCA SE ESCONDE ══
 *
 * Recibir un wire **le cuesta a Mercatren** (hoy $30). Ese costo se le suma a
 * lo que transfiere quien paga, y se le enseña desglosado antes de que toque
 * nada: «la factura son $2.774,04 · recibir el cable cuesta $30,00 · transfiere
 * $2.804,04».
 *
 * Meterlo callado dentro del total es la forma más rápida de que alguien mande
 * el monto de la factura, se quede corto por treinta dólares, y haya que
 * corregir el pago a mano — que es exactamente el problema que ya tuvimos.
 *
 * ══ EL COSTO NO ES DEL COMERCIO ══
 *
 * Al comercio se le acredita **lo mismo que si hubiera pagado por ACH**: su
 * factura menos la comisión de Mercatren. Los $30 no son una venta ni un
 * margen; son el costo de recibir, y por eso los pone quien elige esa vía.
 * Descontárselos al comercio sería cobrarle por una decisión que no tomó él.
 *
 * ══ Y LA RUTA ES OTRA ══
 *
 * Chase lo dice en su propia pantalla: la ruta de ACH **solo** sirve para
 * depósitos directos y ACH, y para wire hay otra distinta. Poner una donde va
 * la otra deja el dinero dando vueltas entre bancos. Por eso el wire tiene su
 * propio campo y no reutiliza el de ACH.
 */

/** Lo que hace falta para recibir un cable. */
export type DatosDeWire = {
  beneficiario: string;
  banco: string;
  cuenta: string;
  rutaWire: string;
};

export type DecisionWire =
  | {
      disponible: true;
      datos: DatosDeWire;
      /** Lo que cuesta recibirlo, en centavos. */
      costoCentavos: number;
      /** Lo que tiene que transferir: la factura más el costo. */
      totalATransferirCentavos: number;
    }
  | { disponible: false; motivo: "sin_datos" | "monto_bajo" };

/**
 * EL COSTO POR DEFECTO: $30.
 *
 * Es el respaldo, no la verdad: el número vivo está en
 * `configuracion.wire_costo_centavos` y se edita desde el panel, porque el
 * banco lo cambia sin avisarnos.
 */
export const WIRE_COSTO_CENTAVOS = 3_000;

/**
 * ¿Se le ofrece el cable a quien va a pagar este cobro?
 *
 * Puro: decide con lo que se le pasa. Las variables las lee quien llama.
 */
export function decidirWire(
  datos: Partial<DatosDeWire>,
  montoCentavos: number,
  minimoCentavos: number,
  costoCentavos: number = WIRE_COSTO_CENTAVOS,
): DecisionWire {
  const beneficiario = datos.beneficiario?.trim();
  const banco = datos.banco?.trim();
  const cuenta = datos.cuenta?.trim();
  const rutaWire = datos.rutaWire?.trim();

  /* Las CUATRO o ninguna, igual que en ACH: media instrucción bancaria manda
     el dinero a otra parte. */
  if (!beneficiario || !banco || !cuenta || !rutaWire) {
    return { disponible: false, motivo: "sin_datos" };
  }
  if (montoCentavos < minimoCentavos) {
    return { disponible: false, motivo: "monto_bajo" };
  }

  /* Un costo mal cargado —cero o negativo— cae al respaldo. Ofrecer un cable
     «gratis» que a nosotros nos cuesta treinta dólares es perder dinero en
     cada uno, y en silencio. */
  const costo =
    Number.isFinite(costoCentavos) && costoCentavos > 0
      ? Math.round(costoCentavos)
      : WIRE_COSTO_CENTAVOS;

  return {
    disponible: true,
    datos: { beneficiario, banco, cuenta, rutaWire },
    costoCentavos: costo,
    totalATransferirCentavos: montoCentavos + costo,
  };
}

/**
 * LA VARIABLE DE LA RUTA DE WIRE, ESCRITA UNA SOLA VEZ.
 *
 * Igual que en ACH: el nombre vive aquí para que una prueba pueda comprobar
 * que este archivo lee `PAGO_RUTA_WIRE` y **nunca** `PAGO_RUTA_ACH`.
 */
export const VARIABLE_DE_RUTA_WIRE = "PAGO_RUTA_WIRE" as const;
