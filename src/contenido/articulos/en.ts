import type { Articulo } from "./tipos";

/**
 * The English articles.
 *
 * Same `slug` as the Spanish ones, always. A test fails if an article exists in
 * one language and not the other — a link that lands on an empty page is worse
 * than no link at all.
 *
 * Written as a native speaker would, not translated word for word. The audience
 * is the United States market.
 */
export const ARTICULOS_EN: Articulo[] = [
  {
    slug: "ya-puedes-vender-a-credito",
    tipo: "novedad",
    titulo: "You can now offer credit to customers you trust",
    resumen:
      "Merchants on Mercatren can now set a credit limit for their customers, track payments, and collect each one from their dashboard.",
    fecha: "2026-08-06",
    temas: ["news", "credit", "merchants"],
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "Starting today, a Mercatren merchant can set a spending limit for customers they trust. Plenty of them were already doing this on their own — in a notebook, or from memory — and now it's tracked, current, and the money comes in on its own.",
      },
      {
        tipo: "parrafo",
        texto:
          "The idea came from a motorcycle parts distributor in Venezuela. His customers buy two thousand dollars' worth and pay him back in pieces over the month. He asked how to bring that into Mercatren, and this is the answer.",
      },
      { tipo: "subtitulo", texto: "What changes for a merchant" },
      {
        tipo: "lista",
        puntos: [
          "Set a limit per customer, with the amount and the number of days to pay.",
          "See on one screen who owes what, and since when.",
          "Every payment that clears goes straight to their account — no waiting for the customer to finish.",
          "The limit frees up as the customer pays, so they can keep selling to them.",
        ],
      },
      {
        tipo: "aviso",
        tono: "ojo",
        titulo: "The credit still belongs to the merchant",
        texto:
          "The merchant decides who gets credit, how much, and for how long — and the risk on that sale is theirs. Mercatren tracks the balance and collects the payments, but does not lend money or guarantee payment.",
      },
      {
        tipo: "parrafo",
        texto:
          "It's live in the dashboard, under Credit. If you run a store on Mercatren and want to use it, reach out and we'll turn it on.",
      },
    ],
    enlaces: [
      { texto: "How it works, in detail", href: "/docs/ventas-a-credito" },
    ],
  },
  {
    slug: "ventas-a-credito",
    tipo: "documentacion",
    titulo: "Selling on credit: how it works on Mercatren",
    resumen:
      "How a merchant gives trusted customers a spending limit, tracks their payments, and collects each one — without Mercatren lending a cent.",
    fecha: "2026-08-06",
    temas: ["credit", "merchants", "payments", "limit"],
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "Plenty of merchants sell on credit: they know the customer, hand over the goods, and get paid in pieces. It works because the merchant knows exactly who they're extending credit to. What's usually missing is the tracking — how much each one has paid, what's left, who's fallen behind.",
      },
      {
        tipo: "parrafo",
        texto:
          "Mercatren provides that tracking. The merchant still decides who gets credit and how much; what the platform adds is the limit, a record of every payment, and the money landing in their account.",
      },
      {
        tipo: "aviso",
        tono: "ojo",
        titulo: "The merchant extends the credit, not Mercatren",
        texto:
          "The merchant decides who, how much, and for how long, and hands over the goods under their own agreement with the customer. Windoce, LLC does not lend money or act as guarantor: if a customer doesn't pay, that's between them and their supplier.",
      },
      { tipo: "subtitulo", texto: "How the money flows" },
      {
        tipo: "parrafo",
        texto:
          "Each customer payment is a complete, closed purchase. When the customer pays 300 dollars, Mercatren buys 300 dollars of goods from the merchant's inventory and pays for them. Next payment, another purchase. And so on until it's settled.",
      },
      {
        tipo: "parrafo",
        texto:
          "That's why Windoce, LLC never finances anything: it keeps buying and reselling goods, which is what it has always done. Lending money in the United States requires state lender licenses, and this model doesn't need them because it doesn't lend.",
      },
      { tipo: "subtitulo", texto: "Step by step" },
      {
        tipo: "pasos",
        pasos: [
          {
            titulo: "The merchant agrees on credit with the customer",
            texto:
              "Off-platform, the way they always have: they ask for whatever documents they see fit and decide whether to extend credit, and how much.",
          },
          {
            titulo: "They set the limit from their dashboard",
            texto:
              "Under Credit, from the three-dot menu, they set the amount and the number of days. Who turned it on and when is recorded.",
          },
          {
            titulo: "The customer buys against their limit",
            texto:
              "They build a normal order. Only they see the option to pay with their limit; no other shopper knows that merchant offers credit.",
          },
          {
            titulo: "The merchant hands over the goods",
            texto:
              "Under their agreement with the customer. Mercatren records that the order went out, but delivery and its terms are the merchant's call.",
          },
          {
            titulo: "The customer pays when they can",
            texto:
              "They see exactly what they owe and pay whatever they want, with a receipt, like any other payment on the site.",
          },
          {
            titulo: "The money lands and the limit frees up",
            texto:
              "Once the payment clears, Mercatren buys that portion from the merchant and pays for it. The customer's limit frees up by that amount.",
          },
        ],
      },
      { tipo: "subtitulo", texto: "A worked example" },
      {
        tipo: "tabla",
        encabezados: [
          "When",
          "What the customer does",
          "Merchant receives",
          "Still owes",
          "Limit available",
        ],
        filas: [
          ["Day 1", "Buys and takes the goods", "—", "$2,000", "$0"],
          ["Day 1", "Pays $500", "$500", "$1,500", "$500"],
          ["Day 15", "Pays $1,200", "$1,200", "$300", "$1,700"],
          ["Day 27", "Pays $300", "$300", "$0", "$2,000"],
        ],
        nota: "With a $2,000 limit over 30 days. Every payment frees up the limit, so the customer can buy again without settling in full first.",
      },
      { tipo: "subtitulo", texto: "What each side sees" },
      {
        tipo: "lista",
        puntos: [
          "The merchant: a list of customers with credit, each one's limit, what they owe, and what's still available.",
          "The customer: how much they've paid, what's left, when it's due, and every payment with its date.",
          "Nobody else: a regular shopper at that store never sees that the merchant offers credit.",
        ],
      },
      {
        tipo: "aviso",
        tono: "neutro",
        titulo: "How it gets turned on",
        texto:
          "The limit is set from the customer's three-dot menu, never from a loose button. It's a money decision and it can't be triggered by a stray tap — and every activation is signed with the account that made it and the date.",
      },
    ],
    enlaces: [
      {
        texto: "Full model document (PDF)",
        href: "/docs/mercatren-ventas-a-credito.pdf",
      },
    ],
  },
];
