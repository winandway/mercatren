/**
 * QUIÉN SE GASTA LOS PUNTOS DE CJ (4 sep 2026).
 *
 * ══ EL HALLAZGO ══
 *
 * CJ no cobra por llamada: cobra por PUNTOS, y su documentación los pone por
 * endpoint. Los dos que usamos valen 10 cada uno:
 *
 *   /product/variant/query    10 puntos  ← tallas y stock
 *   /logistic/freightCalculate 10 puntos ← el envío real
 *
 * Y da **50.000 puntos al día** a todo el mundo, más **100 por cada dólar**
 * comprado (sobre el mes de mayor compra de los últimos tres). Con los ~$135
 * cargados eso son ~63.500 puntos, y medido el 4 sep el afinado hizo 3.178
 * productos: 3.178 × 20 = 63.560. La fórmula cuadra con la realidad.
 *
 * ══ LO QUE ESTABA MAL ══
 *
 * El refresco de stock usa **la misma llamada de 10 puntos** y corría **2 por
 * latido**, con el sitio latiendo cada minuto: unas 3.100 llamadas al día,
 * **31.000 puntos — la mitad del día entero**. Y no publica ni un producto:
 * solo actualiza el stock de los que YA están a la venta.
 *
 * Mientras hay 44.850 esperando salir, cada punto gastado ahí es un producto
 * que no se publica.
 *
 * ══ POR QUÉ SE PUEDE BAJAR SIN RIESGO ══
 *
 * El stock de la ficha no es lo que protege la venta: **el checkout le
 * pregunta a CJ antes de cobrar, y sin respuesta no cobra** (regla del 3 sep).
 * Un stock de ayer hace que la ficha diga «quedan 5» de más; no vende algo
 * que no existe.
 *
 * Y el afinado refresca el stock de cada producto que toca, así que los
 * 44.850 de la cola llegan con su stock del día.
 *
 * ══ LO QUE NO SE HACE, Y ES DELIBERADO ══
 *
 * No se apaga el refresco. Un producto publicado cuyo stock no se mira nunca
 * se queda diciendo «quedan 5» para siempre, y aunque el checkout lo atrape,
 * la ficha estaría mintiendo. Se espacia, no se apaga.
 */

/** Cuántos productos de stock mira un latido cuando NO hay cola. */
export const STOCK_POR_LATIDO = 2;

/** Con cola pendiente, se mira uno cada tantos minutos. */
export const MINUTOS_ENTRE_STOCK = 15;

/**
 * Cuánta cola de afinado basta para que el stock ceda sus puntos. Por debajo
 * de esto la cola se termina en horas y no hace falta quitarle nada a nadie.
 */
export const COLA_QUE_MANDA = 500;

/**
 * Cuántos productos de stock mirar en ESTE latido.
 *
 * @param pendientesPorAfinar cuántos esperan su envío real
 * @param minutoDelDia        para espaciar sin guardar estado en ningún lado
 */
export function cuantosDeStock(
  pendientesPorAfinar: number,
  minutoDelDia: number,
  cjSinPuntos = false,
): number {
  /* ══ SIN PUNTOS NO SE LLAMA A CJ, NI PARA EL STOCK (5 sep 2026) ══
     Se vio en producción a la primera: con el afinado en pausa por falta de
     puntos, el stock seguía pidiendo sus dos por latido — la MISMA API, sin
     puntos, así que eran llamadas que fallan. Y al día siguiente los primeros
     puntos del día se los llevaba el refresco en vez del afinado. */
  if (cjSinPuntos) return 0;
  if (pendientesPorAfinar < COLA_QUE_MANDA) return STOCK_POR_LATIDO;
  /* Con cola: uno cada quince minutos. Son ~96 llamadas al día (960 puntos,
     un 1,5 % del presupuesto) en vez de 3.100. */
  return minutoDelDia % MINUTOS_ENTRE_STOCK === 0 ? 1 : 0;
}

/** Lo que se libera al día, para poder decirlo en el panel y en el reporte. */
export function puntosLiberadosAlDia(latidosPorDia: number): number {
  const antes = latidosPorDia * STOCK_POR_LATIDO;
  const despues = Math.round((latidosPorDia / MINUTOS_ENTRE_STOCK) * 1);
  return Math.max(0, (antes - despues) * 10);
}

/* ══ LA FÓRMULA DE CJ, QUE ES LA QUE MARCA EL RITMO DE VERDAD ══
   Su documentación: 50.000 puntos al día para todos, más 100 por cada dólar
   comprado (el mes MAYOR de los últimos tres). Afinar cuesta 20 (las tallas
   10 + el flete 10), y no se puede bajar: el listado no trae variantes y no
   se pueden pedir varias de una vez.

   Comprobado contra la realidad el 4 sep 2026: con ~$135 cargados el afinado
   hizo 3.178 productos, y 63.500 / 20 = 3.175. */

/** Los puntos que CJ regala cada día, sin comprar nada. */
export const PUNTOS_BASE_AL_DIA = 50_000;
/** Puntos extra por cada dólar comprado, según su tabla. */
export const PUNTOS_POR_DOLAR = 100;
/** Lo que cuesta afinar un producto: variantes (10) + flete (10). */
export const PUNTOS_POR_PRODUCTO = 20;

/**
 * Cuántos productos se pueden afinar al día.
 *
 * Es el número honesto para el panel. El anterior —40 por vuelta × 96 vueltas
 * = 3.840— salía de NUESTRO reloj, que va sobrado: quien pone el techo es CJ.
 * Prometer una cifra que no se cumple hace que el dueño mire el conteo cuatro
 * días seguidos preguntándose qué está roto.
 */
export function productosPorDia(dolaresComprados = 0): number {
  const puntos =
    PUNTOS_BASE_AL_DIA + Math.max(0, dolaresComprados) * PUNTOS_POR_DOLAR;
  return Math.floor(puntos / PUNTOS_POR_PRODUCTO);
}
