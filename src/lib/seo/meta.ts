/**
 * LOS METADATOS DE CADA PÁGINA, ARMADOS CON UNA REGLA (23 ago 2026).
 *
 * Lo pidió el dueño: «los productos están en español, pero los metadatos
 * cuando se hizo la traducción no se trabajaron». Una ficha con título pelado
 * y sin descripción la resume Google como quiere; con título + comercio y una
 * descripción que dice precio, dónde se retira o si se despacha, marca y
 * categoría, la ficha compite de verdad.
 *
 * Todo aquí es PURO y tiene pruebas: recibe datos, devuelve título,
 * descripción y palabras clave. No inventa: cada frase sale de un dato real
 * (precio, comercio, ciudad, país de entrega). Lo que no hay, no se escribe.
 */
export type Idioma = "es" | "en";

const LARGO_TITULO = 60;
const LARGO_DESCRIPCION = 155;

/** Siglas que se quedan en mayúsculas al pasar un título gritado a normal. */
const SIGLAS = new Set([
  "PVC",
  "LED",
  "USB",
  "HDMI",
  "TV",
  "SSD",
  "HDD",
  "GPS",
  "LCD",
  "CPU",
  "RAM",
  "PC",
  "CD",
  "DVD",
  "UV",
  "AC",
  "DC",
  "3M",
  "HP",
  "GH",
  "UPS",
  "WIFI",
  "RJ45",
  "CAT",
  "BT",
  "SUV",
  "ATV",
  "UTV",
  "XL",
  "XXL",
  "XS",
  "S",
  "M",
  "L",
  "USA",
  "EE.UU.",
  "IP",
  "AM",
  "FM",
  "LG",
  "MDF",
  "OSB",
  "PET",
  "PP",
  "ABS",
  "EVA",
  "TPU",
  "PU",
  "SAE",
  "DIN",
  "ISO",
  "NPT",
  "BSP",
  "V",
  "W",
  "A",
  "HZ",
  "KG",
  "G",
  "MM",
  "CM",
  "M2",
  "M3",
  "LT",
  "ML",
  "OZ",
  "LB",
]);

/**
 * «ELECTRODO 3/32 GRIS» → «Electrodo 3/32 gris». Solo si el título viene
 * TODO en mayúsculas (así llegan los del catálogo importado); uno escrito a
 * mano no se toca. Las siglas conocidas y lo que lleva dígitos se conservan.
 */
export function titularNormal(titulo: string): string {
  const t = titulo.trim().replace(/\s+/g, " ");
  if (!t || /[a-záéíóúñü]/.test(t)) return t;
  const palabras = t.split(" ").map((p) => {
    const limpia = p.replace(/[^A-ZÁÉÍÓÚÑÜ0-9./-]/g, "");
    if (SIGLAS.has(limpia) || /\d/.test(p)) return p;
    return p.toLowerCase();
  });
  const primera = palabras[0]!;
  palabras[0] = primera.charAt(0).toUpperCase() + primera.slice(1);
  return palabras.join(" ");
}

/** Corta a `largo` sin partir palabras, con puntos suspensivos. */
export function acotar(texto: string, largo: number): string {
  const t = texto.trim().replace(/\s+/g, " ");
  if (t.length <= largo) return t;
  const corte = t.lastIndexOf(" ", largo - 1);
  return `${t.slice(0, corte > largo * 0.6 ? corte : largo - 1).replace(/[,;:·\-–—]+$/, "")}…`;
}

/** La primera frase de un texto libre, acotada. */
export function primeraFrase(
  texto: string | null | undefined,
  largo = 90,
): string | null {
  const t = (texto ?? "").replace(/\s+/g, " ").trim();
  if (!t) return null;
  const m = /^(.+?[.!?])(\s|$)/.exec(t);
  return acotar(m ? m[1]! : t, largo).replace(/…$/, "…");
}

export type DatosDeProducto = {
  titulo: string;
  descripcion: string | null;
  marca: string | null;
  categoria: string | null;
  tienda: string;
  ciudad: string | null;
  /** Ya formateado: «$3.48». */
  precio: string;
  /** `US` se despacha; cualquier otra cosa se retira. */
  paisOrigen: string | null;
  idioma: Idioma;
};

export function metaDeProducto(d: DatosDeProducto): {
  title: string;
  description: string;
  keywords: string[];
} {
  const titulo = titularNormal(d.titulo);
  const esUs = (d.paisOrigen ?? "").trim().toUpperCase() === "US";
  const en = d.idioma === "en";

  /* Título: producto + comercio; si no cabe, solo el producto. */
  const conTienda = `${titulo} · ${d.tienda}`;
  const title =
    conTienda.length <= LARGO_TITULO ? conTienda : acotar(titulo, LARGO_TITULO);

  /* Descripción: una frase con precio, la primera frase de la descripción si
     la hay, cómo se recibe, y cómo se paga. Se acota sin partir palabras. */
  const donde = esUs
    ? en
      ? "Free shipping across the United States, delivered in 2–5 days."
      : "Envío gratis a todo Estados Unidos, llega en 2 a 5 días."
    : en
      ? `Pick it up at ${d.tienda}${d.ciudad ? `, ${d.ciudad}` : ""}.`
      : `Retíralo en ${d.tienda}${d.ciudad ? `, ${d.ciudad}` : ""}.`;
  const precio = en
    ? `${titulo}${d.marca ? ` by ${d.marca}` : ""} for ${d.precio}.`
    : `${titulo}${d.marca ? ` de ${d.marca}` : ""} por ${d.precio}.`;
  const propia = primeraFrase(d.descripcion, 80);
  const pago = en
    ? "Pay by card or Zelle from the US on Mercatren."
    : "Paga con tarjeta o Zelle desde Estados Unidos en Mercatren.";
  const partes = [precio, propia, donde, pago].filter((p): p is string =>
    Boolean(p),
  );
  let description = partes.join(" ");
  /* Si no cabe, primero sale la frase propia (es la que más varía en largo). */
  if (description.length > LARGO_DESCRIPCION && propia) {
    description = [precio, donde, pago].join(" ");
  }
  description = acotar(description, LARGO_DESCRIPCION);

  const keywords = [
    titulo,
    d.marca,
    d.categoria,
    d.tienda,
    d.ciudad,
    "Mercatren",
    en
      ? esUs
        ? "free shipping USA"
        : "buy in Venezuela from the US"
      : esUs
        ? "envío gratis Estados Unidos"
        : "comprar en Venezuela desde Estados Unidos",
  ].filter((k): k is string => Boolean(k && k.trim()));

  return { title, description, keywords: [...new Set(keywords)] };
}

export type DatosDeTienda = {
  nombre: string;
  ciudad: string | null;
  descripcion: string | null;
  cuantos: number;
  paisOrigen: string | null;
  idioma: Idioma;
};

export function metaDeTienda(d: DatosDeTienda): {
  title: string;
  description: string;
  keywords: string[];
} {
  const en = d.idioma === "en";
  const esUs = (d.paisOrigen ?? "").trim().toUpperCase() === "US";
  const conCiudad = d.ciudad ? `${d.nombre} · ${d.ciudad}` : d.nombre;
  const title =
    conCiudad.length <= LARGO_TITULO
      ? conCiudad
      : acotar(d.nombre, LARGO_TITULO);
  const propia = primeraFrase(d.descripcion, 90);
  const quien = esUs
    ? en
      ? `${d.nombre}: a Mercatren store that ships across the United States.`
      : `${d.nombre}: tienda de Mercatren con envío a todo Estados Unidos.`
    : en
      ? `${d.nombre}: store${d.ciudad ? ` in ${d.ciudad}` : ""}, Venezuela.`
      : `${d.nombre}: comercio${d.ciudad ? ` en ${d.ciudad}` : ""}, Venezuela.`;
  const cuantos =
    d.cuantos > 0
      ? en
        ? `${d.cuantos} products.`
        : `${d.cuantos} productos.`
      : null;
  const pago = en
    ? esUs
      ? "Pay by card on Mercatren."
      : "Pay by card or Zelle from the US and pick up in store."
    : esUs
      ? "Paga con tarjeta en Mercatren."
      : "Paga con tarjeta o Zelle desde Estados Unidos y retira en tienda.";
  let description = [quien, propia, cuantos, pago]
    .filter((p): p is string => Boolean(p))
    .join(" ");
  if (description.length > LARGO_DESCRIPCION && propia)
    description = [quien, cuantos, pago].filter(Boolean).join(" ");
  description = acotar(description, LARGO_DESCRIPCION);
  const keywords = [
    d.nombre,
    d.ciudad,
    "Mercatren",
    en ? "store" : "tienda",
    en ? "buy from the US" : "comprar desde Estados Unidos",
  ].filter((k): k is string => Boolean(k));
  return { title, description, keywords: [...new Set(keywords)] };
}

export type DatosDeCatalogo = {
  busqueda?: string | null;
  categoria?: string | null;
  comercio?: string | null;
  total: number;
  idioma: Idioma;
  tituloBase: string;
  descripcionBase: string;
};

export function metaDeCatalogo(d: DatosDeCatalogo): {
  title: string;
  description: string;
} {
  const en = d.idioma === "en";
  const n = d.total;
  if (d.busqueda) {
    return {
      title: acotar(
        en ? `Results for “${d.busqueda}”` : `Resultados para «${d.busqueda}»`,
        LARGO_TITULO,
      ),
      description: acotar(
        en
          ? `${n} product${n === 1 ? "" : "s"} for “${d.busqueda}” on Mercatren. Pay by card or Zelle from the US; pick up in Venezuela or get it shipped in the US.`
          : `${n} producto${n === 1 ? "" : "s"} para «${d.busqueda}» en Mercatren. Paga con tarjeta o Zelle desde Estados Unidos; retira en Venezuela o recíbelo en Estados Unidos.`,
        LARGO_DESCRIPCION,
      ),
    };
  }
  if (d.categoria) {
    return {
      title: acotar(d.categoria, LARGO_TITULO),
      description: acotar(
        en
          ? `${d.categoria}: ${n} product${n === 1 ? "" : "s"} on Mercatren. Pay by card or Zelle from the US; pick up in Venezuela or get it shipped in the US.`
          : `${d.categoria}: ${n} producto${n === 1 ? "" : "s"} en Mercatren. Paga con tarjeta o Zelle desde Estados Unidos; retira en Venezuela o recíbelo en Estados Unidos.`,
        LARGO_DESCRIPCION,
      ),
    };
  }
  if (d.comercio) {
    return {
      title: acotar(
        en ? `Products from ${d.comercio}` : `Productos de ${d.comercio}`,
        LARGO_TITULO,
      ),
      description: acotar(
        en
          ? `${n} products from ${d.comercio} on Mercatren.`
          : `${n} productos de ${d.comercio} en Mercatren.`,
        LARGO_DESCRIPCION,
      ),
    };
  }
  return {
    title: d.tituloBase,
    description: acotar(d.descripcionBase, LARGO_DESCRIPCION),
  };
}
