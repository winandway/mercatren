/**
 * ¿ESTE COBRO SE PUEDE PAGAR POR ZELLE?
 *
 * ══ POR QUÉ ES UNA DECISIÓN Y NO UN SÍ ══
 *
 * La tarjeta se confirma sola; un Zelle lo valida una persona, y ese trabajo
 * cuesta. Por eso Zelle en los enlaces de cobro es algo que el equipo DA y
 * puede QUITAR, tienda por tienda, y con un monto mínimo: por debajo de él,
 * validar la captura cuesta más de lo que deja el margen.
 *
 * ══ QUIÉN DECIDE QUÉ ══
 *
 *  - `habilitada`: fila en `zelle_cobros_tienda` con el interruptor puesto.
 *    Sin fila, NO hay Zelle: encenderlo es un acto del equipo, no un valor por
 *    defecto que nadie decidió.
 *  - Mínimo: el de la tienda si tiene uno; si no, el general del panel; si no
 *    hay ninguno, el mismo mínimo de Zelle del catálogo — una sola regla de
 *    dinero en todo el sitio, no dos que se desincronizan.
 *  - `receptorConfigurado`: sin `ZELLE_CORREO_RECEPTOR` cargada no se ofrece
 *    Zelle, punto. **Nunca se inventa un correo receptor.**
 *
 * Es puro a propósito: decide sobre valores que le pasan, sin tocar la base,
 * y por eso se puede probar completo.
 */

import { ZELLE_MAXIMO_CENTAVOS, ZELLE_MINIMO_CENTAVOS } from "@/lib/dinero";

export type ConfigZelleCobro = {
  /** ¿El equipo le dio Zelle a esta tienda? */
  habilitada: boolean;
  /** Mínimo propio de la tienda, o null para usar el general. */
  minimoTiendaCentavos: number | null;
  /** Mínimo general del panel, o null si nunca se ha configurado. */
  minimoGlobalCentavos: number | null;
  /** ¿Está cargado ZELLE_CORREO_RECEPTOR? */
  receptorConfigurado: boolean;
  /**
   * Tope general del panel, o null si nunca se ha configurado.
   *
   * Vive en `configuracion` y no en una columna de la tienda a propósito: el
   * límite no es nuestro, es el del banco de quien paga, así que es el mismo
   * para todos los comercios y cambia con el tiempo, no por tienda.
   */
  maximoGlobalCentavos?: number | null;
};

export type DecisionZelle =
  | { disponible: true; minimoCentavos: number; maximoCentavos: number }
  | {
      disponible: false;
      motivo: "sin_receptor" | "no_habilitada" | "monto_bajo" | "monto_alto";
      minimoCentavos: number;
      maximoCentavos: number;
    };

/** El mínimo que aplica, con la cadena de respaldos en un solo sitio. */
export function minimoAplicable(
  config: Pick<
    ConfigZelleCobro,
    "minimoTiendaCentavos" | "minimoGlobalCentavos"
  >,
): number {
  if (
    config.minimoTiendaCentavos !== null &&
    Number.isFinite(config.minimoTiendaCentavos) &&
    config.minimoTiendaCentavos >= 0
  ) {
    return Math.round(config.minimoTiendaCentavos);
  }
  if (
    config.minimoGlobalCentavos !== null &&
    Number.isFinite(config.minimoGlobalCentavos) &&
    config.minimoGlobalCentavos >= 0
  ) {
    return Math.round(config.minimoGlobalCentavos);
  }
  return ZELLE_MINIMO_CENTAVOS;
}

/**
 * EL TOPE QUE APLICA.
 *
 * Cero y los negativos se descartan: un tope en cero apagaría Zelle para todo
 * el mundo sin que ninguna pantalla dijera por qué, y sería el fallo más caro
 * de esta pieza — Zelle es la forma de pago de esta clientela.
 */
export function maximoAplicable(
  config: Pick<ConfigZelleCobro, "maximoGlobalCentavos">,
): number {
  const g = config.maximoGlobalCentavos;
  if (g !== null && g !== undefined && Number.isFinite(g) && g > 0) {
    return Math.round(g);
  }
  return ZELLE_MAXIMO_CENTAVOS;
}

export function decidirZelle(
  config: ConfigZelleCobro,
  montoCentavos: number,
): DecisionZelle {
  const minimoCentavos = minimoAplicable(config);
  const maximoCentavos = maximoAplicable(config);

  /* El orden de los motivos es el orden de las causas: sin receptor no hay
     Zelle para nadie; sin el interruptor, no lo hay para esta tienda; y con
     los dos, manda el monto. Cada motivo le dice al que mira el panel qué
     tendría que cambiar. */
  if (!config.receptorConfigurado) {
    return {
      disponible: false,
      motivo: "sin_receptor",
      minimoCentavos,
      maximoCentavos,
    };
  }
  if (!config.habilitada) {
    return {
      disponible: false,
      motivo: "no_habilitada",
      minimoCentavos,
      maximoCentavos,
    };
  }
  if (montoCentavos < minimoCentavos) {
    return {
      disponible: false,
      motivo: "monto_bajo",
      minimoCentavos,
      maximoCentavos,
    };
  }
  /**
   * ══ EL TOPE VA DESPUÉS DEL MÍNIMO, Y ES DELIBERADO ══
   *
   * Un monto que se pasa del tope NO es un fallo nuestro: es que el banco de
   * quien paga no lo va a dejar mandar de una sola vez. Se comprueba de último
   * porque los otros tres motivos son cosas que se arreglan de este lado —una
   * variable, un interruptor— y este solo se arregla cobrando por otra vía.
   *
   * Y ofrecerlo igual es peor que no ofrecerlo: la persona entra, manda lo que
   * le dejan, la factura queda a medias y hay que corregir el pago a mano. Pasó
   * el 27 de agosto con un cobro de $2.774,04 del que llegaron $500.
   */
  if (montoCentavos > maximoCentavos) {
    return {
      disponible: false,
      motivo: "monto_alto",
      minimoCentavos,
      maximoCentavos,
    };
  }
  return { disponible: true, minimoCentavos, maximoCentavos };
}
