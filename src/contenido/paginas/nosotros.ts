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
            "No somos un banco ni una casa de cambio, y no movemos dinero de nadie. Somos una tienda en línea: compramos mercancía a nuestros proveedores y la revendemos a compradores en Estados Unidos.",
        },
        {
          tipo: "cifras",
          items: [
            {
              valor: "EE. UU.",
              texto:
                "donde está registrada la sociedad y donde ocurre el cobro",
            },
            {
              valor: "3 %",
              texto:
                "el margen comercial incluido en el precio publicado; es todo nuestro ingreso",
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
            titulo: "Por el lado del cliente",
            tono: "ojo",
            puntos: [
              "Sus clientes tienen familia en Estados Unidos con capacidad de pago.",
              "Esa familia quiere pagarle al comercio, no mandar dinero suelto.",
              "No había una forma con comprobante de hacerlo.",
            ],
          },
          derecha: {
            titulo: "Por el lado del proveedor",
            tono: "ojo",
            puntos: [
              "El comercio le compra mercancía a un mayorista en Estados Unidos.",
              "Tiene que juntar dólares allá para pagarle.",
              "Cada quien lo resolvía como podía.",
            ],
          },
        },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "Lo que hace Mercatren",
          parrafos: [
            "Unimos las dos puntas en una sola operación documentada: el familiar compra productos identificados, nosotros cobramos ese pago en Estados Unidos, y con ese mismo dinero —siguiendo la instrucción escrita del comercio— pagamos las facturas que ese comercio tiene con su proveedor estadounidense. El comercio entrega el producto en su país. Cobramos 3 % por la gestión.",
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
                "quién compró, qué compró, quién pagó y adónde fue aplicado el dinero. Se puede reconstruir en los dos sentidos.",
            },
            {
              titulo: "Ningún pago se acepta solo",
              texto:
                "una persona del equipo verifica cada comprobante contra el banco antes de aprobarlo.",
            },
            {
              titulo: "El dinero de los comercios no es nuestro",
              texto:
                "nuestro ingreso es la venta del producto, y el costo de esa mercancía es el gasto que la respalda. Así figura en la contabilidad, con su factura de compra y su factura de venta.",
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
            "We are not a bank or a currency exchange, and we do not move anyone's money. We are an online store: we buy merchandise from our suppliers and resell it to buyers in the United States.",
        },
        {
          tipo: "cifras",
          items: [
            {
              valor: "USA",
              texto:
                "where the company is registered and where collection happens",
            },
            {
              valor: "3%",
              texto:
                "the commercial markup inside the published price; it is our entire revenue",
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
            titulo: "On the customer side",
            tono: "ojo",
            puntos: [
              "Their customers have family in the US with money to spend.",
              "That family wants to pay the merchant, not send loose cash.",
              "There was no documented way to do it.",
            ],
          },
          derecha: {
            titulo: "On the supplier side",
            tono: "ojo",
            puntos: [
              "The merchant buys goods from a US wholesaler.",
              "It has to gather dollars there to pay them.",
              "Everyone improvised their own solution.",
            ],
          },
        },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "What Mercatren does",
          parrafos: [
            "We join both ends into a single documented transaction: the family member buys identified products, we collect that payment in the United States, and with that same money — following the merchant's written instruction — we pay the invoices that merchant owes its US supplier. The merchant delivers the product in its own country. We charge 3% for handling it.",
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
                "who bought, what they bought, who paid, and where the money was applied. It can be reconstructed in both directions.",
            },
            {
              titulo: "No payment is accepted automatically",
              texto:
                "a member of our team verifies every receipt against the bank before approving it.",
            },
            {
              titulo: "Merchant money isn't ours",
              texto:
                "our revenue is the sale of the product, and the cost of that merchandise is the expense behind it. That is how the books show it, with its purchase invoice and its sales invoice.",
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
