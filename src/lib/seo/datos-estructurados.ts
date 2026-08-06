import { SITIO } from "@/lib/sitio";

/**
 * LO QUE GOOGLE LEE DE CADA PÁGINA, en su propio idioma.
 *
 * Una ficha de producto sin esto es, para Google, una página cualquiera con
 * texto: sale en los resultados como un enlace azul y nada más. Con esto sale
 * con **el precio y "en stock" dentro del resultado**, que es lo que decide
 * si alguien hace clic. Con 622 productos publicados, esa diferencia no es un
 * detalle.
 *
 * DOS REGLAS AL ESCRIBIR ESTAS FICHAS:
 *
 * 1. **Solo se declara lo que es cierto.** Google penaliza los datos que no
 *    coinciden con lo que se ve en la página, y una política de devoluciones
 *    o un plazo de envío inventados serían además una promesa al comprador
 *    que nadie acordó. Lo que no sabemos, no se escribe.
 *
 * 2. **Quien vende es Windoce, LLC.** El comercio surte la mercancía, pero
 *    quien le vende y le factura al comprador somos nosotros — esa es la
 *    figura jurídica del negocio (ver CLAUDE.md). Poner al comercio como
 *    `seller` le diría a Google, y a cualquiera que lea el código fuente,
 *    exactamente lo contrario de lo que dicen los términos.
 */

/**
 * EL JSON, LISTO PARA METER EN UN `<script>` SIN QUE PUEDA ESCAPARSE.
 *
 * Los títulos y descripciones los escribe el comercio, no nosotros. Si uno
 * pusiera `</script>` dentro del nombre de un producto —por travesura o por
 * pegar mal un texto—, el navegador cerraría ahí el bloque y todo lo que
 * viniera después se ejecutaría como HTML de la página. Escapando `<` como
 * `<` el JSON sigue significando exactamente lo mismo y deja de poder
 * cerrar la etiqueta.
 *
 * TODO JSON-LD DEL SITIO PASA POR AQUÍ. Si aparece un `JSON.stringify` suelto
 * dentro de un `dangerouslySetInnerHTML`, está mal.
 */
export function comoJsonLd(datos: unknown): string {
  return JSON.stringify(datos)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");
}

/** Centavos enteros → el texto que espera schema.org ("12.50"). */
function aPrecio(centavos: number): string {
  return (centavos / 100).toFixed(2);
}

function url(locale: string, ruta: string): string {
  return `${SITIO.url}/${locale}${ruta}`;
}

/** La sociedad, tal como se identifica en todas las fichas. */
function vendedor() {
  return {
    "@type": "Organization",
    name: SITIO.nombre,
    legalName: SITIO.sociedad,
    url: SITIO.url,
  };
}

export type ProductoParaGoogle = {
  slug: string;
  titulo: string;
  descripcion: string | null;
  precioCentavos: number;
  moneda: string;
  existencias: number;
  controlaExistencias: boolean;
  sku: string | null;
  marca: string | null;
  categoria: string | null;
  imagenes: string[];
};

export function fichaDeProducto(p: ProductoParaGoogle, locale: string) {
  /**
   * DISPONIBLE O NO, según lo mismo que ve el cliente en pantalla. Un producto
   * que no lleva cuenta de existencias (el cemento que se vende por kilo)
   * siempre está disponible; los demás, solo si queda algo.
   */
  const hay = !p.controlaExistencias || p.existencias > 0;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.titulo,
    ...(p.descripcion ? { description: p.descripcion } : {}),
    ...(p.imagenes.length > 0 ? { image: p.imagenes } : {}),
    ...(p.sku ? { sku: p.sku } : {}),
    ...(p.marca ? { brand: { "@type": "Brand", name: p.marca } } : {}),
    ...(p.categoria ? { category: p.categoria } : {}),
    offers: {
      "@type": "Offer",
      url: url(locale, `/producto/${p.slug}`),
      price: aPrecio(p.precioCentavos),
      priceCurrency: p.moneda,
      // El precio publicado ya trae todo incluido: es el que se cobra.
      availability: hay
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: vendedor(),
    },
  };
}

/**
 * LAS MIGAS DE PAN. Con esto Google enseña "Mercatren › Ferretería › Tubo PVC"
 * en vez de la dirección cruda, que nadie lee.
 */
export function migasDePan(
  pasos: { nombre: string; ruta: string }[],
  locale: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: pasos.map((paso, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: paso.nombre,
      item: url(locale, paso.ruta),
    })),
  };
}

export type TiendaParaGoogle = {
  slug: string;
  nombre: string;
  descripcion: string | null;
  ciudad: string | null;
  telefono: string | null;
  sitioWeb: string | null;
  logoUrl: string | null;
};

/**
 * LA FICHA DE UN COMERCIO.
 *
 * Va como `Store` y no como `LocalBusiness` a secas porque es exactamente
 * eso: una tienda con mercancía que se retira en un sitio físico. La
 * dirección solo se declara si el comercio la cargó — inventar una ubicación
 * mandaría gente a un lugar equivocado.
 */
export function fichaDeTienda(t: TiendaParaGoogle, locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: t.nombre,
    ...(t.descripcion ? { description: t.descripcion } : {}),
    ...(t.logoUrl ? { image: t.logoUrl } : {}),
    ...(t.telefono ? { telephone: t.telefono } : {}),
    ...(t.sitioWeb ? { sameAs: [t.sitioWeb] } : {}),
    ...(t.ciudad
      ? {
          address: {
            "@type": "PostalAddress",
            addressLocality: t.ciudad,
            addressCountry: "VE",
          },
        }
      : {}),
    url: url(locale, `/tienda/${t.slug}`),
    // Se vende a través de Mercatren: es lo que dice la página y lo que dicen
    // los términos.
    parentOrganization: vendedor(),
  };
}
