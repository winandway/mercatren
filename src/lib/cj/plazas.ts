import type { Mercado } from "@/lib/mercado/mercados";

/**
 * LAS PLAZAS DEL CATÁLOGO DE CJ: UNA POR PAÍS DONDE MERCATREN VENDE DIRECTO.
 *
 * ══ QUÉ ES UNA PLAZA ══
 *
 * El mismo catálogo de CJ se vende en tres sitios —mercatren.com, mercatren.cl
 * y mercatren.com.co— y en cada uno cambian las mismas cinco cosas: a qué
 * tienda entra el producto, en qué moneda se publica, a dónde se despacha, con
 * qué respaldo de flete, y qué dice la ficha de la tienda. Una plaza es esa
 * tabla, escrita UNA vez.
 *
 * Sin esto, abrir Colombia habría sido copiar los `if (mercado === "CL")` de
 * Chile por el importador, el flete y las tiendas — y el primer país nuevo
 * siempre olvida uno. Es la misma decisión de `destino/direccion.ts`: una
 * TABLA por país, no un `if` repartido.
 *
 * ══ EL RESPALDO DE FLETE NUNCA ES CERO, Y POR PAÍS ══
 *
 * La regla de `envio-us.ts` vale aquí multiplicada: a Chile y Colombia el
 * envío es internacional y cuesta VARIAS veces el doméstico de EE. UU. Un
 * respaldo de $3.50 para Chile regalaría el margen en cada venta. Los $12 son
 * un estimado CONSERVADOR hasta que las compras de prueba den el número real
 * — se prefiere cobrar de más (se vende un poco menos) a cobrar de menos
 * (se regala margen para siempre y en silencio).
 */

export type Plaza = {
  /** El código del mercado donde se vende. */
  mercado: "US" | "CL" | "CO";
  /** La tienda general, el respaldo de todo rubro sin tienda propia. */
  tiendaGeneral: { id: string; slug: string; nombre: string };
  /** Prefijos de las tiendas por rubro. */
  prefijoTienda: string;
  prefijoSlug: string;
  /** En qué moneda se publica. La unidad menor la sabe `mercado/moneda.ts`. */
  moneda: "USD" | "CLP" | "COP";
  /** A qué país se despacha (es lo que viaja a CJ y decide el checkout). */
  paisEntrega: "US" | "CL" | "CO";
  /**
   * DE QUÉ ALMACÉN DE CJ SE SURTE ESTA PLAZA.
   *
   * Decisión del dueño (27 ago 2026): **Chile y Colombia se surten desde el
   * almacén de CHINA** — es como trabaja todo el dropshipping hacia
   * Latinoamérica, con un catálogo varias veces más grande. EE. UU. sigue con
   * su almacén local, que es lo que hace posible el «2 a 5 días».
   *
   * Este campo manda en TRES sitios a la vez —la búsqueda del catálogo, la
   * cotización del flete y el `fromCountryCode` del pedido— porque tenerlo
   * escrito tres veces es como uno de los tres se queda en «US» y el pedido
   * chileno intenta salir de un almacén donde el producto no está.
   */
  almacen: "US" | "CN";
  /** El respaldo del flete cuando CJ no cotiza. NUNCA cero. */
  envioEstimadoUsdCentavos: number;
  /** Referencia para cotizar flete: una dirección real del país. */
  cotizacion: { zip: string; provincia: string };
};

const PLAZAS: Record<string, Plaza> = {
  US: {
    mercado: "US",
    tiendaGeneral: {
      id: "tienda-mercatren-us",
      slug: "mercatren-us",
      nombre: "Mercatren · Estados Unidos",
    },
    prefijoTienda: "tienda-us-",
    prefijoSlug: "us-",
    moneda: "USD",
    paisEntrega: "US",
    almacen: "US",
    envioEstimadoUsdCentavos: 350,
    /* El domicilio de Mercatren LLC en Michigan, como siempre. */
    cotizacion: { zip: "48377", provincia: "MI" },
  },
  CL: {
    mercado: "CL",
    tiendaGeneral: {
      id: "tienda-mercatren-cl",
      slug: "mercatren-cl",
      nombre: "Mercatren · Chile",
    },
    prefijoTienda: "tienda-cl-",
    prefijoSlug: "cl-",
    moneda: "CLP",
    paisEntrega: "CL",
    almacen: "CN",
    envioEstimadoUsdCentavos: 1_200,
    /* Santiago, Región Metropolitana: donde vive la mayoría de la clientela. */
    cotizacion: { zip: "8320000", provincia: "RM" },
  },
  CO: {
    mercado: "CO",
    tiendaGeneral: {
      id: "tienda-mercatren-co",
      slug: "mercatren-co",
      nombre: "Mercatren · Colombia",
    },
    prefijoTienda: "tienda-co-",
    prefijoSlug: "co-",
    moneda: "COP",
    paisEntrega: "CO",
    almacen: "CN",
    envioEstimadoUsdCentavos: 1_200,
    /* Bogotá. */
    cotizacion: { zip: "110111", provincia: "DC" },
  },
};

/**
 * La plaza de un mercado. **Lo desconocido cae en Estados Unidos**, igual que
 * `mercadoPorHost`: es la plaza con datos de verdad detrás, y un catálogo en
 * la plaza equivocada se ve enseguida — una pantalla rota no.
 */
export function plazaDelMercado(mercado: Mercado): Plaza {
  return PLAZAS[mercado.codigo] ?? PLAZAS.US!;
}

/** La ficha de la tienda de una plaza. SIN prometer plazo fuera de EE. UU.:
 * el plazo real de CJ a Chile y Colombia lo dirán las compras de prueba, y
 * prometer «2 a 5 días» sin haberlo medido es un reclamo por venta. */
export function descripcionDePlaza(
  plaza: Plaza,
  nombre: { es: string; en: string },
  sociedad: string,
): { es: string; en: string } {
  if (plaza.mercado === "CL") {
    return {
      es: `${nombre.es} con entrega a domicilio en todo Chile, con el envío y el IVA incluidos en el precio. Vendido y facturado por ${sociedad}.`,
      en: `${nombre.en} delivered to your door anywhere in Chile, shipping and VAT included in the price. Sold and invoiced by ${sociedad}.`,
    };
  }
  if (plaza.mercado === "CO") {
    return {
      es: `${nombre.es} con entrega a domicilio en toda Colombia, con el envío incluido en el precio. Vendido y facturado por ${sociedad}.`,
      en: `${nombre.en} delivered to your door anywhere in Colombia, shipping included in the price. Sold and invoiced by ${sociedad}.`,
    };
  }
  return {
    es: `${nombre.es} con entrega en Estados Unidos en 2 a 5 días hábiles y el envío incluido en el precio. Vendido y facturado por ${sociedad}.`,
    en: `${nombre.en} delivered anywhere in the United States in 2 to 5 business days, shipping included in the price. Sold and invoiced by ${sociedad}.`,
  };
}

/**
 * El almacén del que sale un envío según su país de ENTREGA.
 *
 * Los códigos de mercado y de país de entrega coinciden en nuestras tres
 * plazas, así que la plaza se busca directo. Lo desconocido cae en EE. UU.,
 * como todo en este módulo.
 */
export function almacenDeEntrega(paisEntrega: string): "US" | "CN" {
  const plaza = PLAZAS[paisEntrega.trim().toUpperCase()];
  return plaza?.almacen ?? "US";
}
