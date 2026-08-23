/**
 * DÓNDE ESTÁ LA MERCANCÍA, Y QUÉ TAN LEJOS LE QUEDA A QUIEN COMPRA.
 *
 * HOY MERCATREN NO LLEVA NADA A DOMICILIO. Esto es ferretería: láminas de
 * zinc, tubos de seis metros, cabilla. Mover eso pide un camión, y camión no
 * hay. El precio que se publica es el precio de retirarlo EN EL DEPÓSITO
 * donde está — y eso hay que decírselo al cliente antes de que pague, no
 * después.
 *
 * EL MAPA ES LA DIVISIÓN REAL DE VENEZUELA (src/lib/entrega/venezuela.ts):
 * 24 estados con sus ciudades oficiales. El cliente elige estado → ciudad.
 * La primera versión era una lista plana de pueblos escrita a mano y el
 * dueño la mandó a rehacer: con la división real, cuando un comercio de
 * cualquier ciudad del país abra su tienda, su ciudad ya existe aquí.
 *
 * Las zonas NO son una barrera: son un aviso. Nadie tiene prohibido comprar
 * algo que está lejos; el que compra decide si puede llegar. Lo único que no
 * se vale es que se entere después.
 *
 *   aqui   → está en tu misma ciudad. Pasas y lo recoges.
 *   cerca  → está en tu estado o en un pueblo vecino, a un rato en carro.
 *   lejos  → está a horas. Se compra igual, pero avisando fuerte.
 *
 * Cuando exista el reparto —con mototaxis o apps de delivery, y solo para
 * cosas chicas— esto crece con un estado más. Está anotado en PLAN.md y NO
 * se promete en ninguna pantalla hasta que el transporte exista de verdad.
 */

import { VENEZUELA, type CiudadVE, type EstadoVE } from "./venezuela";

export type { CiudadVE, EstadoVE };
export const ESTADOS: EstadoVE[] = VENEZUELA;

/** Una ciudad con su estado a cuestas, que es como se usa en pantalla. */
export type Zona = {
  slug: string;
  nombre: string;
  /** El nombre del estado, para que no se confundan dos ciudades homónimas. */
  region: string;
  estadoSlug: string;
};

/**
 * Índice ciudad → zona, armado una vez. Son ~480 ciudades: un Map en memoria
 * resuelve cualquier búsqueda sin recorrer los 24 estados cada vez.
 */
const POR_SLUG = new Map<string, Zona>();
for (const estado of VENEZUELA) {
  for (const ciudad of estado.ciudades) {
    POR_SLUG.set(ciudad.slug, {
      slug: ciudad.slug,
      nombre: ciudad.nombre,
      region: estado.nombre,
      estadoSlug: estado.slug,
    });
  }
}

/**
 * La zona a partir de la CIUDAD ESCRITA A MANO en la ficha del comercio
 * («Tucani», «El Vigía », «CARACAS»). Sirve para el producto que no tiene
 * depósito: hereda la ciudad de su tienda (misma regla que `enZona`) y con
 * esto la ficha puede decir si le queda cerca o lejos a quien mira.
 * Sin acentos y sin mayúsculas; si no coincide con ninguna, `null` — no se
 * adivina.
 */
export function zonaPorNombre(texto: string | null | undefined): Zona | null {
  if (!texto) return null;
  const buscado = normalizarNombre(texto);
  if (!buscado) return null;
  return POR_NOMBRE.get(buscado) ?? null;
}

function normalizarNombre(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Índice nombre normalizado → zona. La primera ciudad con ese nombre gana. */
const POR_NOMBRE = new Map<string, Zona>();
for (const zona of POR_SLUG.values()) {
  const llave = normalizarNombre(zona.nombre);
  if (!POR_NOMBRE.has(llave)) POR_NOMBRE.set(llave, zona);
}

export function zonaPorSlug(slug: string | null | undefined): Zona | null {
  if (!slug) return null;
  return POR_SLUG.get(slug) ?? null;
}

/**
 * VECINOS QUE CRUZAN LA RAYA DEL ESTADO.
 *
 * El estado ya agrupa solo ("estás en Mérida, El Vigía te queda cerca"),
 * pero la geografía no respeta límites administrativos: el Sur del Lago está
 * pegado a El Vigía y es estado Zulia, y La Tendida es Táchira. Para quien
 * vive ahí, El Vigía es "cerquita" aunque el mapa político diga otra cosa.
 *
 * Se agregan pares a medida que aparezcan depósitos en más ciudades.
 */
const VECINOS: Record<string, string[]> = {
  "el-vigia": [
    "la-tendida", // Táchira, a la salida hacia el llano
    "el-chivo", // Zulia, Sur del Lago
    "santa-barbara-del-zulia", // Zulia, Sur del Lago
    "san-carlos-del-zulia", // Zulia, Sur del Lago
  ],
};

function sonVecinos(a: string, b: string): boolean {
  return Boolean(VECINOS[a]?.includes(b) || VECINOS[b]?.includes(a));
}

/** Qué tan lejos le queda al cliente lo que quiere comprar. */
export type Distancia = "aqui" | "cerca" | "lejos";

/**
 * Cuánto tiene que viajar quien está en `zonaCliente` para retirar algo que
 * está en `zonaProducto`.
 *
 * NUNCA devuelve "no puedes comprarlo": eso no existe mientras todo sea
 * retiro. Devuelve qué tan lejos le queda, para decírselo con la fuerza que
 * corresponda.
 *
 * Sin zona elegida responde `aqui`: a quien acaba de llegar no se le llena la
 * pantalla de avisos por no haber dicho todavía dónde vive. El aviso serio
 * aparece cuando ya eligió su ciudad, que es cuando significa algo.
 */
export function distanciaDeRetiro(
  zonaProducto: string | null | undefined,
  zonaCliente: string | null | undefined,
): Distancia {
  if (!zonaProducto || !zonaCliente) return "aqui";
  if (zonaProducto === zonaCliente) return "aqui";

  const producto = POR_SLUG.get(zonaProducto);
  const cliente = POR_SLUG.get(zonaCliente);
  if (!producto || !cliente) return "aqui";

  if (producto.estadoSlug === cliente.estadoSlug) return "cerca";
  if (sonVecinos(zonaProducto, zonaCliente)) return "cerca";

  return "lejos";
}

/**
 * LAS CIUDADES QUE "CUENTAN COMO CERCA" PARA FILTRAR EL CATÁLOGO.
 *
 * Cuando el cliente elige su ciudad, la portada y el catálogo enseñan lo que
 * puede ir a buscar: lo de su ciudad, lo del resto de su estado y lo de los
 * pueblos vecinos de la lista de arriba. Elegir Caracas enseña lo de Caracas;
 * elegir Tucaní enseña lo de El Vigía (mismo estado); elegir Valencia no
 * enseña nada de Mérida — y esa ausencia es el aviso de que ahí falta un
 * comercio.
 */
export function ciudadesVisiblesDesde(slug: string): string[] {
  const zona = POR_SLUG.get(slug);
  if (!zona) return [];

  const estado = VENEZUELA.find((e) => e.slug === zona.estadoSlug);
  const delEstado = estado?.ciudades.map((c) => c.slug) ?? [slug];

  const vecinas = new Set<string>(delEstado);
  for (const [a, lista] of Object.entries(VECINOS)) {
    if (a === slug || delEstado.includes(a)) {
      for (const v of lista) vecinas.add(v);
    }
    if (lista.includes(slug)) vecinas.add(a);
  }

  return [...vecinas];
}
