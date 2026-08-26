/**
 * COBRAR UNA FACTURA EN VARIAS PARTES (26 ago 2026).
 *
 * ══ EL CASO REAL ══
 *
 * Una factura de $7.475 y un cliente cuyo banco le deja mandar $2.500 por
 * Zelle al día. Con un solo cobro no puede pagarla: manda lo que le deja el
 * banco, se queda a medias, y el comercio se queda sin saber si eso fue un
 * abono o un error. Palabras del dueño: _«si se divide en tres partes,
 * póngale que la primera la logra enviar… pero la segunda, ¿cómo va a ser si
 * no tiene más cupo?»_.
 *
 * ══ CÓMO SE RESUELVE, SIN INVENTAR NADA NUEVO ══
 *
 * Una factura en N partes son **N cobros normales**, cada uno con su enlace,
 * su número de conciliación, su comprobante y su validación. Todo eso ya
 * funciona: lo único que se agrega es repartir el monto y numerarlas.
 *
 * Se hace así y no con «pagos parciales» de un solo cobro por una razón
 * concreta: un cobro a medio pagar no se puede conciliar contra el banco —
 * llega una transferencia y nadie sabe si es el abono de esta factura o el
 * pago entero de otra. Con partes, **cada una tiene su propio número** y
 * cuadra sola.
 */

/** Como mucho doce: más partes que meses no es un abono, es un crédito. */
export const MAXIMO_PARTES = 12;

export type ParteDeCobro = {
  /** 1, 2, 3… */
  numero: number;
  total: number;
  montoCentavos: number;
  /** «F-00123 (1/3)» — lo que va en el banco y en la factura del comercio. */
  referencia: string;
};

export function cuantasPartes(valor: unknown): number {
  const n = Math.trunc(Number(valor));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAXIMO_PARTES);
}

/**
 * REPARTIR EL MONTO ENTRE LAS PARTES.
 *
 * En centavos enteros, y **la última absorbe el resto**: $7.475 entre 3 da
 * 2.491,67 + 2.491,67 + 2.491,66. Si se redondeara cada una por su lado, la
 * suma daría un centavo de más o de menos que la factura — y un centavo que
 * no cuadra en una conciliación bancaria cuesta una llamada.
 */
export function repartirEnPartes(
  totalCentavos: number,
  partes: number,
  referenciaBase: string,
): ParteDeCobro[] {
  const cuantas = cuantasPartes(partes);
  if (totalCentavos <= 0) return [];

  const base = Math.floor(totalCentavos / cuantas);
  const resto = totalCentavos - base * cuantas;

  return Array.from({ length: cuantas }, (_, i) => {
    const numero = i + 1;
    /* El resto se reparte de una en una entre las primeras, no todo junto en
       la última: así ninguna parte se aleja más de un centavo de las demás. */
    const monto = base + (i < resto ? 1 : 0);
    return {
      numero,
      total: cuantas,
      montoCentavos: monto,
      referencia:
        cuantas === 1
          ? referenciaBase
          : `${referenciaBase} (${numero}/${cuantas})`,
    };
  });
}

/**
 * EL SIGUIENTE NÚMERO DE FACTURA, A PARTIR DEL ÚLTIMO DEL COMERCIO.
 *
 * El dueño lo pidió después de copiar un número a mano: _«la idea es que el
 * sistema genere el número de factura pertinente, el que vendría»_.
 *
 * **Se respeta la numeración del comercio, no se le impone la nuestra.** Si su
 * último cobro fue `VIG-02497`, el siguiente es `VIG-02498`; si fue `F-00123`,
 * `F-00124`. Se toma el ÚLTIMO grupo de dígitos y se le suma uno, conservando
 * los ceros a la izquierda — que es como numera cualquier talonario.
 *
 * Si el último tiene sufijo de parte —`F-00123 (2/3)`— se ignora: el siguiente
 * es de la factura siguiente, no de la parte siguiente.
 */
export function siguienteReferencia(ultima: string | null | undefined): string {
  const limpia = (ultima ?? "").replace(/\s*\(\d+\/\d+\)\s*$/, "").trim();
  if (!limpia) return "F-00001";

  const encontrado = limpia.match(/^(.*?)(\d+)(\D*)$/);
  if (!encontrado) return `${limpia}-2`;

  const [, antes, digitos, despues] = encontrado;
  const siguiente = String(Number(digitos) + 1).padStart(digitos!.length, "0");
  return `${antes}${siguiente}${despues}`;
}
