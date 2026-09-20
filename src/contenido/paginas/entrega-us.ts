import type { PaginaContenido } from "./tipos";
import { CORREO_CONTACTO } from "@/lib/correo/direcciones";
import { SOCIEDAD } from "@/lib/sociedad";

/**
 * ══ ENTREGA Y ENVÍO EN ESTADOS UNIDOS (20 sep 2026) ══
 *
 * Hasta hoy mercatren.com enseñaba la página de entrega de VENEZUELA: retiro
 * en el depósito del comercio y, con todas las letras, «No enviamos a Estados
 * Unidos ni a otros países». En la tienda que vende y entrega SOLO en Estados
 * Unidos, y cuya cuenta de Merchant Center declara envío gratis a todo el
 * país. Google cruza la política del sitio con lo declarado: esa frase sola
 * basta para rechazar el catálogo por información contradictoria.
 *
 * Aquí no se promete NADA que el resto del sitio no prometa ya en cada ficha
 * (`catalogo.producto.entregaUs`): envío incluido, los 50 estados y el plazo.
 * Si ese plazo cambia cuando se midan las primeras entregas reales, se cambia
 * en los dos sitios y se sube la versión.
 */
export const ENTREGA_US_ES: PaginaContenido = {
  titulo: "Entrega y envío",
  entradilla:
    "Envío gratis a cualquier dirección de los 50 estados de Estados Unidos. El precio que ves es el precio final.",
  vigencia: "Versión 1 · Vigente desde el 20 de septiembre de 2026",
  indiceTitulo: "En esta página",
  secciones: [
    {
      id: "gratis",
      numero: "1",
      titulo: "El envío va incluido en el precio",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "El precio publicado de cada producto ya incluye el envío. No aparece ningún cargo de envío ni de manejo al final de la compra: lo que ves en la ficha es lo que pagas.",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "A dónde enviamos",
              texto:
                "A cualquier dirección de los 50 estados de Estados Unidos. La dirección de entrega la escribes tú al comprar.",
            },
            {
              titulo: "Desde dónde sale",
              texto:
                "Desde almacenes dentro de Estados Unidos. Por eso no hay trámites de aduana ni impuestos de importación que pagar al recibir.",
            },
          ],
        },
      ],
    },
    {
      id: "plazo",
      numero: "2",
      titulo: "Cuánto tarda en llegar",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "De 2 a 5 días hábiles desde que se confirma tu pago. Los sábados, domingos y feriados no cuentan como días hábiles.",
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "Si tu pedido se retrasa",
          parrafos: [
            "Escríbenos con tu número de pedido. Si el paquete no llega, no tienes que discutirlo con el transportista: lo resolvemos nosotros, con un reenvío o con la devolución de tu dinero.",
          ],
        },
      ],
    },
    {
      id: "seguimiento",
      numero: "3",
      titulo: "Cómo sigues tu pedido",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "En «Seguir mi pedido», con tu número de pedido, ves cada paso: pago confirmado, en preparación, enviado y entregado.",
        },
      ],
    },
    {
      id: "otros-paises",
      numero: "4",
      titulo: "Si lo quieres en otro país",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Esta tienda entrega solo dentro de Estados Unidos. Si vives en otro país, puedes crear gratis tu casillero de Mercatren en Miami: te damos una dirección de Estados Unidos con tu número, recibimos tu compra y te la enviamos a tu país.",
        },
      ],
    },
    {
      id: "devolver",
      numero: "5",
      titulo: "Si algo no llegó como esperabas",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Tienes 30 días desde el día que lo recibes para devolverlo. Si llegó dañado, incompleto o no es lo que pediste, el envío de vuelta lo pagamos nosotros. El detalle está en la página de devoluciones.",
        },
      ],
    },
  ],
  cierre: `Esta política forma parte de los términos y condiciones de Mercatren, un servicio de ${SOCIEDAD.nombre}, que es quien te vende y te factura. Si algo de tu entrega no salió como dice aquí, escríbenos a ${CORREO_CONTACTO} con tu número de pedido.`,
  accion: {
    titulo: "¿Dudas con la entrega de tu pedido?",
    texto: "Escríbenos con tu número de pedido y lo revisamos contigo.",
    boton: "Escribir a Mercatren",
    href: `mailto:${CORREO_CONTACTO}`,
  },
};

export const ENTREGA_US_EN: PaginaContenido = {
  titulo: "Shipping and delivery",
  entradilla:
    "Free shipping to any address in all 50 U.S. states. The price you see is the final price.",
  vigencia: "Version 1 · Effective September 20, 2026",
  indiceTitulo: "On this page",
  secciones: [
    {
      id: "gratis",
      numero: "1",
      titulo: "Shipping is included in the price",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "The listed price of every product already includes shipping. No shipping or handling charge shows up at checkout: what you see on the product page is what you pay.",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Where we ship",
              texto:
                "To any address in all 50 U.S. states. You enter the delivery address when you place your order.",
            },
            {
              titulo: "Where it ships from",
              texto:
                "From warehouses inside the United States, so there is no customs paperwork and no import duties to pay on delivery.",
            },
          ],
        },
      ],
    },
    {
      id: "plazo",
      numero: "2",
      titulo: "How long delivery takes",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "2 to 5 business days from the moment your payment is confirmed. Saturdays, Sundays, and holidays are not business days.",
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "If your order is running late",
          parrafos: [
            "Email us with your order number. If the package never arrives, you don't have to take it up with the carrier: we make it right, with a replacement shipment or a refund.",
          ],
        },
      ],
    },
    {
      id: "seguimiento",
      numero: "3",
      titulo: "How to track your order",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Under “Track my order,” your order number shows every step: payment confirmed, being prepared, shipped, and delivered.",
        },
      ],
    },
    {
      id: "otros-paises",
      numero: "4",
      titulo: "If you need it in another country",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "This store delivers within the United States only. If you live elsewhere, you can open a free Mercatren mailbox in Miami: you get a U.S. address with your own number, we receive your purchase, and we forward it to your country.",
        },
      ],
    },
    {
      id: "devolver",
      numero: "5",
      titulo: "If something didn't arrive as expected",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "You have 30 days from the day you receive it to send it back. If it arrived damaged, incomplete, or isn't what you ordered, we pay the return shipping. The details are on the returns page.",
        },
      ],
    },
  ],
  cierre: `This policy is part of the terms and conditions of Mercatren, a service of ${SOCIEDAD.nombre}, the company that sells to you and invoices you. If anything about your delivery didn't go as described here, email ${CORREO_CONTACTO} with your order number.`,
  accion: {
    titulo: "Questions about your delivery?",
    texto: "Email us your order number and we'll look into it with you.",
    boton: "Email Mercatren",
    href: `mailto:${CORREO_CONTACTO}`,
  },
};
