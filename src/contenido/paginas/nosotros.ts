import type { PaginaContenido } from "./tipos";

/**
 * Quienes somos.
 *
 * La pagina que lee alguien que llego al sitio y quiere saber si esto es
 * serio: quien esta detras, de donde sale la idea y como se gana el dinero.
 * Sin humo y sin cifras inventadas.
 */
export const NOSOTROS_ES: PaginaContenido = {
  titulo: "Quiénes somos",
  entradilla:
    "Mercatren nació de un problema real: hay familias en Estados Unidos que quieren comprarle a un comercio de su país de origen, y no había una forma ordenada y documentada de hacerlo.",
  secciones: [
    {
      id: "la-empresa",
      titulo: "La empresa",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Mercatren es un servicio operado por Windoce, LLC, una sociedad registrada en Estados Unidos. Somos un equipo pequeño que construye software para comercio transfronterizo.",
        },
        {
          tipo: "parrafo",
          texto:
            "Somos una tienda en línea. Compramos la mercancía a nuestros proveedores, la revendemos a compradores en Estados Unidos y emitimos factura en cada paso. Cada operación queda documentada de punta a punta.",
        },
        {
          tipo: "cifras",
          items: [
            {
              valor: "EE. UU.",
              texto:
                "donde está registrada la sociedad y donde ocurre la venta",
            },
            {
              valor: "3 %",
              texto:
                "el margen comercial incluido en el precio publicado según la forma de pago; es todo nuestro ingreso",
            },
            {
              valor: "5 años",
              texto: "que conservamos el expediente de cada operación",
            },
            {
              valor: "0 US$",
              texto: "sale de Estados Unidos en cualquier punto del ciclo",
            },
          ],
        },
      ],
    },
    {
      id: "el-problema",
      titulo: "El problema que resolvemos",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Un comercio fuera de Estados Unidos tiene dos problemas al mismo tiempo, y hasta ahora los resolvía por separado y a mano.",
        },
        {
          tipo: "dosColumnas",
          izquierda: {
            titulo: "Por el lado del comprador",
            tono: "ojo",
            puntos: [
              "Tiene familia en su país de origen y quiere resolverle algo concreto.",
              "Quiere comprar un producto de una tienda que conoce, con precio cerrado.",
              "Y quiere pagarlo desde su banco de Estados Unidos, con su factura.",
            ],
          },
          derecha: {
            titulo: "Por el lado del comercio",
            tono: "ojo",
            puntos: [
              "Quiere venderle a compradores en Estados Unidos.",
              "Montar allá una empresa, una cuenta y una tienda es lento y caro.",
              "Su catálogo ya existe; lo que le falta es la vitrina.",
            ],
          },
        },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "Lo que hace Mercatren",
          parrafos: [
            "Unimos las dos puntas en una sola operación documentada. El comprador elige productos identificados del catálogo y nos paga el precio publicado desde su banco en Estados Unidos. Con ese ingreso le compramos esa misma mercancía al proveedor, a nombre propio y con factura a nuestro nombre. El proveedor la entrega en la dirección designada por el comprador, y nosotros le emitimos su factura de venta.",
            "Nuestro ingreso es el margen comercial que ya viene incluido en el precio publicado: un 3 %, igual con tarjeta que por Zelle. El comprador ve un precio cerrado, y el comercio tiene una vitrina en Estados Unidos sin montar operación allá.",
          ],
        },
      ],
    },
    {
      id: "como-trabajamos",
      titulo: "Cómo trabajamos",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Cada operación deja expediente",
              texto:
                "quién compró, qué compró, quién pagó y qué mercancía salió. Se puede reconstruir en los dos sentidos.",
            },
            {
              titulo: "Ningún pago se acepta solo",
              texto:
                "una persona del equipo verifica cada comprobante contra el banco antes de aprobarlo.",
            },
            {
              titulo: "Cada venta tiene sus dos facturas",
              texto:
                "la de compra al proveedor y la de venta al comprador. Nuestro ingreso es el precio de venta; la mercancía es el costo que lo respalda. Así figura en la contabilidad y así se declara.",
            },
            {
              titulo: "Lo privado es privado",
              texto:
                "los montos, los comprobantes y los datos de quienes pagan no salen nunca a las páginas públicas.",
            },
          ],
        },
      ],
    },
    {
      id: "transparencia",
      titulo: "Transparencia por defecto",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Publicamos cómo funciona la operación con el mismo detalle con el que se la explicamos a un banco. No hay una versión para clientes y otra para reguladores: es la misma.",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "El modelo de negocio completo",
              texto:
                "el ciclo del dinero paso a paso, qué cruza la frontera y qué no, y la economía de cada pedido. Está en la sección de documentación.",
            },
            {
              titulo: "Nuestros límites",
              texto:
                "lo que no hacemos está escrito con la misma claridad que lo que sí hacemos.",
            },
            {
              titulo: "Un buzón real",
              texto: "mercatren@windoce.com. Escribe y contesta una persona.",
            },
          ],
        },
      ],
    },
  ],
  cierre:
    "Mercatren es una marca de Windoce, LLC, sociedad registrada en Estados Unidos. El servicio está en fase piloto con su primer comercio en operación.",
};

export const NOSOTROS_EN: PaginaContenido = {
  titulo: "About us",
  entradilla:
    "Mercatren came out of a real problem: families in the United States want to buy from a merchant back home, and there was no orderly, documented way to do it.",
  secciones: [
    {
      id: "la-empresa",
      titulo: "The company",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Mercatren is a service operated by Windoce, LLC, a company registered in the United States. We're a small team building software for cross-border commerce.",
        },
        {
          tipo: "parrafo",
          texto:
            "We are an online store. We buy merchandise from our suppliers, resell it to buyers in the United States, and issue an invoice at every step. Every transaction is documented end to end.",
        },
        {
          tipo: "cifras",
          items: [
            {
              valor: "USA",
              texto:
                "where the company is registered and where the sale happens",
            },
            {
              valor: "3%",
              texto:
                "the commercial markup built into the published price, depending on payment method; it is our entire revenue",
            },
            {
              valor: "5 years",
              texto: "we retain the file for every transaction",
            },
            {
              valor: "US$0",
              texto: "leaves the United States at any point in the cycle",
            },
          ],
        },
      ],
    },
    {
      id: "el-problema",
      titulo: "The problem we solve",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "A merchant outside the United States has two problems at once, and until now solved them separately and by hand.",
        },
        {
          tipo: "dosColumnas",
          izquierda: {
            titulo: "On the buyer's side",
            tono: "ojo",
            puntos: [
              "They have family back home and something specific they want to solve.",
              "They want to buy from a store they know, at a price that's locked in.",
              "And to pay for it from their US bank, with an invoice to show for it.",
            ],
          },
          derecha: {
            titulo: "On the merchant's side",
            tono: "ojo",
            puntos: [
              "They want to sell to buyers in the United States.",
              "Standing up a company, a bank account and a storefront there is slow and expensive.",
              "Their catalog already exists — what's missing is the storefront.",
            ],
          },
        },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "What Mercatren does",
          parrafos: [
            "We join both ends into a single documented transaction. The buyer picks identified products from the catalog and pays us the published price from their US bank. With that revenue we buy those same goods from the supplier, in our own name and with the invoice made out to us. The supplier delivers to the address the buyer designated, and we issue the buyer a sales invoice.",
            "Our revenue is the commercial markup already built into the published price: 3%, whether the buyer pays by card or through Zelle. The buyer gets a price that's locked in, and the merchant gets a storefront in the United States without setting up operations there.",
          ],
        },
      ],
    },
    {
      id: "como-trabajamos",
      titulo: "How we work",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Every transaction leaves a file",
              texto:
                "who bought, what they bought, who paid, and what merchandise shipped. It can be reconstructed in both directions.",
            },
            {
              titulo: "No payment is accepted automatically",
              texto:
                "a member of our team verifies every receipt against the bank before approving it.",
            },
            {
              titulo: "Every sale has both invoices",
              texto:
                "the purchase invoice from the supplier and the sales invoice to the buyer. Our revenue is the sale price; the merchandise is the cost behind it. That is how the books show it and how it is filed.",
            },
            {
              titulo: "Private stays private",
              texto:
                "amounts, payment records, and buyer details never appear on public pages.",
            },
          ],
        },
      ],
    },
    {
      id: "transparencia",
      titulo: "Transparent by default",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "We publish how the operation works in the same detail we'd explain it to a bank. There isn't a customer version and a regulator version: it's the same one.",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "The full business model",
              texto:
                "the contractual structure step by step, what crosses the border and what doesn't, and the regulatory framing. It's in the documentation section.",
            },
            {
              titulo: "Our limits",
              texto: "what we don't do is written as clearly as what we do.",
            },
            {
              titulo: "A real inbox",
              texto: "mercatren@windoce.com. Write, and a person answers.",
            },
          ],
        },
      ],
    },
  ],
  cierre:
    "Mercatren is a brand of Windoce, LLC, a company registered in the United States. The service is in pilot phase with its first merchant in operation.",
};
