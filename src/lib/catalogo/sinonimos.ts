/**
 * BUSCAR EN ESPAÑOL UN CATÁLOGO ESCRITO EN INGLÉS.
 *
 * ══ EL PROBLEMA QUE RESUELVE, QUE NO ES EL QUE PARECE ══
 *
 * El buscador nunca estuvo roto. Busca en título español, título inglés,
 * descripción, marca, SKU y nombre del comercio, y lo hace bien.
 *
 * Lo que pasa es que **el dato está en inglés**. Los productos que entran
 * desde CJ guardan el título inglés en los dos campos —el de inglés y el de
 * español— porque CJ solo publica `productName` (en chino) y `productNameEn`.
 * Español no da. Así que buscar «repuestos» no encuentra nada: esa palabra no
 * existe ni una vez en la base, donde dice «Auto Parts».
 *
 * Traducir el catálogo es el arreglo de fondo y está en marcha. Pero traducir
 * tarda, cuesta y hay que revisarlo. **Esto hace que el buscador funcione
 * mientras tanto y siga sirviendo después**, porque un diccionario resuelve
 * algo que la traducción no: que la misma cosa se llama distinto en cada país.
 *
 * ══ DOS TRABAJOS EN UNA SOLA PIEZA ══
 *
 * 1. **Español → inglés.** «bicicleta» encuentra «bike». Es lo que desbloquea
 *    el catálogo de Estados Unidos hoy mismo.
 * 2. **Español → español.** «repuesto» encuentra «refacción» (México) y
 *    «autoparte»; «cauchos» encuentra «llantas» (Venezuela contra el resto).
 *    Esto sigue haciendo falta el día que todo esté traducido: quien escribe
 *    la palabra de su país y no encuentra nada, se va y no vuelve.
 *
 * ══ POR QUÉ GRUPOS Y NO PARES ══
 *
 * Un grupo es un CONCEPTO, y todas sus palabras son equivalentes entre sí en
 * las dos direcciones. Con pares «palabra → traducción» habría que escribir
 * cada relación dos veces y a la tercera palabra el mantenimiento se cae.
 * Aquí se agrega la palabra al grupo y las relaciones salen solas.
 *
 * ══ LO QUE ESTA PIEZA NO HACE, A PROPÓSITO ══
 *
 * No traduce para MOSTRAR. Lo que se ve en pantalla sigue saliendo del título
 * del producto. Esto solo amplía lo que se busca, así que **no puede romper
 * ninguna ficha**: en el peor caso encuentra de más, nunca de menos.
 */

import { normalizarTexto } from "./normalizar";

/**
 * Los conceptos. Cada línea es una cosa del mundo dicha de varias maneras.
 *
 * ══ REGLAS PARA AGREGAR ══
 *
 * 1. **Todo en minúsculas y sin acentos.** El buscador normaliza antes de
 *    comparar; una entrada con acento no coincidiría nunca.
 * 2. **Solo palabras que de verdad signifiquen lo mismo.** Meter «auto» en el
 *    grupo de «coche» parece inofensivo hasta que alguien busca «auto» y le
 *    salen los repuestos de carro enteros.
 * 3. **Ojo con las palabras cortas y las que son parte de otras.** La
 *    comparación es por texto contenido, así que «pc» encontraría «pcs»
 *    (piezas) en medio título de CJ. Cuando la palabra sea corta y común,
 *    mejor no meterla.
 * 4. **Cada grupo nuevo, con su prueba.** Si no, en dos meses nadie sabe por
 *    qué una búsqueda trae lo que trae.
 */
export const CONCEPTOS: ReadonlyArray<readonly string[]> = [
  // ── Repuestos y vehículos ────────────────────────────────────────────
  [
    "repuesto",
    "repuestos",
    "refaccion",
    "refacciones",
    "autoparte",
    "autopartes",
    "auto part",
    "auto parts",
    "car part",
    "car parts",
    "spare part",
    "spare parts",
  ],
  [
    "carro",
    "carros",
    "coche",
    "coches",
    "automovil",
    "automoviles",
    "vehiculo",
    "vehiculos",
    "car",
    "cars",
    "vehicle",
    "automotive",
  ],
  ["camioneta", "camionetas", "camion", "camiones", "truck", "trucks"],
  [
    "llanta",
    "llantas",
    "caucho",
    "cauchos",
    "neumatico",
    "neumaticos",
    "goma",
    "gomas",
    "tire",
    "tires",
    "tyre",
    "tyres",
  ],
  ["bateria", "baterias", "acumulador", "battery", "batteries"],
  ["freno", "frenos", "pastilla de freno", "brake", "brakes", "brake pad"],
  ["aceite", "aceites", "lubricante", "oil", "motor oil", "lubricant"],
  ["filtro", "filtros", "filter", "filters"],
  ["bujia", "bujias", "spark plug", "spark plugs"],
  ["amortiguador", "amortiguadores", "shock absorber", "suspension"],
  ["parabrisas", "windshield", "windscreen"],
  ["retrovisor", "espejo", "espejos", "mirror", "mirrors"],
  ["cargador", "cargadores", "charger", "chargers"],

  // ── Bicicletas y motos ───────────────────────────────────────────────
  [
    "bicicleta",
    "bicicletas",
    "bici",
    "bicis",
    "ciclismo",
    "bike",
    "bikes",
    "bicycle",
    "bicycles",
    "cycling",
    "e-bike",
    "ebike",
  ],
  ["casco", "cascos", "helmet", "helmets"],
  /* «patinete» comparte grupo con «scooter» a propósito: en los títulos de
     CJ el patinete eléctrico ES «scooter», y un chileno lo busca como
     patinete o monopatín. Encontrar de más (motos) es aceptable; encontrar
     de menos dejó a un cliente sin su patinete el 30 ago 2026. */
  [
    "moto",
    "motos",
    "motocicleta",
    "motocicletas",
    "motorcycle",
    "motorcycles",
    "motorbike",
    "scooter",
    "patinete",
    "patinetes",
    "monopatin",
    "monopatines",
    "patineta",
  ],
  ["inflador", "bomba de aire", "inflator", "air pump", "tire pump"],

  // ── Herramientas y ferretería ────────────────────────────────────────
  ["herramienta", "herramientas", "tool", "tools", "toolkit", "tool set"],
  ["taladro", "taladros", "drill", "drills"],
  ["destornillador", "destornilladores", "screwdriver", "screwdrivers"],
  /* «llave» a secas también es cerradura y grifo, y aun así entra: probado
     contra el catálogo real, «wrench» no encontraba NADA porque las fichas
     dicen «LLAVE ALLEN», no «llave inglesa». Encontrar de más es aceptable;
     encontrar de menos es lo que hace que la gente se vaya. */
  [
    "llave",
    "llaves",
    "llave inglesa",
    "llave de tuercas",
    "wrench",
    "wrenches",
  ],
  ["martillo", "martillos", "hammer", "hammers"],
  ["sierra", "sierras", "serrucho", "saw", "saws"],
  ["tornillo", "tornillos", "screw", "screws"],
  ["clavo", "clavos", "nail", "nails"],
  ["cinta metrica", "metro", "tape measure", "measuring tape"],
  /* «torch» NO va aquí: en inglés británico es linterna, pero en un
     catálogo de ferretería choca con la antorcha de corte, y probándolo
     contra el catálogo real trajo exactamente eso. */
  ["linterna", "linternas", "flashlight", "flashlights"],
  [
    "candado",
    "candados",
    "cerradura",
    "cerraduras",
    "lock",
    "locks",
    "padlock",
  ],
  ["carretilla", "carretillas", "hand truck", "dolly", "platform truck"],
  ["escalera", "escaleras", "ladder", "ladders"],
  ["soldadura", "soldar", "welding", "welder"],
  ["pintura", "pinturas", "paint", "paints"],
  ["brocha", "brochas", "rodillo", "brush", "roller", "paint roller"],

  // ── Casa, cocina y electrodomésticos ─────────────────────────────────
  ["cocina", "kitchen"],
  ["nevera", "refrigerador", "heladera", "fridge", "refrigerator"],
  ["licuadora", "batidora", "blender", "mixer"],
  [
    "olla",
    "ollas",
    "sarten",
    "sartenes",
    "pot",
    "pots",
    "pan",
    "pans",
    "cookware",
  ],
  ["cubiertos", "cuchillo", "cuchillos", "cutlery", "knife", "knives"],
  ["mueble", "muebles", "furniture"],
  ["colchon", "colchones", "mattress"],
  ["silla", "sillas", "chair", "chairs"],
  ["mesa", "mesas", "table", "tables"],
  ["lampara", "lamparas", "lamp", "lamps", "light", "lighting"],
  ["ventilador", "ventiladores", "fan", "fans"],
  ["aspiradora", "vacuum", "vacuum cleaner"],

  // ── Tecnología ───────────────────────────────────────────────────────
  [
    "celular",
    "celulares",
    "telefono",
    "telefonos",
    "movil",
    "moviles",
    "smartphone",
    "smartphones",
    "cellphone",
    "phone",
    "phones",
  ],
  [
    "computadora",
    "computadoras",
    "ordenador",
    "laptop",
    "laptops",
    "computer",
    "notebook",
  ],
  [
    "audifonos",
    "auriculares",
    "cascos de audio",
    "headphones",
    "earphones",
    "earbuds",
  ],
  [
    "parlante",
    "parlantes",
    "corneta",
    "cornetas",
    "bocina",
    "bocinas",
    "speaker",
    "speakers",
  ],
  ["televisor", "televisores", "tele", "television", "tv"],
  ["camara", "camaras", "camera", "cameras"],
  ["teclado", "teclados", "keyboard", "keyboards"],
  ["raton", "mouse", "mice"],
  ["memoria", "pendrive", "usb", "flash drive", "memory card"],
  ["reloj", "relojes", "watch", "watches", "smartwatch"],

  // ── Ropa, calzado y cuidado ──────────────────────────────────────────
  ["zapato", "zapatos", "calzado", "shoe", "shoes", "footwear"],
  [
    "zapatilla",
    "zapatillas",
    "tenis",
    "deportivos",
    "sneaker",
    "sneakers",
    "running shoes",
  ],
  ["bota", "botas", "boot", "boots"],
  [
    "camisa",
    "camisas",
    "franela",
    "franelas",
    "playera",
    "remera",
    "shirt",
    "shirts",
    "t-shirt",
    "tshirt",
    "tee",
  ],
  ["pantalon", "pantalones", "pants", "trousers", "jeans"],
  ["chaqueta", "chaquetas", "campera", "abrigo", "jacket", "jackets", "coat"],
  ["vestido", "vestidos", "dress", "dresses"],
  [
    "cartera",
    "carteras",
    "billetera",
    "billeteras",
    "monedero",
    "wallet",
    "wallets",
    "purse",
  ],
  ["bolso", "bolsos", "mochila", "mochilas", "bag", "bags", "backpack"],
  ["gorra", "gorras", "sombrero", "cap", "caps", "hat", "hats"],
  ["lentes", "gafas", "anteojos", "glasses", "sunglasses", "eyewear"],
  ["perfume", "perfumes", "fragancia", "fragrance", "cologne"],
  ["maquillaje", "cosmeticos", "makeup", "cosmetics"],

  // ── Bebés, mascotas, jardín y deporte ────────────────────────────────
  ["bebe", "bebes", "baby", "babies", "infant"],
  ["coche de bebe", "cochecito", "stroller", "pram"],
  ["panal", "panales", "diaper", "diapers"],
  ["juguete", "juguetes", "toy", "toys"],
  ["perro", "perros", "dog", "dogs", "puppy"],
  ["gato", "gatos", "cat", "cats", "kitten"],
  ["mascota", "mascotas", "pet", "pets"],
  ["jardin", "jardineria", "garden", "gardening", "yard"],
  ["manguera", "mangueras", "hose", "garden hose"],
  ["carpa", "tienda de campana", "camping", "tent", "tents"],
  ["pesca", "cana de pescar", "fishing", "fishing rod"],
  [
    "pesa",
    "pesas",
    "mancuerna",
    "mancuernas",
    "dumbbell",
    "dumbbells",
    "weights",
  ],
];

/**
 * El índice: de cada palabra, a todas sus equivalentes.
 *
 * Se arma una sola vez al cargar el módulo. Hacerlo en cada búsqueda sería
 * recorrer 90 grupos por cada palabra que escribe la persona, y el buscador
 * responde mientras se teclea.
 *
 * Una palabra puede estar en más de un grupo —«goma» es llanta y también
 * borrador— y entonces hereda las equivalentes de los dos. Encontrar de más
 * es aceptable; encontrar de menos es lo que hace que la gente se vaya.
 */
const INDICE: ReadonlyMap<string, readonly string[]> = (() => {
  const mapa = new Map<string, string[]>();
  for (const grupo of CONCEPTOS) {
    for (const palabra of grupo) {
      const clave = normalizarTexto(palabra);
      if (!clave) continue;
      const acumulado = mapa.get(clave) ?? [];
      for (const otra of grupo) {
        const valor = normalizarTexto(otra);
        if (valor && !acumulado.includes(valor)) acumulado.push(valor);
      }
      mapa.set(clave, acumulado);
    }
  }
  return mapa;
})();

/**
 * Singular y plural del español, sin diccionario.
 *
 * ══ POR QUÉ HACE FALTA ══
 *
 * La comparación es por texto contenido, así que buscar «repuestos» SÍ
 * encuentra «repuesto» (está dentro), pero buscar «repuesto» NO encuentra
 * «repuestos»… y en la práctica la gente escribe las dos. Peor: «lapiz» no
 * encuentra «lapices», que cambian la raíz.
 *
 * ══ LO QUE SE HACE Y LO QUE NO ══
 *
 * Se generan las formas probables y se buscan TODAS con un «o». No se intenta
 * acertar cuál es la correcta: acertar exige un diccionario, y equivocarse
 * significa no encontrar nada. Sobrar una forma que no existe no cuesta nada,
 * porque simplemente no coincide con ningún producto.
 *
 * Las palabras de tres letras o menos se dejan quietas: «pie» no es el plural
 * de nada y «pies» tampoco necesita ayuda.
 */
export function formasDeNumero(palabra: string): string[] {
  const p = normalizarTexto(palabra);

  /* La regla de la «z» va ANTES del guardián de longitud, y no es un detalle:
     «luz» y «voz» tienen tres letras y su plural cambia la raíz, así que el
     guardián las dejaba sin plural. Es una regla sin ambigüedad —en español
     toda palabra terminada en z hace el plural en «ces»— y por eso puede ir
     delante sin traer ruido. */
  if (p.endsWith("z") && p.length > 2) {
    return [p, p.slice(0, -1) + "ces"];
  }

  /* De aquí para abajo, las palabras muy cortas se dejan quietas: «pie» no es
     el singular de nada, y a «kit» —que sale en medio catálogo de CJ como
     «Tool Kit»— inventarle «kites» le traería cometas a quien busca un juego
     de herramientas. */
  if (p.length <= 3) return [p];

  const formas = new Set<string>([p]);

  if (p.endsWith("ces")) {
    // lapices → lapiz · luces → luz
    formas.add(p.slice(0, -3) + "z");
  }
  if (p.endsWith("es")) {
    formas.add(p.slice(0, -2)); // motores → motor
  }
  if (p.endsWith("s")) {
    formas.add(p.slice(0, -1)); // repuestos → repuesto
  } else {
    formas.add(p + "s"); // repuesto → repuestos
    formas.add(p + "es"); // motor → motores
  }

  return [...formas].filter((f) => f.length > 1);
}

/**
 * Todo lo que hay que buscar cuando alguien escribe UNA palabra.
 *
 * El orden importa poco para el resultado, pero se deja lo escrito primero:
 * si algún día esto alimenta el resaltado, lo que la persona tecleó va antes.
 *
 * Se topa a 12 formas por palabra. Sin tope, una palabra de un grupo grande
 * más sus plurales arma una consulta con decenas de condiciones — y ocho
 * palabras así tumbarían la búsqueda por «too many SQL variables», que es un
 * fallo que este proyecto ya sufrió una vez.
 */
export function expandir(palabra: string): string[] {
  const base = normalizarTexto(palabra);
  if (!base) return [];

  const formas = new Set<string>();
  for (const forma of formasDeNumero(base)) {
    formas.add(forma);
    for (const sinonimo of INDICE.get(forma) ?? []) {
      formas.add(sinonimo);
    }
  }

  /* Lo que escribió la persona va primero y nunca se pierde por el tope. */
  const resto = [...formas].filter((f) => f !== base);
  return [base, ...resto].slice(0, 12);
}

/** ¿Esta palabra tiene equivalentes conocidas? Para pruebas y diagnóstico. */
export function tieneSinonimos(palabra: string): boolean {
  return expandir(palabra).length > formasDeNumero(palabra).length;
}
