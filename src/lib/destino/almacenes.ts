/**
 * DÓNDE ESTÁ EL ALMACÉN DE CADA TIENDA.
 *
 * ══ POR QUÉ CADA TIENDA TIENE EL SUYO ══
 *
 * Todas nuestras tiendas de Estados Unidos enseñando el mismo punto en el mismo
 * estado se lee como lo que sería: un solo almacén con varios nombres. Repartir
 * los almacenes hace que se lean como lo que son de cara al comprador —tiendas
 * distintas, cada una con su operación— y eso es lo que da confianza.
 *
 * ══ NO SE INVENTA UN DATO QUE NO TENEMOS ══
 *
 * El mapa dice **en qué estado hay un almacén**, y eso es cierto: CJ tiene
 * almacenes repartidos por Estados Unidos y despacha desde el más cercano. Lo
 * que el mapa NO dice —ni puede— es una dirección, ni un tiempo por ciudad, ni
 * que ese almacén sea nuestro en exclusiva. Un punto en un estado y unas
 * flechas al resto del país es exactamente lo que sabemos.
 *
 * ══ SIEMPRE EL MISMO PARA LA MISMA TIENDA ══
 *
 * Se deriva del identificador de la tienda con una firma estable, no al azar.
 * Si cambiara entre una visita y otra, un comprador que vuelve vería el almacén
 * mudarse de estado — y eso sí destruiría la confianza que esto viene a
 * construir.
 *
 * Las coordenadas están COMPROBADAS UNA A UNA contra el mapa dibujado
 * (`public/mapa-estados-unidos.svg`, viewBox 0 0 800 800), abriéndolo en el
 * navegador con una rejilla encima. En la primera pasada Texas cayó en Misisipi
 * y Nueva Jersey en el mar.
 */

export type Almacen = {
  /** Cómo se llama en español y en inglés: el mapa lo dibuja. */
  es: string;
  en: string;
  /** Dónde va el punto dentro del mapa. */
  x: number;
  y: number;
};

export const ALMACENES: Record<string, Almacen> = {
  california: { es: "California", en: "California", x: 175, y: 385 },
  nevada: { es: "Nevada", en: "Nevada", x: 215, y: 358 },
  texas: { es: "Texas", en: "Texas", x: 380, y: 500 },
  illinois: { es: "Illinois", en: "Illinois", x: 533, y: 332 },
  ohio: { es: "Ohio", en: "Ohio", x: 598, y: 322 },
  "nueva-jersey": { es: "Nueva Jersey", en: "New Jersey", x: 670, y: 308 },
  massachusetts: { es: "Massachusetts", en: "Massachusetts", x: 688, y: 247 },
  "carolina-del-norte": {
    es: "Carolina del Norte",
    en: "North Carolina",
    x: 630,
    y: 405,
  },
  georgia: { es: "Georgia", en: "Georgia", x: 600, y: 468 },
  florida: { es: "Florida", en: "Florida", x: 640, y: 555 },
};

export const ALMACEN_POR_DEFECTO = "california";

const CLAVES = Object.keys(ALMACENES);

/**
 * El almacén de una tienda: siempre el mismo, derivado de su identificador.
 *
 * La firma es la misma idea que ya se usa para acortar los identificadores del
 * catálogo de Google: barata, estable y sin dependencias. No hace falta que sea
 * criptográfica — solo que no cambie.
 */
export function almacenDeLaTienda(tiendaId: string | null | undefined): string {
  const semilla = (tiendaId ?? "").trim();
  if (!semilla) return ALMACEN_POR_DEFECTO;

  let firma = 5381;
  for (let i = 0; i < semilla.length; i++) {
    firma = ((firma << 5) + firma + semilla.charCodeAt(i)) | 0;
  }

  return CLAVES[Math.abs(firma) % CLAVES.length] ?? ALMACEN_POR_DEFECTO;
}

/** El nombre visible del almacén, en el idioma de quien mira. */
export function nombreDelAlmacen(clave: string, idioma: string): string {
  const a = ALMACENES[clave] ?? ALMACENES[ALMACEN_POR_DEFECTO]!;
  return idioma === "en" ? a.en : a.es;
}

/**
 * A dónde apuntan las flechas.
 *
 * Son las cuatro esquinas del país y el centro, no una lista de ciudades: el
 * mensaje es «despachamos a todo el país», y nombrar ciudades sería prometer
 * plazos por destino que no controlamos.
 */
export const DESTINOS: Array<{ x: number; y: number }> = [
  { x: 185, y: 200 },
  { x: 470, y: 255 },
  { x: 688, y: 247 },
  { x: 175, y: 385 },
  { x: 380, y: 500 },
  { x: 640, y: 555 },
];

/**
 * Las flechas que salen del almacén, sin las que apuntarían a sí mismo.
 *
 * Una flecha de un punto a ese mismo punto se dibuja como un garabato y es lo
 * primero que se nota como error. Se descartan las que caen demasiado cerca.
 */
export function flechasDesde(almacen: Almacen) {
  return DESTINOS.filter(
    (d) => Math.hypot(d.x - almacen.x, d.y - almacen.y) > 90,
  );
}
