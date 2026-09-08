import {
  calcularComisionCentavos,
  COMISION_TARJETA_PB,
  PROCESADOR_FIJO_CENTAVOS,
  PROCESADOR_PORCENTAJE_PB,
} from "@/lib/dinero";

/**
 * DE DÓNDE SALE CADA DÓLAR DE LO QUE EL COMERCIO VA A COBRAR.
 *
 * ══ POR QUÉ SE ENSEÑA SEPARADO ══
 *
 * Lo pidió el dueño y tiene razón: **son dos costos distintos y de dos
 * dueños distintos.** Lo que se lleva Stripe es de un tercero y no lo vemos
 * nunca; lo que se lleva Mercatren es nuestro. Meterlos en un solo número
 * —«comisiones: $65»— hace que el comercio nos atribuya los dos y sienta que
 * cobramos el doble de lo que cobramos.
 *
 * Enseñar los tres renglones cuesta lo mismo y responde la pregunta antes de
 * que la haga.
 *
 * ══ POR QUÉ ES PURO ══
 *
 * Es una cuenta sobre dinero que alguien va a leer para decidir si confía. Se
 * prueba aquí, no en una pantalla.
 */
export type DesgloseDeCobro = {
  /** Lo que pagaron los compradores, sumado. */
  brutoCentavos: number;
  /** Lo que se llevó el procesador de tarjeta. Cero si todo entró por Zelle. */
  procesadorCentavos: number;
  /** El margen de Mercatren. */
  mercatrenCentavos: number;
  /** Lo que le queda al comercio: bruto menos los dos costos. */
  delComercioCentavos: number;
};

/**
 * Reparte una venta entre sus tres partes.
 *
 * `conTarjeta` decide si hay costo de procesador: por Zelle no interviene
 * ninguno, y cobrárselo sería cobrarle un servicio que no se usó.
 *
 * ══ EL RESTO ES DEL COMERCIO, SIEMPRE ══
 *
 * Lo que le queda no se calcula aparte: es la resta. Así los tres números
 * suman el bruto exacto y no aparece un centavo perdido que nadie sabe
 * explicar — que en una pantalla de dinero es lo que rompe la confianza.
 */
export function desglosarCobro(
  brutoCentavos: number,
  conTarjeta: boolean,
  puntosBaseMercatren = COMISION_TARJETA_PB,
): DesgloseDeCobro {
  if (brutoCentavos <= 0) {
    return {
      brutoCentavos: 0,
      procesadorCentavos: 0,
      mercatrenCentavos: 0,
      delComercioCentavos: 0,
    };
  }

  const procesadorCentavos = conTarjeta
    ? calcularComisionCentavos(brutoCentavos, PROCESADOR_PORCENTAJE_PB) +
      PROCESADOR_FIJO_CENTAVOS
    : 0;

  const mercatrenCentavos = calcularComisionCentavos(
    brutoCentavos,
    puntosBaseMercatren,
  );

  return {
    brutoCentavos,
    procesadorCentavos,
    mercatrenCentavos,
    delComercioCentavos: brutoCentavos - procesadorCentavos - mercatrenCentavos,
  };
}

/**
 * Reparte con el margen que DE VERDAD se descontó, sin recalcularlo.
 *
 * ══ POR QUÉ EXISTE (8 sep 2026) ══
 *
 * Zelle pasó del 3 % al 6 %, y los cobros por Zelle guardan su comisión
 * exacta en cada pago (`pagos_zelle.comision_centavos`). Recalcular «el 3 %
 * del bruto» le enseñaría al comercio un margen que no es el suyo: a los
 * pagos viejos les tocó el 3 % y a los nuevos el 6 %, y el margen va a
 * seguir subiendo por tramos. La pantalla de dinero dice lo que pasó, no lo
 * que diría la fórmula de hoy.
 *
 * Con tarjeta se sigue usando `desglosarCobro`: allí el margen no cambió y
 * el costo del procesador es una fórmula de todas formas.
 */
export function desglosarConMargenReal(
  brutoCentavos: number,
  conTarjeta: boolean,
  mercatrenCentavos: number,
): DesgloseDeCobro {
  if (brutoCentavos <= 0) {
    return {
      brutoCentavos: 0,
      procesadorCentavos: 0,
      mercatrenCentavos: 0,
      delComercioCentavos: 0,
    };
  }
  const procesadorCentavos = conTarjeta
    ? calcularComisionCentavos(brutoCentavos, PROCESADOR_PORCENTAJE_PB) +
      PROCESADOR_FIJO_CENTAVOS
    : 0;
  const margen = Math.max(0, Math.min(brutoCentavos, mercatrenCentavos));
  return {
    brutoCentavos,
    procesadorCentavos,
    mercatrenCentavos: margen,
    delComercioCentavos: brutoCentavos - procesadorCentavos - margen,
  };
}

/**
 * Suma varios desgloses en uno.
 *
 * Un comercio cobra por los dos métodos en el mismo mes, y el resumen tiene
 * que decir cuánto se llevó Stripe **en total**, no por venta.
 */
export function sumarDesgloses(partes: DesgloseDeCobro[]): DesgloseDeCobro {
  return partes.reduce<DesgloseDeCobro>(
    (total, p) => ({
      brutoCentavos: total.brutoCentavos + p.brutoCentavos,
      procesadorCentavos: total.procesadorCentavos + p.procesadorCentavos,
      mercatrenCentavos: total.mercatrenCentavos + p.mercatrenCentavos,
      delComercioCentavos: total.delComercioCentavos + p.delComercioCentavos,
    }),
    {
      brutoCentavos: 0,
      procesadorCentavos: 0,
      mercatrenCentavos: 0,
      delComercioCentavos: 0,
    },
  );
}
