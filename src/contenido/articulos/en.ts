import type { Articulo } from "./tipos";
import { CORREO_CONTACTO } from "@/lib/correo/direcciones";
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
    slug: "limites-de-zelle",
    tipo: "documentacion",
    titulo: "Zelle limits when paying Mercatren",
    resumen:
      "Why your bank sometimes won't let you send the full amount over Zelle, what today's maximum is, and which method does work for a large invoice.",
    fecha: "2026-08-27",
    temas: ["pagos", "zelle", "transferencia", "compradores"],
    cuerpo: [
      {
        tipo: "aviso",
        tono: "ojo",
        titulo: "This is temporary",
        texto: `This page was written on Thursday, August 27, 2026 and describes a TEMPORARY situation. The ${SOCIEDAD.nombre} account is new, and banks cap the first payments to a recipient they don't know yet. If you're reading this two or three months from now, it very likely no longer applies: the limit rises on its own as the account matures and as you keep paying us.`,
      },
      { tipo: "subtitulo", texto: "What's actually happening" },
      {
        tipo: "parrafo",
        texto: `When you go to send a Zelle payment to ${SOCIEDAD.nombre}, your bank shows you the most it will let you send that recipient TODAY. Right now, for an account paying us for the first time, that maximum is around one thousand dollars.`,
      },
      {
        tipo: "parrafo",
        texto:
          "This isn't a limit Mercatren sets. It's your bank's, and it decides it on every transfer. Chase, for instance, puts it this way right on the payment screen:",
      },
      {
        tipo: "aviso",
        tono: "neutro",
        titulo: "What your bank says",
        texto:
          "“Your payment sending limit is flexible. As you establish a Zelle payment history with a new recipient, your daily limit for sending them money may increase.”",
      },
      {
        tipo: "parrafo",
        texto:
          "So when an invoice goes over that maximum, Mercatren simply doesn't offer Zelle: it would be sending you to a screen where you can't finish. And what usually happens then is worse than not being able to pay — you send what you're allowed, the invoice ends up half paid, and it has to be corrected by hand.",
      },
      { tipo: "subtitulo", texto: "What to do with a large invoice" },
      {
        tipo: "parrafo",
        texto: `Use a BANK TRANSFER (ACH). It has no such limit, most banks charge nothing for it, and the money lands in the same ${SOCIEDAD.nombre} account. Your payment page shows the four details your bank asks for, each with its own copy button.`,
      },
      {
        tipo: "lista",
        puntos: [
          "Bank transfer (ACH): no such limit and no fee. This is the recommended one for large amounts.",
          "Card: no such limit either. It confirms instantly.",
          "Zelle: for amounts below the maximum. A person confirms it, usually the same business day.",
        ],
      },
      {
        tipo: "aviso",
        tono: "ojo",
        titulo: "The reconciliation number",
        texto:
          "If you pay by transfer or by Zelle, include the reconciliation number shown on your payment page. That number is what ties your transfer to your invoice: it documents the money leaving your account and arriving in ours.",
      },
      { tipo: "subtitulo", texto: "What if I already sent less?" },
      {
        tipo: "parrafo",
        texto:
          "Nothing is lost. We record exactly what came in and you get an email with both amounts — the invoice and what we received — plus a link to view the receipt you uploaded, exactly as it arrived. The invoice stays open for the difference and the merchant will reach out to finish it.",
      },
      {
        tipo: "boton",
        texto: "Zelle limits at Chase",
        href: "https://www.chase.com/business/support/banking/online-banking/zelle",
        externo: true,
      },
    ],
  },
  {
    slug: "la-portada-abre-con-todas-las-tiendas",
    tipo: "novedad",
    titulo:
      "Mercatren's home page now opens with every store — small shops first",
    resumen:
      "Every Venezuelan store shows up on the first screen with its newest products, even if it only has one. Products from the US catalog are spread in between, a few at a time.",
    fecha: "2026-08-23",
    temas: ["news", "home page", "stores", "venezuela"],
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "Several stores told us, and they were right: the home page opened with a whole block from the store with the most products, then the US catalog, and the rest might as well not exist. A store with two products — or one — never came first.",
      },
      {
        tipo: "parrafo",
        texto:
          "Starting today the home page opens with a block called exactly that, “From every store”: the two newest products of EACH Venezuelan store, one after another, and only then six products from the US catalog. The order of the stores changes on every visit, so one time the zinc-sheet wholesaler opens and the next time the shoe store does.",
      },
      {
        tipo: "imagen",
        src: "/blog/la-portada-abre-con-todas-las-tiendas/1-portada-celular.png",
        alt: "Mercatren's home page on a phone: the “From every store” block with products from different Venezuelan stores.",
        pie: "On a phone, which is where almost everyone shops from.",
      },
      { tipo: "subtitulo", texto: "What changes for a store" },
      {
        tipo: "lista",
        puntos: [
          "Whether you have one product or six hundred, your two newest show up on the first screen of the home page.",
          "Every product you upload goes straight into that block: uploading puts you up front.",
          "The department bands (Hardware, Apparel, Motorcycles…) follow the same rule: in each one, Venezuelan stores first, then the US catalog.",
          "And if a product has several photos, the photo shown in the grid rotates through them — people see all of them, not just the first.",
        ],
      },
      {
        tipo: "imagen",
        src: "/blog/la-portada-abre-con-todas-las-tiendas/2-portada-escritorio.png",
        alt: "Mercatren's home page on a desktop, with the “From every store” block.",
        pie: "On desktop you see seven per row; the rule is the same.",
      },
      {
        tipo: "aviso",
        tono: "acento",
        titulo: "Do you run a store?",
        texto:
          "Open your store, upload your products with their city and address, and you're on the home page from day one.",
      },
    ],
    enlaces: [
      { texto: "See the home page", href: "/" },
      { texto: "Open my store", href: "/vender" },
      { texto: "All stores", href: "/tiendas" },
    ],
  },
  {
    slug: "productos-similares-y-lo-que-estabas-mirando",
    tipo: "novedad",
    titulo:
      "Similar products and “Because you were browsing”: a store that follows your taste",
    resumen:
      "At the bottom of every product you now get similar ones, and if you look at two of the same kind, the home page shows you more of it. The back arrow drops you right back in the store you were in.",
    fecha: "2026-08-23",
    temas: ["news", "shoppers", "catalog"],
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "Three small things you notice a lot while browsing. First: below every product there is now a “Similar products” row — same category first, then the same store — with a link to see more from that store.",
      },
      {
        tipo: "imagen",
        src: "/blog/productos-similares-y-lo-que-estabas-mirando/1-similares.png",
        alt: "The “Similar products” row at the bottom of a sneaker listing on Mercatren.",
      },
      {
        tipo: "parrafo",
        texto:
          "Second: if you open two products of the same kind — two pairs of shoes, two lipsticks — the home page shows a band that says “Because you were browsing” with more of it. If you move on to something else, the band follows. All of that stays in your browser; it is not sent anywhere.",
      },
      {
        tipo: "imagen",
        src: "/blog/productos-similares-y-lo-que-estabas-mirando/2-porque-estuviste-mirando.png",
        alt: "The “Because you were browsing · More Apparel” band on Mercatren's home page.",
      },
      {
        tipo: "parrafo",
        texto:
          "And third, which looked like a detail and wasn't: the “Back” arrow above each product sent you to the whole catalog, and if you were browsing a store you had to find it again. Now it goes back to where you were — the store, the search — and if you arrived from a WhatsApp or Google link, it takes you to the product's store.",
      },
    ],
    enlaces: [
      { texto: "Browse the catalog", href: "/catalogo" },
      { texto: "How Mercatren works", href: "/como-funciona" },
    ],
  },
  {
    slug: "cada-producto-dice-donde-lo-reclamas",
    tipo: "novedad",
    titulo:
      "Every product now says where to pick it up: the store's city and address",
    resumen:
      "If you buy a pair of shoes in Tucaní you need to know where to go get them. Every listing from a Venezuelan store now says it plainly, and what happens after you pay.",
    fecha: "2026-08-23",
    temas: ["news", "shoppers", "pickup", "venezuela"],
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "Nobody buys something without knowing where they will receive it. Until now, a product with no warehouse assigned said nothing — even when the store had its address on its own page. Whoever looked at the shoes had no way of knowing they are picked up on Vía Panamericana, in Tucaní.",
      },
      {
        tipo: "parrafo",
        texto:
          "Starting today, every product from a Venezuelan store says where it is picked up — the store's city and address, or its warehouse if it has one — and what happens after paying: you pick the product up at that address with your order number, at a verified store. If you choose your city at the top, the listing also tells you whether it is near or far.",
      },
      {
        tipo: "imagen",
        src: "/blog/cada-producto-dice-donde-lo-reclamas/1-ficha-campus.png",
        alt: "A sneaker listing on Mercatren with the “Pick up at Tucaní” block, the store's address and the note about what happens after paying.",
      },
      { tipo: "subtitulo", texto: "For the store" },
      {
        tipo: "lista",
        puntos: [
          "The city and address you have in “My store” are what buyers see on every product. Check them.",
          "If you have several warehouses, each product can carry its own, and that one takes precedence over the general address.",
          "Without a city, the listing tells the buyer to message you before paying — better than making up a place.",
        ],
      },
      {
        tipo: "imagen",
        src: "/blog/cada-producto-dice-donde-lo-reclamas/2-tienda-maxium.png",
        alt: "The MAXIUM store page on Mercatren, with its city, its WhatsApp button and its single product.",
        pie: "A store with a single product — and everything you need to buy it.",
      },
    ],
    enlaces: [
      { texto: "Delivery and pickup", href: "/entrega" },
      { texto: "Go to My store", href: "/panel/mi-tienda" },
    ],
  },
  {
    slug: "cobra-por-enlace-sin-programar-nada",
    tipo: "novedad",
    titulo:
      "Payment links with zero coding: forward them to whoever pays, by card or Zelle",
    resumen:
      "From your panel you create a payment link with your invoice number, send it by WhatsApp or email to whoever is paying — even if they're in Miami — and the payment comes in. With freight and handling as separate lines if you need them.",
    fecha: "2026-08-23",
    temas: ["news", "stores", "payments", "zelle"],
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "The most common case of all: someone buys at your counter and the one putting down the card is their son in the United States. Until now, payment links were only available to the store that had connected them to its own system. Now every store has them, from the panel, under “Payments → Payment links”.",
      },
      {
        tipo: "imagen",
        src: "/blog/cobra-por-enlace-sin-programar-nada/1-panel-enlaces-de-cobro.png",
        alt: "The “Request a payment” form in the Mercatren panel: store, amount, invoice number, payer's email and concept.",
      },
      {
        tipo: "pasos",
        pasos: [
          {
            titulo: "Enter the amount and your invoice number",
            texto:
              "That number is what later shows up in your bank and in the payer's; it is what reconciles the books.",
          },
          {
            titulo: "Enter the email of whoever is PAYING",
            texto:
              "It doesn't have to be your customer. The email with the link goes out, and you can also copy the link and send it by WhatsApp.",
          },
          {
            titulo: "If you charge freight or any extra service, add it",
            texto:
              "They go on separate lines — “Freight and transportation”, “Handling and additional services” — each with its explanation, and the payer sees them itemized.",
          },
          {
            titulo: "The payer chooses card or Zelle",
            texto: `Zelle is offered from $200 and is guided step by step, with the account in the name of ${SOCIEDAD.nombre} and the number they must write in the memo.`,
          },
        ],
      },
      {
        tipo: "imagen",
        src: "/blog/cobra-por-enlace-sin-programar-nada/2-pagina-de-pago.png",
        alt: "The payment page for a $620 payment link: the store, the invoice, the concept and the two ways to pay.",
      },
      {
        tipo: "imagen",
        src: "/blog/cobra-por-enlace-sin-programar-nada/3-pagar-por-zelle.png",
        alt: `The steps to pay by Zelle: send to the account in the name of ${SOCIEDAD.nombre} and write the reconciliation number in the memo.`,
        pie: "Step 1 says whose name the account is in: the bank shows it to the payer before confirming.",
      },
      { tipo: "subtitulo", texto: "And what happens next" },
      {
        tipo: "lista",
        puntos: [
          "If the link expires, you reactivate it with the same number and the same link: the email you already sent works again.",
          "If you got the amount or the customer wrong, you cancel it. A paid one can't be canceled: if money has to go back, the refund button is right there.",
          "If someone reopens a link that was already paid, the page says so: “this invoice is already paid”, with the date and method.",
          "If your business has its own system, all of this can be done from it too: there is a documented API.",
        ],
      },
    ],
    enlaces: [
      { texto: "Go to Payments", href: "/panel/cobros/enlaces" },
      { texto: "How the price is formed", href: "/vender/comisiones" },
      { texto: "Documentation", href: "/docs" },
    ],
  },
  {
    slug: "busca-en-espanol-el-catalogo-de-estados-unidos",
    tipo: "novedad",
    titulo:
      "Search the US catalog in Spanish: “bicicleta”, “caucho”, “corneta”",
    resumen:
      "The catalog that ships within the United States can be searched in Spanish, with each country's words. Ninety-six results for “bicicleta”, free shipping included in the price.",
    fecha: "2026-08-23",
    temas: ["news", "catalog", "united states", "search"],
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "The catalog that ships within the United States arrived with its listings in English, and searching for “repuestos” returned nothing even though there were spare parts. Not anymore: the search understands Spanish — and each country's words — and finds the same thing even if the listing is in English.",
      },
      {
        tipo: "imagen",
        src: "/blog/busca-en-espanol-el-catalogo-de-estados-unidos/1-bicicleta.png",
        alt: "Results for “bicicleta” on Mercatren: 96 products that ship within the United States.",
      },
      {
        tipo: "lista",
        puntos: [
          "“bicicleta” finds “bike”; “llanta”, “caucho” and “neumático” all match each other; “corneta” finds “bocina”; “refacciones” finds “repuestos”.",
          "Products that ship within the United States carry the flag on the card: shipping is included in the price and takes 2–5 days.",
          "Titles are being translated into Spanish; in the meantime, search already works.",
        ],
      },
      {
        tipo: "aviso",
        tono: "neutro",
        titulo: "Can't find something?",
        texto:
          "Write to us. If it's a word used in your country and not in another, we add it to the search dictionary.",
      },
    ],
    enlaces: [
      { texto: "Search the catalog", href: "/catalogo" },
      { texto: "Help", href: "/ayuda" },
    ],
  },
  {
    slug: "el-formulario-fiscal-w8ben-e-se-llena-en-pantalla",
    tipo: "novedad",
    titulo:
      "The W-8BEN-E tax form is filled out on screen, in Spanish, in five minutes",
    resumen:
      "A store in Venezuela or Colombia does not need a US company to sell through Mercatren: it needs this form. It is now filled out from the panel and the signed document comes out.",
    fecha: "2026-08-23",
    temas: ["news", "stores", "tax"],
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "The W-8BEN-E is the form with which a company declares it is not a US company. It is what Google, Facebook or any marketplace asks of anyone getting paid from abroad; downloading it in English, printing it, signing it and scanning it is exactly where most people give up.",
      },
      {
        tipo: "parrafo",
        texto:
          "Now it is filled out from “My store”, in Spanish and with every field explained, and on signing the document comes out in English, as whoever has to read it expects. It is not sent to any office: it is kept in case someone asks for it. Without it, withdrawals can't be requested — so it's worth doing on day one.",
      },
      {
        tipo: "imagen",
        src: "/docs/w8bene/2-formulario.png",
        alt: "The tax form inside “My store”: legal name, country, entity type, address, tax ID and signer.",
      },
      {
        tipo: "imagen",
        src: "/docs/w8bene/4-documento.png",
        alt: "The W-8BEN-E document generated from the form, ready to print or save.",
      },
      {
        tipo: "boton",
        texto: "See the step-by-step tutorial",
        href: "/docs/formulario-fiscal-w8ben-e",
      },
    ],
    enlaces: [{ texto: "Go to My store", href: "/panel/mi-tienda" }],
  },
  {
    slug: "asi-se-ve-tu-panel-cuando-vendes",
    tipo: "novedad",
    titulo:
      "This is what your panel looks like when you sell: a demo to walk through",
    resumen:
      "A sample store with a month of sales so you can see, before opening yours, how orders come in, how much you keep from each sale and how you request your money.",
    fecha: "2026-08-23",
    temas: ["news", "stores", "panel"],
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "Many stores ask us the same thing before opening theirs: “and how do I see what I sell?”. So we built a demo of the panel, with a made-up store and a made-up month of sales, to walk through calmly from a phone or a computer.",
      },
      {
        tipo: "imagen",
        src: "/docs/demo-panel/1-tablero.png",
        alt: "The demo store's dashboard: sold this month, Mercatren's commission, what was left and what is available to withdraw.",
      },
      {
        tipo: "lista",
        puntos: [
          "Orders: each sale with its date, product, how it was paid and what step it's at.",
          "Payments: card, Zelle and payment links, each on its own.",
          "My money and Withdrawals: how much you kept from each sale and how you request it.",
        ],
      },
      {
        tipo: "boton",
        texto: "Open the demo",
        href: "/demo/panel-ventas.html",
      },
    ],
    enlaces: [
      { texto: "The full demo guide", href: "/docs/demo-del-panel" },
      { texto: "Open my store", href: "/vender" },
    ],
  },
  {
    slug: "mercatren-ya-habla-con-los-agentes-de-ia",
    tipo: "novedad",
    titulo:
      "Mercatren now talks to AI agents: open catalog, MCP server and pages in Markdown",
    resumen:
      "An AI assistant can search the catalog, read a listing or look up a store without fighting the HTML: there is a read-only MCP server, a documented API, and every page comes back as Markdown when asked.",
    fecha: "2026-08-23",
    temas: ["news", "agents", "api", "developers"],
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "More and more people ask an AI assistant where to buy something. For the answer to include Mercatren's stores, the site has to be machine-readable. Starting today, it is.",
      },
      {
        tipo: "tabla",
        encabezados: ["What", "Where", "What for"],
        filas: [
          [
            "MCP server (read-only)",
            "/datos/mcp",
            "Search products, view a listing, list and view stores from any compatible agent.",
          ],
          [
            "OpenAPI specification",
            "/datos/openapi.json",
            "The public catalog, search and the partner API for payment links, documented.",
          ],
          [
            "Pages in Markdown",
            "any public page",
            "Requesting it with Accept: text/markdown returns the clean content, without the HTML.",
          ],
          [
            "Skills",
            "/.well-known/agent-skills/index.json",
            "Instructions for buying on Mercatren and for collecting payments through Mercatren from a store's system.",
          ],
          [
            "API catalog and manifest",
            "/.well-known/api-catalog · /.well-known/ai-catalog.json",
            "So an agent can discover on its own what's here and how to use it.",
          ],
        ],
        nota: "None of this charges or writes anything: an agent finds and recommends; buying is still something the person does, with their account.",
      },
      {
        tipo: "aviso",
        tono: "neutro",
        titulo: "If you run a system",
        texto:
          "If your business already has its invoicing software, the API lets you create payment links, check whether they were paid and sync your catalog. Write to us and we'll set up your access.",
      },
    ],
    enlaces: [
      { texto: "Documentation", href: "/docs" },
      { texto: "How Mercatren works", href: "/como-funciona" },
    ],
  },
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
      {
        texto: "Your country's VAT: why it goes inside the price",
        href: "/docs/impuestos-comercios-fuera-de-estados-unidos",
      },
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
  {
    slug: "cobrar-por-enlace",
    tipo: "documentacion",
    titulo: "Payment links: the complete guide for your store",
    resumen:
      "How to create a payment link from your panel, what the payer sees (card, or Zelle from $200), how to forward it to whoever actually pays, and how to refund, cancel or revive it.",
    fecha: "2026-08-23",
    temas: ["comercios", "cobros", "zelle", "tarjeta", "enlace de cobro"],
    cuerpo: [
      {
        tipo: "aviso",
        tono: "acento",
        titulo: "In one line",
        texto:
          "A payment link is a payment page with your reference and your amount. You send it by email or WhatsApp to whoever will pay —your customer or their relative in the United States— and when they pay, the charge shows as paid in your panel.",
      },
      { tipo: "subtitulo", texto: "Where it lives" },
      {
        tipo: "parrafo",
        texto:
          "In your panel: Sales → Payments → the “Payment links” tab. There you find the form to create one and the list of the ones you already created, with their status.",
      },
      {
        tipo: "imagen",
        src: "/blog/cobra-por-enlace-sin-programar-nada/1-panel-enlaces-de-cobro.png",
        alt: "The “Request a payment” form in the Mercatren panel, with amount, reference, email and the freight and handling charges.",
        pie: "Sales → Payments → Payment links.",
      },
      { tipo: "subtitulo", texto: "How to create one, step by step" },
      {
        tipo: "pasos",
        pasos: [
          {
            titulo: "Amount",
            texto: "What the goods cost, in dollars, with decimals (45.90).",
          },
          {
            titulo: "Reference",
            texto:
              "YOUR invoice number. It is what shows up in reconciliation and on the payer's statement.",
          },
          {
            titulo: "Payer's email",
            texto:
              "Your customer, or the person paying on their behalf. The link goes to that email.",
          },
          {
            titulo: "Freight and handling (optional)",
            texto:
              "Two separate lines, each with its own explanation: transport, and handling (loading, carrying upstairs, packaging). That way the invoice never says the goods cost more than they did.",
          },
          {
            titulo: "Days valid",
            texto:
              "Seven by default, up to fifteen. If it expires, you revive it with the same reference and the same link.",
          },
          {
            titulo: "Create",
            texto:
              "The email goes out by itself. You also see the link on screen to copy it and send it by WhatsApp.",
          },
        ],
      },
      { tipo: "subtitulo", texto: "What the payer sees" },
      {
        tipo: "parrafo",
        texto:
          "A page with the breakdown (goods, freight, handling), your name and two ways to pay: card, or Zelle when the amount is $200 or more. With Zelle they are asked to write the reconciliation number in the transfer note: that number justifies the money leaving their account and arriving in ours.",
      },
      {
        tipo: "imagen",
        src: "/blog/cobra-por-enlace-sin-programar-nada/2-pagina-de-pago.png",
        alt: "The payment page of a payment link with the breakdown of goods, freight and handling, and the payment methods.",
        pie: "The page the payer receives.",
      },
      {
        tipo: "imagen",
        src: "/blog/cobra-por-enlace-sin-programar-nada/3-pagar-por-zelle.png",
        alt: `The three steps to pay by Zelle: the account in the name of ${SOCIEDAD.nombre}, the reconciliation number and the receipt screenshot.`,
        pie: "Paying by Zelle: three steps in a thread.",
      },
      { tipo: "subtitulo", texto: "Forward, refund, cancel, revive" },
      {
        tipo: "lista",
        puntos: [
          "Forward: the “Resend” button sends the same link again, with the same reference. No second charge is created.",
          "Refund: only card payments, from the charge's menu, with a mandatory reason. A Zelle payment cannot be reversed: it is returned with a new transfer made by a person.",
          "Cancel: an open or expired link is switched off and can no longer be paid. A paid one cannot be cancelled.",
          "Revive: an expired link is reactivated keeping reference and link; the email you already sent works again.",
        ],
      },
      {
        tipo: "aviso",
        tono: "neutro",
        titulo: "Does your system issue the invoices?",
        texto:
          "It can create the links on its own, without touching the panel: the partner API takes amount, reference and email and returns the link. It is described in the OpenAPI spec and in the developer guide.",
      },
    ],
    enlaces: [
      { texto: "API and AI agents", href: "/docs/api-y-agentes-de-ia" },
      { texto: "How the price is built", href: "/vender/comisiones" },
    ],
  },
  {
    slug: "api-y-agentes-de-ia",
    tipo: "documentacion",
    titulo: "API and AI agents: how to connect to Mercatren",
    resumen:
      "What is open without credentials (catalog, search, Markdown, MCP server), what needs a store token (payment links and catalog sync) and how to request access.",
    fecha: "2026-08-23",
    temas: ["desarrolladores", "api", "agentes", "mcp", "openapi"],
    cuerpo: [
      {
        tipo: "aviso",
        tono: "acento",
        titulo: "In one line",
        texto:
          "Reading the catalog is public. Creating payment links and syncing catalogs needs a store token issued by the team. There is no OAuth server, and we don't publish one that doesn't exist.",
      },
      { tipo: "subtitulo", texto: "What is public" },
      {
        tipo: "tabla",
        encabezados: ["What", "Where", "What for"],
        filas: [
          [
            "Catalog in batches",
            "GET /datos/catalogo?pagina=1&todas=1",
            "Published products, 24 per batch; q= searches by words (with synonyms).",
          ],
          [
            "Suggestions",
            "GET /datos/buscar?q=",
            "Products and stores that match while typing.",
          ],
          [
            "MCP server",
            "POST /datos/mcp",
            "JSON-RPC 2.0, Streamable HTTP: buscar_productos, ver_producto, listar_tiendas, ver_tienda.",
          ],
          [
            "Markdown for agents",
            "any page with Accept: text/markdown",
            "The product, store, article or home page in Markdown, with x-markdown-tokens.",
          ],
          [
            "Health",
            "GET /datos/salud",
            "ok, and whether the database answers.",
          ],
          [
            "OpenAPI 3.1",
            "/datos/openapi.json",
            "The spec for all of the above and for the partner API.",
          ],
        ],
      },
      { tipo: "subtitulo", texto: "How it is discovered" },
      {
        tipo: "lista",
        puntos: [
          "/.well-known/api-catalog — the API catalog (RFC 9727).",
          "/.well-known/mcp/server-card.json — the MCP server card.",
          "/.well-known/agent-skills/index.json — the skills: “buy on Mercatren” and “get paid through Mercatren”, with their SHA-256.",
          "/.well-known/ai-catalog.json — the ARD manifest.",
          "/auth.md and /.well-known/oauth-protected-resource — how to get access and which resource is protected.",
          "/llms.txt — the summary for assistants.",
        ],
      },
      { tipo: "subtitulo", texto: "Try the MCP in thirty seconds" },
      {
        tipo: "parrafo",
        texto:
          'POST to /datos/mcp with {"jsonrpc":"2.0","id":1,"method":"tools/list"} and you get the four tools. Then {"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"buscar_productos","arguments":{"consulta":"bicicleta"}}} and you get the results with title, price, store and link.',
      },
      { tipo: "subtitulo", texto: "The partner API (with token)" },
      {
        tipo: "parrafo",
        texto: `With Authorization: Bearer <store token>, a system creates payment links (POST /datos/socios/cobro), checks their status (GET /datos/socios/cobro?referencia=), reactivates and cancels them, pushes its catalog (POST /datos/socios/productos) and reads what changed here (GET /datos/socios/cambios?desde=). The token is issued by the team when the store is linked: write to ${CORREO_CONTACTO} with the store name and the intended use. A partner platform gets each store's token with its partner key at POST /datos/socios/vincular.`,
      },
      {
        tipo: "aviso",
        tono: "ojo",
        titulo: "Keep it safe",
        texto: `The token lives on the server, never in a browser or a public repository. To rotate or revoke it, write to ${CORREO_CONTACTO}.`,
      },
    ],
    enlaces: [
      { texto: "OpenAPI 3.1", href: "/datos/openapi.json" },
      { texto: "auth.md", href: "/auth.md" },
      { texto: "Payment links: the guide", href: "/docs/cobrar-por-enlace" },
    ],
  },

  {
    slug: "impuestos-comercios-fuera-de-estados-unidos",
    tipo: "documentacion",
    titulo:
      "Taxes outside the United States: VAT goes inside the price, and the tax form is signed once",
    resumen:
      "If your business is in Venezuela, Colombia, or any country outside the United States, here is what you need to know: who sells to whom, why VAT goes inside your price, how to break it down when the money arrives, and which form you sign to get paid. With screenshots from the dashboard.",
    fecha: "2026-09-03",
    temas: ["comercios", "fiscal", "IVA", "W-8BEN-E", "cobros", "retiros"],
    cuerpo: [
      {
        tipo: "aviso",
        tono: "acento",
        titulo: "In one line",
        texto: `${SOCIEDAD.nombre} is a U.S. company that BUYS the merchandise from you and pays you in dollars. Your country's taxes —VAT— are yours: they go INSIDE the price you enter, and you break them out there when the money arrives. Mercatren does not add them, does not charge them separately, and does not file them for you.`,
      },
      {
        tipo: "subtitulo",
        texto: "Who sells to whom (and why it matters for VAT)",
      },
      {
        tipo: "parrafo",
        texto: `Every Mercatren sale is two transactions, not one. The buyer in the United States pays ${SOCIEDAD.nombre} the published price. ${SOCIEDAD.nombre} buys that merchandise from you —it issues a purchase order in its own name— and you deliver it to the designated person in your country. You invoice ${SOCIEDAD.nombre}, not the person who picks it up.`,
      },
      {
        tipo: "lista",
        puntos: [
          `On paper, your customer is ${SOCIEDAD.nombre}: a company from ${SOCIEDAD.estado}, United States.`,
          "The invoice to the buyer is issued by Mercatren under U.S. law. Your VAT does not exist there: it cannot appear as a line item, which is why there is no —and will be no— “charge VAT” button.",
          "What you report in your country is YOUR sale to Mercatren, for the exact amount of each purchase order.",
        ],
      },
      { tipo: "subtitulo", texto: "Why VAT goes inside the price" },
      {
        tipo: "parrafo",
        texto:
          "In your dashboard, the price you enter on each product is “what you want to receive.” The system adds its adjustment and publishes the total; you receive exactly what you entered. If your country requires VAT on what you sell, that VAT has to be inside that number: it is the only way it reaches you.",
      },
      {
        tipo: "imagen",
        src: "/docs/impuestos/1-precio.png",
        alt: "The price field in the product form of the Mercatren dashboard, with the hint saying the price already includes your country's taxes",
        pie: "Dashboard → My products → the price. What you enter here is what we pay you, with your taxes already inside.",
      },
      {
        tipo: "aviso",
        tono: "ojo",
        titulo: "Don't charge it twice",
        texto:
          "Don't ask the buyer to pay VAT separately, and don't ask us to add it at the end: the price already carries it. And don't raise it yourself on top of the system's adjustment, which is also already inside.",
      },
      {
        tipo: "tabla",
        encabezados: [
          "What you enter as the price",
          "What we pay you",
          "How your accountant breaks it down (16 % VAT)",
        ],
        filas: [
          ["$116.00", "$116.00", "Base $100.00 + VAT $16.00"],
          ["$100.00", "$100.00", "Base $86.21 + VAT $13.79"],
        ],
        nota: "16 % is Venezuela's general rate today; the rate that applies to you is confirmed by your accountant. The math is the same with any rate.",
      },
      {
        tipo: "subtitulo",
        texto: "How to break it down when the money arrives",
      },
      {
        tipo: "pasos",
        pasos: [
          {
            titulo: "Open the purchase order for each sale",
            texto: `Dashboard → Money → “My invoices to Mercatren.” There, sale by sale, is the exact amount ${SOCIEDAD.nombre} buys from you. That is the number you report.`,
          },
          {
            titulo: "Issue your invoice to Mercatren for that amount",
            texto: `With your company's tax details —the same ones you entered in “My store”— and in the name of ${SOCIEDAD.nombre}. Your accountant splits base + VAT at the rate that applies to you.`,
          },
          {
            titulo: "Request your payout whenever you want",
            texto:
              "What lands in your bank is that same money. If your accountant asks for the detail, Orders and Payments both have a button to download your sales to Excel.",
          },
        ],
      },
      {
        tipo: "imagen",
        src: "/docs/impuestos/2-datos-empresa.png",
        alt: "The company details card in My store: legal name, tax ID, email, and address",
        pie: "Dashboard → My store → Company details. This is where your details on every purchase order come from.",
      },
      { tipo: "subtitulo", texto: "The U.S. tax form (W-8BEN-E): signed once" },
      {
        tipo: "parrafo",
        texto: `You are receiving money from a U.S. company. Without that form, ${SOCIEDAD.nombre} would have to withhold part of what it pays you; with it, you get paid in full. And since the merchandise is delivered in your country, that income is not taxed in the United States: the form is what puts it in writing. You fill it out in Spanish, inside your dashboard, and it is valid for three years. Without it you cannot request payouts.`,
      },
      {
        tipo: "imagen",
        src: "/docs/w8bene/1-mi-tienda.png",
        alt: "The tax form card at the top of the My store screen in the Mercatren dashboard",
        pie: "Dashboard → My store. The orange card at the top is the form.",
      },
      {
        tipo: "imagen",
        src: "/docs/w8bene/4-documento.png",
        alt: "The signed W-8BEN-E document as it is stored in the merchant's profile",
        pie: "This is how it is stored, with date and signature. It is not sent to any tax office.",
      },
      {
        tipo: "boton",
        texto: "How to fill out the W-8BEN-E step by step",
        href: "/docs/formulario-fiscal-w8ben-e",
      },
      {
        tipo: "aviso",
        tono: "bien",
        titulo: "That form is NOT a tax return",
        texto:
          "It does not go to the IRS or to your country's tax office. It is stored in your Mercatren profile in case a bank or an accountant asks for it. You are not filing anything in the United States by signing it.",
      },
      { tipo: "subtitulo", texto: "In short: what you do and what we do" },
      {
        tipo: "tabla",
        encabezados: ["What", "Who"],
        filas: [
          ["Set each product's price with your taxes already inside", "You"],
          [
            "Charge the buyer in the United States and issue their invoice",
            "Mercatren",
          ],
          [
            `Buy the merchandise from you, with a purchase order in the name of ${SOCIEDAD.nombre}`,
            "Mercatren",
          ],
          [
            "Invoice Mercatren and report your sale in your country",
            "You, with your accountant",
          ],
          ["Sign the W-8BEN-E", "You, once every three years"],
          [
            "Add, charge separately, or file your country's VAT",
            "Nobody: it does not exist in Mercatren",
          ],
        ],
      },
      {
        tipo: "aviso",
        tono: "neutro",
        titulo: "This explains how Mercatren works; it is not tax advice",
        texto:
          "How you report in your country is up to your accountant, with your records. If they have questions about the model, send them this page or write to us.",
      },
    ],
  },
];
