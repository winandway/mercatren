import type { PaginaContenido } from "./tipos";

/**
 * Terminos y condiciones del servicio.
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
  vigencia: "Vigentes desde el 3 de agosto de 2026",
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
            "Mercatren es un servicio de comercio electrónico transfronterizo operado por Windoce LLC, una sociedad registrada en Estados Unidos. Cuando en este documento decimos «nosotros», nos referimos a Windoce LLC operando bajo la marca Mercatren.",
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
            "Operamos una plataforma donde comercios independientes publican sus productos, y donde compradores ubicados en Estados Unidos pagan esos productos para que se entreguen a un destinatario en el país del comercio. Cobramos una comisión por esa gestión.",
        },
        {
          tipo: "dosColumnas",
          izquierda: {
            titulo: "Lo que sí hacemos",
            tono: "bien",
            puntos: [
              "Operamos la plataforma y el catálogo.",
              "Cobramos en Estados Unidos por cuenta del comercio vendedor.",
              "Verificamos cada pago antes de aceptarlo.",
              "Documentamos cada operación de punta a punta.",
            ],
          },
          derecha: {
            titulo: "Lo que no hacemos",
            tono: "ojo",
            puntos: [
              "No enviamos remesas ni dinero entre particulares.",
              "No hacemos cambio de divisas.",
              "No somos dueños de la mercancía ni la vendemos.",
              "No transportamos, importamos ni despachamos mercancía.",
              "No captamos depósitos ni pagamos rendimientos.",
            ],
          },
        },
        {
          tipo: "aviso",
          tono: "acento",
          titulo: "El comercio es quien vende",
          parrafos: [
            "Cada producto lo publica, lo fija de precio y lo entrega un comercio independiente. Mercatren no es el vendedor: somos la plataforma donde ocurre la venta y el agente de cobro designado por ese comercio.",
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
                "Al confirmar, el sistema vuelve a leer de nuestra base el precio, la disponibilidad y la comisión de cada producto. El total del pedido es el que sale de esa lectura, no el que estuviera guardado en tu navegador.",
              ],
            },
            {
              numero: "2",
              etiqueta: "Tú",
              titulo: "Pagas y subes el comprobante",
              parrafos: [
                "En la página de tu pedido aparecen los datos exactos de pago y el monto. Haces la transferencia y subes la captura.",
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
              etiqueta: "El comercio",
              titulo: "Entrega el producto",
              parrafos: [
                "Confirmado el pago, el comercio entrega al destinatario que indicaste. Los tiempos y la forma de entrega los define cada comercio.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "precios",
      numero: "5",
      titulo: "Precios, comisión e impuestos",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Los precios los fija el comercio",
              texto:
                "y están en dólares de Estados Unidos. Pueden cambiar en cualquier momento; el que vale es el del momento en que confirmas el pedido.",
            },
            {
              titulo: "Nuestra comisión",
              texto:
                "se calcula sobre el valor del pedido y es nuestro único ingreso. Está incluida en el total que ves; no se te cobra aparte.",
            },
            {
              titulo: "El envío y los impuestos",
              texto:
                "se acuerdan con el comercio. Cuando apliquen, se mostrarán en el pedido antes de que pagues.",
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
                "no dividimos un pedido entre varios pagadores ni un pago entre varios pedidos.",
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
      titulo: "Entregas, cancelaciones y devoluciones",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "La entrega la hace el comercio",
              texto:
                "en su propio país, al destinatario que indicaste. Los plazos los define el comercio y se informan en el pedido.",
            },
            {
              titulo: "Antes de que el pago se apruebe",
              texto: "puedes cancelar el pedido sin costo escribiéndonos.",
            },
            {
              titulo: "Si el pago ya se aprobó",
              texto:
                "la cancelación depende de si el comercio ya despachó. Escríbenos y lo gestionamos con él.",
            },
            {
              titulo: "Si el producto llega dañado, incompleto o distinto",
              texto:
                "escríbenos dentro de los 7 días siguientes a la entrega, con fotos. Lo resolvemos con el comercio: reposición, cambio o devolución del importe.",
            },
            {
              titulo: "Si el comercio no entrega",
              texto: "y no hay solución con él, te devolvemos lo pagado.",
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
      titulo: "Si abres una tienda",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Los comercios que venden en Mercatren son empresas independientes. Al abrir una tienda aceptas además lo siguiente:",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Nos designas como tu agente de cobro",
              texto:
                "para recibir en Estados Unidos los pagos de tus compradores, por cuenta tuya.",
            },
            {
              titulo: "Respondes por lo que publicas",
              texto:
                "los productos, sus precios, sus descripciones y su legalidad son tu responsabilidad. No se publican productos prohibidos, falsificados ni de origen dudoso.",
            },
            {
              titulo: "Entregas lo que vendes",
              texto:
                "en el plazo que anuncias, y registras la entrega en el sistema.",
            },
            {
              titulo: "Tu saldo es tuyo",
              texto:
                "los cobros verificados se acreditan a tu billetera, menos nuestra comisión, y se liquidan según lo que acordemos por escrito contigo.",
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
                "Pagar con cuentas o medios que no sean tuyos, o con fondos de origen ilícito.",
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
            "Respondemos por el servicio que prestamos: operar la plataforma, cobrar correctamente, verificar los pagos y aplicar el dinero donde corresponde. Nuestra responsabilidad frente a un pedido no supera el importe de ese pedido.",
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
                "estos términos se rigen por las leyes de los Estados Unidos de América y del estado donde está registrada Windoce LLC.",
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
    "Mercatren es una marca de Windoce LLC, sociedad registrada en Estados Unidos. Este documento describe las condiciones del servicio; no constituye asesoramiento legal, contable ni fiscal.",
};

export const TERMINOS_EN: PaginaContenido = {
  titulo: "Terms and conditions",
  entradilla:
    "The rules of the Mercatren service: what we do, what we don't do, how payment works, how delivery works, and what you can expect from us.",
  vigencia: "Effective August 3, 2026",
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
            "Mercatren is a cross-border ecommerce service operated by Windoce LLC, a company registered in the United States. Where these terms say “we,” that means Windoce LLC operating under the Mercatren brand.",
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
            "We operate a platform where independent merchants list their products, and where buyers located in the United States pay for those products so they can be delivered to a recipient in the merchant's country. We charge a fee for handling that.",
        },
        {
          tipo: "dosColumnas",
          izquierda: {
            titulo: "What we do",
            tono: "bien",
            puntos: [
              "Operate the platform and the catalog.",
              "Collect payment in the United States on the selling merchant's behalf.",
              "Verify every payment before accepting it.",
              "Document every transaction end to end.",
            ],
          },
          derecha: {
            titulo: "What we don't do",
            tono: "ojo",
            puntos: [
              "We do not send remittances or money between individuals.",
              "We do not exchange currency.",
              "We do not own the goods and we do not sell them.",
              "We do not ship, import, or clear customs.",
              "We do not take deposits and we do not pay interest.",
            ],
          },
        },
        {
          tipo: "aviso",
          tono: "acento",
          titulo: "The merchant is the seller",
          parrafos: [
            "Every product is listed, priced, and delivered by an independent merchant. Mercatren is not the seller: we are the platform where the sale happens and the collection agent appointed by that merchant.",
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
                "On confirmation, the system re-reads each product's price, availability, and fee from our database. The order total comes from that reading, not from whatever was stored in your browser.",
              ],
            },
            {
              numero: "2",
              etiqueta: "You",
              titulo: "Pay and upload the receipt",
              parrafos: [
                "Your order page shows the exact payment details and the amount. You make the transfer and upload the screenshot.",
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
              etiqueta: "The merchant",
              titulo: "Delivers the product",
              parrafos: [
                "Once payment is confirmed, the merchant delivers to the recipient you named. Delivery times and methods are set by each merchant.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "precios",
      numero: "5",
      titulo: "Prices, fees, and taxes",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Prices are set by the merchant",
              texto:
                "and are in US dollars. They can change at any time; the price that applies is the one at the moment you confirm the order.",
            },
            {
              titulo: "Our fee",
              texto:
                "is calculated on the order value and is our only revenue. It is included in the total you see; it is not charged separately.",
            },
            {
              titulo: "Shipping and taxes",
              texto:
                "are agreed with the merchant. Where they apply, they are shown on the order before you pay.",
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
            "The entire flow of funds happens inside the United States. We do not accept international transfers, SWIFT, cash, or cryptocurrency.",
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
                "we do not split an order across several payers, or a payment across several orders.",
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
            "Nothing is accepted automatically. Before approving a payment we verify the payer's identity, screen their name against sanctions lists, confirm the amount matches, and check for structuring patterns.",
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
      titulo: "Delivery, cancellations, and returns",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "The merchant handles delivery",
              texto:
                "in its own country, to the recipient you named. Timeframes are set by the merchant and shown on the order.",
            },
            {
              titulo: "Before your payment is approved",
              texto: "you can cancel the order at no cost by writing to us.",
            },
            {
              titulo: "Once payment is approved",
              texto:
                "cancellation depends on whether the merchant has already dispatched. Write to us and we'll work it out with them.",
            },
            {
              titulo:
                "If the product arrives damaged, incomplete, or different",
              texto:
                "write to us within 7 days of delivery, with photos. We resolve it with the merchant: replacement, exchange, or refund.",
            },
            {
              titulo: "If the merchant does not deliver",
              texto:
                "and there is no resolution with them, we refund what you paid.",
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
      titulo: "If you open a store",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Merchants selling on Mercatren are independent companies. Opening a store means you also accept the following:",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "You appoint us as your collection agent",
              texto:
                "to receive your buyers' payments in the United States, on your behalf.",
            },
            {
              titulo: "You are responsible for what you list",
              texto:
                "products, prices, descriptions, and their legality are your responsibility. No prohibited, counterfeit, or questionably sourced goods.",
            },
            {
              titulo: "You deliver what you sell",
              texto:
                "within the timeframe you advertise, and you record the delivery in the system.",
            },
            {
              titulo: "Your balance is yours",
              texto:
                "verified collections are credited to your wallet, less our fee, and settled as agreed with you in writing.",
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
                "Pay with accounts or instruments that are not yours, or with funds of illicit origin.",
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
            "We are responsible for the service we provide: operating the platform, collecting correctly, verifying payments, and applying funds where they belong. Our liability for any order does not exceed the amount of that order.",
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
                "these terms are governed by the laws of the United States of America and of the state where Windoce LLC is registered.",
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
    "Mercatren is a brand of Windoce LLC, a company registered in the United States. This document describes the conditions of the service; it is not legal, accounting, or tax advice.",
};
