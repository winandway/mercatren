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
    "Tus clientes ya tienen quien les pague desde Estados Unidos. Nosotros ponemos la tienda, el cobro y el comprobante. Tú pones el producto y la entrega.",
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
              "Tu ticket es de pocos dólares: la comisión no cubre el costo de verificar.",
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
              titulo: "Cobras en Estados Unidos, en dólares",
              texto:
                "sin cambio de divisas y sin que el dinero salga del país. Nosotros cobramos por cuenta tuya.",
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
              titulo: "Tu saldo, a la vista",
              texto:
                "cada venta verificada se acredita a tu billetera al instante, con su historial de movimientos.",
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
                "Revisamos tu registro mercantil, la identidad de tus dueños y tu proveedor. Firmamos el mandato que nos designa como tu agente de cobro. Es el paso más lento y es a propósito: es lo que hace que un banco tome esto en serio.",
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
                "Una persona lo verifica contra el banco. Cuando queda aprobado, te llega el aviso y el neto entra a tu billetera.",
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
            ["Cobrar en Estados Unidos", "No", "Sí"],
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
};

export const VENDER_EN: PaginaContenido = {
  titulo: "Sell on Mercatren",
  entradilla:
    "Your customers already have someone who can pay from the United States. We provide the store, the collection, and the paper trail. You provide the product and the delivery.",
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
              "Your ticket is a few dollars: the fee won't cover the cost of verifying.",
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
              titulo: "Your balance, in plain sight",
              texto:
                "every verified sale is credited to your wallet instantly, with its transaction history.",
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
                "We review your business registration, your owners' identity, and your supplier. We sign the mandate appointing us as your collection agent. It's the slowest step and that's deliberate: it's what makes a bank take this seriously.",
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
                "A person checks it against the bank. Once approved, you get the notice and the net amount lands in your wallet.",
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
};

/** Pagina de comisiones: un solo numero, explicado sin letra chica. */
export const COMISIONES_ES: PaginaContenido = {
  titulo: "Comisiones",
  entradilla:
    "Un solo cobro, sobre el valor del pedido, y nada más. Sin cuota mensual, sin costo de alta y sin letra chica.",
  secciones: [
    {
      id: "cuanto",
      titulo: "Cuánto cobramos",
      bloques: [
        {
          tipo: "cifras",
          items: [
            {
              valor: "3 %",
              texto: "sobre el valor del pedido, pagando por Zelle",
            },
            { valor: "US$ 0", texto: "de cuota mensual" },
            { valor: "US$ 0", texto: "por dar de alta tu tienda" },
            { valor: "US$ 0", texto: "por publicar productos" },
          ],
        },
        {
          tipo: "parrafo",
          texto:
            "La comisión sale del valor del pedido: si tu cliente paga US$ 1.000, a tu billetera entran US$ 970 y US$ 30 son nuestros. No se le cobra nada aparte al comprador.",
        },
      ],
    },
    {
      id: "por-que-distinto",
      titulo: "Por qué cada forma de pago cuesta distinto",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "La diferencia no es un capricho: es lo que cuesta cobrar por cada vía y el riesgo que trae cada una.",
        },
        {
          tipo: "tabla",
          encabezados: ["Forma de pago", "Comisión", "Por qué"],
          filas: [
            [
              "Zelle",
              "3 %",
              "No cuesta nada cobrar, acredita en minutos y no admite reversión.",
            ],
            [
              "Tarjeta",
              "5 %",
              "El procesador se lleva cerca del 3 % y la operación queda expuesta a contracargos durante meses, con el producto ya entregado.",
            ],
            [
              "Saldo de la billetera",
              "Sin costo",
              "El dinero ya está dentro del sistema: no hay que cobrarlo otra vez.",
            ],
          ],
          nota: "El pago con tarjeta y con saldo están en construcción. Hoy el cobro es por Zelle y transferencia desde bancos de Estados Unidos.",
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "Sobre el ticket bajo",
          parrafos: [
            "El 3 % funciona bien con pedidos grandes. En pedidos muy chicos, la comisión no alcanza a cubrir lo que cuesta verificar el pago a mano, así que en esos casos lo conversamos antes de darte de alta.",
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
                "Tu tienda dentro del sitio, con tu catálogo y tus precios.",
            },
            { texto: "El cobro en Estados Unidos por cuenta tuya." },
            { texto: "La verificación de cada pago contra el banco." },
            { texto: "El expediente documentado de cada operación." },
            { texto: "Tu billetera con el historial de movimientos." },
            { texto: "La importación y sincronización de tu catálogo." },
          ],
        },
      ],
    },
  ],
};

export const COMISIONES_EN: PaginaContenido = {
  titulo: "Fees",
  entradilla:
    "One charge, on the order value, and nothing else. No monthly fee, no setup cost, no fine print.",
  secciones: [
    {
      id: "cuanto",
      titulo: "What we charge",
      bloques: [
        {
          tipo: "cifras",
          items: [
            { valor: "3%", texto: "on the order value, paying by Zelle" },
            { valor: "US$0", texto: "monthly fee" },
            { valor: "US$0", texto: "to open your store" },
            { valor: "US$0", texto: "to list products" },
          ],
        },
        {
          tipo: "parrafo",
          texto:
            "The fee comes out of the order value: if your customer pays US$1,000, US$970 lands in your wallet and US$30 is ours. Nothing extra is charged to the buyer.",
        },
      ],
    },
    {
      id: "por-que-distinto",
      titulo: "Why each payment method costs differently",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "The difference isn't arbitrary: it's what it costs to collect each way, and the risk each one carries.",
        },
        {
          tipo: "tabla",
          encabezados: ["Payment method", "Fee", "Why"],
          filas: [
            [
              "Zelle",
              "3%",
              "Costs nothing to collect, clears in minutes, and can't be reversed.",
            ],
            [
              "Card",
              "5%",
              "The processor takes close to 3%, and the transaction stays exposed to chargebacks for months, with the product already delivered.",
            ],
            [
              "Wallet balance",
              "No cost",
              "The money is already inside the system: there's nothing to collect again.",
            ],
          ],
          nota: "Card and wallet payment are under construction. Today collection is by Zelle and transfer from US banks.",
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "About low tickets",
          parrafos: [
            "3% works well on large orders. On very small orders, the fee doesn't cover what it costs to verify the payment by hand, so in those cases we talk it through before onboarding you.",
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
                "Your store inside the site, with your catalog and prices.",
            },
            { texto: "Collection in the United States on your behalf." },
            { texto: "Verification of every payment against the bank." },
            { texto: "The documented file for each transaction." },
            { texto: "Your wallet with its transaction history." },
            { texto: "Importing and syncing your catalog." },
          ],
        },
      ],
    },
  ],
};
