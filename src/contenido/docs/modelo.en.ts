import type { Documento } from "./tipos";
import { SOCIEDAD } from "@/lib/sociedad";

/**
 * The public business-model document, in English.
 *
 * V1 — THE FIRST REAL VERSION (Aug 5, 2026). What was published before was a
 * demo written without professional review and does NOT count in the history:
 * versioning starts here, with the text reviewed by the lawyer and the
 * accountant.
 *
 * LEGAL RESTRUCTURING (August 2026). Mirrors modelo.es.ts section by
 * section; if one changes, the other changes in the same commit.
 *
 * Written as a native US business document, not translated word for word from
 * the Spanish. A compliance officer at a US bank is part of the audience.
 *
 * FORBIDDEN vocabulary here and across the site: collect on behalf of, settle,
 * settlement, custody, hold funds, balance, funds, wallet, fee on the payment,
 * agent, mandate, payer, beneficiary, payment instruction, remittance.
 */
export const MODELO_EN: Documento = {
  titulo: "Cross-border ecommerce with US-based purchase and resale",
  subtitulo:
    "What Mercatren sells and to whom, how every transaction is documented, why the structure is a sale of goods, and what evidence each step leaves behind.",
  resumen: `Mercatren is an online store operated by ${SOCIEDAD.nombre}. A buyer in the United States purchases a product from the catalog and designates the address where it must be delivered. ${SOCIEDAD.nombre} buys that merchandise from the supplier in its own name and resells it to the buyer. The published price is the final sale price and includes our commercial markup.`,
  version: "V1",
  actualizado: "August 5, 2026",

  entradilla: [
    `Mercatren is an online store operated by ${SOCIEDAD.nombre}, a company registered in ${SOCIEDAD.estado}, United States. A buyer in the United States selects a product from the catalog, pays the published price from a US bank, and designates the address where it must be delivered. ${SOCIEDAD.nombre} buys that merchandise from the supplier in its own name, with an invoice issued to ${SOCIEDAD.nombre}, and resells it to the buyer, with a sales invoice issued in the buyer's name.`,
    `We do not receive or administer money belonging to third parties. Every transaction is a sale of goods between the buyer and ${SOCIEDAD.nombre}. What comes in is revenue from the sale of our own product; what goes out is the cost of goods sold. The product is physically delivered to the designated address: at no point is money delivered to anyone.`,
  ],

  cifras: [
    {
      valor: "2",
      texto:
        "invoices per transaction: the purchase from the supplier and the sale to the buyer",
    },
    {
      valor: "100%",
      texto: "of accepted payments originate from US banks",
    },
    {
      valor: "0",
      texto:
        "user accounts, stored balances, or third-party money under our administration",
    },
    { valor: "5 years", texto: "of record retention per transaction" },
  ],

  ideasClave: [
    {
      titulo: "One",
      texto: `The structure is a sale of goods. ${SOCIEDAD.nombre} buys the merchandise as principal and resells it as principal. Title to the product passes from the supplier to ${SOCIEDAD.nombre} and from ${SOCIEDAD.nombre} to the buyer.`,
    },
    {
      titulo: "Two",
      texto:
        "What comes in is our own revenue from selling a product, not money belonging to a third party. What goes out is the cost of goods sold, not a payment made for anyone else's account.",
    },
    {
      titulo: "Three",
      texto:
        "The buyer of record is the person in the United States. The person at the delivery address receives a physical product — exactly as when someone buys a gift online and has it shipped to a different address.",
    },
  ],

  indiceTitulo: "How to read this document",

  secciones: [
    /* ---------------------------------------------------------------- */
    {
      id: "resumen-ejecutivo",
      numero: "1",
      titulo: "Executive summary: what Mercatren sells and to whom",
      etiqueta: "positioning",
      bloques: [
        {
          tipo: "parrafo",
          texto: `Mercatren sells physical products to buyers residing in the United States. It operates as an online store with a catalog, cart, checkout, and invoice, and it is a service of ${SOCIEDAD.nombre} (${SOCIEDAD.estado}, United States).`,
        },
        {
          tipo: "parrafo",
          texto:
            "What sets the service apart is where delivery happens. Many buyers in the United States want to purchase a product and have it delivered to an address in another country: building materials for a family project, spare parts, appliances. Mercatren publishes catalogs from suppliers with a presence in those destinations, sells the product to the US buyer, and has it delivered to the address the buyer designates.",
        },
        {
          tipo: "dosColumnas",
          izquierda: {
            titulo: "What we are",
            tono: "bien",
            puntos: [
              "An online store that sells merchandise for its own account.",
              `The buyer of that merchandise from the supplier, invoiced to ${SOCIEDAD.nombre}.`,
              "The seller to the US buyer, with a sales invoice in the buyer's name.",
              "Responsible for the published price, which is the final sale price.",
            ],
          },
          derecha: {
            titulo: "What we are not",
            tono: "ojo",
            puntos: [
              "We are not a financial institution and we do not offer accounts.",
              "We do not hold or administer money belonging to third parties.",
              "We do not deliver money to anyone: we deliver products.",
              "We do not act as a representative of any party.",
              "We do not exchange currency and we operate only in US dollars.",
            ],
          },
        },
        {
          tipo: "aviso",
          tono: "acento",
          titulo: "The sentence that sums up the structure",
          parrafos: [
            "Mercatren buys the merchandise in its own name and resells it to the buyer in the United States. The published price is the final sale price and includes our commercial markup.",
          ],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    {
      id: "estructura-contractual",
      numero: "2",
      titulo: "Contractual structure",
      etiqueta: "who contracts with whom",
      bloques: [
        {
          tipo: "parrafo",
          texto: `Every transaction is two consecutive contracts of sale, not an engagement to act for someone else. ${SOCIEDAD.nombre} is a party to both, and in both it acts as principal: it buys for itself and sells what is its own.`,
        },
        {
          tipo: "tabla",
          encabezados: ["Party", "Who they are", "What they contract for"],
          filas: [
            [
              "A · Buyer",
              "Person in the United States",
              `Buys a product from ${SOCIEDAD.nombre} and pays the published price from a US bank. Designates the delivery address and is responsible for its accuracy. Receives a sales invoice in their name.`,
            ],
            [
              `B · ${SOCIEDAD.nombre}`,
              "Company registered in Delaware, United States. Operates the Mercatren brand",
              "Buys the merchandise from the supplier in its own name and resells it to the buyer. Sets and publishes the final sale price. Issues the sales invoice and retains the purchase invoice. Bears the commercial risk of the transaction.",
            ],
            [
              "C · Supplier",
              "Merchant that publishes its catalog on Mercatren",
              `Sells the merchandise to ${SOCIEDAD.nombre} and invoices ${SOCIEDAD.nombre} for it. Ships the product to the address designated in the order. Is paid for the merchandise sold against its invoice.`,
            ],
            [
              "— · Delivery address",
              "Address designated by the buyer",
              "Not a party to the contract. It is the place where the product must be delivered. Whoever receives it signs for merchandise; they receive no money in any form.",
            ],
          ],
        },
        {
          tipo: "subtitulo",
          texto: "The document trail of a transaction",
        },
        {
          tipo: "fases",
          fases: [
            {
              titulo: "1. Purchase order",
              ocurre:
                "The buyer confirms the order and pays the published price.",
              evidencia: [
                "Order with sequential number, products, unit price, and total",
                "Delivery address designated by the buyer",
                "Buyer identification and confirmation that payment originates from a US bank",
              ],
            },
            {
              titulo: `2. Supplier invoice to ${SOCIEDAD.nombre}`,
              ocurre: `${SOCIEDAD.nombre} buys the merchandise from the supplier in its own name.`,
              evidencia: [
                `Invoice issued by the supplier to ${SOCIEDAD.nombre}`,
                "Description of the merchandise and purchase price",
                "Reference to the order that originates it",
              ],
            },
            {
              titulo: "3. Sales invoice to the buyer",
              ocurre: `${SOCIEDAD.nombre} resells the merchandise to the US buyer.`,
              evidencia: [
                `Sales invoice issued by ${SOCIEDAD.nombre} in the buyer's name`,
                "Final sale price, the same one that was published",
                "Linked to the order and to the purchase invoice",
              ],
            },
            {
              titulo: "4. Proof of delivery",
              ocurre:
                "The product is delivered to the address designated by the buyer.",
              evidencia: [
                "Dated delivery confirmation",
                "Identification of the person receiving the merchandise",
                "Order closed in the system",
              ],
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "Why both invoices have to exist",
          parrafos: [
            `Without the purchase invoice issued to ${SOCIEDAD.nombre}, the resale structure does not hold up in an audit: there would be money coming in with no purchase behind it. With both invoices, every transaction reads as what it is — merchandise bought and resold — and the commercial markup appears as the difference between two prices, not as a percentage withheld from someone else's money.`,
          ],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    {
      id: "el-ciclo",
      numero: "3",
      titulo: "The full transaction, mapped",
      etiqueta: "main diagram",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "This is the central diagram of the document. On the left, inside the United States, the entire commercial transaction takes place: the sale to the buyer and the purchase from the supplier. On the right, the only thing that moves is the product.",
        },
        { tipo: "figuraCiclo" },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "Both ends are sales of goods",
          parrafos: [
            `The buyer is not handing over money for it to reach someone: they are paying the price of a product they bought. ${SOCIEDAD.nombre} is not applying that money to a third party's account: it is using its own resources to buy the merchandise it has already sold. These are two linked sales, and each one is documented with its invoice.`,
          ],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    {
      id: "los-movimientos",
      numero: "4",
      titulo: "The transaction, step by step",
      etiqueta: "process",
      bloques: [
        {
          tipo: "pasos",
          pasos: [
            {
              numero: "1",
              etiqueta: "Buyer · United States",
              titulo: "The buyer selects the product and confirms the order",
              parrafos: [
                "The buyer opens the Mercatren catalog, selects one or more products, and confirms the order. The system re-reads each product's price and availability from the database at that moment: the price charged is the published price, not whatever the browser had stored.",
              ],
            },
            {
              numero: "2",
              etiqueta: `Buyer → ${SOCIEDAD.nombre} · United States`,
              titulo: "Pays the published price from a US bank",
              parrafos: [
                `The buyer pays the final sale price. Only payments originating from US banks are accepted, and that check runs before the order is treated as valid. That amount is ${SOCIEDAD.nombre}'s own revenue from the moment of the sale.`,
              ],
            },
            {
              numero: "3",
              etiqueta: "Buyer · within the order",
              titulo: "Designates the delivery address",
              parrafos: [
                "The buyer provides the address where the product must be delivered and is responsible for its accuracy. That address is a field on the order, the same as in any online purchase shipped to someone other than the person paying.",
              ],
            },
            {
              numero: "4",
              etiqueta: `${SOCIEDAD.nombre} → Supplier`,
              titulo: `${SOCIEDAD.nombre} buys the merchandise in its own name`,
              parrafos: [
                `With the sale closed, ${SOCIEDAD.nombre} buys the merchandise sold from the supplier. The supplier issues an invoice to ${SOCIEDAD.nombre}. That purchase is the cost of goods sold, and it is paid against the invoice to US bank accounts.`,
              ],
            },
            {
              numero: "5",
              etiqueta: "Supplier → Designated address",
              titulo: "The supplier ships the product",
              parrafos: [
                "The supplier delivers the merchandise to the address designated in the order. The delivery is recorded with a date and the identity of the person receiving it. What is delivered is a physical product: at no point is money delivered.",
              ],
            },
            {
              numero: "6",
              etiqueta: `${SOCIEDAD.nombre} → Buyer`,
              titulo: "The sales invoice is issued and the order is closed",
              parrafos: [
                `${SOCIEDAD.nombre} issues the buyer the sales invoice for the product and closes the order. What remains, tied together by the order number, is the purchase invoice issued to ${SOCIEDAD.nombre}, the sales invoice to the buyer, and the proof of delivery.`,
              ],
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "About the pilot supplier",
          parrafos: [
            `The merchant we work with today is an independent company with its own owners and its own inventory. It is not a subsidiary or a business of ours: it is a supplier that sells us merchandise and invoices ${SOCIEDAD.nombre} for it. It is the first, and there will be more.`,
          ],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    {
      id: "encuadre-regulatorio",
      numero: "5",
      titulo: "Regulatory framing",
      etiqueta: "why this is not money transmission",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "The question any bank or processor asks when reading about a cross-border service is whether the activity constitutes money transmission. This section answers it directly and descriptively, without claiming that any official determination exists in the company's favor.",
        },
        {
          tipo: "aviso",
          tono: "acento",
          titulo: "The test, and why this structure does not meet it",
          parrafos: [
            "Money transmission describes, in essence, receiving money from one person in order to transmit it or apply it for the benefit of another. Both elements have to be present: the money received must belong to a third party, and it must be transmitted or applied for someone else's benefit.",
            `Neither element is present here. The money Mercatren receives is the price of a product it sold: it is ${SOCIEDAD.nombre}'s own revenue from the moment of the sale, not money belonging to a third party. And the money that goes out is the price of merchandise ${SOCIEDAD.nombre} bought for itself, invoiced in its own name: it is the cost of goods sold, not a payment made for another party's benefit.`,
            `What happens between the two ends is a transfer of title to goods: the product passes from the supplier to ${SOCIEDAD.nombre} and from ${SOCIEDAD.nombre} to the buyer. The earnings are the difference between two prices in a sale of goods.`,
          ],
        },
        {
          tipo: "tabla",
          encabezados: [
            "Element",
            "In money transmission",
            "In this structure",
          ],
          filas: [
            [
              "Source of the money received",
              "It belongs to a third party; the operator merely holds it in transit",
              `It is the sale price of our own product — revenue of ${SOCIEDAD.nombre}`,
            ],
            [
              "Destination of the money paid out",
              "Delivered or applied for another person's benefit",
              `Pays for merchandise bought by ${SOCIEDAD.nombre}, invoiced in its name`,
            ],
            [
              "Object of the contract",
              "The movement of the money itself",
              "The sale of goods, with transfer of title",
            ],
            [
              "What the recipient gets",
              "Money",
              "A physical product. Never money, in any form",
            ],
            [
              "The operator's earnings",
              "A charge on the amount moved",
              "The commercial markup included in the sale price",
            ],
          ],
          nota: "This table describes the general test and is meant to situate the structure. It does not substitute for review by a US financial services attorney.",
        },
        { tipo: "figuraFrontera" },
        {
          tipo: "aviso",
          tono: "ojo",
          titulo: "What this document does not claim",
          parrafos: [
            `This section describes the structure of the transaction and the general applicable test. It does not claim that any determination, opinion, or authorization from any authority exists in favor of ${SOCIEDAD.nombre}, and it does not substitute for legal advice.`,
          ],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    {
      id: "controles",
      numero: "6",
      titulo: "Compliance controls",
      etiqueta: "what gets verified",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Controls run before an order is treated as valid, and they are recorded with it. They are not a statement of intent: each one leaves evidence that can be retrieved.",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Buyer identity",
              texto:
                "Buying requires an account with a verified email address. The order is tied to that account and to the details it was opened with.",
            },
            {
              titulo: "Source of payment",
              texto:
                "Only payments originating from US banks are accepted. Card payments run through a registered processor; bank transfers are checked against the statement before an order is treated as paid.",
            },
            {
              titulo: "Human review of every payment record",
              texto:
                "No bank transfer is accepted automatically. A member of the team checks the amount and date against the bank before approving it, and rejecting one requires a written reason.",
            },
            {
              titulo: "Separation of duties",
              texto:
                "Whoever sells does not approve their own incoming payments. A supplier has no permission to approve payments on its own orders.",
            },
            {
              titulo: "Prohibited products",
              texto:
                "We do not list or sell weapons, ammunition, or explosives; medicines, controlled substances, or restricted-use products; items subject to export controls; live animals; currency, monetary metals, gift cards, crypto assets, or financial instruments; or goods of unlawful origin or that infringe third-party rights.",
            },
            {
              titulo: "Sanctioned destinations and persons",
              texto:
                "An order is not accepted if its delivery address or its buyer corresponds to persons or destinations subject to US sanctions.",
            },
            {
              titulo: "Record retention",
              texto:
                "Every transaction keeps its documents for five years: the order, the purchase invoice, the sales invoice, the record of the payment received, and the proof of delivery.",
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "What the system does and what a person does",
          parrafos: [
            "The system blocks what can be blocked by rule: buying without an account, paying by an unsupported method, or selling without stock. Anything requiring judgment — verifying a payment against the bank, reviewing a questionable delivery address — is done by an identified person, and that decision is recorded with their name and the date.",
          ],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    {
      id: "trazabilidad",
      numero: "7",
      titulo: "Traceability: what evidence each transaction leaves",
      etiqueta: "evidence",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Any transaction can be reconstructed in full starting from its order number. This is what is kept, and this is what we hand over if a bank, an auditor, or a processor asks for it.",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "The order",
              texto:
                "Sequential, readable number; date and time; buyer's account; products with unit prices; total; and the delivery address designated by the buyer.",
            },
            {
              titulo: "The payment received",
              texto:
                "Method, date, amount, and record. For bank transfers, also the screenshot provided by the buyer and the name of the person who approved it.",
            },
            {
              titulo: "The purchase invoice",
              texto: `Document issued by the supplier to ${SOCIEDAD.nombre}, with the description of the merchandise and its purchase price, tied to the order number.`,
            },
            {
              titulo: "The sales invoice",
              texto: `Document issued by ${SOCIEDAD.nombre} to the buyer, with the final sale price, tied to the same order number.`,
            },
            {
              titulo: "The delivery",
              texto:
                "Dated confirmation identifying the person who received the merchandise at the designated address.",
            },
            {
              titulo: "The decision trail",
              texto:
                "Who approved or rejected what, when, and for what reason. Approvals are never anonymous.",
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "acento",
          titulo: "The proof that the structure is real",
          parrafos: [
            `A resale structure is proven with documents, not with wording. If every incoming payment has a purchase invoice issued to ${SOCIEDAD.nombre} and a sales invoice issued to the buyer behind it, the transaction is what this document says it is. If those invoices are missing, no wording will hold it up.`,
          ],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    {
      id: "crecimiento",
      numero: "8",
      titulo: "Growth plan",
      etiqueta: "where this is going",
      bloques: [
        {
          tipo: "parrafo",
          texto: `The service is in its early stage, with one supplier and one catalog. Growth means more catalog and more coverage, and it does not change the structure described in this document: every new supplier is simply one more supplier we buy merchandise from, invoiced to ${SOCIEDAD.nombre}.`,
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "More suppliers, same contract",
              texto:
                "Every merchant that publishes a catalog signs the same sale-of-goods agreement: they sell us merchandise and invoice us for it. We sign no representation agreements with any of them.",
            },
            {
              titulo: "More delivery cities",
              texto:
                "Coverage grows city by city, based on where each supplier has a presence. The buyer sees which city a product is delivered in before paying.",
            },
            {
              titulo: "More categories",
              texto:
                "The catalog opens departments as suppliers in each line of business come on board, within the prohibited-products policy.",
            },
            {
              titulo: "Card payments as the primary method",
              texto:
                "Card payments through a registered processor are the primary method for the service, for traceability and for the buyer's convenience.",
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "What is not in the plan",
          parrafos: [
            "There are no plans to offer accounts, hold money belonging to third parties, deliver money at any destination, or operate in any currency other than the US dollar. If any of that were ever considered, it would be a different service with its own structure and its own framing, and it would not launch without the corresponding legal review.",
          ],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    {
      id: "resumen-final",
      numero: "9",
      titulo: "One-page summary",
      etiqueta: "the takeaway",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "If you only keep one page from this entire document, keep this one.",
        },
        { tipo: "figuraResumen" },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "In one sentence",
          parrafos: [
            `We do not receive or administer money belonging to third parties. Every transaction is a sale of goods between the buyer and ${SOCIEDAD.nombre}: we buy the product in our own name, resell it to the buyer in the United States, and have it delivered to the address they designate.`,
          ],
        },
      ],
    },
  ],

  figuras: {
    ciclo: {
      titulo: "Figure 1",
      eeuu: "Inside the United States",
      venezuela: "Designated delivery address",
      comprador: {
        rol: "A",
        nombre: "Buyer",
        detalle:
          "Person in the United States. Buys the product and designates where it is delivered",
      },
      mercatren: {
        rol: "B",
        nombre: `${SOCIEDAD.nombre} · Mercatren`,
        detalle:
          "Sells the product to the buyer and buys the merchandise from the supplier, in its own name",
      },
      proveedor: {
        rol: "C",
        nombre: "Supplier",
        detalle: `Sells the merchandise to ${SOCIEDAD.nombre} and invoices it in its name`,
      },
      comercio: {
        rol: "C",
        nombre: "Supplier's dispatch",
        detalle: "Delivers the product to the address on the order",
      },
      consumidor: {
        rol: "—",
        nombre: "Recipient",
        detalle: "Receives a physical product. Never money",
      },
      paga: "Pays the published price of the product",
      compra: `Buys the merchandise · invoiced to ${SOCIEDAD.nombre}`,
      pide: "The product leaves the supplier's inventory",
      entrega: "Product delivered, with dated confirmation",
      orden: "The order travels: which product, to which address",
      enlace: "Proof of delivery comes back, tied to the order number",
      fuera:
        "The entire commercial transaction — the sale to the buyer and the purchase from the supplier — takes place inside the United States, between parties with accounts at US banks.",
      pie: "Two linked sales of goods. On the left, the complete commercial circuit; on the right, only the product and its proof of delivery.",
    },

    frontera: {
      noTitulo: "The shape this model does NOT have",
      noTexto:
        "Receiving money from one person in order to hand it to another. That describes money transmission, and it is not what happens here.",
      noCajas: [
        "Someone hands over money",
        "An operator holds it in transit",
        "Another person receives money",
      ],
      noNota:
        "There, the money belongs to a third party and the recipient receives money. Neither of those happens at Mercatren.",
      siTitulo: "The actual structure: a sale of goods",
      siTexto:
        "Two invoiced sales, closed inside the United States. The only thing that crosses the border is the product.",
      siCajas: ["Buyer in the US", `${SOCIEDAD.nombre}`, "Supplier"],
      cruzaCajas: ["Product in transit", "Delivery address"],
      circuito:
        "The complete commercial circuit stays inside the United States",
      frontera: "← the dashed line is the border",
      consecuencia: `What comes in is the sale price of our own product and what goes out is the cost of the merchandise purchased, invoiced to ${SOCIEDAD.nombre}. On the other side of the border no money moves: a product is delivered.`,
    },

    resumen: {
      pasos: [
        {
          titulo: "Purchase",
          detalle:
            "The buyer in the United States purchases a product and pays the published price from a US bank.",
        },
        {
          titulo: "Acquisition",
          detalle: `${SOCIEDAD.nombre} buys that merchandise from the supplier in its own name, invoiced to ${SOCIEDAD.nombre}.`,
        },
        {
          titulo: "Delivery",
          detalle:
            "The supplier delivers the product to the address designated by the buyer, with proof of delivery.",
        },
        {
          titulo: "Invoice",
          detalle: `${SOCIEDAD.nombre} issues the sales invoice to the buyer and closes the order with its full documentation.`,
        },
      ],
      banda: "A sale of goods, with two invoices per transaction",
      sinDinero: "At no point is money delivered to anyone",
      afirmaciones: [
        `The money received is ${SOCIEDAD.nombre}'s own revenue from selling a product.`,
        `The money paid to the supplier is the cost of goods sold, invoiced to ${SOCIEDAD.nombre}.`,
        `Title to the product passes from the supplier to ${SOCIEDAD.nombre} and from ${SOCIEDAD.nombre} to the buyer.`,
        "Whoever receives at the designated address receives a physical product, never money.",
        "The published price is the final price and includes the commercial markup.",
        "Only payments originating from US banks are accepted.",
      ],
    },
  },

  preguntasTitulo: "The three questions we always get",
  preguntas: [
    {
      pregunta: "Does money leave the country?",
      respuesta:
        "No. The buyer pays in the United States, and the merchandise is paid for against an invoice to US bank accounts. No foreign financial institution takes part in the transaction.",
    },
    {
      pregunta: "Whose money is it?",
      respuesta: `It belongs to ${SOCIEDAD.nombre} from the moment of the sale. It is the price of a product sold, not third-party money under our administration.`,
    },
    {
      pregunta: "What does the person at the delivery address receive?",
      respuesta: "A physical product. Never money, in any form.",
    },
  ],

  aviso: `This document describes the structure and operation of the service. It does not constitute legal, accounting, or tax advice, and it does not claim that any determination by any authority exists in favor of ${SOCIEDAD.nombre}. Mercatren is a service operated by ${SOCIEDAD.nombre} (${SOCIEDAD.estado}, United States).`,
};
