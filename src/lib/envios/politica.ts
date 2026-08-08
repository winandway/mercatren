/**
 * LA POLÍTICA DE ENVÍO DE CADA COMERCIO.
 *
 * Parte pura: no toca la base ni la sesión. Vive aparte para poder probarla,
 * igual que `alcance.ts` y `cupo.ts` — aquí se calcula dinero que el comprador
 * paga de verdad, así que no puede estar mezclado con consultas.
 *
 * ══ DE DÓNDE SALE ESTO (7 ago 2026) ══
 *
 * Hasta hoy el sitio decía "todo se retira en el depósito, no hacemos entregas
 * a domicilio", igual para todos. Y no es cierto: hay comercios que despachan a
 * todo el país y para ellos ese texto les está quitando ventas.
 *
 * ══ LOS CUATRO ESTADOS, Y POR QUÉ SON CUATRO Y NO DOS ══
 *
 *   · `sin_definir` — el comercio todavía no dijo nada. **No es lo mismo que
 *     "no envía"**, y confundirlos es el error que hay que evitar: si a un
 *     comercio que sí despacha le ponemos "solo retiro en el local", le
 *     estamos mintiendo a su comprador. En su ficha se enseña
 *     "aún no especificado por el vendedor", que además es el empujón para que
 *     entre a completarlo.
 *   · `solo_retiro` — lo dijo: se busca en su local.
 *   · `porcentaje` — despacha y cobra un % sobre el precio del producto.
 *   · `incluido` — despacha y no cobra aparte: ya está en el precio.
 *
 * ══ POR QUÉ PORCENTAJE Y NO UNA TARIFA FIJA ══
 *
 * Lo pidió el dueño y encaja con cómo se despacha en Venezuela: el flete lo
 * cobra el transporte según el bulto, y el comercio lo estima como una
 * proporción de lo que vende. Una tarifa fija obligaría a cada comercio a
 * mantener una tabla por zona y por peso — y no la va a mantener nadie.
 *
 * El porcentaje va en PUNTOS BASE, como todas las comisiones del proyecto:
 * 400 = 4 %. Nada de decimales.
 */

export const MODOS_ENVIO = [
  "sin_definir",
  "solo_retiro",
  "porcentaje",
  "incluido",
] as const;

export type ModoEnvio = (typeof MODOS_ENVIO)[number];

export type PoliticaEnvio = {
  modo: ModoEnvio;
  /** Solo cuenta cuando el modo es `porcentaje`. 400 = 4 %. */
  porcentajePuntosBase: number;
};

/** Lo que se asume de un comercio que todavía no configuró nada. */
export const POLITICA_POR_DEFECTO: PoliticaEnvio = {
  modo: "sin_definir",
  porcentajePuntosBase: 0,
};

/**
 * TOPE DEL PORCENTAJE: 50 %.
 *
 * No es desconfianza al comercio: es que un dedo de más convierte un 4 % en un
 * 40 % y el comprador lo ve como un cobro absurdo en el checkout. Medio precio
 * del producto es ya un flete carísimo; cualquier cosa por encima es un error
 * de tecleo, no una tarifa.
 */
export const PORCENTAJE_MAXIMO_PB = 5_000;

/** Si el comercio despacha, sea cobrando o no. */
export function despacha(politica: PoliticaEnvio): boolean {
  return politica.modo === "porcentaje" || politica.modo === "incluido";
}

/**
 * Lo que cuesta enviar un subtotal.
 *
 * REDONDEO HACIA ARRIBA, al centavo. Es el mismo criterio del resto del
 * proyecto: el centavo suelto queda del lado del que asume el costo, nunca en
 * contra. Y en enteros, sin coma flotante, que pierde centavos.
 */
export function costoEnvioCentavos(
  politica: PoliticaEnvio,
  subtotalCentavos: number,
): number {
  if (politica.modo !== "porcentaje") return 0;
  if (subtotalCentavos <= 0) return 0;

  const pb = acotarPorcentaje(politica.porcentajePuntosBase);
  if (pb <= 0) return 0;

  return Math.ceil((subtotalCentavos * pb) / 10_000);
}

/**
 * Deja el porcentaje dentro de lo posible.
 *
 * Se acota AQUÍ además de en el formulario porque el formulario se lo salta
 * cualquiera, y porque un valor viejo guardado antes de poner el tope tiene
 * que seguir comportándose bien.
 */
export function acotarPorcentaje(puntosBase: number): number {
  if (!Number.isFinite(puntosBase)) return 0;
  const entero = Math.floor(puntosBase);
  if (entero < 0) return 0;
  return Math.min(entero, PORCENTAJE_MAXIMO_PB);
}

/** El porcentaje como se escribe en pantalla: 400 → "4". */
export function porcentajeVisible(puntosBase: number): string {
  const pb = acotarPorcentaje(puntosBase);
  const entero = Math.trunc(pb / 100);
  const decimales = pb % 100;
  if (decimales === 0) return String(entero);
  // Sin ceros a la derecha: 450 → "4.5", 405 → "4.05".
  return `${entero}.${String(decimales).padStart(2, "0")}`.replace(/0$/, "");
}

/** De lo que escribe una persona ("4", "4.5") a puntos base. */
export function porcentajeAPuntosBase(texto: string): number {
  const limpio = texto.replace(",", ".").trim();
  const numero = Number.parseFloat(limpio);
  if (!Number.isFinite(numero) || numero < 0) return 0;
  return acotarPorcentaje(Math.round(numero * 100));
}

export type FormaDeEntrega = "retiro" | "envio";

/**
 * Qué formas de entrega puede elegir el comprador en este comercio.
 *
 * EL RETIRO SIEMPRE ESTÁ. Aunque el comercio despache, el comprador puede
 * preferir ir a buscarlo — y entonces no paga flete. Quitarle esa opción sería
 * cobrarle un envío que no pidió.
 */
export function entregasDisponibles(politica: PoliticaEnvio): FormaDeEntrega[] {
  return despacha(politica) ? ["retiro", "envio"] : ["retiro"];
}

/**
 * La clave de traducción con la que se le cuenta al público.
 *
 * Devuelve la clave y no la frase porque esto corre también en el navegador,
 * donde no se sabe el idioma. Mismo criterio que los avisos de los campos.
 */
export function claveDeAviso(politica: PoliticaEnvio): string {
  switch (politica.modo) {
    case "porcentaje":
      return "envio.conCosto";
    case "incluido":
      return "envio.incluido";
    case "solo_retiro":
      return "envio.soloRetiro";
    default:
      return "envio.sinDefinir";
  }
}
