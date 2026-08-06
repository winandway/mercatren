import type { PaginaContenido } from "./tipos";

/**
 * POLÍTICA DE DEVOLUCIONES.
 *
 * Existe por dos razones, y las dos importan:
 *
 * 1. **Google la exige.** Sin una política de devoluciones publicada y
 *    alcanzable desde el sitio, Merchant Center no aprueba la cuenta y los
 *    productos no salen en Shopping. Es el requisito que más rechazos causa.
 *
 * 2. **El comprador la necesita.** Alguien en Estados Unidos paga por algo
 *    que va a recoger otra persona en otro país. Si no sabe qué pasa cuando
 *    llega roto o llega otro, no compra.
 *
 * CÓMO ESTÁ ESCRITA. La mercancía se retira EN PERSONA y se puede revisar
 * antes de llevársela — eso cambia todo respecto a una tienda que envía a
 * ciegas. Por eso hay tres momentos distintos y cada uno tiene su regla, en
 * vez de una sola frase de "30 días" copiada de otro sitio que aquí no
 * significaría nada.
 *
 * QUIEN RESPONDE ES WINDOCE, LLC. Es quien vende y factura al comprador (ver
 * la figura jurídica en CLAUDE.md), así que el reclamo entra por Mercatren y
 * no por el comercio. Mandar al comprador a discutir con el comercio sería
 * decirle que no le vendimos nosotros.
 *
 * PENDIENTE DE REVISIÓN LEGAL, igual que los términos. Los plazos son los
 * estándar del comercio en línea de Estados Unidos y son defendibles, pero
 * quien los firma es el abogado. Si cambia uno, sube la versión en el mismo
 * commit.
 */
export const DEVOLUCIONES_ES: PaginaContenido = {
  titulo: "Devoluciones y reclamos",
  entradilla:
    "Qué hacer si tu pedido llegó dañado, incompleto o no es el que pediste. Y en qué casos te devolvemos el dinero.",
  vigencia: "Versión 1 · Vigente desde el 5 de agosto de 2026",
  indiceTitulo: "En esta página",
  secciones: [
    {
      id: "antes-de-retirar",
      numero: "1",
      titulo: "Antes de retirar: cancelas y te devolvemos todo",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Mientras no hayas retirado la mercancía, puedes cancelar el pedido y te devolvemos el importe completo, incluido lo que hayas pagado por el envío si lo contrataste. No hay que dar explicaciones ni pagar penalidad.",
        },
        {
          tipo: "parrafo",
          texto:
            "Para cancelar, escríbenos desde el correo de tu cuenta indicando el número de pedido. Te confirmamos la cancelación por escrito.",
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "Cuánto tarda el dinero en volver",
          parrafos: [
            "El importe vuelve por la misma vía por la que pagaste. Con tarjeta, tu banco suele reflejarlo entre 5 y 10 días hábiles. Si pagaste por Zelle, lo devolvemos al mismo correo de Zelle desde el que salió el pago, dentro de los 5 días hábiles siguientes a la cancelación.",
            "No devolvemos a un correo de Zelle ni a una tarjeta distintos de los que pagaron. Es la única forma de estar seguros de que el dinero vuelve a quien lo puso.",
          ],
        },
      ],
    },
    {
      id: "al-retirar",
      numero: "2",
      titulo: "Al retirar: revisa antes de firmar",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Quien retira puede abrir y revisar la mercancía en el depósito, antes de llevársela. Es el momento de comprobar que está completa, que es lo que se pidió y que no viene dañada.",
        },
        {
          tipo: "parrafo",
          texto:
            "Si algo no está bien, no lo aceptes: díselo ahí mismo al comercio y escríbenos el mismo día. Un problema detectado en el depósito se resuelve en el momento; el mismo problema detectado en casa, dos semanas después, es mucho más difícil de comprobar para todos.",
        },
      ],
    },
    {
      id: "despues-de-retirar",
      numero: "3",
      titulo: "Después de retirar: 7 días para reclamar",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Tienes 7 días corridos desde el retiro para reclamar si la mercancía llegó dañada, incompleta, defectuosa o no corresponde a lo que compraste. Escríbenos con el número de pedido y fotos de lo recibido.",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Si el reclamo procede",
              texto:
                "Elige tú: reemplazamos el producto sin costo, o te devolvemos el importe completo de esa línea del pedido. Si el pedido entero estaba mal, se devuelve entero.",
            },
            {
              titulo: "Quién paga la devolución del producto",
              texto:
                "Nosotros. Cuando el error es nuestro o del comercio, quien retiró no pone ni un dólar para devolver la mercancía al depósito.",
            },
            {
              titulo: "Qué necesitamos de ti",
              texto:
                "Fotos claras de lo recibido y, si aplica, del empaque. Con eso resolvemos casi todos los casos sin que tengas que mover nada.",
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "En cuánto respondemos",
          parrafos: [
            "Te contestamos en un máximo de 2 días hábiles con una decisión, no con un acuse de recibo. Si necesitamos más tiempo para comprobar algo, te decimos cuánto y por qué.",
          ],
        },
      ],
    },
    {
      id: "no-aplica",
      numero: "4",
      titulo: "Qué no se devuelve",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Con la mercancía en la mano y revisada en el depósito, no aceptamos devoluciones por cambio de opinión. Es la contrapartida de poder abrir y revisar antes de llevarse nada.",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Mercancía ya usada o instalada",
              texto:
                "Un producto montado, cortado a medida o usado no puede volver al inventario del comercio. Esto no afecta a los defectos de fábrica, que sí se reclaman.",
            },
            {
              titulo: "Productos cortados o preparados a pedido",
              texto:
                "Cable por metro, tubería cortada, mezclas preparadas y similares. Se preparan para ti y no se pueden revender.",
            },
            {
              titulo: "Daños posteriores al retiro",
              texto:
                "Lo que se rompe después de haberlo revisado y aceptado en el depósito, salvo que sea un defecto de fábrica que aparezca dentro de los 7 días.",
            },
          ],
        },
      ],
    },
    {
      id: "garantia",
      numero: "5",
      titulo: "Garantía del fabricante",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Algunos productos traen garantía del fabricante, más larga que estos 7 días. Cuando la hay, lo dice la ficha del producto y la garantía la honra el fabricante o el comercio según sus condiciones.",
        },
        {
          tipo: "parrafo",
          texto:
            "Si no sabes si tu producto la tiene, escríbenos con el número de pedido y lo comprobamos contigo.",
        },
      ],
    },
    {
      id: "como-reclamar",
      numero: "6",
      titulo: "Cómo se pide una devolución",
      bloques: [
        {
          tipo: "pasos",
          pasos: [
            {
              numero: "1",
              etiqueta: "Escríbenos",
              titulo: "Un correo a mercatren@windoce.com",
              parrafos: [
                "Desde el correo de tu cuenta, con el número de pedido (por ejemplo MT-000042) y qué pasó. Adjunta fotos si el problema se ve.",
              ],
            },
            {
              numero: "2",
              etiqueta: "Te respondemos",
              titulo: "Una decisión en 2 días hábiles",
              parrafos: [
                "Te decimos si procede y qué opciones tienes: reemplazo o devolución del importe. Contesta una persona, no un formulario automático.",
              ],
            },
            {
              numero: "3",
              etiqueta: "Se resuelve",
              titulo: "Reemplazo o devolución del dinero",
              parrafos: [
                "Si eliges reemplazo, coordinamos el nuevo retiro. Si eliges que te devolvamos el importe, sale por la misma vía por la que pagaste, dentro de los 5 días hábiles siguientes.",
              ],
            },
          ],
        },
      ],
    },
  ],
  cierre:
    "Esta política forma parte de los términos y condiciones de Mercatren, un servicio de Windoce, LLC. Windoce, LLC es quien te vende y te factura, así que tu reclamo lo atendemos nosotros y no tienes que discutirlo con el comercio.",
  accion: {
    titulo: "¿Tienes un problema con un pedido?",
    texto:
      "Escríbenos con tu número de pedido. Contesta una persona del equipo.",
    boton: "Escribir a Mercatren",
    href: "mailto:mercatren@windoce.com",
  },
};

export const DEVOLUCIONES_EN: PaginaContenido = {
  titulo: "Returns and claims",
  entradilla:
    "What to do if your order arrived damaged, incomplete, or isn't what you ordered — and when we refund you.",
  vigencia: "Version 1 · Effective August 5, 2026",
  indiceTitulo: "On this page",
  secciones: [
    {
      id: "antes-de-retirar",
      numero: "1",
      titulo: "Before pickup: cancel and get everything back",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "As long as the merchandise hasn't been picked up, you can cancel the order and we'll refund the full amount, including any delivery fee you paid. No explanation needed and no cancellation fee.",
        },
        {
          tipo: "parrafo",
          texto:
            "To cancel, email us from your account's email address with the order number. We'll confirm the cancellation in writing.",
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "How long the refund takes",
          parrafos: [
            "Refunds go back the same way you paid. On a card, most banks post it within 5 to 10 business days. If you paid through Zelle, we send it back to the same Zelle address the payment came from, within 5 business days of the cancellation.",
            "We don't refund to a different Zelle address or card than the one that paid. It's the only way to be certain the money goes back to the person who put it up.",
          ],
        },
      ],
    },
    {
      id: "al-retirar",
      numero: "2",
      titulo: "At pickup: check it before you sign",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Whoever picks the order up can open and inspect it at the warehouse before taking it. That's the moment to confirm nothing is missing, it's what was ordered, and nothing is damaged.",
        },
        {
          tipo: "parrafo",
          texto:
            "If something's wrong, don't accept it: tell the seller right there and email us the same day. A problem caught at the warehouse gets solved on the spot; the same problem caught at home two weeks later is far harder for everyone to verify.",
        },
      ],
    },
    {
      id: "despues-de-retirar",
      numero: "3",
      titulo: "After pickup: 7 days to file a claim",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "You have 7 calendar days from pickup to file a claim if the merchandise arrived damaged, incomplete, defective, or isn't what you bought. Email us the order number along with photos of what you received.",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "If the claim holds up",
              texto:
                "Your call: we replace the product at no cost, or we refund that line of the order in full. If the whole order was wrong, the whole order gets refunded.",
            },
            {
              titulo: "Who pays to return the item",
              texto:
                "We do. When the mistake is ours or the seller's, the person who picked it up doesn't pay a dollar to get the merchandise back to the warehouse.",
            },
            {
              titulo: "What we need from you",
              texto:
                "Clear photos of what you received and, where relevant, of the packaging. That settles almost every case without you having to move anything.",
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "How fast we answer",
          parrafos: [
            "You'll get a decision within 2 business days — an actual answer, not an acknowledgment. If we need longer to verify something, we'll tell you how long and why.",
          ],
        },
      ],
    },
    {
      id: "no-aplica",
      numero: "4",
      titulo: "What we don't take back",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Once the merchandise has been inspected at the warehouse and taken, we don't accept returns for change of mind. That's the trade-off for being able to open and check everything before you take it.",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Used or installed merchandise",
              texto:
                "A product that's been mounted, cut to size, or used can't go back into the seller's inventory. This doesn't affect manufacturing defects, which you can still claim.",
            },
            {
              titulo: "Items cut or prepared to order",
              texto:
                "Cable by the meter, cut pipe, mixed compounds, and the like. They're prepared for you and can't be resold.",
            },
            {
              titulo: "Damage that happens after pickup",
              texto:
                "Anything that breaks after you inspected and accepted it at the warehouse, unless it's a manufacturing defect that shows up within the 7 days.",
            },
          ],
        },
      ],
    },
    {
      id: "garantia",
      numero: "5",
      titulo: "Manufacturer's warranty",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Some products come with a manufacturer's warranty that runs longer than these 7 days. When there is one, the product page says so, and the manufacturer or the seller honors it under their own terms.",
        },
        {
          tipo: "parrafo",
          texto:
            "If you're not sure whether yours has one, email us your order number and we'll check it with you.",
        },
      ],
    },
    {
      id: "como-reclamar",
      numero: "6",
      titulo: "How to request a return",
      bloques: [
        {
          tipo: "pasos",
          pasos: [
            {
              numero: "1",
              etiqueta: "Email us",
              titulo: "Write to mercatren@windoce.com",
              parrafos: [
                "From your account's email address, with the order number (for example MT-000042) and what happened. Attach photos if the problem is visible.",
              ],
            },
            {
              numero: "2",
              etiqueta: "We answer",
              titulo: "A decision within 2 business days",
              parrafos: [
                "We'll tell you whether it holds up and what your options are: replacement or refund. A person answers, not an autoresponder.",
              ],
            },
            {
              numero: "3",
              etiqueta: "It gets settled",
              titulo: "Replacement or refund",
              parrafos: [
                "If you choose a replacement, we arrange the new pickup. If you choose a refund, it goes back the same way you paid, within 5 business days.",
              ],
            },
          ],
        },
      ],
    },
  ],
  cierre:
    "This policy is part of the terms and conditions of Mercatren, a service of Windoce, LLC. Windoce, LLC is who sells to you and invoices you, so we handle your claim directly — you don't have to take it up with the seller.",
  accion: {
    titulo: "Having a problem with an order?",
    texto: "Email us your order number. A person on our team will answer.",
    boton: "Email Mercatren",
    href: "mailto:mercatren@windoce.com",
  },
};
