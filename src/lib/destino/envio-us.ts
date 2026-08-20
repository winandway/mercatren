/**
 * CUÁNTO ENVÍO SE METE EN EL PRECIO DE UN PRODUCTO DE ESTADOS UNIDOS.
 *
 * ══ EL FALLO QUE ESTO CIERRA ══
 *
 * Hasta el 19 ago 2026, publicar un producto de CJ llamaba a
 * `desglosarUs(costo, 0)`. Ese cero es el envío. En la pantalla del buscador
 * está bien —ahí se enseña un precio mínimo y la pantalla lo dice—, pero es el
 * MISMO cálculo que se guardaba al publicar, y ahí ya no es una estimación:
 * es el precio que paga el comprador.
 *
 * Medido con la primera compra real (MT-000004): el envío costó **$1.57**. Con
 * el 30 % declarado, un producto que debía dejar $3.09 dejaba **$0.82**. No se
 * perdía dinero, pero se ganaba un tercio de lo previsto — y no aparecía en
 * ninguna pantalla.
 *
 * ══ LA REGLA QUE MANDA: EL RESPALDO NUNCA ES CERO ══
 *
 * Cotizar contra el proveedor puede fallar: se cae su API, el producto no
 * tiene variantes, la ruta no responde. La tentación es volver a cero «porque
 * es lo que había antes». **Cero es exactamente el fallo**, y encima es el más
 * caro de los dos errores posibles:
 *
 *  - Cobrar de más por un envío que salió barato: se vende un poco menos.
 *  - Cobrar de menos: se regala el margen en cada venta, para siempre, en
 *    silencio.
 *
 * Por eso, cuando no se puede cotizar, se usa un estimado conservador y se
 * MARCA como estimado, para poder volver a mirarlo. Nunca cero.
 */

/**
 * Lo que se asume cuando el proveedor no cotiza.
 *
 * Sale de la única medición real que hay (MT-000004: $1.57) redondeada hacia
 * arriba con margen. No es un número inventado ni un promedio de nada: es «lo
 * que costó la vez que se midió, más un colchón», que es lo honesto mientras
 * no haya más mediciones.
 *
 * **Se sube en cuanto haya tres o cuatro compras medidas**, que es lo que pide
 * el paso A1 del plan. Un estimado con una sola medición detrás es mejor que
 * cero y peor que la verdad.
 */
export const ENVIO_ESTIMADO_CENTAVOS = 350;

export type OrigenDelEnvio = "cotizado" | "estimado";

export type EnvioDelProducto = {
  costoCentavos: number;
  origen: OrigenDelEnvio;
  transporte: string | null;
};

/**
 * Qué envío se usa, dado lo que haya contestado el proveedor.
 *
 * Puro a propósito: aquí es donde un error cuesta dinero en cada venta, así
 * que tiene que poder probarse entero sin llamar a nadie.
 */
export function envioAUsar(cotizacion: {
  costoCentavos?: number | null;
  transporte?: string | null;
}): EnvioDelProducto {
  const costo = cotizacion.costoCentavos;

  /* Un cero cotizado NO se toma por bueno. Ningún transportista lleva nada
     gratis: un cero significa que la respuesta vino vacía o mal leída, y
     tomarlo por bueno reproduce exactamente el fallo que esto viene a cerrar. */
  if (typeof costo === "number" && Number.isFinite(costo) && costo > 0) {
    return {
      costoCentavos: Math.round(costo),
      origen: "cotizado",
      transporte: cotizacion.transporte?.trim() || null,
    };
  }

  return {
    costoCentavos: ENVIO_ESTIMADO_CENTAVOS,
    origen: "estimado",
    transporte: null,
  };
}

/**
 * ¿Este precio se armó sin envío?
 *
 * El candado del paso A5: sirve para que una prueba pueda ponerse roja si
 * alguien vuelve a publicar con el envío en cero, y para marcar en el panel
 * los que se publicaron antes de este arreglo.
 */
export function precioSinEnvio(costoEnvioCentavos: number | null): boolean {
  return costoEnvioCentavos === null || costoEnvioCentavos <= 0;
}
