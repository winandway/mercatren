/**
 * DÓNDE ESTÁ LA MERCANCÍA, Y QUÉ TAN LEJOS LE QUEDA A QUIEN COMPRA.
 *
 * HOY MERCATREN NO LLEVA NADA A DOMICILIO. Esto es ferretería: láminas de
 * zinc, tubos de seis metros, cabilla. Mover eso pide un camión, y camión no
 * hay. El precio que se publica es el precio de retirarlo EN EL DEPÓSITO
 * donde está — y eso hay que decírselo al cliente antes de que pague, no
 * después.
 *
 * Por eso las zonas NO son una barrera: son un aviso. Nadie tiene prohibido
 * comprar algo que está lejos; el que compra decide si puede llegar. Lo único
 * que no se vale es que se entere después.
 *
 *   aqui   → está en tu misma ciudad. Pasas y lo recoges.
 *   cerca  → está en un pueblo vecino, a un rato en carro.
 *   lejos  → está a horas. Se compra igual, pero avisando fuerte.
 *
 * Cuando exista el reparto —con mototaxis o apps de delivery, y solo para
 * cosas chicas: una cinta métrica, no una lámina— esto crece con un estado
 * más. Está anotado en PLAN.md y NO se promete en ninguna pantalla hasta que
 * el transporte exista de verdad.
 *
 * LA LISTA ES NUESTRA Y CERRADA, como los departamentos. Si cada comercio
 * escribe la suya, "El Vigía", "el vigia" y "Vigía" son tres ciudades
 * distintas y ningún cliente encuentra nada.
 */

export type Zona = {
  slug: string;
  nombre: string;
  /** El estado o región, para que no se confundan dos ciudades homónimas. */
  region: string;
  /**
   * Ciudades que quedan a un rato de aquí.
   *
   * Solo se llenan en las zonas donde hay depósito. A quien vive en una de
   * ellas se le dice "te queda cerca" en vez de "está lejos": no es lo mismo
   * media hora que siete horas, y esa diferencia decide la compra.
   */
  cerca?: string[];
};

export const ZONAS: Zona[] = [
  {
    slug: "el-vigia",
    nombre: "El Vigía",
    region: "Mérida",
    // Los pueblos que el dueño nombró: están a un rato en carro.
    cerca: [
      "canos-zancudo",
      "tucani",
      "el-chivo",
      "los-naranjos",
      "cuatro-esquinas",
      "la-tendida",
      "merida",
      "santa-aurora",
      "el-zulia",
    ],
  },
  { slug: "caracas", nombre: "Caracas", region: "Distrito Capital" },

  /* Los alrededores de El Vigía. No tienen depósito propio: existen para que
     quien vive ahí pueda elegirse y le salga "te queda cerca". */
  { slug: "canos-zancudo", nombre: "Caños Zancudo", region: "Mérida" },
  { slug: "tucani", nombre: "Tucaní", region: "Mérida" },
  { slug: "el-chivo", nombre: "El Chivo", region: "Mérida" },
  { slug: "los-naranjos", nombre: "Los Naranjos", region: "Mérida" },
  { slug: "cuatro-esquinas", nombre: "Cuatro Esquinas", region: "Mérida" },
  { slug: "la-tendida", nombre: "La Tendida", region: "Táchira" },
  { slug: "merida", nombre: "Mérida", region: "Mérida" },
  { slug: "santa-aurora", nombre: "Santa Aurora", region: "Mérida" },
  { slug: "el-zulia", nombre: "El Zulia", region: "Zulia" },

  /* Otras ciudades grandes: todavía sin comercio. Salen en la lista para que
     quien viva ahí pueda elegirse y entienda por qué no le llega — y para
     que se vea dónde nos falta un vendedor. */
  { slug: "san-cristobal", nombre: "San Cristóbal", region: "Táchira" },
  { slug: "maracaibo", nombre: "Maracaibo", region: "Zulia" },
  { slug: "valencia", nombre: "Valencia", region: "Carabobo" },
  { slug: "barquisimeto", nombre: "Barquisimeto", region: "Lara" },
  { slug: "maracay", nombre: "Maracay", region: "Aragua" },
];

export function zonaPorSlug(slug: string | null | undefined) {
  if (!slug) return null;
  return ZONAS.find((z) => z.slug === slug) ?? null;
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

  const zona = zonaPorSlug(zonaProducto);
  if (zona?.cerca?.includes(zonaCliente)) return "cerca";

  return "lejos";
}
