import type { PaginaContenido } from "./tipos";
import { SOCIEDAD } from "@/lib/sociedad";

/**
 * «VENDE EN MERCATREN», PARA UN COMERCIO DE ESPAÑA (27 oct 2026).
 *
 * La página de siempre (`vender.ts`) le habla a un comercio de fuera de
 * Estados Unidos cuyos clientes tienen familia allá, y le promete cobrar en
 * dólares en un banco de Estados Unidos. En España nada de eso es verdad:
 * vende a compradores de España, en euros, y despacha él dentro del país.
 *
 * Sin cifras del margen a propósito: el de España lo decide Richard (la
 * tarjeta europea cuesta más que la de Estados Unidos). Lo que sí se promete
 * es lo que el sistema ya hace: el comercio recibe exactamente su precio.
 */
export const VENDER_ESPANA_ES: PaginaContenido = {
  titulo: "Vende en Mercatren España",
  entradilla:
    "Abre tu tienda en Mercatren y vende a compradores de toda España, en euros. Tú pones el producto, tu precio y el envío; nosotros ponemos el escaparate, la venta y la factura.",
  secciones: [
    {
      id: "para-quien",
      titulo: "Para quién es",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Para comercios y autónomos de España que ya venden y quieren un escaparate más en internet y en la app de Mercatren, sin montar una tienda online propia.",
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
              titulo: "Recibes tu precio exacto",
              texto:
                "lo que escribes en cada producto es lo que te pagamos por esa venta. Nuestro margen va dentro del precio que publicamos, no se te descuenta.",
            },
            {
              titulo: "Tu tienda abre al instante",
              texto:
                "sin esperar una aprobación. La revisamos después y solo actuamos si algo no cumple las reglas.",
            },
            {
              titulo: "En la web y en la app",
              texto:
                "quien elige España en Mercatren ve tus productos, en el sitio y en la app de Android.",
            },
            {
              titulo: "Cada venta con su comprobante",
              texto:
                "qué se vendió, a quién y cuándo: lo que te pide tu gestor, sin armarlo a mano.",
            },
          ],
        },
      ],
    },
    {
      id: "como-funciona",
      titulo: "Cómo funciona",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Abres tu tienda",
              texto:
                "con tu NIF: el CIF de tu empresa, o tu DNI o NIE si vendes como autónomo.",
            },
            {
              titulo: "Cargas tus productos",
              texto:
                "con fotos, descripción, existencias y precio en euros, con tu IVA ya dentro.",
            },
            {
              titulo: "Entra un pedido",
              texto: `el comprador paga con tarjeta a ${SOCIEDAD.nombre}, que te compra la mercancía a ti y se la vende a él. Te avisamos con su dirección de entrega.`,
            },
            {
              titulo: "Lo envías",
              texto:
                "a la dirección del comprador en España, con tu transportista de siempre, y nos pasas el número de seguimiento.",
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "acento",
          titulo: "Las compras se abren en unos días",
          parrafos: [
            "Ya puedes abrir tu tienda y cargar tus productos, y ya se ven en Mercatren. El botón de comprar se enciende en cuanto terminemos de probar los pagos en euros de punta a punta.",
          ],
        },
      ],
    },
  ],
};

export const VENDER_ESPANA_EN: PaginaContenido = {
  titulo: "Sell on Mercatren Spain",
  entradilla:
    "Open your store on Mercatren and sell to shoppers across Spain, in euros. You bring the product, your price, and the shipping; we bring the storefront, the sale, and the invoice.",
  secciones: [
    {
      id: "para-quien",
      titulo: "Who it's for",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "For businesses and sole traders in Spain who already sell and want one more storefront online and in the Mercatren app — without building their own online store.",
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
              titulo: "You receive your exact price",
              texto:
                "what you enter on each product is what we pay you for that sale. Our margin is built into the price we publish; nothing is deducted from yours.",
            },
            {
              titulo: "Your store opens right away",
              texto:
                "no approval wait. We review it afterward and only step in if something breaks the rules.",
            },
            {
              titulo: "On the web and in the app",
              texto:
                "anyone who chooses Spain on Mercatren sees your products, on the site and in the Android app.",
            },
            {
              titulo: "A record for every sale",
              texto:
                "what sold, to whom, and when — what your accountant asks for, without putting it together by hand.",
            },
          ],
        },
      ],
    },
    {
      id: "como-funciona",
      titulo: "How it works",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Open your store",
              texto:
                "with your NIF: your company's CIF, or your DNI or NIE if you sell as a sole trader.",
            },
            {
              titulo: "Add your products",
              texto:
                "with photos, a description, stock, and a price in euros with your VAT already included.",
            },
            {
              titulo: "An order comes in",
              texto: `the buyer pays ${SOCIEDAD.nombre} by card; we buy the merchandise from you and sell it to them. We send you their delivery address.`,
            },
            {
              titulo: "You ship it",
              texto:
                "to the buyer's address in Spain with your usual carrier, and send us the tracking number.",
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "acento",
          titulo: "Checkout opens in a few days",
          parrafos: [
            "You can already open your store and add your products, and they're already visible on Mercatren. The buy button turns on as soon as we finish testing payments in euros end to end.",
          ],
        },
      ],
    },
  ],
};
