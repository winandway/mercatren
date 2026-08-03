import type { PaginaContenido } from "./tipos";

/**
 * Centro de ayuda: las preguntas que de verdad llegan.
 *
 * Escritas como las hace la gente, no como las escribiria un abogado. Cada
 * respuesta termina en algo accionable; cuando no hay respuesta buena, se
 * manda al buzon real (mercatren@windoce.com) y no a un formulario ciego.
 */
export const AYUDA_ES: PaginaContenido = {
  titulo: "Centro de ayuda",
  entradilla:
    "Las preguntas más comunes sobre comprar, pagar, recibir y vender en Mercatren. Si no encuentras la tuya, escríbenos: contesta una persona.",
  indiceTitulo: "Temas",
  secciones: [
    {
      id: "comprar",
      titulo: "Comprar",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "¿Necesito una cuenta para comprar?",
              texto:
                "Sí. El pago tiene que poder acreditarse a alguien y tú tienes que poder seguir tu pedido. Crear la cuenta toma menos de un minuto.",
            },
            {
              titulo: "¿Puedo comprar desde fuera de Estados Unidos?",
              texto:
                "Puedes armar el pedido desde donde estés, pero el pago tiene que salir de un banco de Estados Unidos. Normalmente lo paga un familiar que vive allá.",
            },
            {
              titulo: "¿Los precios están en dólares?",
              texto:
                "Sí, todo el catálogo está en dólares de Estados Unidos. No hacemos cambio de divisas en ningún momento.",
            },
            {
              titulo: "¿Puedo comprar a varios comercios en el mismo pedido?",
              texto:
                "Puedes, pero el pago queda sin comercio asignado y lo resuelve nuestro equipo a mano, así que tarda más. Si tienes prisa, haz un pedido por comercio.",
            },
          ],
        },
      ],
    },
    {
      id: "pagar",
      titulo: "Pagar",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "¿Cómo pago?",
              texto:
                "Al confirmar el pedido, la página te muestra los datos exactos y el monto. Haces la transferencia desde tu banco y subes la captura ahí mismo.",
            },
            {
              titulo: "¿Por qué tengo que subir una captura?",
              texto:
                "Porque no acreditamos nada automáticamente. Una persona del equipo comprueba contra el banco que el pago llegó de verdad y que el monto calza con tu pedido.",
            },
            {
              titulo: "¿Cuánto tarda en aprobarse?",
              texto:
                "Normalmente el mismo día. Te llega un aviso apenas quede aprobado, y también si algo no cuadra.",
            },
            {
              titulo: "¿Puede pagar otra persona por mí?",
              texto:
                "Sí, es lo habitual: un familiar en Estados Unidos. Lo importante es que el nombre de quien paga coincida con lo que nos dices, para poder verificarlo.",
            },
            {
              titulo: "¿Aceptan tarjeta?",
              texto:
                "Todavía no. Hoy solo Zelle y transferencia desde bancos de Estados Unidos. El pago con tarjeta y con saldo está en camino.",
            },
            {
              titulo: "Mi pago no fue aprobado, ¿qué hago?",
              texto:
                "El aviso te dice el motivo exacto. Puedes subir un comprobante nuevo desde la página de tu pedido, o escribirnos y lo resolvemos contigo.",
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "acento",
          titulo: "Nunca pagues fuera de la plataforma",
          parrafos: [
            "Los datos de pago están únicamente en la página de tu pedido, después de confirmarlo. Si alguien te pasa otros datos por WhatsApp o por chat diciendo que son de Mercatren, no pagues y escríbenos.",
          ],
        },
      ],
    },
    {
      id: "recibir",
      titulo: "Recibir el pedido",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "¿Quién entrega?",
              texto:
                "El comercio, en su propio país, a la persona que indicaste como destinataria. Mercatren no transporta ni despacha mercancía.",
            },
            {
              titulo: "¿Cuánto tarda la entrega?",
              texto:
                "Depende del comercio y del producto. El plazo se informa en el pedido, y la entrega empieza cuando el pago queda aprobado.",
            },
            {
              titulo: "¿El destinatario recibe dinero?",
              texto:
                "Nunca. Recibe el producto físico que compraste. En ningún punto de la operación una persona recibe efectivo.",
            },
            {
              titulo: "Llegó dañado o no es lo que pedí",
              texto:
                "Escríbenos dentro de los 7 días siguientes a la entrega, con fotos. Lo resolvemos con el comercio: reposición, cambio o devolución.",
            },
          ],
        },
      ],
    },
    {
      id: "cuenta",
      titulo: "Mi cuenta",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Olvidé mi contraseña",
              texto:
                "En la pantalla de entrar, toca «¿Olvidaste tu contraseña?» y te llega un enlace al correo para crear una nueva.",
            },
            {
              titulo: "¿Dónde veo mis pedidos?",
              texto:
                "En «Devoluciones y pedidos», arriba a la derecha. Ahí está el estado de cada uno y el botón para pagar los que estén pendientes.",
            },
            {
              titulo: "Quiero cerrar mi cuenta",
              texto:
                "Escríbenos desde el correo de tu cuenta y la cerramos. Los registros de operaciones ya hechas se conservan cinco años, como explica la política de privacidad.",
            },
          ],
        },
      ],
    },
    {
      id: "vender",
      titulo: "Vender en Mercatren",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "¿Qué necesito para abrir una tienda?",
              texto:
                "Ser una empresa registrada, con tus dueños identificables, y un proveedor al que le compres. Antes de activarte verificamos esos datos.",
            },
            {
              titulo: "¿Cuánto cobra Mercatren?",
              texto:
                "3 % sobre el valor de cada pedido cobrado. No hay cuota mensual ni costo de alta.",
            },
            {
              titulo: "¿Tengo que cargar mis productos a mano?",
              texto:
                "No necesariamente. Si ya tienes tu catálogo en otro sistema, lo traemos desde ahí y después se mantiene sincronizado.",
            },
            {
              titulo: "¿Cuándo recibo mi dinero?",
              texto:
                "El neto de cada venta verificada se acredita a tu billetera en el momento de aprobar el pago. La liquidación se hace según lo que acordemos por escrito contigo.",
            },
          ],
        },
      ],
    },
    {
      id: "contacto",
      titulo: "No encuentro mi respuesta",
      bloques: [
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "Escríbenos a mercatren@windoce.com",
          parrafos: [
            "Es un buzón real y contesta una persona. Si es sobre un pedido, ponnos el número (empieza por MT-) y vamos directo al grano.",
          ],
        },
      ],
    },
  ],
};

export const AYUDA_EN: PaginaContenido = {
  titulo: "Help center",
  entradilla:
    "The most common questions about buying, paying, receiving, and selling on Mercatren. If yours isn't here, write to us — a person answers.",
  indiceTitulo: "Topics",
  secciones: [
    {
      id: "comprar",
      titulo: "Buying",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Do I need an account to buy?",
              texto:
                "Yes. Payment has to be attributable to someone, and you need to be able to track your order. Creating an account takes under a minute.",
            },
            {
              titulo: "Can I buy from outside the United States?",
              texto:
                "You can build the order from anywhere, but payment has to come from a US bank. Usually a family member living there pays.",
            },
            {
              titulo: "Are prices in dollars?",
              texto:
                "Yes, the whole catalog is in US dollars. We never do currency conversion.",
            },
            {
              titulo: "Can I buy from several merchants in one order?",
              texto:
                "You can, but the payment ends up unassigned to a merchant and our team resolves it by hand, so it takes longer. If you're in a hurry, place one order per merchant.",
            },
          ],
        },
      ],
    },
    {
      id: "pagar",
      titulo: "Paying",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "How do I pay?",
              texto:
                "Once you confirm the order, the page shows the exact details and amount. You transfer from your bank and upload the screenshot right there.",
            },
            {
              titulo: "Why do I have to upload a screenshot?",
              texto:
                "Because nothing is credited automatically. A member of our team confirms against the bank that the payment actually arrived and that the amount matches your order.",
            },
            {
              titulo: "How long does approval take?",
              texto:
                "Usually the same day. You get a notice as soon as it's approved, and also if something doesn't add up.",
            },
            {
              titulo: "Can someone else pay for me?",
              texto:
                "Yes, that's the norm: a family member in the United States. What matters is that the payer's name matches what you tell us, so we can verify it.",
            },
            {
              titulo: "Do you take cards?",
              texto:
                "Not yet. Today it's Zelle and transfers from US banks only. Card and wallet payment are on the way.",
            },
            {
              titulo: "My payment wasn't approved. What now?",
              texto:
                "The notice tells you the exact reason. You can upload a new receipt from your order page, or write to us and we'll sort it out with you.",
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "acento",
          titulo: "Never pay outside the platform",
          parrafos: [
            "Payment details appear only on your order page, after you confirm it. If someone sends you other details over WhatsApp or chat claiming they're Mercatren's, don't pay — write to us.",
          ],
        },
      ],
    },
    {
      id: "recibir",
      titulo: "Receiving your order",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Who delivers?",
              texto:
                "The merchant, in its own country, to the person you named as recipient. Mercatren does not ship or clear goods.",
            },
            {
              titulo: "How long does delivery take?",
              texto:
                "It depends on the merchant and the product. The timeframe is shown on the order, and delivery starts once payment is approved.",
            },
            {
              titulo: "Does the recipient get money?",
              texto:
                "Never. They receive the physical product you bought. At no point in the operation does a person receive cash.",
            },
            {
              titulo: "It arrived damaged or it's not what I ordered",
              texto:
                "Write to us within 7 days of delivery, with photos. We resolve it with the merchant: replacement, exchange, or refund.",
            },
          ],
        },
      ],
    },
    {
      id: "cuenta",
      titulo: "My account",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "I forgot my password",
              texto:
                "On the sign-in screen, tap “Forgot your password?” and you'll get an email with a link to create a new one.",
            },
            {
              titulo: "Where do I see my orders?",
              texto:
                "Under “Returns and orders,” top right. It shows the status of each one and a button to pay any that are pending.",
            },
            {
              titulo: "I want to close my account",
              texto:
                "Write to us from your account email and we'll close it. Records of completed transactions are kept for five years, as the privacy policy explains.",
            },
          ],
        },
      ],
    },
    {
      id: "vender",
      titulo: "Selling on Mercatren",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "What do I need to open a store?",
              texto:
                "A registered business, identifiable owners, and a supplier you buy from. We verify those details before activating you.",
            },
            {
              titulo: "What does Mercatren charge?",
              texto:
                "3% on the value of each order collected. No monthly fee, no setup cost.",
            },
            {
              titulo: "Do I have to enter my products by hand?",
              texto:
                "Not necessarily. If your catalog is already in another system, we bring it in from there and keep it synced afterward.",
            },
            {
              titulo: "When do I get my money?",
              texto:
                "The net amount of each verified sale is credited to your wallet the moment the payment is approved. Settlement follows what we agree with you in writing.",
            },
          ],
        },
      ],
    },
    {
      id: "contacto",
      titulo: "I can't find my answer",
      bloques: [
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "Write to mercatren@windoce.com",
          parrafos: [
            "It's a real inbox and a person answers. If it's about an order, include the number (it starts with MT-) and we'll get straight to it.",
          ],
        },
      ],
    },
  ],
};
