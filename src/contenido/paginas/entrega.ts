import type { PaginaContenido } from "./tipos";
import { SOCIEDAD } from "@/lib/sociedad";

/**
 * CÓMO SE ENTREGA LA MERCANCÍA.
 *
 * Google Merchant Center exige una política de entrega publicada, igual que
 * la de devoluciones. Pero esta página no existe solo por Google: es la
 * pregunta que hace todo el mundo antes de pagar — "y esto, ¿cómo le llega?".
 *
 * DOS FORMAS, Y LA SEGUNDA LA DECIDE CADA COMERCIO. En Venezuela el envío
 * dentro del país no lo hace una empresa de paquetería con tarifa fija: lo
 * resuelve el propio comercio, normalmente en moto, y le suma un porcentaje
 * al precio. Un comercio lo ofrece y otro no, y el mismo comercio lo ofrece
 * para unos productos y no para otros. Escribir "enviamos a toda Venezuela"
 * sería mentira, y escribir "no enviamos" también.
 *
 * LO QUE FUNCIONA HOY ES EL RETIRO. El envío está descrito aquí porque es
 * como trabaja el negocio y porque el comprador tiene que poder acordarlo con
 * su comercio, pero **todavía no se puede contratar desde el sitio**: eso se
 * dice con todas las letras en vez de prometerlo. Cuando se implemente, se
 * quita el aviso y se sube la versión.
 */
export const ENTREGA_ES: PaginaContenido = {
  titulo: "Entrega y envío",
  entradilla:
    "Cómo llega lo que compras: se retira en el depósito del comercio y, en algunos casos, el comercio lo envía dentro del país.",
  vigencia: "Versión 1 · Vigente desde el 5 de agosto de 2026",
  indiceTitulo: "En esta página",
  secciones: [
    {
      id: "retiro",
      numero: "1",
      titulo: "Retiro en el depósito, sin costo",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Es la forma normal de recibir un pedido en Mercatren y no cuesta nada. Cada producto dice en qué ciudad está la mercancía antes de que compres, y cuando el pedido queda listo te llega un correo con la dirección exacta del depósito y qué se retira ahí.",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Puede retirar otra persona",
              texto:
                "Lo normal es que quien paga esté en Estados Unidos y retire un familiar. No hay que autorizar nada por escrito: basta con que lleve su documento de identidad y el número de pedido.",
            },
            {
              titulo: "Cuándo está listo",
              texto:
                "El comercio prepara el pedido en cuanto el pago queda confirmado y te avisamos por correo. El tiempo depende de cada comercio y de si tiene la mercancía a la mano.",
            },
            {
              titulo: "Hasta cuándo se guarda",
              texto:
                "El comercio guarda el pedido 30 días desde que avisa que está listo. Si no puedes ir en ese plazo, escríbenos antes de que se cumpla y lo coordinamos.",
            },
            {
              titulo: "Se revisa antes de llevárselo",
              texto:
                "Quien retira puede abrir y comprobar la mercancía ahí mismo. Si algo no está bien, no hay que aceptarlo.",
            },
          ],
        },
      ],
    },
    {
      id: "envio",
      numero: "2",
      titulo: "Envío dentro del país: lo decide cada comercio",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Muchos comercios envían la mercancía a otra ciudad del país. Así trabaja el comercio en Venezuela: no lo hace una empresa de paquetería con una tarifa igual para todos, lo resuelve el propio comercio —normalmente en moto o por transporte terrestre— y le suma un costo al precio del producto.",
        },
        {
          tipo: "parrafo",
          texto:
            "Por eso el envío no es una promesa de Mercatren, sino una posibilidad de cada comercio: uno lo ofrece y otro no, y el mismo comercio puede ofrecerlo para unos productos y no para otros. Un juego de cauchos de moto sale distinto que un cunete de pintura.",
        },
        {
          tipo: "aviso",
          tono: "ojo",
          titulo: "Todavía no se contrata desde el sitio",
          parrafos: [
            "Hoy Mercatren solo cobra el precio del producto y el pedido se retira en el depósito. Si necesitas que te lo envíen a otra ciudad, acuérdalo con el comercio: su teléfono y su correo están en su página dentro de Mercatren.",
            "Estamos trabajando para que el envío se pueda contratar y pagar en el mismo pedido, con su costo a la vista antes de confirmar. Cuando esté, esta página lo dirá y cada producto mostrará si el comercio lo envía.",
          ],
        },
      ],
    },
    {
      id: "costo",
      numero: "3",
      titulo: "Cuánto cuesta el envío",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Lo pone el comercio y depende de a dónde va, cuánto pesa y qué tan voluminoso es. En la práctica suele ser un porcentaje del valor de la mercancía. El comercio te dice el monto exacto antes de que aceptes.",
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "Nunca vas a pagar un costo que no te dijeron antes",
          parrafos: [
            "Ni ahora, que el envío se acuerda con el comercio, ni cuando se pueda contratar aquí. Un cargo que aparece después de pagar es exactamente lo que no queremos que pase en Mercatren.",
          ],
        },
      ],
    },
    {
      id: "fuera",
      numero: "4",
      titulo: "Lo que no hacemos",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "No enviamos a Estados Unidos ni a otros países",
              texto:
                "La compra se paga desde un banco de Estados Unidos, pero la mercancía está en el país del comercio y ahí se entrega. No hay envío internacional.",
            },
            {
              titulo: "No transportamos nosotros",
              texto:
                "Mercatren no tiene flota ni bodegas. La mercancía está en el depósito del comercio hasta que la retiran, y quien la mueve —cuando hay envío— es el comercio.",
            },
          ],
        },
      ],
    },
  ],
  cierre: `Esta política forma parte de los términos y condiciones de Mercatren, un servicio de ${SOCIEDAD.nombre}. Si algo de tu entrega no salió como dice aquí, escríbenos a mercatren@windoce.com con tu número de pedido.`,
  accion: {
    titulo: "¿Dudas con la entrega de tu pedido?",
    texto: "Escríbenos con tu número de pedido y lo revisamos contigo.",
    boton: "Escribir a Mercatren",
    href: "mailto:mercatren@windoce.com",
  },
};

export const ENTREGA_EN: PaginaContenido = {
  titulo: "Pickup and delivery",
  entradilla:
    "How your order reaches you: pick it up at the seller's warehouse or, in some cases, have the seller deliver it within the country.",
  vigencia: "Version 1 · Effective August 5, 2026",
  indiceTitulo: "On this page",
  secciones: [
    {
      id: "retiro",
      numero: "1",
      titulo: "Warehouse pickup, free of charge",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "This is the standard way to receive an order on Mercatren, and it costs nothing. Every product shows which city the merchandise is in before you buy, and once the order is ready you get an email with the warehouse's exact address and what to pick up there.",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Someone else can pick it up",
              texto:
                "Usually the person paying is in the United States and a relative collects the order. No written authorization is needed — they just bring a photo ID and the order number.",
            },
            {
              titulo: "When it's ready",
              texto:
                "The seller starts preparing your order as soon as the payment clears, and we email you when it's ready. How long that takes depends on the seller and whether the merchandise is on hand.",
            },
            {
              titulo: "How long it's held",
              texto:
                "The seller holds your order for 30 days from the day they say it's ready. If you can't make it in that window, email us before it runs out and we'll work it out.",
            },
            {
              titulo: "Inspect it before you take it",
              texto:
                "Whoever picks the order up can open and check the merchandise right there. If something isn't right, they shouldn't accept it.",
            },
          ],
        },
      ],
    },
    {
      id: "envio",
      numero: "2",
      titulo: "In-country delivery: each seller decides",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Many sellers will deliver merchandise to another city. That's how retail works in Venezuela: it isn't a courier company with one flat rate for everyone — the seller arranges it themselves, usually by motorcycle or ground transport, and adds a fee on top of the product price.",
        },
        {
          tipo: "parrafo",
          texto:
            "So delivery isn't something Mercatren promises; it's something each seller may offer. One seller does it and another doesn't, and the same seller may offer it on some products but not others. A set of motorcycle tires travels very differently from a five-gallon bucket of paint.",
        },
        {
          tipo: "aviso",
          tono: "ojo",
          titulo: "You can't book delivery through the site yet",
          parrafos: [
            "Right now Mercatren charges only for the product, and orders are picked up at the warehouse. If you need it delivered to another city, arrange it with the seller — their phone number and email are on their page here on Mercatren.",
            "We're building delivery into the order itself, with the cost shown before you confirm. When it's ready, this page will say so and each product will show whether that seller delivers.",
          ],
        },
      ],
    },
    {
      id: "costo",
      numero: "3",
      titulo: "What delivery costs",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "The seller sets it, based on where it's going, what it weighs, and how bulky it is. In practice it usually works out to a percentage of the merchandise value. The seller tells you the exact amount before you agree to it.",
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "You'll never pay a charge nobody told you about",
          parrafos: [
            "Not now, while delivery is arranged with the seller, and not once you can book it here. A fee that shows up after you've paid is exactly what we don't want happening on Mercatren.",
          ],
        },
      ],
    },
    {
      id: "fuera",
      numero: "4",
      titulo: "What we don't do",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "We don't ship to the United States or anywhere else",
              texto:
                "The purchase is paid from a U.S. bank, but the merchandise sits in the seller's country and is handed over there. There's no international shipping.",
            },
            {
              titulo: "We don't do the transporting",
              texto:
                "Mercatren has no fleet and no warehouses. The merchandise stays at the seller's warehouse until it's picked up, and when there is a delivery, the seller is the one moving it.",
            },
          ],
        },
      ],
    },
  ],
  cierre: `This policy is part of the terms and conditions of Mercatren, a service of ${SOCIEDAD.nombre}. If something about your delivery didn't go the way this page describes, email us at mercatren@windoce.com with your order number.`,
  accion: {
    titulo: "Questions about your order's delivery?",
    texto: "Email us your order number and we'll look into it with you.",
    boton: "Email Mercatren",
    href: "mailto:mercatren@windoce.com",
  },
};
