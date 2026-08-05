/**
 * EL DICCIONARIO: cómo se habla de Mercatren.
 *
 * No es un glosario de estilo. Es la lista de palabras que describen una
 * figura jurídica distinta de la nuestra, y por qué cada una es peligrosa.
 *
 * De dónde salió: el 5 ago 2026 el abogado y el contable revisaron el sitio y
 * encontraron que estaba escrito como una AGENCIA DE COBRO —"cobramos y
 * liquidamos ese pago", "comisión del 3%"—, que es palabra por palabra la
 * definición de money transmission en Estados Unidos. Es la redacción por la
 * que los bancos cierran cuentas. Se corrigió el sitio entero; esta página
 * existe para que el equipo no lo deshaga hablando.
 *
 * CÓMO SE MANTIENE: cada vez que alguien del equipo use una palabra de la
 * columna roja —en una llamada, en un correo, en un chat— se agrega aquí la
 * entrada con su porqué. Este archivo crece con los errores reales, no con
 * los que uno se imagina.
 *
 * Los textos van en los dos idiomas porque las dos versiones del sitio tienen
 * el mismo problema: "settlement" es tan peligroso como "liquidación".
 */

export type EntradaDiccionario = {
  /** Ancla y clave estable. No se renombra: se enlaza desde otros sitios. */
  id: string;
  mal: { es: string; en: string };
  bien: { es: string; en: string };
  /** Por qué la palabra roja es un problema, no solo por qué la otra es mejor. */
  porQue: { es: string; en: string };
  /** Gravedad: `critico` describe money transmission; `cuidado` confunde. */
  nivel: "critico" | "cuidado";
};

export type GrupoDiccionario = {
  id: string;
  titulo: { es: string; en: string };
  entradilla: { es: string; en: string };
  entradas: EntradaDiccionario[];
};

export const DICCIONARIO: GrupoDiccionario[] = [
  {
    id: "el-dinero",
    titulo: {
      es: "El dinero: de quién es y qué se hace con él",
      en: "The money: whose it is and what happens to it",
    },
    entradilla: {
      es: "Aquí está el grupo que costó la reestructuración entera. Cada una de estas palabras dice que el dinero es de otro y que nosotros lo movemos. Eso es money transmission, y exige licencias que no tenemos.",
      en: "This is the group that caused the entire restructuring. Every one of these words says the money belongs to someone else and that we move it. That is money transmission, and it requires licenses we do not have.",
    },
    entradas: [
      {
        id: "cobrar-por-cuenta-de",
        nivel: "critico",
        mal: {
          es: "Cobramos por cuenta del comercio",
          en: "We collect on behalf of the merchant",
        },
        bien: {
          es: "Vendemos el producto y facturamos",
          en: "We sell the product and invoice it",
        },
        porQue: {
          es: "«Por cuenta de» significa que actúas para otro. Si cobras para otro, ese dinero es suyo y tú solo lo tienes de paso: eso es exactamente lo que la ley llama transmitir dinero.",
          en: '"On behalf of" means you act for someone else. If you collect for someone else, that money is theirs and you merely hold it in transit — which is precisely what the law calls transmitting money.',
        },
      },
      {
        id: "liquidar",
        nivel: "critico",
        mal: {
          es: "Le liquidamos al comercio / liquidación",
          en: "We settle with the merchant / settlement",
        },
        bien: {
          es: "Le pagamos la mercancía que le compramos",
          en: "We pay for the merchandise we bought",
        },
        porQue: {
          es: "Liquidar es entregarle a alguien lo que ya era suyo. Nosotros no entregamos nada de nadie: pagamos el precio de una compra que hicimos.",
          en: "Settling means handing someone what was already theirs. We hand over nothing of anyone's: we pay the price of a purchase we made.",
        },
      },
      {
        id: "saldo",
        nivel: "critico",
        mal: {
          es: "Su saldo / su billetera",
          en: "Their balance / their wallet",
        },
        bien: {
          es: "Lo que se le debe pagar por la mercancía",
          en: "What is owed to them for the merchandise",
        },
        porQue: {
          es: "Un saldo es dinero de otro guardado por ti. Lo nuestro es una deuda comercial: le debemos el precio de una compra, como cualquier empresa le debe a su proveedor.",
          en: "A balance is someone else's money held by you. Ours is a trade payable: we owe them the price of a purchase, like any company owes its supplier.",
        },
      },
      {
        id: "fondos",
        nivel: "critico",
        mal: {
          es: "Retenemos los fondos / custodia",
          en: "We hold the funds / custody",
        },
        bien: {
          es: "El pago recibido es ingreso de la venta",
          en: "The payment received is revenue from the sale",
        },
        porQue: {
          es: "Retener fondos implica que no son tuyos. El dinero que entra es nuestro desde el momento de la venta, porque vendimos un producto.",
          en: "Holding funds implies they are not yours. Money coming in is ours from the moment of the sale, because we sold a product.",
        },
      },
      {
        id: "comision",
        nivel: "critico",
        mal: { es: "Cobramos 3% de comisión", en: "We charge a 3% fee" },
        bien: {
          es: "El margen va dentro del precio publicado",
          en: "The markup is inside the published price",
        },
        porQue: {
          es: "Una comisión es un porcentaje que le quitas a un dinero ajeno. Un margen es la diferencia entre lo que te costó algo y lo que lo vendiste. La primera describe un intermediario; la segunda, un comerciante.",
          en: "A fee is a percentage taken out of someone else's money. A markup is the difference between what something cost you and what you sold it for. The first describes an intermediary; the second, a merchant.",
        },
      },
      {
        id: "remesa",
        nivel: "critico",
        mal: {
          es: "Es como una remesa / envío de dinero",
          en: "It's like a remittance / money transfer",
        },
        bien: {
          es: "Es la compra de un producto que se entrega en otra dirección",
          en: "It's the purchase of a product delivered to another address",
        },
        porQue: {
          es: "En una remesa alguien recibe dinero. Aquí nadie recibe dinero nunca: se recibe un producto. Comparar el servicio con una remesa, aunque sea para explicarlo rápido, es regalarle la categoría equivocada a quien escucha.",
          en: "In a remittance someone receives money. Here nobody ever receives money: they receive a product. Comparing the service to a remittance, even as a quick explanation, hands the listener the wrong category.",
        },
      },
    ],
  },

  {
    id: "quien-es-quien",
    titulo: {
      es: "Quién es quién",
      en: "Who is who",
    },
    entradilla: {
      es: "Los nombres de las partes también dicen una figura. «Pagador» y «beneficiario» son las palabras de un giro de dinero; «comprador» y «dirección de entrega» son las de una tienda.",
      en: 'The names of the parties describe a structure too. "Payer" and "beneficiary" are the words of a money transfer; "buyer" and "delivery address" are the words of a store.',
    },
    entradas: [
      {
        id: "agente",
        nivel: "critico",
        mal: {
          es: "Somos el agente / intermediario",
          en: "We are the agent / intermediary",
        },
        bien: {
          es: "Somos el vendedor. Compramos y revendemos",
          en: "We are the seller. We buy and resell",
        },
        porQue: {
          es: "Un agente actúa en nombre de otro y no es dueño de nada. Nosotros compramos la mercancía a nombre propio: somos dueños de lo que vendemos, aunque sea por un instante.",
          en: "An agent acts in someone else's name and owns nothing. We buy the merchandise in our own name: we own what we sell, even if only for an instant.",
        },
      },
      {
        id: "pagador",
        nivel: "cuidado",
        mal: {
          es: "El pagador / el familiar que paga",
          en: "The payer / the family member paying",
        },
        bien: { es: "El comprador", en: "The buyer" },
        porQue: {
          es: "Un pagador manda dinero; un comprador compra algo. Además, quien paga ES el cliente: no está pagando por otro, está comprando para sí y pidiendo que se entregue en otra dirección.",
          en: "A payer sends money; a buyer buys something. And whoever pays IS the customer: they are not paying for someone else, they are buying for themselves and asking for delivery elsewhere.",
        },
      },
      {
        id: "beneficiario",
        nivel: "cuidado",
        mal: {
          es: "El beneficiario en Venezuela",
          en: "The beneficiary in Venezuela",
        },
        bien: {
          es: "La dirección de entrega designada",
          en: "The designated delivery address",
        },
        porQue: {
          es: "Beneficiario es quien recibe un dinero. Quien está allá recibe una caja y firma un papel de entrega, igual que cuando te mandan un regalo por internet.",
          en: "A beneficiary is someone who receives money. The person there receives a box and signs a delivery slip, exactly as when someone sends you a gift online.",
        },
      },
      {
        id: "comercio-vendedor",
        nivel: "cuidado",
        mal: {
          es: "El comercio que vende en Mercatren",
          en: "The merchant who sells on Mercatren",
        },
        bien: {
          es: "El proveedor que nos vende la mercancía",
          en: "The supplier who sells us the merchandise",
        },
        porQue: {
          es: "Si él vende al cliente, nosotros somos una plataforma y él es el vendedor: vuelve la agencia. Él nos vende a NOSOTROS; nosotros vendemos al cliente.",
          en: "If he sells to the customer, we are a platform and he is the seller: the agency structure comes right back. He sells to US; we sell to the customer.",
        },
      },
    ],
  },

  {
    id: "la-mercancia",
    titulo: {
      es: "La mercancía y los papeles",
      en: "The merchandise and the paperwork",
    },
    entradilla: {
      es: "La estructura de reventa se demuestra con documentos, no con redacción. Si falta la factura de compra, ninguna palabra la sostiene.",
      en: "A resale structure is proven with documents, not with wording. If the purchase invoice is missing, no wording holds it up.",
    },
    entradas: [
      {
        id: "stock-propio",
        nivel: "cuidado",
        mal: {
          es: "Los productos que sube son nuestros",
          en: "The products he uploads are ours",
        },
        bien: {
          es: "Publicar el catálogo es una oferta de venta; la propiedad pasa al venderse",
          en: "Publishing the catalog is an offer to sell; title passes when it sells",
        },
        porQue: {
          es: "No somos dueños del inventario y no debemos decir que lo somos: está en su galpón y es suyo. La propiedad pasa en el instante de la venta, y pasa dos veces: de él a nosotros, y de nosotros al comprador.",
          en: "We do not own the inventory and must not claim we do: it sits in their warehouse and it is theirs. Title passes at the moment of sale, and it passes twice: from them to us, and from us to the buyer.",
        },
      },
      {
        id: "factura-de-compra",
        nivel: "critico",
        mal: {
          es: "Le damos una factura al proveedor",
          en: "We give the supplier an invoice",
        },
        bien: {
          es: "Él nos factura a nosotros; nosotros le mandamos la orden de compra",
          en: "They invoice us; we send them the purchase order",
        },
        porQue: {
          es: "La factura la emite siempre quien vende. En esa punta el que vende es él. Nosotros emitimos la orden de compra, y la factura la emitimos en su nombre solo si él lo autorizó por escrito (autofacturación).",
          en: "An invoice is always issued by whoever sells. On that end, they are the seller. We issue the purchase order; we may issue the invoice in their name only if they authorized it in writing (self-billing).",
        },
      },
      {
        id: "su-dinero",
        nivel: "critico",
        mal: {
          es: "Le vamos entregando su dinero",
          en: "We hand over their money bit by bit",
        },
        bien: {
          es: "Le pagamos la mercancía que le compramos",
          en: "We pay them for the merchandise we bought",
        },
        porQue: {
          es: "«Su dinero» vuelve a decir que guardamos plata ajena, que es justo el problema que se corrigió. Es el precio de una compra que le debemos.",
          en: '"Their money" says once again that we hold someone else\'s cash — exactly the problem that was fixed. It is the price of a purchase we owe them.',
        },
      },
      {
        id: "envio",
        nivel: "cuidado",
        mal: {
          es: "Nosotros lo enviamos / lo llevamos",
          en: "We ship it / we deliver it",
        },
        bien: {
          es: "Se retira en el depósito indicado en el producto",
          en: "It is picked up at the warehouse listed on the product",
        },
        porQue: {
          es: "Hoy no hay transporte propio ni contratado. Prometer una entrega que no se puede cumplir cuesta más caro que no ofrecerla, y en ferretería mover una lámina de zinc pide un camión.",
          en: "Today there is no owned or contracted transport. Promising a delivery you cannot fulfill costs more than not offering it, and in hardware moving a zinc sheet takes a truck.",
        },
      },
    ],
  },

  {
    id: "como-conversar",
    titulo: {
      es: "Cómo conversar: tres reglas para una llamada",
      en: "How to talk about it: three rules for a call",
    },
    entradilla: {
      es: "Casi todos los resbalones pasan hablando, no escribiendo. Estas tres cosas resuelven la mayoría.",
      en: "Almost every slip happens while talking, not writing. These three rules cover most of them.",
    },
    entradas: [
      {
        id: "empieza-por-la-venta",
        nivel: "cuidado",
        mal: {
          es: "Empezar explicando cómo llega el dinero",
          en: "Starting by explaining how the money arrives",
        },
        bien: {
          es: "Empezar por lo que se vende y quién lo compra",
          en: "Starting with what is sold and who buys it",
        },
        porQue: {
          es: "Si arrancas por el dinero, el que escucha te encasilla como algo financiero y ya no sale de ahí. Arranca siempre por el producto: «vendemos material de ferretería a compradores en Estados Unidos».",
          en: 'If you open with the money, the listener files you under "financial" and never moves. Always open with the product: "we sell hardware supplies to buyers in the United States."',
        },
      },
      {
        id: "una-frase",
        nivel: "cuidado",
        mal: {
          es: "Explicarlo con el circuito completo de una",
          en: "Explaining the whole circuit at once",
        },
        bien: {
          es: "Una frase: compramos al proveedor y revendemos al comprador",
          en: "One sentence: we buy from the supplier and resell to the buyer",
        },
        porQue: {
          es: "La frase corta se repite igual cada vez, y eso es lo que hace que la historia no cambie según quién la cuente. Si preguntan más, entonces se abre el detalle.",
          en: "The short sentence repeats identically every time, which is what keeps the story from changing depending on who tells it. If they ask for more, then open up the detail.",
        },
      },
      {
        id: "no-califiques",
        nivel: "critico",
        mal: {
          es: "«Eso no es money transmission» / «no necesitamos licencia»",
          en: '"That\'s not money transmission" / "we don\'t need a license"',
        },
        bien: {
          es: "Describir la operación y dejar que el abogado la califique",
          en: "Describe the operation and let the lawyer classify it",
        },
        porQue: {
          es: "Nadie del equipo puede afirmar la calificación regulatoria del negocio, ni a favor ni en contra. Se describe qué pasa —quién compra, quién factura, qué se entrega— y esa descripción se defiende sola.",
          en: "Nobody on the team can assert the regulatory classification of the business, for or against. Describe what happens — who buys, who invoices, what is delivered — and that description defends itself.",
        },
      },
    ],
  },
];

/** Cuántas entradas hay, para el contador de la pantalla. */
export function cuantasEntradas(): number {
  return DICCIONARIO.reduce((n, g) => n + g.entradas.length, 0);
}
