/**
 * LOS DEPARTAMENTOS DE MERCATREN.
 *
 * Esta lista la ponemos NOSOTROS y no se negocia con cada comercio. Es la
 * misma idea que usan Amazon o eBay: el vendedor elige de una lista cerrada,
 * no inventa la suya.
 *
 * POR QUÉ IMPORTA. Si cada comercio escribe su propia categoría, el mismo
 * producto acaba en "Ferretería", "Ferreteria", "Herramientas" y "Tools", y
 * el cliente que busca taladros no encuentra tres de los cuatro. Con una lista
 * fija, buscar por departamento funciona el primer día y sigue funcionando con
 * cien comercios dentro.
 *
 * Y hace de escaparate: un departamento vacío le dice al que llega "aquí se
 * pueden vender motos", que es justo lo que queremos que piense.
 *
 * CADA COMERCIO SIGUE TENIENDO LAS SUYAS. Las categorías propias (las que
 * Bley trae de su sistema: PVC, Hierro…) no se tocan; cuelgan de uno de estos
 * departamentos con `categorias.padreId`. Él organiza su tienda como quiera y
 * el cliente navega Mercatren de una sola forma.
 *
 * EN LA BASE viven en la tabla `categorias` con `tienda_id = NULL`, que es
 * justo lo que significa "de la casa, no de un comercio". Se siembran solas en
 * cada publicación desde `schema.sql`; no hace falta tocar la base a mano.
 */

/** Los iconos se nombran aquí y el componente los resuelve. */
export type IconoDepartamento =
  | "Hammer"
  | "PaintRoller"
  | "Car"
  | "Bike"
  | "Smartphone"
  | "Laptop"
  | "Tv"
  | "Refrigerator"
  | "Sofa"
  | "Utensils"
  | "Sparkles"
  | "HeartPulse"
  | "Baby"
  | "Shirt"
  | "Watch"
  | "Dumbbell"
  | "ToyBrick"
  | "Dog"
  | "Flower2"
  | "Briefcase"
  | "Wheat"
  | "Factory";

export type Departamento = {
  slug: string;
  es: string;
  en: string;
  icono: IconoDepartamento;
};

/**
 * El orden es el que se ve en pantalla, y no es alfabético a propósito:
 * primero lo que hoy se vende de verdad (ferretería y construcción, que es el
 * piloto) y después lo que queremos atraer.
 */
export const DEPARTAMENTOS: Departamento[] = [
  {
    slug: "ferreteria-construccion",
    es: "Ferretería y construcción",
    en: "Tools & Home Improvement",
    icono: "Hammer",
  },
  {
    slug: "pintura-acabados",
    es: "Pintura y acabados",
    en: "Paint & Finishes",
    icono: "PaintRoller",
  },
  {
    slug: "repuestos-carro",
    es: "Repuestos de carro",
    en: "Auto Parts",
    icono: "Car",
  },
  {
    slug: "motos-repuestos",
    es: "Motos y repuestos",
    en: "Motorcycles & Parts",
    icono: "Bike",
  },
  {
    slug: "celulares-accesorios",
    es: "Celulares y accesorios",
    en: "Cell Phones & Accessories",
    icono: "Smartphone",
  },
  {
    slug: "computacion",
    es: "Computación",
    en: "Computers",
    icono: "Laptop",
  },
  {
    slug: "electronica",
    es: "Electrónica",
    en: "Electronics",
    icono: "Tv",
  },
  {
    slug: "electrodomesticos",
    es: "Electrodomésticos",
    en: "Appliances",
    icono: "Refrigerator",
  },
  {
    slug: "hogar-muebles",
    es: "Hogar y muebles",
    en: "Home & Furniture",
    icono: "Sofa",
  },
  {
    slug: "cocina-comedor",
    es: "Cocina y comedor",
    en: "Kitchen & Dining",
    icono: "Utensils",
  },
  {
    slug: "belleza-cuidado",
    es: "Belleza y cuidado personal",
    en: "Beauty & Personal Care",
    icono: "Sparkles",
  },
  {
    slug: "salud-bienestar",
    es: "Salud y bienestar",
    en: "Health & Wellness",
    icono: "HeartPulse",
  },
  {
    slug: "bebes-ninos",
    es: "Bebés y niños",
    en: "Baby & Kids",
    icono: "Baby",
  },
  {
    slug: "ropa-calzado",
    es: "Ropa y calzado",
    en: "Clothing & Shoes",
    icono: "Shirt",
  },
  {
    slug: "relojes-joyeria",
    es: "Relojes y joyería",
    en: "Watches & Jewelry",
    icono: "Watch",
  },
  {
    slug: "deportes-aire-libre",
    es: "Deportes y aire libre",
    en: "Sports & Outdoors",
    icono: "Dumbbell",
  },
  {
    slug: "juguetes-juegos",
    es: "Juguetes y juegos",
    en: "Toys & Games",
    icono: "ToyBrick",
  },
  {
    slug: "mascotas",
    es: "Mascotas",
    en: "Pet Supplies",
    icono: "Dog",
  },
  {
    slug: "jardin-exteriores",
    es: "Jardín y exteriores",
    en: "Garden & Outdoor",
    icono: "Flower2",
  },
  {
    slug: "oficina-papeleria",
    es: "Oficina y papelería",
    en: "Office & School",
    icono: "Briefcase",
  },
  {
    slug: "agro-campo",
    es: "Agro y campo",
    en: "Farm & Agriculture",
    icono: "Wheat",
  },
  {
    slug: "industrial-equipos",
    es: "Industrial y equipos",
    en: "Industrial & Equipment",
    icono: "Factory",
  },
];

/** El nombre en el idioma de quien mira. */
export function nombreDepartamento(d: Departamento, idioma: string) {
  return idioma === "en" ? d.en : d.es;
}

export function departamentoPorSlug(slug: string) {
  return DEPARTAMENTOS.find((d) => d.slug === slug) ?? null;
}

/**
 * A qué departamento pertenece una categoría que trajo un comercio.
 *
 * El importador no pregunta nada: adivina por el nombre. "PVC", "Hierro" y
 * "Tornillería" son ferretería aunque no lo digan. Lo que no reconoce se deja
 * sin colgar, y entonces el equipo lo asigna a mano — que es mejor que
 * colgarlo del departamento equivocado y esconderlo del cliente.
 */
const PISTAS: Record<string, string[]> = {
  "ferreteria-construccion": [
    "ferreteria",
    "ferretería",
    "herramienta",
    "tornill",
    "hierro",
    "acero",
    "cemento",
    "pvc",
    "tuberia",
    "tubería",
    "plomeria",
    "plomería",
    "electrico",
    "eléctrico",
    "cable",
    "construccion",
    "construcción",
    "zinc",
    "lamina",
    "lámina",
    "viga",
    "alambre",
    "soldadura",
    "electrodo",
    "sanitario",
  ],
  "pintura-acabados": ["pintura", "barniz", "esmalte", "sellador", "brocha"],
  "repuestos-carro": ["repuesto", "automotriz", "carro", "auto", "vehiculo"],
  "motos-repuestos": ["moto", "motocicleta"],
  "celulares-accesorios": ["celular", "telefono", "teléfono", "smartphone"],
  computacion: ["computador", "laptop", "pc", "informatica", "informática"],
  electronica: ["electronica", "electrónica", "televisor", "audio"],
  electrodomesticos: ["electrodomestico", "electrodoméstico", "nevera"],
  "hogar-muebles": ["hogar", "mueble", "decoracion", "decoración"],
  "cocina-comedor": ["cocina", "comedor", "vajilla"],
  "belleza-cuidado": ["belleza", "cosmetic", "perfum"],
  "salud-bienestar": ["salud", "farmacia", "medic"],
  "bebes-ninos": ["bebe", "bebé", "infantil", "niño", "nino"],
  "ropa-calzado": ["ropa", "calzado", "zapato", "vestir"],
  "relojes-joyeria": ["reloj", "joyeria", "joyería"],
  "deportes-aire-libre": ["deporte", "gimnasio", "camping"],
  "juguetes-juegos": ["juguete", "juego"],
  mascotas: ["mascota", "perro", "gato", "veterinar"],
  "jardin-exteriores": ["jardin", "jardín", "vivero", "planta"],
  "oficina-papeleria": ["oficina", "papeleria", "papelería", "escolar"],
  "agro-campo": ["agro", "agricola", "agrícola", "campo", "ganader"],
  "industrial-equipos": ["industrial", "maquinaria", "equipo"],
};

export function adivinarDepartamento(nombre: string): string | null {
  const limpio = nombre.trim().toLowerCase();
  if (!limpio) return null;

  for (const [departamento, pistas] of Object.entries(PISTAS)) {
    if (pistas.some((p) => limpio.includes(p))) return departamento;
  }
  return null;
}
