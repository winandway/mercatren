import type { PaginaContenido } from "./tipos";

/**
 * Terminos y condiciones del servicio.
 *
 * REESTRUCTURACION LEGAL (agosto de 2026). La version anterior describia a
 * Mercatren como una plataforma que recaudaba para el comercio y que no era
 * dueña de la mercancia. Eso describe una agencia, y contradice la
 * estructura real. Ahora el contrato dice lo que de verdad ocurre: Windoce,
 * LLC compra la mercancia a nombre propio y la revende al comprador.
 *
 * La clausula central es la seccion 2. Si el resto del sitio dice reventa y
 * el contrato dice agencia, la contradiccion anula el trabajo entero.
 *
 * Describen COMO FUNCIONA la operacion, en el mismo lenguaje llano del resto
 * del sitio. No afirman la calificacion regulatoria del servicio: eso lo
 * decide el abogado del proyecto, no esta pagina.
 *
 * El correo de contacto es SIEMPRE mercatren@windoce.com (el buzon real). Ver
 * src/lib/correo/direcciones.ts.
 */
export const TERMINOS_ES: PaginaContenido = {
  titulo: "Términos y condiciones",
  entradilla:
    "Las reglas del servicio de Mercatren: qué hacemos, qué no hacemos, cómo se paga, cómo se entrega y qué puedes esperar de nosotros.",
  vigencia: "Versión 1 · Vigentes desde el 5 de agosto de 2026",
  indiceTitulo: "En esta página",
  secciones: [
    {
      id: "quienes-somos",
      numero: "1",
      titulo: "Quiénes somos",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Mercatren es un servicio de comercio electrónico transfronterizo operado por Windoce, LLC, una sociedad registrada en Estados Unidos. Cuando en este documento decimos «nosotros», nos referimos a Windoce, LLC operando bajo la marca Mercatren.",
        },
        {
          tipo: "parrafo",
          texto:
            "Al crear una cuenta, hacer un pedido o abrir una tienda en mercatren.com, aceptas estos términos. Si no estás de acuerdo con ellos, no uses el servicio.",
        },
      ],
    },
    {
      id: "que-hacemos",
      numero: "2",
      titulo: "Qué hacemos y qué no",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Windoce, LLC vende productos por cuenta propia. Cuando compras en mercatren.com, compras un producto a Windoce, LLC y designas la dirección donde debe entregarse. Windoce, LLC adquiere esa mercancía al proveedor a nombre propio y te la revende.",
        },
        {
          tipo: "aviso",
          tono: "acento",
          titulo: "La cláusula central de este contrato",
          parrafos: [
            "Windoce, LLC actúa como principal en las dos puntas de la operación: compra la mercancía para sí y la revende al comprador. La propiedad de la mercancía pasa del proveedor a Windoce, LLC, y de Windoce, LLC al comprador.",
            "El precio publicado es el precio final de venta e incluye nuestro margen comercial. No se agregan cargos posteriores por el producto.",
            "Windoce, LLC no actúa como agente, fiduciario ni depositario de ninguna de las partes, y no recibe ni administra dinero de terceros. El importe que pagas es el precio de un producto vendido, no dinero destinado a otra persona.",
          ],
        },
        {
          tipo: "dosColumnas",
          izquierda: {
            titulo: "Lo que sí hacemos",
            tono: "bien",
            puntos: [
              "Vendemos productos por cuenta propia y emitimos la factura de venta.",
              "Compramos la mercancía al proveedor con factura a nombre de Windoce, LLC.",
              "Fijamos y publicamos el precio final de venta.",
              "Verificamos que cada pago provenga de un banco de Estados Unidos.",
              "Documentamos cada operación de punta a punta.",
            ],
          },
          derecha: {
            titulo: "Lo que no hacemos",
            tono: "ojo",
            puntos: [
              "No somos una entidad financiera y no ofrecemos cuentas.",
              "No recibimos ni administramos dinero de terceros.",
              "No entregamos dinero a nadie: entregamos productos.",
              "No actuamos como representantes de ninguna de las partes.",
              "No hacemos cambio de divisas: operamos solo en dólares estadounidenses.",
            ],
          },
        },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "Qué recibe quien está en la dirección de entrega",
          parrafos: [
            "Un producto físico, y nada más. La persona que recibe la mercancía en la dirección designada no es parte de este contrato y no recibe dinero en ninguna forma. Es la misma figura que cuando alguien compra un regalo en línea y lo hace enviar a otra dirección.",
          ],
        },
      ],
    },
    {
      id: "tu-cuenta",
      numero: "3",
      titulo: "Tu cuenta",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Hace falta cuenta para comprar",
              texto:
                "el pago tiene que poder acreditarse a alguien y tú tienes que poder seguir tu pedido.",
            },
            {
              titulo: "Los datos deben ser reales",
              texto:
                "tu nombre y tu correo se usan para verificar el pago y para avisarte. Un dato falso puede hacer que tu pago no se apruebe.",
            },
            {
              titulo: "Tu contraseña es tuya",
              texto:
                "no la compartas. Si crees que alguien entró a tu cuenta, escríbenos y la aseguramos.",
            },
            {
              titulo: "Una cuenta por persona",
              texto:
                "abrir varias cuentas para fraccionar pagos por debajo de nuestros límites de revisión es motivo de cierre.",
            },
          ],
        },
      ],
    },
    {
      id: "como-se-compra",
      numero: "4",
      titulo: "Cómo funciona una compra",
      bloques: [
        {
          tipo: "pasos",
          pasos: [
            {
              numero: "1",
              etiqueta: "Tú",
              titulo: "Eliges los productos y confirmas el pedido",
              parrafos: [
                "Al confirmar, el sistema vuelve a leer de nuestra base el precio y la disponibilidad de cada producto. El total del pedido es el que sale de esa lectura, no el que estuviera guardado en tu navegador.",
              ],
            },
            {
              numero: "2",
              etiqueta: "Tú",
              titulo: "Pagas y subes el comprobante",
              parrafos: [
                "En la página de tu pedido aparece el correo de Zelle que recibe y el monto exacto. Haces el envío y subes la captura.",
              ],
            },
            {
              numero: "3",
              etiqueta: "Nosotros",
              titulo: "Verificamos el pago contra el banco",
              parrafos: [
                "Una persona de nuestro equipo comprueba que el pago llegó de verdad y que el monto calza con tu pedido. No hay acreditación automática.",
              ],
            },
            {
              numero: "4",
              etiqueta: "Nosotros",
              titulo: "Compramos la mercancía al proveedor",
              parrafos: [
                "Con tu compra cerrada, Windoce, LLC adquiere al proveedor la mercancía que te vendió, con factura emitida a nombre de Windoce, LLC.",
              ],
            },
            {
              numero: "5",
              etiqueta: "El proveedor",
              titulo: "Entrega el producto en la dirección designada",
              parrafos: [
                "El proveedor entrega la mercancía en la dirección que indicaste, y queda constancia de la entrega. Recibes la factura de venta a tu nombre y tu pedido se cierra.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "precios",
      numero: "5",
      titulo: "Precios e impuestos",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "El precio publicado es el precio final",
              texto:
                "está en dólares de Estados Unidos e incluye nuestro margen comercial. No se te cobra nada aparte por el producto. Los precios pueden cambiar en cualquier momento; el que vale es el del momento en que confirmas el pedido.",
            },
            {
              titulo: "El precio lo fija y lo publica Windoce, LLC",
              texto:
                "el proveedor nos vende la mercancía a su precio; el precio al que te la vendemos a ti lo fijamos y lo publicamos nosotros, y es el que ves en el catálogo.",
            },
            {
              titulo: "El envío y los impuestos",
              texto:
                "cuando apliquen, se mostrarán en el pedido antes de que pagues. Hoy la mercancía se retira en el depósito indicado en cada producto.",
            },
            {
              titulo: "Errores evidentes de precio",
              texto:
                "si un producto aparece con un precio claramente equivocado, podemos cancelar el pedido y devolverte lo pagado. No estamos obligados a vender a un precio publicado por error.",
            },
          ],
        },
      ],
    },
    {
      id: "pagos",
      numero: "6",
      titulo: "Formas de pago",
      bloques: [
        {
          tipo: "aviso",
          tono: "acento",
          titulo: "Solo se aceptan pagos desde bancos de Estados Unidos",
          parrafos: [
            "Todo el circuito de dinero ocurre dentro de Estados Unidos. No aceptamos transferencias internacionales, SWIFT, efectivo ni criptomonedas.",
          ],
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "El pago debe salir de una cuenta a tu nombre",
              texto:
                "si el titular de la cuenta que paga no coincide con la cuenta que hizo el pedido, el pago se detiene para revisión.",
            },
            {
              titulo: "El monto debe calzar exactamente",
              texto:
                "un pago por un monto distinto al del pedido no se acepta automáticamente.",
            },
            {
              titulo: "Un pago por pedido",
              texto:
                "no dividimos un pedido entre varios compradores ni un pago entre varios pedidos.",
            },
          ],
        },
      ],
    },
    {
      id: "verificacion",
      numero: "7",
      titulo: "Verificación y rechazo de pagos",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Nada se acepta automáticamente. Antes de dar por bueno un pago verificamos la identidad de quien pagó, contrastamos su nombre contra listas de sanciones, comprobamos que el monto calce y revisamos que no haya patrones de fraccionamiento.",
        },
        {
          tipo: "parrafo",
          texto:
            "Si un pago no puede aprobarse, te lo decimos con el motivo y puedes subir un comprobante nuevo. Podemos rechazar o revertir una operación, y cerrar una cuenta, cuando la información no cuadre, cuando el pago no pueda verificarse o cuando detectemos un uso que ponga en riesgo el servicio.",
        },
      ],
    },
    {
      id: "entregas",
      numero: "8",
      titulo: "Entregas, cancelaciones, devoluciones y disputas",
      bloques: [
        {
          tipo: "aviso",
          tono: "acento",
          titulo: "Nos respondes a nosotros, y nosotros te respondemos a ti",
          parrafos: [
            "Como vendedor de la mercancía, Windoce, LLC responde ante ti por el producto que compraste. No tienes que reclamarle al proveedor ni negociar con él: tu contrato es con nosotros.",
          ],
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "La entrega",
              texto:
                "se hace en la dirección que designaste. Los plazos y la forma de entrega se informan en el pedido, y queda constancia con la fecha y la identificación de quien recibe.",
            },
            {
              titulo: "Antes de que el pago se apruebe",
              texto: "puedes cancelar el pedido sin costo escribiéndonos.",
            },
            {
              titulo: "Si el pago ya se aprobó",
              texto:
                "la cancelación depende de si la mercancía ya salió a entrega. Escríbenos y te confirmamos el estado de tu pedido.",
            },
            {
              titulo: "Si el producto llega dañado, incompleto o distinto",
              texto:
                "escríbenos dentro de los 7 días siguientes a la entrega, con fotos. Repondremos el producto, lo cambiaremos o te devolveremos el importe pagado, a tu elección entre las opciones disponibles.",
            },
            {
              titulo: "Si el producto no se entrega",
              texto:
                "te devolvemos el importe pagado íntegro. Esa responsabilidad es nuestra y no depende de lo que ocurra con el proveedor.",
            },
            {
              titulo: "Disputas",
              texto:
                "escríbenos primero a mercatren@windoce.com: la mayoría se resuelve en el mismo día. Si el reclamo no se resuelve, se dirime conforme a la ley aplicable indicada en la sección de cierre de estos términos, y conservamos toda la documentación de la operación durante cinco años para sustentarlo.",
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "Las devoluciones vuelven por donde vinieron",
          parrafos: [
            "Todo reintegro se hace a la misma cuenta desde la que se pagó, nunca a una cuenta distinta ni a un tercero.",
          ],
        },
      ],
    },
    {
      id: "comercios",
      numero: "9",
      titulo: "Si publicas tu catálogo como proveedor",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Los comercios que publican su catálogo en Mercatren son empresas independientes que nos venden mercancía. Al publicar tu catálogo aceptas además lo siguiente:",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Nos vendes la mercancía y nos facturas",
              texto:
                "cuando se produce una venta, Windoce, LLC te compra esa mercancía y tú emites factura a nombre de Windoce, LLC. No nos designas como tu representante para nada, y no vendemos nada por cuenta tuya.",
            },
            {
              titulo: "Tú pones tu precio; nosotros ponemos el nuestro",
              texto:
                "el precio al que nos vendes lo fijas tú. El precio al que Windoce, LLC revende al comprador lo fijamos y lo publicamos nosotros, e incluye nuestro margen comercial.",
            },
            {
              titulo: "Respondes por lo que publicas",
              texto:
                "los productos, sus descripciones y su legalidad son tu responsabilidad. No se publican productos prohibidos, falsificados ni de origen dudoso.",
            },
            {
              titulo: "Despachas a la dirección de la orden",
              texto:
                "en el plazo que anuncias, y registras la entrega en el sistema.",
            },
            {
              titulo: "Se te paga la mercancía contra factura",
              texto:
                "el importe de la mercancía comprada se paga a una cuenta bancaria de Estados Unidos, contra tu factura, según lo acordado por escrito contigo. Es el pago de una compra, no la entrega de dinero de un tercero.",
            },
            {
              titulo: "Verificación previa",
              texto:
                "antes de activarte comprobamos tu registro mercantil, la identidad de tus dueños y tu contraste contra listas de sanciones.",
            },
          ],
        },
      ],
    },
    {
      id: "uso-correcto",
      numero: "10",
      titulo: "Uso correcto del servicio",
      bloques: [
        {
          tipo: "parrafo",
          texto: "No se permite usar Mercatren para:",
        },
        {
          tipo: "lista",
          puntos: [
            {
              texto:
                "Hacer llegar dinero a una persona disfrazándolo de compra de productos.",
            },
            {
              texto:
                "Fraccionar operaciones para quedar por debajo de nuestros umbrales de revisión.",
            },
            {
              texto:
                "Pagar con cuentas o medios que no sean tuyos, o con dinero de origen ilícito.",
            },
            {
              texto:
                "Comprar o vender productos prohibidos por la ley de Estados Unidos o del país de entrega.",
            },
            { texto: "Suplantar a otra persona o empresa." },
          ],
        },
        {
          tipo: "parrafo",
          texto:
            "Detectada cualquiera de estas conductas, detenemos la operación, cerramos la cuenta y conservamos el expediente.",
        },
      ],
    },
    {
      id: "responsabilidad",
      numero: "11",
      titulo: "Nuestra responsabilidad",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Respondemos por lo que vendemos: que el producto sea el que compraste y que se entregue en la dirección que designaste. Nuestra responsabilidad frente a un pedido no supera el importe de ese pedido.",
        },
        {
          tipo: "parrafo",
          texto:
            "No respondemos por la calidad, la idoneidad ni la legalidad de los productos que publica cada comercio, ni por retrasos causados por terceros (bancos, transportistas, aduanas). Tampoco garantizamos que el servicio esté disponible sin interrupciones.",
        },
      ],
    },
    {
      id: "datos",
      numero: "12",
      titulo: "Tus datos",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Tratamos tus datos como se explica en nuestra política de privacidad. En resumen: recogemos lo necesario para operar y verificar, guardamos los registros de cada operación durante cinco años, y no vendemos tus datos a nadie.",
        },
      ],
    },
    {
      id: "cambios",
      numero: "13",
      titulo: "Cambios, ley aplicable y contacto",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Podemos actualizar estos términos",
              texto:
                "y la fecha de vigencia de arriba cambia. Si el cambio es importante, te avisamos. Seguir usando el servicio después de un cambio significa que lo aceptas.",
            },
            {
              titulo: "Ley aplicable",
              texto:
                "estos términos se rigen por las leyes de los Estados Unidos de América y del estado donde está registrada Windoce, LLC.",
            },
            {
              titulo: "Escríbenos",
              texto:
                "para cualquier duda, reclamo o solicitud sobre estos términos, a mercatren@windoce.com. Contestamos por ahí.",
            },
          ],
        },
      ],
    },
  ],
  cierre:
    "Mercatren es una marca de Windoce, LLC, sociedad registrada en Estados Unidos. Este documento describe las condiciones del servicio; no constituye asesoramiento legal, contable ni fiscal.",
};

export const TERMINOS_EN: PaginaContenido = {
  titulo: "Terms and conditions",
  entradilla:
    "The rules of the Mercatren service: what we do, what we don't do, how payment works, how delivery works, and what you can expect from us.",
  vigencia: "Version 1 · Effective August 5, 2026",
  indiceTitulo: "On this page",
  secciones: [
    {
      id: "quienes-somos",
      numero: "1",
      titulo: "Who we are",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Mercatren is a cross-border ecommerce service operated by Windoce, LLC, a company registered in the United States. Where these terms say “we,” that means Windoce, LLC operating under the Mercatren brand.",
        },
        {
          tipo: "parrafo",
          texto:
            "By creating an account, placing an order, or opening a store on mercatren.com, you accept these terms. If you do not agree with them, do not use the service.",
        },
      ],
    },
    {
      id: "que-hacemos",
      numero: "2",
      titulo: "What we do and what we don't",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Windoce, LLC sells products for its own account. When you buy on mercatren.com, you buy a product from Windoce, LLC and designate the address where it must be delivered. Windoce, LLC acquires that merchandise from the supplier in its own name and resells it to you.",
        },
        {
          tipo: "aviso",
          tono: "acento",
          titulo: "The central clause of this contract",
          parrafos: [
            "Windoce, LLC acts as principal on both ends of the transaction: it buys the merchandise for itself and resells it to the buyer. Title to the merchandise passes from the supplier to Windoce, LLC, and from Windoce, LLC to the buyer.",
            "The published price is the final sale price and includes our commercial markup. No additional charges are added for the product.",
            "Windoce, LLC does not act as an agent, fiduciary, or custodian for any party, and does not receive or administer money belonging to third parties. What you pay is the price of a product sold, not money destined for another person.",
          ],
        },
        {
          tipo: "dosColumnas",
          izquierda: {
            titulo: "What we do",
            tono: "bien",
            puntos: [
              "Sell products for our own account and issue the sales invoice.",
              "Buy the merchandise from the supplier, invoiced to Windoce, LLC.",
              "Set and publish the final sale price.",
              "Verify that every payment originates from a US bank.",
              "Document every transaction end to end.",
            ],
          },
          derecha: {
            titulo: "What we don't do",
            tono: "ojo",
            puntos: [
              "We are not a financial institution and we do not offer accounts.",
              "We do not receive or administer money belonging to third parties.",
              "We do not deliver money to anyone: we deliver products.",
              "We do not act as a representative of any party.",
              "We do not exchange currency: we operate only in US dollars.",
            ],
          },
        },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "What the person at the delivery address receives",
          parrafos: [
            "A physical product, and nothing else. The person who receives the merchandise at the designated address is not a party to this contract and receives no money in any form. It is the same arrangement as when someone buys a gift online and has it shipped to a different address.",
          ],
        },
      ],
    },
    {
      id: "tu-cuenta",
      numero: "3",
      titulo: "Your account",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "An account is required to buy",
              texto:
                "payment has to be attributable to someone, and you need to be able to track your order.",
            },
            {
              titulo: "Your details must be real",
              texto:
                "your name and email are used to verify payment and to notify you. False information can cause your payment to be declined.",
            },
            {
              titulo: "Your password is yours",
              texto:
                "don't share it. If you think someone accessed your account, write to us and we'll secure it.",
            },
            {
              titulo: "One account per person",
              texto:
                "opening multiple accounts to split payments below our review thresholds is grounds for closure.",
            },
          ],
        },
      ],
    },
    {
      id: "como-se-compra",
      numero: "4",
      titulo: "How a purchase works",
      bloques: [
        {
          tipo: "pasos",
          pasos: [
            {
              numero: "1",
              etiqueta: "You",
              titulo: "Choose your products and confirm the order",
              parrafos: [
                "On confirmation, the system re-reads each product's price and availability from our database. The order total comes from that reading, not from whatever was stored in your browser.",
              ],
            },
            {
              numero: "2",
              etiqueta: "You",
              titulo: "Pay and upload the receipt",
              parrafos: [
                "Your order page shows the Zelle address that receives the payment and the exact amount. You send it and upload the screenshot.",
              ],
            },
            {
              numero: "3",
              etiqueta: "Us",
              titulo: "We verify the payment against the bank",
              parrafos: [
                "A member of our team confirms the payment actually arrived and that the amount matches your order. Nothing is credited automatically.",
              ],
            },
            {
              numero: "4",
              etiqueta: "Us",
              titulo: "We buy the merchandise from the supplier",
              parrafos: [
                "With your purchase closed, Windoce, LLC acquires from the supplier the merchandise it sold you, with an invoice issued to Windoce, LLC.",
              ],
            },
            {
              numero: "5",
              etiqueta: "The supplier",
              titulo: "Delivers the product to the designated address",
              parrafos: [
                "The supplier delivers the merchandise to the address you designated, and the delivery is recorded. You receive the sales invoice in your name and your order is closed.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "precios",
      numero: "5",
      titulo: "Prices and taxes",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "The published price is the final price",
              texto:
                "it is in US dollars and includes our commercial markup. Nothing extra is charged for the product. Prices can change at any time; the price that applies is the one at the moment you confirm the order.",
            },
            {
              titulo: "The price is set and published by Windoce, LLC",
              texto:
                "the supplier sells us the merchandise at its price; the price at which we resell it to you is set and published by us, and it is the one you see in the catalog.",
            },
            {
              titulo: "Shipping and taxes",
              texto:
                "where they apply, they are shown on the order before you pay. Today the merchandise is picked up at the warehouse listed on each product.",
            },
            {
              titulo: "Obvious pricing errors",
              texto:
                "if a product appears at a clearly incorrect price, we may cancel the order and refund you. We are not obliged to sell at a price published in error.",
            },
          ],
        },
      ],
    },
    {
      id: "pagos",
      numero: "6",
      titulo: "Payment methods",
      bloques: [
        {
          tipo: "aviso",
          tono: "acento",
          titulo: "We only accept payments from US banks",
          parrafos: [
            "The entire commercial transaction happens inside the United States. We do not accept international transfers, SWIFT, cash, or cryptocurrency.",
          ],
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Payment must come from an account in your name",
              texto:
                "if the paying account holder does not match the account that placed the order, the payment is held for review.",
            },
            {
              titulo: "The amount must match exactly",
              texto:
                "a payment for an amount different from the order is not accepted automatically.",
            },
            {
              titulo: "One payment per order",
              texto:
                "we do not split an order across several buyers, or a payment across several orders.",
            },
          ],
        },
      ],
    },
    {
      id: "verificacion",
      numero: "7",
      titulo: "Payment verification and rejection",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Nothing is accepted automatically. Before approving a payment we verify the buyer's identity, screen their name against sanctions lists, confirm the amount matches, and check for structuring patterns.",
        },
        {
          tipo: "parrafo",
          texto:
            "If a payment cannot be approved, we tell you the reason and you can upload a new receipt. We may reject or reverse a transaction, and close an account, when information does not add up, when a payment cannot be verified, or when we detect use that puts the service at risk.",
        },
      ],
    },
    {
      id: "entregas",
      numero: "8",
      titulo: "Delivery, cancellations, returns, and disputes",
      bloques: [
        {
          tipo: "aviso",
          tono: "acento",
          titulo: "You answer to us, and we answer to you",
          parrafos: [
            "As the seller of the merchandise, Windoce, LLC is answerable to you for the product you bought. You do not have to claim against the supplier or negotiate with them: your contract is with us.",
          ],
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Delivery",
              texto:
                "takes place at the address you designated. Timeframes and delivery method are shown on the order, and the delivery is recorded with its date and the identity of the person receiving it.",
            },
            {
              titulo: "Before your payment is approved",
              texto: "you can cancel the order at no cost by writing to us.",
            },
            {
              titulo: "Once payment is approved",
              texto:
                "cancellation depends on whether the merchandise has already gone out for delivery. Write to us and we'll confirm the status of your order.",
            },
            {
              titulo:
                "If the product arrives damaged, incomplete, or different",
              texto:
                "write to us within 7 days of delivery, with photos. We will replace the product, exchange it, or refund what you paid, at your choice among the options available.",
            },
            {
              titulo: "If the product is not delivered",
              texto:
                "we refund what you paid in full. That responsibility is ours and does not depend on what happens with the supplier.",
            },
            {
              titulo: "Disputes",
              texto:
                "write to mercatren@windoce.com first: most are resolved the same day. If a claim is not resolved, it is resolved under the governing law stated in the closing section of these terms, and we keep all documentation of the transaction for five years to support it.",
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "Refunds go back the way they came",
          parrafos: [
            "Every refund is made to the same account the payment came from, never to a different account or a third party.",
          ],
        },
      ],
    },
    {
      id: "comercios",
      numero: "9",
      titulo: "If you publish your catalog as a supplier",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Merchants that publish their catalog on Mercatren are independent companies that sell us merchandise. Publishing your catalog means you also accept the following:",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "You sell us the merchandise and invoice us",
              texto:
                "when a sale occurs, Windoce, LLC buys that merchandise from you and you issue an invoice to Windoce, LLC. You do not appoint us as your representative for anything, and we do not sell anything for your account.",
            },
            {
              titulo: "You set your price; we set ours",
              texto:
                "the price you sell to us at is yours to set. The price at which Windoce, LLC resells to the buyer is set and published by us, and it includes our commercial markup.",
            },
            {
              titulo: "You are responsible for what you list",
              texto:
                "products, descriptions, and their legality are your responsibility. No prohibited, counterfeit, or questionably sourced goods.",
            },
            {
              titulo: "You ship to the address on the order",
              texto:
                "within the timeframe you advertise, and you record the delivery in the system.",
            },
            {
              titulo: "You are paid for the merchandise against your invoice",
              texto:
                "the amount for merchandise purchased is paid to a US bank account, against your invoice, as agreed with you in writing. It is payment for a purchase, not the handing over of a third party's money.",
            },
            {
              titulo: "Prior verification",
              texto:
                "before activating you, we check your business registration, the identity of your owners, and screen you against sanctions lists.",
            },
          ],
        },
      ],
    },
    {
      id: "uso-correcto",
      numero: "10",
      titulo: "Acceptable use",
      bloques: [
        { tipo: "parrafo", texto: "Mercatren may not be used to:" },
        {
          tipo: "lista",
          puntos: [
            {
              texto:
                "Get money to a person by disguising it as a purchase of goods.",
            },
            {
              texto: "Split transactions to stay below our review thresholds.",
            },
            {
              texto:
                "Pay with accounts or instruments that are not yours, or with money of illicit origin.",
            },
            {
              texto:
                "Buy or sell goods prohibited under the law of the United States or of the delivery country.",
            },
            { texto: "Impersonate another person or company." },
          ],
        },
        {
          tipo: "parrafo",
          texto:
            "If we detect any of these, we stop the transaction, close the account, and retain the file.",
        },
      ],
    },
    {
      id: "responsabilidad",
      numero: "11",
      titulo: "Our liability",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "We are responsible for what we sell: that the product is the one you bought and that it is delivered to the address you designated. Our liability for any order does not exceed the amount of that order.",
        },
        {
          tipo: "parrafo",
          texto:
            "We are not responsible for the quality, suitability, or legality of the products each merchant lists, nor for delays caused by third parties (banks, carriers, customs). We also do not guarantee uninterrupted availability of the service.",
        },
      ],
    },
    {
      id: "datos",
      numero: "12",
      titulo: "Your data",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "We handle your data as described in our privacy policy. In short: we collect what is needed to operate and verify, we keep transaction records for five years, and we do not sell your data to anyone.",
        },
      ],
    },
    {
      id: "cambios",
      numero: "13",
      titulo: "Changes, governing law, and contact",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "We may update these terms",
              texto:
                "and the effective date above will change. If a change is significant, we'll tell you. Continuing to use the service after a change means you accept it.",
            },
            {
              titulo: "Governing law",
              texto:
                "these terms are governed by the laws of the United States of America and of the state where Windoce, LLC is registered.",
            },
            {
              titulo: "Write to us",
              texto:
                "for any question, complaint, or request about these terms, at mercatren@windoce.com. That's where we answer.",
            },
          ],
        },
      ],
    },
  ],
  cierre:
    "Mercatren is a brand of Windoce, LLC, a company registered in the United States. This document describes the conditions of the service; it is not legal, accounting, or tax advice.",
};
