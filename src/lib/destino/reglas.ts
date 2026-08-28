/**
 * A DÓNDE SE ENTREGA CADA COSA.
 *
 * ══ LA PREGUNTA ESTABA MAL HECHA ══
 *
 * El encabezado decía «¿Dónde estás? Elige tu ciudad», y esa pregunta no tiene
 * respuesta útil: **quien compra está en Miami y la entrega es en Maracaibo**.
 * Preguntar por la ubicación de la persona da siempre el dato equivocado.
 *
 * La pregunta correcta es **«¿A dónde lo enviamos?»**. Con eso, el comprador
 * venezolano sigue estando en Estados Unidos y todo cuadra.
 *
 * ══ NUNCA SE ADIVINA POR LA CONEXIÓN ══
 *
 * Es la regla que manda sobre las demás. **El 100% de los compradores de
 * Venezuela navegan desde Estados Unidos**, así que detectar por IP le daría
 * exactamente el catálogo equivocado a toda la clientela actual. Se elige a
 * mano, se recuerda, y se puede cambiar siempre desde arriba.
 *
 * ══ EL DESTINO SALE DEL PAÍS DE LA TIENDA, NO DE UNA COLUMNA NUEVA ══
 *
 * Todo producto cuelga de una tienda —`tiendaId` es obligatorio— y toda tienda
 * ya declara su `paisOrigen`. Así que el destino de un producto **ya está en la
 * base**: es el país de quien lo despacha.
 *
 * Eso evita una columna nueva, que en este proyecto es un problema real:
 * `schema.sql` solo trae `CREATE TABLE IF NOT EXISTS`, así que una columna
 * nueva NO llega sola a producción y habría que aplicarla a mano contra la base
 * en vivo.
 *
 * El catálogo de Estados Unidos cuelga de una tienda interna nuestra —Mercatren
 * LLC es quien vende y factura allá—, y eso además es lo que Google Merchant
 * Center necesita: **un solo vendedor responsable**, con una política de envío
 * y una de devoluciones, no un mercado de terceros que habría que demostrar
 * tienda por tienda.
 */

/**
 * Los destinos que existen hoy.
 *
 * CL y CO entraron el 27 ago 2026 con las plazas de mercatren.cl y
 * mercatren.com.co: allá también se despacha a domicilio, con sus propios
 * campos de dirección (regiones en Chile, departamentos en Colombia).
 */
export const DESTINOS = ["US", "VE", "CL", "CO"] as const;
export type Destino = (typeof DESTINOS)[number];

/**
 * A dónde se entrega, por defecto, quien llega sin haber elegido.
 *
 * Estados Unidos, y no es arbitrario: es lo que Google indexa y lo que busca
 * quien llega de una búsqueda. La clientela de Venezuela llega por enlace
 * directo —WhatsApp, la ficha de su comercio— y ese enlace ya trae el destino
 * puesto (ver `destinoDelContenido`).
 */
export const DESTINO_POR_DEFECTO: Destino = "US";

export function esDestino(valor: unknown): valor is Destino {
  return typeof valor === "string" && DESTINOS.includes(valor as Destino);
}

/**
 * El destino guardado, o el de por defecto.
 *
 * Cualquier cosa que no reconozcamos cae en el de por defecto en vez de romper:
 * una cookie vieja o manipulada no puede dejar a nadie con la pantalla en
 * blanco.
 */
export function destinoElegido(guardado: string | null | undefined): Destino {
  return esDestino(guardado) ? guardado : DESTINO_POR_DEFECTO;
}

/**
 * EL DESTINO DE UN PRODUCTO ES EL PAÍS DE SU TIENDA.
 *
 * `paisOrigen` puede venir en minúsculas o con espacios según quién cargó la
 * tienda, así que se normaliza. Lo que no sea Estados Unidos se entrega en
 * Venezuela, que es de donde despachan todos los comercios de hoy.
 */
export function destinoDeLaTienda(
  paisOrigen: string | null | undefined,
): Destino {
  const pais = (paisOrigen ?? "").trim().toUpperCase();
  /* Chile y Colombia son plazas de despacho propio, como EE. UU. Lo que no
     sea ninguna de las tres se entrega en Venezuela, que es de donde
     despachan todos los comercios de hoy. */
  if (pais === "US" || pais === "CL" || pais === "CO") return pais;
  return "VE";
}

/**
 * EL DESTINO SIGUE AL CONTENIDO QUE SE ABRIÓ.
 *
 * Si alguien abre un producto de Bley o la ficha de su tienda, es obvio lo que
 * está mirando: se cambia solo a Venezuela. Es lo que hace que la clientela de
 * siempre —que llega por un enlace de WhatsApp— nunca caiga en el catálogo
 * equivocado, sin tener que explicarle nada.
 *
 * Devuelve `null` cuando la página no habla de un país concreto (la portada, el
 * carrito): ahí manda lo que la persona haya elegido.
 */
export function destinoDelContenido(
  paisDeLoQueSeAbrio: string | null | undefined,
): Destino | null {
  if (!paisDeLoQueSeAbrio) return null;
  return destinoDeLaTienda(paisDeLoQueSeAbrio);
}

/**
 * ¿SE PUEDEN LLEVAR ESTAS DOS COSAS EN EL MISMO CARRITO?
 *
 * No: un taladro de un almacén de Texas y un tubo de PVC de Maracaibo no caben
 * en la misma caja ni los despacha la misma persona. Un carrito mezclado sería
 * un pedido imposible de cumplir, y se descubriría al final, después de pagar.
 */
export function cabenJuntos(a: Destino, b: Destino): boolean {
  return a === b;
}

/** Cuánto tarda cada uno, para poder decirlo antes de que pregunten. */
export const PLAZO: Record<Destino, { minimo: number; maximo: number }> = {
  US: { minimo: 2, maximo: 5 },
  /* Venezuela lo pone cada comercio en su política de envío; aquí no se
     promete un plazo que no es nuestro. */
  VE: { minimo: 0, maximo: 0 },
  /* Chile y Colombia: envío internacional de CJ. El rango es CONSERVADOR a
     propósito — prometer «2 a 5» sin haberlo medido es un reclamo por venta.
     Se ajusta con lo que midan las compras de prueba, no antes. */
  CL: { minimo: 10, maximo: 25 },
  CO: { minimo: 10, maximo: 25 },
};

export function tienePlazoPropio(destino: Destino): boolean {
  return PLAZO[destino].maximo > 0;
}

/** El nombre del país de un destino, para la dirección que lee una persona. */
export function nombreDelPais(destino: Destino): string {
  return { US: "United States", VE: "Venezuela", CL: "Chile", CO: "Colombia" }[
    destino
  ];
}
