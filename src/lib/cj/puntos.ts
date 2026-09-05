/**
 * CJ DA PUNTOS DE API POR DÍA, Y SE ACABAN (3 sep 2026).
 *
 * ══ LO QUE PASÓ ══
 *
 * El dueño mandó la captura de la importación terminada (44.035 productos
 * nuevos) con este aviso de CJ al final:
 *
 *   «Insufficient API points. Used today: 61520, Remaining: 0, Required: 50.
 *    To increase your daily points, grow your CJ transaction amount.»
 *
 * No es que CJ esté caído: es que **nos quedamos sin puntos hasta que se
 * renueven**. Y con eso se paran el afinado, el stock, el flete y la sonda
 * de salud — que es exactamente lo que se veía como «CJ no responde» en el
 * vigilante y como «fallidos» en el afinado, sin decir por qué.
 *
 * ══ POR QUÉ IMPORTA DISTINGUIRLO ══
 *
 * Un proveedor caído se arregla esperando o escribiéndole. Quedarse sin
 * puntos se arregla de otra forma: gastando menos llamadas, o subiendo el
 * volumen de compra con ellos. Y sobre todo, **cuando no quedan puntos hay
 * que DEJAR de llamar**: cada llamada más devuelve el mismo error y gasta
 * nuestro tiempo de reloj sin traer nada.
 */

/** La llave en `configuracion` donde se guarda hasta cuándo no hay puntos. */
export const LLAVE_SIN_PUNTOS = "cj_sin_puntos_hasta";

/** ¿Ese motivo de CJ dice que se acabaron los puntos del día? */
export function esSinPuntos(motivo: string | null | undefined): boolean {
  if (!motivo) return false;
  const t = motivo.toLowerCase();
  return (
    t.includes("insufficient api points") ||
    (t.includes("api points") && t.includes("remaining: 0")) ||
    t.includes("daily points")
  );
}

/** Los puntos que se llevan usados y los que quedan, si el aviso los trae. */
export function puntosDe(motivo: string): {
  usados: number | null;
  quedan: number | null;
} {
  const usados = motivo.match(/used today:\s*(\d+)/i);
  const quedan = motivo.match(/remaining:\s*(\d+)/i);
  return {
    usados: usados?.[1] ? Number(usados[1]) : null,
    quedan: quedan?.[1] ? Number(quedan[1]) : null,
  };
}

/**
 * Hasta cuándo no vale la pena volver a llamar.
 *
 * CJ renueva los puntos en su día natural, y su operación va en horario de
 * China (UTC+8). Se espera hasta la próxima medianoche de allá; si eso ya
 * pasó, una hora, para no quedarse esperando un día entero por un aviso
 * viejo.
 */
export function esperarHasta(ahoraMs: number): number {
  const enChina = ahoraMs + 8 * 3_600_000;
  const dia = 24 * 3_600_000;
  const siguienteMedianoche = (Math.floor(enChina / dia) + 1) * dia;
  const enUtc = siguienteMedianoche - 8 * 3_600_000;
  return Math.max(enUtc, ahoraMs + 3_600_000);
}

/** ¿Sigue en pie la pausa guardada? */
export function sigueSinPuntos(
  guardado: string | null | undefined,
  ahoraMs: number,
): boolean {
  const hasta = Number(guardado);
  return Number.isFinite(hasta) && hasta > ahoraMs;
}

/** Cuántos minutos faltan para volver a intentar. */
export function minutosParaVolver(
  guardado: string | null | undefined,
  ahoraMs: number,
): number {
  const hasta = Number(guardado);
  if (!Number.isFinite(hasta) || hasta <= ahoraMs) return 0;
  return Math.ceil((hasta - ahoraMs) / 60_000);
}

/**
 * LA LLAVE DONDE SE ANOTA CÓMO FUE LA ÚLTIMA LLAMADA DE VERDAD (5 sep 2026).
 *
 * ══ EL HALLAZGO ══
 *
 * `saludDelProveedor()` preguntaba «¿CJ está vivo?» con `/product/list`, que
 * **cuesta 50 PUNTOS** — dos productos y medio afinados, cada vez. Y la
 * llamaban el vigilante cada 20 minutos (3.600 puntos al día) y **CADA
 * visita a `/datos/salud`, que es una página pública**. Midiendo el catálogo
 * ese mismo día yo mismo la consulté sesenta veces: tres mil puntos del
 * dueño gastados en preguntar, no en publicar.
 *
 * ══ LA SALIDA ══
 *
 * El sistema le habla a CJ todo el día —el afinado, el stock, una compra—.
 * Cada una de esas llamadas ya sabe si CJ contestó. Se anota el resultado y
 * la sonda LEE eso: **cero puntos, y encima es un dato más honesto**, porque
 * dice cómo le fue a una llamada del trabajo real y no a una de prueba.
 */
export const LLAVE_ULTIMA_LLAMADA = "cj_ultima_llamada";

/** Cuánto vale lo anotado antes de considerarlo viejo: 30 minutos. */
export const FRESCURA_MS = 30 * 60 * 1000;

export type UltimaLlamada = { ok: boolean; enMs: number };

/** Lee lo anotado. Devuelve null si no hay nada o si ya está viejo. */
export function leerUltimaLlamada(
  guardado: string | null | undefined,
  ahoraMs: number,
): UltimaLlamada | null {
  if (!guardado) return null;
  try {
    const d = JSON.parse(guardado) as Partial<UltimaLlamada>;
    if (typeof d.ok !== "boolean" || typeof d.enMs !== "number") return null;
    /* Un dato de hace horas no dice cómo está CJ AHORA. Se descarta y la
       sonda contesta «sin datos» en vez de inventar un «ok» viejo. */
    if (ahoraMs - d.enMs > FRESCURA_MS) return null;
    return { ok: d.ok, enMs: d.enMs };
  } catch {
    return null;
  }
}

/** Donde se guarda el último aviso de puntos que dio CJ. */
export const LLAVE_PUNTOS = "cj_puntos_del_dia";

export type PuntosDelDia = {
  usados: number;
  quedan: number;
  enMs: number;
};

/**
 * DE CUÁNTO ES EL PRESUPUESTO, Y DE DÓNDE SALE (5 sep 2026).
 *
 * El dueño preguntó qué hay que comprar para que CJ dé más puntos. Su propia
 * documentación dice `50.000 base + 100 por cada dólar de transacciones`,
 * pero **no define qué cuenta como transacción**: si es recargar el saldo o
 * gastarlo en pedidos.
 *
 * Lo resuelve su propio aviso. Cuando CJ dice «Used today: 61520,
 * Remaining: 0», el presupuesto del día fue 61.520, así que las
 * transacciones que le contaron son `(61.520 − 50.000) / 100 = $115,20`. Ese
 * número, puesto al lado de lo que él ve en su panel de CJ, contesta la
 * pregunta sin depender de que nadie nos explique nada.
 */
export function dolaresQueCuentan(usados: number, quedan: number): number {
  const total = usados + Math.max(0, quedan);
  return Math.max(0, (total - PUNTOS_BASE_DE_CJ) / 100);
}

/** Los puntos que CJ regala al día sin comprar nada (su documentación). */
export const PUNTOS_BASE_DE_CJ = 50_000;

/** Lee el último aviso guardado. Null si no hay o si no es de hoy. */
export function leerPuntosDelDia(
  guardado: string | null | undefined,
  ahoraMs: number,
): PuntosDelDia | null {
  if (!guardado) return null;
  try {
    const d = JSON.parse(guardado) as Partial<PuntosDelDia>;
    if (typeof d.usados !== "number" || typeof d.enMs !== "number") return null;
    /* Los puntos se renuevan cada día: uno de anteayer no dice nada de hoy. */
    if (ahoraMs - d.enMs > 24 * 60 * 60 * 1000) return null;
    return { usados: d.usados, quedan: d.quedan ?? 0, enMs: d.enMs };
  } catch {
    return null;
  }
}
