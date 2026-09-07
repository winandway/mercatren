/**
 * EL PAÍS DE UN COMERCIO SE GUARDA COMO CÓDIGO, NUNCA COMO LO QUE ESCRIBAN.
 *
 * ══ POR QUÉ EXISTE (7 sep 2026) ══
 *
 * `tiendas.pais_origen` era texto libre con `autocomplete="country-name"`,
 * así que el navegador lo rellenaba con el nombre entero. En producción
 * había SEIS formas distintas del mismo dato: «VE», «Venezuela»,
 * «VENEZUELA», «US», «Estados Unidos», «Chile».
 *
 * El día de la mudanza de Venezuela eso costó caro: la consulta buscaba
 * `= 'VE'` y movió UN comercio de seis. Los otros cinco —Inversiones
 * multiservicios, Brillox Steel, MEGAYES, MAXIUM y Variedades COLOMBIA
 * NEXT— se quedaron en el catálogo de Estados Unidos con sus 69 productos,
 * y nadie se habría enterado hasta que un comprador de Miami intentara que
 * le mandaran un tubo desde Mérida.
 *
 * Y no era solo la mudanza: el archivo que se le manda a Google filtra por
 * este campo, y también lo miran la ficha del producto y el checkout.
 *
 * ══ LA REGLA ══
 *
 * Se normaliza EN EL SERVIDOR, no en el formulario: un desplegable se salta
 * con la consola abierta, y este dato decide en qué país se vende algo.
 * Lo que no se reconoce se deja tal cual —un país que no conocemos no se
 * inventa— pero recortado y en mayúsculas, para que al menos no haya dos
 * formas del mismo texto.
 */

/** Las formas en que la gente y los navegadores escriben cada país. */
const COMO_LO_ESCRIBEN: Record<string, readonly string[]> = {
  VE: [
    "ve",
    "venezuela",
    "república bolivariana de venezuela",
    "republica bolivariana de venezuela",
    "venezuela, rb",
  ],
  US: [
    "us",
    "usa",
    "eeuu",
    "ee.uu.",
    "ee. uu.",
    "estados unidos",
    "estados unidos de américa",
    "estados unidos de america",
    "united states",
    "united states of america",
  ],
  CL: ["cl", "chile"],
  CO: ["co", "colombia"],
  MX: ["mx", "mexico", "méxico"],
  PE: ["pe", "peru", "perú"],
  AR: ["ar", "argentina"],
  EC: ["ec", "ecuador"],
  PA: ["pa", "panama", "panamá"],
  DO: ["do", "republica dominicana", "república dominicana"],
  ES: ["es", "espana", "españa", "spain"],
  BR: ["br", "brasil", "brazil"],
};

/** `Venezuela`, `VENEZUELA`, ` ve ` → `VE`. Lo desconocido se limpia. */
export function codigoDePais(escrito: string | null | undefined): string {
  const limpio = (escrito ?? "").trim();
  if (!limpio) return "";

  const busca = limpio.toLowerCase().replace(/\s+/g, " ");
  for (const [codigo, formas] of Object.entries(COMO_LO_ESCRIBEN)) {
    if (formas.includes(busca)) return codigo;
  }

  /* No se reconoce: se respeta lo que escribieron. Inventarle un código a un
     país que no está en la lista sería peor que dejarlo como está — y el día
     que ese país importe, se agrega aquí. */
  return limpio.length === 2 ? limpio.toUpperCase() : limpio;
}
