import type { PaginaContenido } from "./tipos";

/**
 * "Vender en Mercatren": la pagina que abre el comercio que esta evaluando
 * si le conviene. Va en el menu de arriba, asi que es de las mas visitadas.
 *
 * Habla de lo que le importa a un comercio: cuanto cuesta, cuando cobra, que
 * tiene que hacer y que no. Cero promesas que no podamos cumplir hoy.
 */
export const VENDER_ES: PaginaContenido = {
  titulo: "Vende en Mercatren",
  entradilla:
    "Te compramos la mercancía y la revendemos a compradores en Estados Unidos. Tú pones el producto, tu precio y la entrega; nosotros ponemos el catálogo, la venta y la factura.",
  secciones: [
    {
      id: "para-quien",
      titulo: "Para quién es",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Para comercios establecidos fuera de Estados Unidos cuyos clientes tienen familia allá con capacidad de pago. Funciona especialmente bien con ticket alto: ferretería, materiales de construcción, repuestos, electrodomésticos, insumos.",
        },
        {
          tipo: "dosColumnas",
          izquierda: {
            titulo: "Encaja bien si",
            tono: "bien",
            puntos: [
              "Eres una empresa registrada, con dueños identificables.",
              "Le compras a un proveedor mayorista en Estados Unidos.",
              "Tus clientes ya te preguntan si un familiar puede pagarte desde allá.",
              "Tu ticket promedio pasa de unos cientos de dólares.",
            ],
          },
          derecha: {
            titulo: "No encaja si",
            tono: "ojo",
            puntos: [
              "Vendes como particular, sin empresa registrada.",
              "Buscas recibir dinero sin entregar un producto.",
              "Tu ticket es de pocos dólares: el margen no cubre el costo de gestionar cada operación.",
              "Vendes productos prohibidos o de origen que no puedas documentar.",
            ],
          },
        },
      ],
    },
    {
      id: "que-ganas",
      titulo: "Qué ganas",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Se te paga en Estados Unidos, en dólares",
              texto:
                "sin cambio de divisas. Te compramos la mercancía y te la pagamos contra tu factura, a una cuenta bancaria de Estados Unidos.",
            },
            {
              titulo: "Cada venta con su comprobante",
              texto:
                "quién compró, qué compró, quién pagó y cuándo. Es lo que te pide un banco o un contador, y aquí sale solo.",
            },
            {
              titulo: "Tu tienda dentro del sitio",
              texto:
                "con tu nombre, tu catálogo y tus precios. El cliente entra a tu tienda, no a un listado anónimo.",
            },
            {
              titulo: "Tu catálogo se trae solo",
              texto:
                "si ya lo tienes en otro sistema, lo importamos y después se mantiene sincronizado. No cargas todo otra vez a mano.",
            },
            {
              titulo: "Tus ventas, a la vista",
              texto:
                "cada venta verificada aparece al instante en tu panel, con lo que se te compró y lo que queda por pagarte.",
            },
          ],
        },
      ],
    },
    {
      id: "como-funciona",
      titulo: "Cómo funciona, paso a paso",
      bloques: [
        {
          tipo: "pasos",
          pasos: [
            {
              numero: "1",
              etiqueta: "Alta",
              titulo: "Nos escribes y verificamos tu empresa",
              parrafos: [
                "Revisamos tu registro mercantil y la identidad de tus dueños. Firmamos el acuerdo de compraventa: tú nos vendes la mercancía y nos facturas. Es el paso más lento y es a propósito: es lo que hace que un banco tome esto en serio.",
              ],
            },
            {
              numero: "2",
              etiqueta: "Catálogo",
              titulo: "Subimos tus productos",
              parrafos: [
                "Desde tu sistema actual o cargándolos en el panel. Tú fijas los precios, en dólares, y las existencias.",
              ],
            },
            {
              numero: "3",
              etiqueta: "Venta",
              titulo: "Tu cliente pide y su familiar paga",
              parrafos: [
                "El cliente arma el pedido y comparte el enlace con quien va a pagar en Estados Unidos. Ese enlace muestra qué se compra, a qué comercio y cuánto cuesta.",
              ],
            },
            {
              numero: "4",
              etiqueta: "Verificación",
              titulo: "Nosotros comprobamos el pago",
              parrafos: [
                "Una persona lo verifica contra el banco. Cuando queda aprobado, te llega el aviso y esa mercancía pasa a la lista de lo que se te compró.",
              ],
            },
            {
              numero: "5",
              etiqueta: "Entrega",
              titulo: "Tú entregas",
              parrafos: [
                "En tu país, a quien indicó el comprador, y registras la entrega. Ahí se cierra el ciclo.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "que-pones",
      titulo: "Qué pone cada uno",
      bloques: [
        {
          tipo: "tabla",
          encabezados: ["", "Tú", "Mercatren"],
          filas: [
            ["El producto y su precio", "Sí", "No"],
            ["La tienda en línea y el catálogo", "No", "Sí"],
            ["Que te paguen en Estados Unidos", "No", "Sí"],
            ["Verificar cada pago", "No", "Sí"],
            ["El comprobante de cada operación", "No", "Sí"],
            ["La entrega al cliente", "Sí", "No"],
            ["La atención al cliente sobre el producto", "Sí", "No"],
          ],
        },
      ],
    },
    {
      id: "empezar",
      titulo: "Cómo empezar",
      bloques: [
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "Escríbenos a mercatren@windoce.com",
          parrafos: [
            "Cuéntanos qué vendes, en qué país entregas y quién es tu proveedor en Estados Unidos. Te contestamos con los requisitos exactos para tu caso.",
            "Estamos en fase piloto y damos de alta pocos comercios a la vez, para acompañar bien a cada uno.",
          ],
        },
      ],
    },
  ],
  /**
   * El paso siguiente. Sin esto, quien terminaba de leer llegaba al pie sin
   * ningún camino: el único botón grande de abajo lo devolvía a esta misma
   * página.
   */
  accion: {
    titulo: "¿Listo para vender en Mercatren?",
    texto:
      "Crea tu cuenta y cuéntanos de tu comercio. Estamos en fase piloto: damos de alta pocos a la vez para acompañar bien a cada uno.",
    boton: "Crear mi cuenta de comercio",
    href: "/vender/empezar",
  },
};

export const VENDER_EN: PaginaContenido = {
  titulo: "Sell on Mercatren",
  entradilla:
    "We buy your merchandise and resell it to buyers in the United States. You provide the product, your price, and the delivery; we provide the catalog, the sale, and the invoice.",
  secciones: [
    {
      id: "para-quien",
      titulo: "Who it's for",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "For established merchants outside the United States whose customers have family there with money to spend. It works especially well at high ticket: hardware, building materials, parts, appliances, supplies.",
        },
        {
          tipo: "dosColumnas",
          izquierda: {
            titulo: "Good fit if",
            tono: "bien",
            puntos: [
              "You're a registered company with identifiable owners.",
              "You buy from a wholesale supplier in the United States.",
              "Your customers already ask whether a relative can pay you from there.",
              "Your average ticket runs into the hundreds of dollars.",
            ],
          },
          derecha: {
            titulo: "Not a fit if",
            tono: "ojo",
            puntos: [
              "You sell as an individual, with no registered company.",
              "You're looking to receive money without delivering a product.",
              "Your ticket is a few dollars: the markup will not cover the cost of handling each transaction.",
              "You sell prohibited goods or goods you can't document the origin of.",
            ],
          },
        },
      ],
    },
    {
      id: "que-ganas",
      titulo: "What you get",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "You collect in the United States, in dollars",
              texto:
                "no currency conversion, and the money never leaves the country. We collect on your behalf.",
            },
            {
              titulo: "Every sale with its paper trail",
              texto:
                "who bought, what they bought, who paid, and when. It's what a bank or an accountant asks for, and here it's generated automatically.",
            },
            {
              titulo: "Your own store inside the site",
              texto:
                "with your name, your catalog, and your prices. Customers land on your store, not an anonymous listing.",
            },
            {
              titulo: "Your catalog comes in automatically",
              texto:
                "if it's already in another system, we import it and keep it synced. You don't re-enter everything by hand.",
            },
            {
              titulo: "Your sales, in plain sight",
              texto:
                "every verified sale appears in your panel instantly, with what we bought from you and what is still owed to you.",
            },
          ],
        },
      ],
    },
    {
      id: "como-funciona",
      titulo: "How it works, step by step",
      bloques: [
        {
          tipo: "pasos",
          pasos: [
            {
              numero: "1",
              etiqueta: "Onboarding",
              titulo: "You write to us and we verify your company",
              parrafos: [
                "We review your business registration and your owners' identity. We sign the sale-of-goods agreement: you sell us the merchandise and invoice us. It's the slowest step and that's deliberate: it's what makes a bank take this seriously.",
              ],
            },
            {
              numero: "2",
              etiqueta: "Catalog",
              titulo: "We load your products",
              parrafos: [
                "From your current system or entered in the panel. You set the prices, in dollars, and the stock.",
              ],
            },
            {
              numero: "3",
              etiqueta: "Sale",
              titulo: "Your customer orders and their relative pays",
              parrafos: [
                "The customer builds the order and shares the link with whoever will pay in the United States. That link shows what's being bought, from which merchant, and for how much.",
              ],
            },
            {
              numero: "4",
              etiqueta: "Verification",
              titulo: "We verify the payment",
              parrafos: [
                "A person checks it against the bank. Once approved, you get the notice and that merchandise moves onto the list of what we bought from you.",
              ],
            },
            {
              numero: "5",
              etiqueta: "Delivery",
              titulo: "You deliver",
              parrafos: [
                "In your country, to whoever the buyer named, and you record the delivery. That closes the cycle.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "que-pones",
      titulo: "Who provides what",
      bloques: [
        {
          tipo: "tabla",
          encabezados: ["", "You", "Mercatren"],
          filas: [
            ["The product and its price", "Yes", "No"],
            ["The online store and catalog", "No", "Yes"],
            ["Collecting in the United States", "No", "Yes"],
            ["Verifying every payment", "No", "Yes"],
            ["The record of each transaction", "No", "Yes"],
            ["Delivery to the customer", "Yes", "No"],
            ["Customer support about the product", "Yes", "No"],
          ],
        },
      ],
    },
    {
      id: "empezar",
      titulo: "How to start",
      bloques: [
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "Write to mercatren@windoce.com",
          parrafos: [
            "Tell us what you sell, which country you deliver in, and who your US supplier is. We'll reply with the exact requirements for your case.",
            "We're in pilot phase and onboard a few merchants at a time, so we can support each one properly.",
          ],
        },
      ],
    },
  ],
  accion: {
    titulo: "Ready to sell on Mercatren?",
    texto:
      "Create your account and tell us about your business. We're in pilot: we onboard a few at a time so we can support each one properly.",
    boton: "Create my merchant account",
    href: "/vender/empezar",
  },
};

/**
 * Como se forma el precio.
 *
 * REESTRUCTURACION LEGAL (agosto de 2026). Antes esta pagina se llamaba
 * "Comisiones" y presentaba un 3 % retenido sobre el dinero cobrado. Eso
 * describe una agencia de cobro. Lo que ocurre de verdad es una compraventa:
 * el comercio nos vende la mercancia a su precio y Windoce, LLC la revende a
 * un precio final propio. Nuestro ingreso es la diferencia entre los dos.
 */
export const COMISIONES_ES: PaginaContenido = {
  titulo: "Cómo se forma el precio",
  entradilla:
    "Tú pones el precio al que nos vendes. Nosotros ponemos el precio al que revendemos. La diferencia es nuestro margen, y está dentro del precio publicado.",
  secciones: [
    {
      id: "dos-precios",
      titulo: "Hay dos precios, y cada uno lo pone quien corresponde",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Cuando alguien compra en Mercatren, ocurren dos compraventas seguidas: Windoce, LLC te compra la mercancía a ti, y se la vende al comprador. Por eso hay dos precios.",
        },
        {
          tipo: "tabla",
          encabezados: ["El precio", "Quién lo pone", "Qué es"],
          filas: [
            [
              "Precio de compra",
              "Tú, el proveedor",
              "Lo que Windoce, LLC te paga por la mercancía. Es el importe de tu factura y es el que cobras.",
            ],
            [
              "Precio publicado",
              "Windoce, LLC",
              "Lo que paga el comprador. Es el precio final: incluye nuestro margen comercial y no lleva cargos aparte.",
            ],
          ],
          nota: "El margen es la diferencia entre los dos. No es un porcentaje que se te retenga de un cobro: es la ganancia de revender un producto propio.",
        },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "Lo que cobras no depende de la forma de pago",
          parrafos: [
            "El comprador puede pagar con tarjeta o por transferencia; a ti se te paga siempre el precio de tu factura. El costo de cobrar por una vía u otra corre por nuestra cuenta y ya está considerado en el precio que publicamos.",
          ],
        },
      ],
    },
    {
      id: "cobrar",
      titulo: "Cómo y cuándo cobras",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Contra factura",
              texto:
                "cada compra que te hacemos lleva tu factura a nombre de Windoce, LLC. Sin esa factura la operación no se cierra.",
            },
            {
              titulo: "A una cuenta bancaria de Estados Unidos",
              texto:
                "el importe de la mercancía comprada se paga a la cuenta que nos indiques, según lo acordado por escrito contigo.",
            },
            {
              titulo: "Sin cuota mensual ni costo de alta",
              texto:
                "publicar tu catálogo, sincronizarlo y mantener tu ficha no tiene costo.",
            },
          ],
        },
        {
          tipo: "cifras",
          items: [
            { valor: "US$ 0", texto: "de cuota mensual" },
            { valor: "US$ 0", texto: "por publicar tu catálogo" },
            { valor: "US$ 0", texto: "por sincronizar tus productos" },
          ],
        },
      ],
    },
    {
      id: "que-incluye",
      titulo: "Qué incluye",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              texto:
                "Tu catálogo publicado dentro del sitio, con tus productos y tus fotos.",
            },
            {
              texto:
                "La venta al comprador en Estados Unidos, a nuestro nombre.",
            },
            {
              texto:
                "La verificación de que cada pago viene de un banco estadounidense.",
            },
            { texto: "El expediente documentado de cada operación." },
            { texto: "La importación y sincronización de tu catálogo." },
          ],
        },
      ],
    },
  ],
};

export const COMISIONES_EN: PaginaContenido = {
  titulo: "How the price is formed",
  entradilla:
    "You set the price you sell to us at. We set the price we resell at. The difference is our markup, and it sits inside the published price.",
  secciones: [
    {
      id: "dos-precios",
      titulo: "There are two prices, each set by the right party",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "When someone buys on Mercatren, two sales happen back to back: Windoce, LLC buys the merchandise from you, and sells it to the buyer. That is why there are two prices.",
        },
        {
          tipo: "tabla",
          encabezados: ["The price", "Who sets it", "What it is"],
          filas: [
            [
              "Purchase price",
              "You, the supplier",
              "What Windoce, LLC pays you for the merchandise. It is the amount on your invoice and what you get paid.",
            ],
            [
              "Published price",
              "Windoce, LLC",
              "What the buyer pays. It is the final price: it includes our commercial markup and carries no separate charges.",
            ],
          ],
          nota: "The markup is the difference between the two. It is not a percentage withheld from something collected for you: it is the profit on reselling our own product.",
        },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "What you get paid does not depend on the payment method",
          parrafos: [
            "The buyer may pay by card or by bank transfer; you are always paid the amount on your invoice. The cost of accepting one method or another is ours, and it is already accounted for in the price we publish.",
          ],
        },
      ],
    },
    {
      id: "cobrar",
      titulo: "How and when you get paid",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Against an invoice",
              texto:
                "every purchase we make from you carries your invoice issued to Windoce, LLC. Without that invoice the transaction does not close.",
            },
            {
              titulo: "To a US bank account",
              texto:
                "the amount for merchandise purchased is paid to the account you designate, as agreed with you in writing.",
            },
            {
              titulo: "No monthly charge, no setup cost",
              texto:
                "publishing your catalog, syncing it, and maintaining your storefront cost nothing.",
            },
          ],
        },
        {
          tipo: "cifras",
          items: [
            { valor: "US$ 0", texto: "per month" },
            { valor: "US$ 0", texto: "to publish your catalog" },
            { valor: "US$ 0", texto: "to sync your products" },
          ],
        },
      ],
    },
    {
      id: "que-incluye",
      titulo: "What's included",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              texto:
                "Your catalog published inside the site, with your products and your photos.",
            },
            { texto: "The sale to the US buyer, made in our name." },
            { texto: "Verification that every payment comes from a US bank." },
            { texto: "The documented file for every transaction." },
            { texto: "Catalog import and synchronization." },
          ],
        },
      ],
    },
  ],
};
