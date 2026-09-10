/**
 * ══ LA BODEGA DE MIAMI ══
 *
 * La dirección la dio Richard el 9 sep 2026. Vive aquí y en la tabla
 * `bodegas_casillero`, y **nunca escrita a mano en una pantalla**: es
 * literalmente el producto, y una dirección vieja repetida en cinco sitios
 * es un paquete que se pierde el día que la bodega cambia de local.
 *
 * La opera **BESTWAY GROUP INTL. CORP.**, que es quien firma el recibo ante
 * UPS y FedEx. Por eso el código del casillero empieza por «BW».
 */

export const BODEGA_MIAMI = {
  id: "bodega-miami",
  codigo: "MIA",
  /** El nombre que va en la etiqueta, encima de la calle. */
  nombre: "BESTWAY GROUP INTL. CORP.",
  linea1: "14329 SW 142nd St",
  ciudad: "Miami",
  estadoUs: "FL",
  zip: "33186",
  pais: "Estados Unidos",
  paisEn: "United States",
  /** Para el mapa. Salen de la ficha que mandó Richard. */
  lat: 25.63627,
  lon: -80.42448,
} as const;

/**
 * ══ LA DIRECCIÓN ES PRIVADA. NO SE PUBLICA NUNCA ══
 *
 * Dictado por Richard el 9 sep 2026, y es la regla que sostiene el sistema
 * entero: _«la dirección tiene que estar oculta… si la gente no crea la
 * cuenta y pone la dirección directamente y nos manda algo, no sabemos de
 * quién es»_. Tiene razón, y es también lo que hacen todos los casilleros
 * del mercado: la dirección se ve **dentro de la cuenta**, nunca antes.
 *
 * El motivo es operativo, no de secretismo: **la dirección sin el código no
 * sirve para nada**. Una caja que llega con la calle correcta y sin código
 * es un huérfano, y averiguar de quién es cuesta más que la caja. Publicar
 * la calle es invitar a que eso pase.
 *
 * Por eso hay dos formas de pedir las líneas: `tapada` (la que se enseña a
 * quien todavía no tiene casillero, con la calle en puntos) y la completa,
 * que solo se dibuja en una pantalla detrás de la sesión.
 */
export type ModoEtiqueta = "completa" | "tapada";

/** Lo que se enseña en vez del dato cuando la dirección va tapada. */
export const TAPADO = "••••••••••••";

/**
 * La etiqueta, línea por línea, tal como se pega en la tienda.
 *
 * ══ POR QUÉ LÍNEA POR LÍNEA Y NO UN BLOQUE ══
 *
 * Copiar el bloque entero y pegarlo en Amazon es la causa número uno de
 * paquetes huérfanos: la tienda mete las cinco líneas en el campo «calle»,
 * la normalización de USPS lo corta, y llega una caja sin código. Cada
 * línea tiene su propio botón de copiar, con el nombre del campo donde va.
 */
export function lineasDeEtiqueta(
  nombreLegal: string,
  codigo: string,
  idioma: "es" | "en" = "es",
  modo: ModoEtiqueta = "completa",
): Array<{ campo: string; valor: string; nota?: string; tapado?: boolean }> {
  const b = BODEGA_MIAMI;
  const es = idioma === "es";
  const oculta = modo === "tapada";
  /* Con la dirección tapada, el código también: sin casillero no hay
     código, y enseñar uno de mentira invita a usarlo. */
  const cod = oculta ? TAPADO : codigo;
  return [
    {
      campo: es ? "Nombre completo" : "Full name",
      valor: `${nombreLegal.toUpperCase()} ${cod}`,
      tapado: oculta,
      nota: es
        ? "Tu nombre y tu código juntos, en el mismo campo."
        : "Your name and your code together, in the same field.",
    },
    {
      campo: es ? "Dirección línea 1" : "Address line 1",
      valor: oculta ? TAPADO : b.linea1,
      tapado: oculta,
    },
    {
      campo: es ? "Dirección línea 2" : "Address line 2",
      valor: cod,
      tapado: oculta,
      nota: es
        ? "Tu código otra vez. Algunas tiendas borran esta línea, por eso también va arriba."
        : "Your code again. Some stores drop this line, which is why it is also above.",
    },
    { campo: es ? "Ciudad" : "City", valor: b.ciudad },
    { campo: es ? "Estado" : "State", valor: b.estadoUs },
    {
      /* El código postal también va tapado: con la calle oculta pero el ZIP
         a la vista, la zona queda señalada y la mitad del cuidado se
         pierde. En público basta «Miami, Florida». */
      campo: es ? "Código postal" : "ZIP code",
      valor: oculta ? TAPADO : b.zip,
      tapado: oculta,
    },
    { campo: es ? "País" : "Country", valor: es ? b.pais : b.paisEn },
  ];
}

/** Un enlace de mapa que funciona en cualquier teléfono. */
export function enlaceDeMapa(): string {
  const b = BODEGA_MIAMI;
  const q = encodeURIComponent(
    `${b.linea1}, ${b.ciudad}, ${b.estadoUs} ${b.zip}`,
  );
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
