import { repartoDelCobro } from "@/lib/cobros/reparto";

/**
 * CORREGIR EL MONTO DE UN PAGO QUE NO ENTRÓ POR LO QUE DECÍA.
 *
 * ══ EL CASO REAL (27 ago 2026) ══
 *
 * Un cobro de $2.774,04 recibió $500,00. Quien pagaba se equivocó de monto y
 * la captura, que es legítima, dice quinientos. El neto del pago se había
 * calculado al subir la captura **desde lo que pedía el cobro**, así que
 * aprobarlo le acreditaba al comercio $2.690,82 por un dinero que nunca llegó.
 *
 * Este archivo es puro: son las reglas, sin base y sin sesión, para poder
 * probarlas de verdad. Aquí un error cuesta dinero de la cuenta.
 */

/** Qué se le pide al validador para corregir un pago. */
export type PeticionDeCorreccion = {
  /** Lo que el pago dice hoy. */
  montoDeclaradoCentavos: number;
  /** Lo que de verdad entró, leído de la captura y comprobado en el banco. */
  montoRealCentavos: number;
  /** Por qué. Obligatorio. */
  motivo: string;
};

export type FalloDeCorreccion =
  "montoInvalido" | "montoIgual" | "montoMayorQueElDeclarado" | "sinMotivo";

export type CorreccionCalculada = {
  montoCentavos: number;
  comisionCentavos: number;
  netoCentavos: number;
  motivo: string;
  /** Cuánto dinero se dejó de acreditar respecto de lo declarado. */
  diferenciaCentavos: number;
};

/**
 * EL MOTIVO TIENE QUE DECIR QUÉ PASÓ, NO SOLO QUE PASÓ ALGO.
 *
 * Quince caracteres, y no diez, porque lo destapó su propia prueba: con diez
 * pasaba «se equivocó», que dentro de seis meses no le explica nada a nadie —
 * ni al comercio que pregunta por qué le entraron quinientos, ni a quien tenga
 * que revisar esto. Cualquier explicación de verdad («transfirió 500 en vez de
 * 2.774») los pasa de sobra.
 *
 * Tampoco se sube más: un validador que no puede guardar escribe «aaaaaaaaaa»,
 * y un motivo de relleno es peor que uno corto y honesto.
 */
const MOTIVO_MINIMO = 15;
const MOTIVO_MAXIMO = 500;

/**
 * Revisa y recalcula. Devuelve el fallo, nunca lanza.
 *
 * ══ CUATRO REGLAS QUE NO SE TOCAN ══
 *
 * 1. **El monto real nunca puede ser MAYOR que el declarado.** Si alguien pagó
 *    de más, eso no se acredita: se le devuelve. Acreditar de más sería regalar
 *    dinero de Mercatren por el camino contrario al que abrió este agujero, y
 *    encima dejaría al comercio cobrando algo que su factura no dice.
 * 2. **Cero no es una corrección, es un rechazo.** Un pago por el que no entró
 *    nada se rechaza con su motivo, que es lo que le avisa al pagador. Dejarlo
 *    aprobado en cero deja un pago «bueno» que no movió un centavo.
 * 3. **El motivo es obligatorio y con contenido.** Un monto cambiado a mano sin
 *    explicación no se puede defender el día que el comercio pregunte por qué
 *    le entraron quinientos y no dos mil setecientos.
 * 4. **La comisión se recalcula sobre lo que ENTRÓ**, con la misma fórmula del
 *    cobro. Dejarla como estaba le cobraría al comercio el 3 % de un dinero que
 *    nunca llegó.
 */
export function revisarCorreccion(
  p: PeticionDeCorreccion,
  metodo: "zelle" | "transferencia" | "tarjeta" = "zelle",
):
  | { ok: true; datos: CorreccionCalculada }
  | { ok: false; aviso: FalloDeCorreccion } {
  const real = Math.trunc(p.montoRealCentavos);

  if (!Number.isFinite(real) || real <= 0) {
    return { ok: false, aviso: "montoInvalido" };
  }
  if (real > p.montoDeclaradoCentavos) {
    return { ok: false, aviso: "montoMayorQueElDeclarado" };
  }
  if (real === p.montoDeclaradoCentavos) {
    return { ok: false, aviso: "montoIgual" };
  }

  const motivo = p.motivo.trim();
  if (motivo.length < MOTIVO_MINIMO) return { ok: false, aviso: "sinMotivo" };

  /* La MISMA fórmula del cobro: el procesador primero, el margen después, el
     resto del comercio. Escribir aquí otra cuenta las separa al primer
     arreglo que alguien haga en una sola. */
  const reparto = repartoDelCobro(real, metodo);

  return {
    ok: true,
    datos: {
      montoCentavos: real,
      comisionCentavos: reparto.margen + reparto.procesador,
      netoCentavos: reparto.recibeElComercio,
      motivo: motivo.slice(0, MOTIVO_MAXIMO),
      diferenciaCentavos: p.montoDeclaradoCentavos - real,
    },
  };
}

/**
 * ¿Este pago alcanza para dar por cobrada la factura?
 *
 * **La respuesta manda sobre si el cobro se cierra o no**, y es la diferencia
 * entre una factura cobrada y una que sigue debiendo. Un cobro que recibió
 * menos de lo que pide **se queda abierto**: cerrarlo diría que está pagado y
 * el comercio dejaría de reclamar un dinero que sí le deben.
 */
export function alcanzaParaCerrar(
  montoRecibidoCentavos: number,
  montoDelCobroCentavos: number,
): boolean {
  return montoRecibidoCentavos >= montoDelCobroCentavos;
}
