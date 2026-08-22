import type { Articulo } from "./tipos";
import { SOCIEDAD } from "@/lib/sociedad";

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
    slug: "demo-del-panel",
    tipo: "documentacion",
    titulo:
      "What your dashboard looks like when you sell: a demo you can explore",
    resumen:
      "A sample store that sold about six thousand dollars in a month. Go in, scroll through the sales, see what you kept, and request a test withdrawal. It is exactly what you would see.",
    fecha: "2026-08-22",
    temas: ["merchants", "dashboard", "sales", "withdrawals", "demo"],
    cuerpo: [
      {
        tipo: "aviso",
        tono: "acento",
        titulo: "This is a demo",
        texto:
          "The store, the sales and the buyers are made up. The products and their prices are real: they come from Mercatren's U.S. catalog. Nothing you do there moves money or touches a real account.",
      },
      {
        tipo: "parrafo",
        texto:
          "When you start selling through Mercatren, the first thing you want to know is how you will see your money: what sold, what was deducted, how much is available and how you take it out. Instead of explaining it in text, we built a sample store with a full month of sales so you can walk through it yourself.",
      },
      {
        tipo: "boton",
        texto: "Open the demo",
        href: "/demo/panel-ventas.html",
        externo: true,
      },
      {
        tipo: "imagen",
        src: "/docs/demo-panel/1-tablero.png",
        alt: "The sample store's dashboard: sold today, sold this month, Mercatren commission and available to withdraw.",
        pie: "The dashboard: what sold, what was deducted and what is available, at a glance.",
      },
      { tipo: "subtitulo", texto: "What you will find" },
      {
        tipo: "pasos",
        pasos: [
          {
            titulo: "Dashboard",
            texto:
              "What sold today and this month, the commission deducted, what you have available, and what is waiting on you.",
          },
          {
            titulo: "Orders",
            texto:
              "Each sale with its buyer, products, payment method and where it stands: ordered, paid, shipped, delivered, in your money. Tap one to see the detail and what you kept from that sale.",
          },
          {
            titulo: "Payments",
            texto:
              "All the money that came in, split by how it was paid: card, Zelle and the payment links you requested from your panel.",
          },
          {
            titulo: "My money",
            texto:
              "The full picture: what your buyers paid, what the card processor took, Mercatren's commission, what you kept, and what is available after what you already withdrew.",
          },
          {
            titulo: "Withdrawals",
            texto:
              "Request a test withdrawal: choose where it goes, the country decides which bank details are asked, see where the money comes from, and the amount is set aside until the team sends the transfer.",
          },
          {
            titulo: "My invoices to Mercatren",
            texto:
              "For each sale, Mercatren buys the goods from you and issues a purchase order. There you see which order to invoice against and how much you get paid.",
          },
        ],
      },
      {
        tipo: "parrafo",
        texto:
          'The numbers add up: what sold minus what was deducted equals what you kept, and what you kept minus what you already took out equals what is available. If you request a withdrawal in the demo, you will see it move from "available" to "requested, awaiting transfer" on the spot.',
      },
      {
        tipo: "aviso",
        tono: "neutro",
        titulo: "And in your real store?",
        texto:
          "It looks the same, with your sales. You sign in to your panel and find the same menus in the same order. If anything in the demo is unclear, write to us and we will walk you through it with your own store in front of you.",
      },
    ],
  },
  {
    slug: "formulario-fiscal-w8ben-e",
    tipo: "documentacion",
    titulo:
      "The tax form (W-8BEN-E): what it is, why we ask for it, and how to fill it out in 5 minutes",
    resumen:
      "If your company is outside the United States and sells through Mercatren, you need to sign a W-8BEN-E before you can get paid. Here is where it lives, what it asks, and why — with screenshots of the panel itself.",
    fecha: "2026-08-22",
    temas: ["merchants", "payouts", "tax", "W-8BEN-E", "withdrawals"],
    cuerpo: [
      {
        tipo: "aviso",
        tono: "acento",
        titulo: "In one line",
        texto:
          "It is a form that says “my company is NOT a U.S. company.” You fill it out once, in your own language, inside your panel, and it is good for three years. Without it, you cannot request withdrawals.",
      },
      { tipo: "subtitulo", texto: "What is the W-8BEN-E?" },
      {
        tipo: "parrafo",
        texto:
          "It is an IRS form — the U.S. tax authority — with which a foreign company tells whoever is paying it that it is not a U.S. person. Google, YouTube, Amazon and any U.S. platform that pays people abroad use it. When you get paid by a U.S. company, that form is what lets them pay you without withholding taxes.",
      },
      {
        tipo: "parrafo",
        texto: `${SOCIEDAD.nombre} is registered in Michigan, United States, and is the company that buys your merchandise. That is why it asks for it. It is the same thing any serious U.S. customer would ask of you.`,
      },
      { tipo: "subtitulo", texto: "Why is it needed?" },
      {
        tipo: "lista",
        puntos: [
          "So we can pay you without withholding anything. Without the form, a U.S. company would have to hold back part of what it pays you. With it, it does not.",
          "Because the income from the merchandise you sell us belongs to you and your country: the goods are delivered where you are, so that money is not taxed in the United States. The form puts that in writing.",
          "Because the day a bank or an accountant asks for it, it is there. We do not want your money stuck over a form that could have been signed in five minutes.",
        ],
      },
      {
        tipo: "aviso",
        tono: "bien",
        titulo: "This is NOT sent to any tax office",
        texto:
          "Not to the IRS and not to your country's. It is kept in your Mercatren file in case someone ever asks. You are not filing taxes anywhere by completing it.",
      },
      { tipo: "subtitulo", texto: "Where it is" },
      {
        tipo: "parrafo",
        texto:
          "Go to your panel and open “My store.” At the very top you will see an orange card that says “Tax form (W-8BEN-E).” That is where you fill it out.",
      },
      {
        tipo: "imagen",
        src: "/docs/w8bene/1-mi-tienda.png",
        alt: "The tax form card at the top of the My store screen in the Mercatren panel",
        pie: "Panel → My store. The orange card at the top is the form.",
      },
      { tipo: "subtitulo", texto: "How to fill it out, step by step" },
      {
        tipo: "pasos",
        pasos: [
          {
            titulo: "Open “Sign and save”",
            texto:
              "Tap that line inside the card and the form unfolds. The first thing you read is the notice that this is not sent to the IRS.",
          },
          {
            titulo: "Legal name of your company",
            texto:
              "Exactly as it appears in your business registry, with its suffix: “C.A”, “S.A.S”, “S.R.L”… This is the name that will appear on the document.",
          },
          {
            titulo: "Country of incorporation",
            texto:
              "Pick it from the list. If your company is registered in the United States, Puerto Rico or any U.S. territory, this is NOT your form: write to us and we will request the right one (the W-9).",
          },
          {
            titulo: "Type of entity",
            texto:
              "Corporation (most companies), partnership, sole proprietorship, or other. If in doubt, the first one.",
          },
          {
            titulo: "Address, city, state and postal code",
            texto:
              "The real address where your company operates. A P.O. box is not accepted — the IRS rejects it. State and postal code are optional, since not every country uses them.",
          },
          {
            titulo: "Your country's tax ID",
            texto:
              "Your RIF, NIT, RUT or whatever number you use there. It is optional, but if you have it, include it: it gives the document more weight.",
          },
          {
            titulo: "Who signs",
            texto:
              "Your name and title (manager, director, legal representative…). It must be someone with authority to sign for the company.",
          },
          {
            titulo: "Read the declaration and check the box",
            texto:
              "It is a declaration under penalty of perjury: that the information is true and that the company is not a U.S. person. Read it in full before checking. When you save, the date, time and where you signed from are recorded — that is what turns the checkbox into a valid signature.",
          },
        ],
      },
      {
        tipo: "imagen",
        src: "/docs/w8bene/2-formulario.png",
        alt: "The tax form unfolded, with the legal name, country, entity type and address fields",
        pie: "The full form. The country is chosen from a list: it does not accept the United States.",
      },
      {
        tipo: "imagen",
        src: "/docs/w8bene/3-firma.png",
        alt: "The sworn declaration and the signature checkbox at the end of the form",
        pie: "The declaration is shown in full. You read it, check the box, and save.",
      },
      { tipo: "subtitulo", texto: "What happens next" },
      {
        tipo: "parrafo",
        texto:
          "When you save, the official document comes out already filled in and signed, in English as the IRS requires, with your information. You can view and print it from “My store → View my document.” You do not have to send it to anyone.",
      },
      {
        tipo: "imagen",
        src: "/docs/w8bene/4-documento.png",
        alt: "The generated W-8BEN-E document, in English, with the company details and the certification",
        pie: "The document produced when you sign. It is the substitute form the IRS accepts, with your information.",
      },
      {
        tipo: "tabla",
        encabezados: ["Question", "Answer"],
        filas: [
          [
            "How long is it valid?",
            "Three years: until December 31 of the third year after signing. We notify you 60 days before it expires.",
          ],
          [
            "How often do I fill it out?",
            "Once every three years, or sooner if something about your company changes (name, address, country).",
          ],
          ["Does it cost anything?", "No. It is free."],
          [
            "Can I get paid while I fill it out?",
            "No: withdrawals are on hold until it is current. That is why it is worth doing on day one.",
          ],
          [
            "What if my company is a U.S. company?",
            "Then this is not your form. Write to us and we will request the W-9.",
          ],
        ],
      },
      {
        tipo: "aviso",
        tono: "ojo",
        titulo: "If you already signed and need to fix something",
        texto:
          "Go to My store and tap “Sign again.” It replaces the previous one and the three-year clock restarts from that date.",
      },
    ],
    enlaces: [
      { texto: "Go to My store", href: "/panel/mi-tienda" },
      { texto: "How Mercatren works", href: "/como-funciona" },
    ],
  },
  {
    slug: "pagar-por-zelle-te-sale-mas-barato",
    tipo: "novedad",
    titulo: "You can now see how much you save paying with Zelle",
    resumen:
      "Your order total depends on how you pay, and checkout now shows you the difference before you confirm.",
    fecha: "2026-08-07",
    temas: ["news", "pricing", "zelle", "buyers"],
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "Catalog prices have the card processing fee built in. That's right when you pay by card, because the cost is real. But Zelle has no processor: the transfer costs nothing.",
      },
      {
        tipo: "parrafo",
        texto:
          "Starting today, checkout calculates your total based on how you choose to pay, and tells you what you save by choosing Zelle. It used to show the card total no matter what, and the order came out cheaper after you confirmed. That's fixed.",
      },
      {
        tipo: "tabla",
        encabezados: ["Total by card", "Total by Zelle", "You save"],
        filas: [
          ["$105.47", "$103.10", "$2.37"],
          ["$526.08", "$515.47", "$10.61"],
          ["$2,103.37", "$2,061.86", "$41.51"],
        ],
        nota: "Zelle is available on orders of $200 and up. Below that, card is the way.",
      },
      {
        tipo: "subtitulo",
        texto: "And for merchants, what you get paid doesn't change",
      },
      {
        tipo: "parrafo",
        texto:
          "You get your invoice price in full, however the buyer pays. What it costs us to collect one way or the other is on us, and it's already accounted for in the price we publish.",
      },
      {
        tipo: "aviso",
        tono: "ojo",
        titulo: "We corrected a mismatch",
        texto:
          "Between August 5 and 7, sales collected through Zelle had one percentage point too much deducted from the merchant. It's fixed and the numbers line up again. If you have a sale from those days you'd like reviewed, get in touch.",
      },
    ],
    enlaces: [{ texto: "How the price is built", href: "/vender/comisiones" }],
  },
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
        texto: `The merchant decides who, how much, and for how long, and hands over the goods under their own agreement with the customer. ${SOCIEDAD.nombre} does not lend money or act as guarantor: if a customer doesn't pay, that's between them and their supplier.`,
      },
      { tipo: "subtitulo", texto: "How the money flows" },
      {
        tipo: "parrafo",
        texto:
          "Each customer payment is a complete, closed purchase. When the customer pays 300 dollars, Mercatren buys 300 dollars of goods from the merchant's inventory and pays for them. Next payment, another purchase. And so on until it's settled.",
      },
      {
        tipo: "parrafo",
        texto: `That's why ${SOCIEDAD.nombre} never finances anything: it keeps buying and reselling goods, which is what it has always done. Lending money in the United States requires state lender licenses, and this model doesn't need them because it doesn't lend.`,
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
