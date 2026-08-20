/**
 * EN QUÉ DEPARTAMENTO DE MERCATREN CAE UN PRODUCTO DE CJ.
 *
 * ══ POR QUÉ NO SE ASIGNA A MANO DESPUÉS ══
 *
 * Porque son 250–300 productos. Clasificarlos uno por uno al final es un día
 * entero de trabajo que hay que repetir cada vez que entren productos nuevos, y
 * mientras tanto el catálogo está publicado con todos los departamentos vacíos
 * — que es exactamente como se ve una tienda a la que nadie le ha metido nada.
 *
 * Se asigna **en el momento de agregarlo**, y se ve en la tarjeta antes de
 * pulsar el botón: así se corrige el que caiga mal en ese momento, no en una
 * revisión de trescientos.
 *
 * ══ SE MIRA LA CATEGORÍA DE CJ ANTES QUE EL TÍTULO ══
 *
 * CJ ya clasifica su catálogo en tres niveles («Women's Clothing» → «Bags» →
 * «Wallets»), y esa clasificación la hizo alguien mirando el producto. El
 * título es el último recurso: los de CJ vienen cargados de palabras sueltas
 * para su buscador («2pcs Vintage Washed Baseball Cap With American Flag USA
 * Embroidery, Distressed…») y adivinar de ahí es mucho más frágil.
 *
 * Se prueba del nivel más específico al más general: el tercero dice «Wallets»,
 * el primero dice «Women's Clothing». Los dos llevan al mismo sitio, pero
 * empezar por el general haría que un cargador de celular dentro de
 * «Electronics» no llegara nunca a «Celulares y accesorios».
 *
 * ══ LO QUE NO SE RECONOCE SE DEJA SIN COLGAR ══
 *
 * Misma regla que ya tiene el importador de los comercios: es mejor un producto
 * sin departamento —que se ve igual en la tienda y se busca igual— que uno
 * colgado del departamento equivocado, donde el cliente que sí lo quería no lo
 * va a encontrar nunca.
 */

/**
 * El texto, listo para comparar palabra por palabra.
 *
 * ══ POR QUÉ NO VALE UN `includes` A SECAS ══
 *
 * Porque «card» contiene «car». Con la comparación fácil, el «Slim Minimalist
 * Wallet With ID Window, Pop Up **Card** Holder» se iría a «Repuestos de
 * carro». Y ese producto es de los primeros que salieron al buscar «wallet»:
 * el fallo habría entrado el primer día.
 *
 * Por eso el texto se parte en palabras y se compara envuelto en espacios. Y se
 * le quita la «s» final a las largas, para que «bags» y «bag» sean lo mismo sin
 * tener que escribir las dos en cada lista. Las cortas se dejan como están —
 * «gas» no es «ga».
 */
function normalizar(texto: string): string {
  const palabras = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((p) => (p.length > 3 && p.endsWith("s") ? p.slice(0, -1) : p));

  return palabras.length ? ` ${palabras.join(" ")} ` : "";
}

function contiene(textoNormalizado: string, pista: string): boolean {
  const limpia = normalizar(pista).trim();
  return limpia.length > 0 && textoNormalizado.includes(` ${limpia} `);
}

/**
 * Las pistas, EN INGLÉS, porque así es como CJ nombra sus categorías.
 *
 * ══ EL ORDEN ES LA REGLA, NO UN DETALLE ══
 *
 * Gana el primero que coincide, así que va de lo inequívoco a lo general.
 * «Motorcycle» antes que «auto», porque un repuesto de moto también menciona el
 * vehículo. «Camping» antes que «bag», o un saco de dormir acabaría en ropa.
 * «Kitchen» antes que «tool», o un pelapapas acabaría en ferretería.
 */
const PISTAS: Array<[departamento: string, pistas: string[]]> = [
  ["motos-repuestos", ["motorcycle", "motorbike", "scooter", "moped"]],
  [
    /* BICICLETAS VA ANTES QUE REPUESTOS DE CARRO, Y EL ORDEN ES LA REGLA.
       Toda bicicleta de rueda gruesa de CJ se llama «Fat Tire Bike», y
       `repuestos-carro` captura `tire`. Probando bicicletas primero, la
       bicicleta gana por su propia palabra antes de que `tire` la desvíe. */
    "bicicletas",
    [
      "bicycle",
      "bike",
      "e-bike",
      "ebike",
      "cycling",
      "mountain bike",
      "bike helmet",
      "bike pump",
      "bike inflator",
      "bike lock",
      "bike light",
      "bicycle seat",
      "bike rack",
    ],
  ],
  [
    "repuestos-carro",
    [
      "auto part",
      "automotive",
      "car part",
      "car accessory",
      "vehicle",
      "truck",
      "tire",
      "windshield",
      "dashboard",
    ],
  ],
  [
    "celulares-accesorios",
    [
      "phone",
      "cellphone",
      "smartphone",
      "iphone",
      "phone case",
      "phone holder",
      "screen protector",
      "charger",
      "power bank",
    ],
  ],
  [
    "computacion",
    [
      "computer",
      "laptop",
      "notebook computer",
      "keyboard",
      "mouse pad",
      "mousepad",
      "monitor",
      "printer",
      "usb hub",
      "hard drive",
    ],
  ],
  [
    "electronica",
    [
      "electronic",
      "consumer electronic",
      "headphone",
      "earphone",
      "earbud",
      "speaker",
      "camera",
      "drone",
      "projector",
      "smart home",
    ],
  ],
  [
    "electrodomesticos",
    [
      "appliance",
      "refrigerator",
      "blender",
      "air fryer",
      "vacuum cleaner",
      "washing machine",
      "microwave",
      "coffee maker",
    ],
  ],
  [
    "cocina-comedor",
    [
      "kitchen",
      "cookware",
      "tableware",
      "dinnerware",
      "cutlery",
      "utensil",
      "mug",
      "bakeware",
      "food storage",
    ],
  ],
  [
    "bebes-ninos",
    [
      "baby",
      "infant",
      "toddler",
      "kid",
      "children",
      "diaper",
      "stroller",
      "nursing",
      "mother kid",
    ],
  ],
  /* MASCOTAS VA ANTES QUE JUGUETES, y lo encontró su propia prueba:
     «Dog Toys» coincidía con «toy» y los juguetes para perro acababan entre
     los de niños. Quien compra para su perro busca en Mascotas. */
  ["mascotas", ["pet", "dog", "cat", "aquarium", "puppy", "kitten"]],
  [
    "juguetes-juegos",
    [
      "toy",
      "puzzle",
      "board game",
      "doll",
      "plush",
      "building block",
      "action figure",
    ],
  ],
  [
    "belleza-cuidado",
    [
      "beauty",
      "makeup",
      "cosmetic",
      "nail",
      "hair",
      "skin care",
      "skincare",
      "perfume",
      "fragrance",
      "lash",
      "wig",
      "shaver",
    ],
  ],
  [
    "salud-bienestar",
    [
      "health",
      "medical",
      "massage",
      "first aid",
      "supplement",
      "orthopedic",
      "thermometer",
    ],
  ],
  [
    "deportes-aire-libre",
    [
      "sport",
      "fitness",
      "gym",
      "yoga",
      "camping",
      "hiking",
      "outdoor",
      "swimming",
      "fishing",
      "workout",
    ],
  ],
  [
    "relojes-joyeria",
    [
      "watch",
      "smartwatch",
      "smart watch",
      "jewelry",
      "jewellery",
      "necklace",
      "bracelet",
      "earring",
      "pendant",
      "brooch",
    ],
  ],
  [
    "ropa-calzado",
    [
      "clothing",
      "apparel",
      "shirt",
      "hoodie",
      "sweater",
      "sweatshirt",
      "dress",
      "pant",
      "jean",
      "jacket",
      "coat",
      "skirt",
      "shoe",
      "sneaker",
      "boot",
      "sandal",
      "sock",
      "underwear",
      "lingerie",
      "bra",
      "swimwear",
      "hat",
      "cap",
      "scarf",
      "glove",
      "belt",
      "sunglasse",
      "bag",
      "handbag",
      "wallet",
      "backpack",
      "purse",
      "luggage",
      "card holder",
    ],
  ],
  /* Y JARDÍN ANTES QUE HOGAR, por lo mismo: «Garden Decoration» coincidía
     con «decoration» y las cosas de jardín acababan entre los muebles. */
  [
    "jardin-exteriores",
    ["garden", "patio", "lawn", "plant", "greenhouse", "watering"],
  ],
  [
    "hogar-muebles",
    [
      "home",
      "furniture",
      "decor",
      "decoration",
      "bedding",
      "pillow",
      "cushion",
      "curtain",
      "lamp",
      "lighting",
      "rug",
      "mirror",
      "storage box",
      "organizer",
      "candle",
    ],
  ],
  [
    "oficina-papeleria",
    [
      "office",
      "stationery",
      "school supply",
      "notebook",
      "pen",
      "pencil",
      "sticker",
    ],
  ],
  [
    "ferreteria-construccion",
    [
      "tool",
      "hardware",
      "home improvement",
      "drill",
      "screwdriver",
      "wrench",
      "hammer",
      "saw",
      "plumbing",
      "screw",
      "tape measure",
      "flashlight",
    ],
  ],
  ["pintura-acabados", ["paint", "varnish", "primer", "paintbrush"]],
  ["agro-campo", ["farm", "agriculture", "livestock", "poultry"]],
  ["industrial-equipos", ["industrial", "machinery", "welding"]],
];

/**
 * LAS FRASES QUE SIGNIFICAN OTRA COSA QUE SU PALABRA SUELTA.
 *
 * Se prueban ANTES que todo lo demás, y por eso ganan siempre.
 *
 * ══ POR QUÉ HACE FALTA UNA LISTA APARTE ══
 *
 * Hay palabras que, dentro de otra frase, cambian de significado por completo.
 * Un «hand truck» no es un camión: es una carretilla de almacén. Un «truck
 * bed liner» sí es un accesorio de camioneta. La palabra es la misma y el
 * departamento no.
 *
 * No se arregla quitando la palabra de la lista general —un `truck` suelto sí
 * es un vehículo— ni metiendo condiciones dentro del bucle, que se vuelve
 * ilegible al tercer caso. Se arregla con una lista de frases exactas que se
 * prueba primero.
 *
 * ══ ESTA LISTA CRECE CON LO QUE SE ENCUENTRA, NO CON LO QUE SE IMAGINA ══
 *
 * Cada entrada viene de un producto real que cayó mal. Si algún día aparece
 * otro, se agrega aquí con su prueba y no se toca nada más.
 */
const EXCEPCIONES: ReadonlyArray<readonly [string, string]> = [
  /* Una carretilla de almacén, no un camión. Encontrado el 19 ago 2026 en el
     catálogo publicado: «Hand Truck, 600 Lbs Load Capacity» salía en
     «Repuestos de carro». */
  ["hand truck", "ferreteria-construccion"],
  ["hand trucks", "ferreteria-construccion"],
  /* Un carrito de plataforma, lo mismo. */
  ["platform truck", "ferreteria-construccion"],
  /* «card» dentro de «car» NO va aquí a propósito: esa trampa ya la resuelve
     la comparación por palabras enteras de `contiene()`, y la prueba de la
     cartera lo demuestra. Meterla como excepción la mandaría a un
     departamento fijo y le quitaría el acierto que ya tiene. */
];

/**
 * El departamento de un producto de CJ, o `null` si no se reconoce.
 *
 * Las categorías se pasan de la más específica a la más general, que es el
 * orden en el que hay que probarlas.
 */
export function departamentoDeCj(
  categorias: Array<string | null | undefined>,
  titulo?: string | null,
): string | null {
  /* Las excepciones mandan sobre todo, y se miran en el título ADEMÁS de en
     las categorías: «Hand Truck» es el nombre del producto, no su categoría.
     Si esto fuera después, la palabra suelta ya habría ganado. */
  const excepcion = porExcepcion([...categorias, titulo]);
  if (excepcion) return excepcion;

  /* Cada categoría se prueba entera antes de pasar a la siguiente: una
     coincidencia en el nivel específico manda sobre una del nivel general. */
  for (const categoria of categorias) {
    const encontrado = buscar(categoria);
    if (encontrado) return encontrado;
  }

  /* El título, al final y solo si las categorías no dijeron nada. */
  return buscar(titulo);
}

function porExcepcion(
  textos: Array<string | null | undefined>,
): string | null {
  for (const texto of textos) {
    if (!texto?.trim()) continue;
    const normalizado = normalizar(texto);
    if (!normalizado) continue;
    for (const [frase, departamento] of EXCEPCIONES) {
      if (contiene(normalizado, frase)) return departamento;
    }
  }
  return null;
}

function buscar(texto: string | null | undefined): string | null {
  if (!texto?.trim()) return null;
  const normalizado = normalizar(texto);
  if (!normalizado) return null;

  for (const [departamento, pistas] of PISTAS) {
    if (pistas.some((p) => contiene(normalizado, p))) return departamento;
  }
  return null;
}

/**
 * El id que tiene ese departamento en la tabla `categorias`.
 *
 * Los departamentos se siembran desde `schema.sql` con el id `dep-<slug>` y
 * `tienda_id = NULL`, que es lo que significa «de la casa, no de un comercio».
 */
export function idDeDepartamento(slug: string | null): string | null {
  return slug ? `dep-${slug}` : null;
}
