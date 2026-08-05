/**
 * LAS ZONAS DE ENTREGA DE MERCATREN.
 *
 * Un producto no está "en Venezuela": está en un depósito concreto, en una
 * ciudad concreta. Y quien compra tampoco está "en Venezuela": está en El
 * Vigía, o en Tucaní a media hora, o en Caracas a setecientos kilómetros.
 *
 * TRES RESPUESTAS, NO DOS. Lo natural sería "llega / no llega", pero eso deja
 * fuera a media región: quien vive en Caños Zancudo, El Chivo o La Tendida
 * está a un rato del Vigía y con gusto va a buscar su alicate al día
 * siguiente. Decirle "no disponible" es perder una venta que él sí quería
 * hacer. Entonces:
 *
 *   - `entrega`  → el comercio se lo lleva a su ciudad.
 *   - `retiro`   → no se lo llevan, pero está cerca y puede ir por él. Se le
 *                  dice dónde, con dirección, antes de que pague.
 *   - `lejos`    → está a horas de distancia. Se le muestra y se le dice
 *                  dónde está, pero no se le deja comprar por error.
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
   * Zonas desde donde SE PUEDE VENIR A BUSCAR lo que hay aquí.
   *
   * Solo se llenan en las zonas donde hay depósito. Son los pueblos de
   * alrededor: quien vive ahí no recibe a domicilio, pero puede pasar.
   */
  seRetiraDesde?: string[];
};

export const ZONAS: Zona[] = [
  {
    slug: "el-vigia",
    nombre: "El Vigía",
    region: "Mérida",
    // Los pueblos que el dueño nombró: están a un rato en carro.
    seRetiraDesde: [
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
     quien vive ahí pueda elegirse y le salga "puedes venir a buscarlo". */
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

export type Alcance = "entrega" | "retiro" | "lejos";

/**
 * Qué puede hacer quien está en `zonaCliente` con algo que está en
 * `zonaProducto`.
 *
 * Sin zona elegida se responde `entrega`: a quien acaba de llegar no se le
 * esconde la tienda por no haber dicho todavía dónde vive. La barrera de
 * verdad está en el pedido, que sí exige una dirección.
 */
export function alcanceDeEntrega(
  zonaProducto: string | null | undefined,
  zonaCliente: string | null | undefined,
): Alcance {
  if (!zonaProducto || !zonaCliente) return "entrega";
  if (zonaProducto === zonaCliente) return "entrega";

  const zona = zonaPorSlug(zonaProducto);
  if (zona?.seRetiraDesde?.includes(zonaCliente)) return "retiro";

  return "lejos";
}
