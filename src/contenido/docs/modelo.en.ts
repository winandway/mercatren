import type { Documento } from "./tipos";

/**
 * The public business-model document, in English.
 *
 * Written as a native US business document, not translated word for word from
 * the Spanish. A compliance officer at a US bank is part of the audience.
 */
export const MODELO_EN: Documento = {
  titulo: "Cross-border ecommerce with domestic settlement",
  subtitulo:
    "How the cycle works, where every dollar enters and leaves, what evidence each step produces, and why this is not a remittance.",
  resumen:
    "Mercatren is an international purchasing service acting on behalf of others: a merchant outside the United States lists its products, a buyer in the United States pays for them, and we collect and settle that payment inside the United States. We charge a 3% fee.",
  version: "V2",
  actualizado: "August 3, 2026",

  entradilla: [
    "Mercatren is an international purchasing service acting on behalf of others. A merchant in Venezuela lists its products on our platform; a buyer in the United States purchases those products and names who receives them; we collect that payment inside the United States and apply it, following the merchant's written instruction, to pay the merchant's wholesale supplier, also in the United States. We charge 3% for handling it.",
  ],

  cifras: [
    {
      valor: "US$0",
      texto: "leaves the United States at any point in the cycle",
    },
    { valor: "3%", texto: "fee on order value; this is our entire revenue" },
    {
      valor: "1",
      texto: "active merchant client today; the model is in pilot",
    },
    { valor: "5 years", texto: "of record retention per transaction" },
  ],

  ideasClave: [
    {
      titulo: "One",
      texto:
        "This is not a one-way transfer from A to B. It is a closed loop that feeds itself: today's payment replenishes the inventory that produces tomorrow's sale.",
    },
    {
      titulo: "Two",
      texto:
        "The entire flow of funds takes place inside the United States, and nothing Mercatren moves crosses the border. The merchant's restocking is handled by its supplier through the supplier's own local branch, with no involvement from us.",
    },
    {
      titulo: "Three",
      texto:
        "The merchant is not ours. It is an independent client that hires us as its purchasing and collection agent, the same way it would hire a customs broker or a freight forwarder.",
    },
  ],

  indiceTitulo: "How to read this document",

  secciones: [
    {
      id: "que-es",
      numero: "1",
      titulo: "What Mercatren is, and what it should not be confused with",
      etiqueta: "positioning",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "The shortest way to put it: we are a cross-border purchasing agent with our own platform. The model resembles a personal shopper or a customs broker, but it operates as ecommerce and at software scale.",
        },
        {
          tipo: "parrafo",
          texto:
            "There is a specific gap this model fills. A Venezuelan merchant has customers whose purchasing power sits in the United States, and suppliers it must pay in the United States. Today it solves both ends separately and by hand: the customer looks for a way to get the payment across, and the merchant looks for a way to gather dollars for its supplier. Mercatren connects both ends into a single documented transaction and turns it into a purchase.",
        },
        {
          tipo: "dosColumnas",
          izquierda: {
            titulo: "What we are",
            tono: "bien",
            puntos: [
              "The operator of an ecommerce platform.",
              "A collection agent appointed by the selling merchant.",
              "An administrative manager of international purchases.",
              "A provider of software and documentary reconciliation.",
            ],
          },
          derecha: {
            titulo: "What we are not",
            tono: "ojo",
            puntos: [
              "We do not send remittances or money between individuals.",
              "We do not exchange currency and we do not handle bolívares.",
              "We do not buy goods for resale: we own no inventory.",
              "We do not take deposits and we do not pay interest.",
              "We do not ship, import, clear customs, or finance any movement of goods.",
            ],
          },
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "About the pilot merchant",
          parrafos: [
            "The hardware store we work with today is an independent Venezuelan company, with its own owners, its own inventory, and its own commercial relationship with its supplier. It is not a subsidiary, not an affiliate, and not a business of ours. We do not set its prices, we do not own what it sells, and we take no part in its deliveries. It is our first merchant client, and there will be more.",
          ],
        },
      ],
    },

    {
      id: "quien-es-quien",
      numero: "2",
      titulo: "Who is who in the transaction",
      etiqueta: "participants",
      bloques: [
        {
          tipo: "tabla",
          encabezados: ["Party", "Who they are", "What they do and do not do"],
          filas: [
            [
              "A · Client",
              "Merchant in Venezuela. Independent company",
              "Our merchant client. Lists and manages its own catalog on the platform, sets its prices, serves the consumer, and delivers physically inside Venezuela. Maintains its own line of credit with its wholesale supplier. Appoints us in writing as its collection agent.",
            ],
            [
              "B · Us",
              "Mercatren, a service operated by Windoce LLC. Registered in the United States",
              "Operates the platform, verifies and accepts orders, receives payments in the United States, reconciles each deposit against its order, issues the documentation, charges its 3% fee, and executes settlement to the authorized supplier following client A's written instruction. Owns no goods and bears no commercial risk on the sale.",
            ],
            [
              "C · Supplier",
              "Wholesaler in the United States. US company",
              "A's supplier and trade creditor. Sells goods to A and extends credit. Receives payments from us that are applied to specific, pre-existing invoices between itself and A. In this case it has its own branch in Venezuela, and restocking A is an internal matter of its own in which Mercatren takes no part.",
            ],
            [
              "D · Payer",
              "Buyer in the United States. US resident",
              "Buys the products and names who receives them in Venezuela, typically a family member. Legally a buyer of goods, not a sender of funds: they pay a purchase price against an identified order, they do not transfer money to a person.",
            ],
            [
              "— · Recipient",
              "End consumer in Venezuela",
              "Chooses the product at the counter or in the catalog and receives it. Never receives money and takes no part in the payment.",
            ],
          ],
        },
        {
          tipo: "aviso",
          tono: "acento",
          titulo: "The distinction the whole model rests on",
          parrafos: [
            "A remittance has a sender who hands over money and a beneficiary who receives it. Neither exists here: there is a buyer who pays a price and a recipient who receives a product. No one in Venezuela receives funds at any point in the cycle.",
          ],
        },
      ],
    },

    {
      id: "el-ciclo",
      numero: "3",
      titulo: "The full cycle, on one map",
      etiqueta: "main diagram",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "This is the central diagram of the document. Read it as a circuit that turns, not as a chain that ends: step 7 feeds step 1 of the next cycle.",
        },
        { tipo: "figuraCiclo" },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "Why it is a cycle and not a transfer",
          parrafos: [
            "The payment in step 4 does not end at step 6. With its account current, the merchant keeps its line of credit and can keep selling, and that sale creates the next order. Every turn of the cycle increases its commercial capacity. That is why the metric that matters is not how many payments we process, but how many times the cycle turns per merchant per month.",
          ],
        },
      ],
    },

    {
      id: "los-siete-movimientos",
      numero: "4",
      titulo: "The seven movements, one by one",
      etiqueta: "process",
      bloques: [
        {
          tipo: "pasos",
          pasos: [
            {
              numero: "1",
              etiqueta: "End consumer → Merchant · inside Venezuela",
              titulo: "The consumer picks the product and reserves it",
              parrafos: [
                "A customer walks up to the counter or browses the merchant's online catalog and asks for one or more products. The merchant quotes in dollars and sets the goods aside. Mercatren has not yet been involved.",
              ],
            },
            {
              numero: "2",
              etiqueta: "Merchant → Mercatren · information",
              titulo: "The merchant records the order on the platform",
              parrafos: [
                "The merchant enters the order with products, quantities, and a fixed dollar amount. The system issues a unique, time-stamped order number and a payment link tied exclusively to that order.",
                "No money moves here. All that is created is the record that will later have to match the deposit received, dollar for dollar.",
              ],
            },
            {
              numero: "3",
              etiqueta: "Consumer → Payer in the US · information",
              titulo: "The link reaches whoever is going to pay",
              parrafos: [
                "The consumer shares the link with their family member or friend in the United States, who is the one making the purchase. The link shows what is being bought, from which merchant, for how much, and who will receive it.",
                "This transparency is deliberate: the payer is not sending money to a person, they are buying identified goods from an identified merchant.",
              ],
            },
            {
              numero: "4",
              etiqueta: "Payer → Mercatren · funds, inside the US",
              titulo: "The payer settles the order and we verify and accept it",
              parrafos: [
                "Payment is received by Zelle into Mercatren's US bank account. Section 7 explains why Zelle and not cards.",
                "This is the control point of the model. Nothing is accepted automatically: we verify the payer's identity, screen their name against sanctions lists, confirm the amount received matches the order exactly, and check for structuring patterns. Only then does the order move to accepted. If something does not add up, it is rejected and refunded, and the reason is recorded.",
              ],
            },
            {
              numero: "5",
              etiqueta: "Mercatren → Merchant → Consumer",
              titulo: "Once payment is confirmed, the merchant delivers",
              parrafos: [
                "The platform notifies the merchant that the order is paid and accepted. The merchant hands the product to the consumer in Venezuela and records the delivery in the system.",
                "The sequence is worth emphasizing: delivery happens here, not at the end. Steps 6 and 7 run afterward and on a separate track. Confusing those tracks is what makes the model look like a money transfer when it is not.",
              ],
            },
            {
              numero: "6",
              etiqueta: "Mercatren → Wholesale supplier · funds, inside the US",
              titulo: "Consolidated settlement to the authorized supplier",
              parrafos: [
                "Collections accumulate in the merchant's balance. When the merchant instructs us in writing, identifying the specific invoices it wants paid, we execute a consolidated transfer to its supplier in the United States.",
                "Consolidating is not a matter of taste: it lowers transfer costs, produces clean reconciliation between batches of orders and payments, and avoids the pattern of hundreds of micropayments that any bank compliance team views with suspicion. Each transfer is applied to pre-existing commercial invoices between the supplier and the merchant.",
              ],
            },
            {
              numero: "7",
              etiqueta: "Supplier → Merchant · outside Mercatren's scope",
              titulo: "Credit stays current and inventory is replenished",
              parrafos: [
                "With its account current, the merchant keeps its line of credit and keeps restocking. In this case the supplier has its own branch in Venezuela, so supply is an internal matter between the supplier and its client.",
                "Mercatren does not ship, import, clear customs, finance transport, or control that movement. Our involvement ends once settlement is executed and documented in the United States.",
              ],
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "The two tracks of the process",
          parrafos: [
            "Steps 1 through 5 are the commercial track: order, purchase, payment, delivery. They happen within hours. Step 6 is the settlement track: it groups many orders and happens over days or weeks. Step 7 is not ours; it is the restocking the supplier handles with its client. Confusing these three tracks is what makes the model look like a money transfer when it is not.",
          ],
        },
      ],
    },

    {
      id: "que-cruza-la-frontera",
      numero: "5",
      titulo: "What crosses the border and what does not",
      etiqueta: "comparison",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "This is the comparison that settles, once and for all, the question that opens any compliance review. In a remittance, money crosses the border. Here, nothing we move crosses it.",
        },
        { tipo: "figuraFrontera" },
        {
          tipo: "tabla",
          encabezados: ["Dimension", "Remittance", "Mercatren"],
          filas: [
            [
              "What is contracted",
              "A transfer of funds",
              "A purchase of identified products",
            ],
            [
              "Who receives",
              "A person, in cash or into an account",
              "A wholesale supplier, against invoices",
            ],
            ["Where the money ends up", "Venezuela", "The United States"],
            [
              "Currency conversion",
              "Yes, it is part of the service",
              "None; the entire cycle is in dollars",
            ],
            ["What the recipient gets", "Money", "A physical product"],
            [
              "Documentary basis",
              "A transfer order",
              "Purchase order, invoice, and proof of application",
            ],
            [
              "Who moves the goods",
              "There are no goods",
              "The supplier, on its own. Mercatren takes no part",
            ],
            [
              "If the transaction is voided",
              "Money is returned",
              "The price of an unfulfilled purchase is refunded",
            ],
          ],
        },
      ],
    },

    {
      id: "evidencia",
      numero: "6",
      titulo: "The life of an order and the evidence it leaves",
      etiqueta: "traceability",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Every order goes through four phases, and each one leaves a specific documentary trail. A reviewer should be able to take any deposit from the bank statement and reconstruct backward what was bought, who paid, from which merchant, and where the money was applied.",
        },
        {
          tipo: "fases",
          fases: [
            {
              titulo: "Phase 1 · Order origin",
              ocurre:
                "The merchant enters the product and the price. The order is created with a unique number and a fixed dollar amount.",
              evidencia: [
                "Master agreement with the merchant",
                "Verification of the merchant and its owners",
                "Product record",
                "Order with reference number and time stamp",
                "Sanctions screening of the merchant",
              ],
            },
            {
              titulo: "Phase 2 · Collection and verification",
              ocurre:
                "The payer in the US settles the order. Mercatren identifies the payer and validates that the amount matches the order.",
              evidencia: [
                "Proof of payment",
                "Payer identity",
                "Sanctions screening of the payer",
                "Record of acceptance or rejection, with reason",
                "Terms accepted by the payer",
              ],
            },
            {
              titulo: "Phase 3 · Reconciliation",
              ocurre:
                "Each deposit is matched to its order. The 3% fee is separated and the balance pending settlement is grouped.",
              evidencia: [
                "Bank statement",
                "Order-to-deposit reconciliation",
                "Mercatren invoice for the 3% fee",
                "Merchant account statement",
                "Accounting ledger for the period",
              ],
            },
            {
              titulo: "Phase 4 · Settlement",
              ocurre:
                "On the merchant's written instruction, a consolidated payment covering a batch of orders is made to the authorized supplier.",
              evidencia: [
                "Payment instruction from the merchant",
                "Supplier invoices",
                "Sanctions screening of the supplier",
                "Proof of transfer",
                "Supplier acknowledgment of application",
              ],
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "acento",
          titulo: "The rule that is never bent",
          parrafos: [
            "No order advances to the next phase without its complete evidence. An order with an unidentified payer, or without written instruction from the merchant, is not settled.",
          ],
        },
        { tipo: "subtitulo", texto: "How a transaction is reconstructed" },
        {
          tipo: "parrafo",
          texto:
            "The practical test of a well-built file is traceability in both directions:",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "From the deposit backward",
              texto:
                "a credit on the statement leads to the proof of payment, from there to the order number, from there to the merchant's catalog and the product detail, and from there to the payer's verified identity.",
            },
            {
              titulo: "From the transfer backward",
              texto:
                "a payment to the supplier leads to the merchant's written instruction, from there to the specific invoices it settles, and from there to the batch of orders whose collections funded it.",
            },
            {
              titulo: "From revenue to the books",
              texto:
                "our 3% fee invoice is the only revenue recognized. Everything else is third-party funds in transit, and that is how it appears in the books.",
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "An accounting point worth settling from day one",
          parrafos: [
            "Mercatren's revenue is the fee, not the gross value of the orders. Recording transaction volume as our own revenue would artificially inflate the financial statements and, more importantly, would suggest that we own those funds. We do not: they are our merchant clients' balances.",
          ],
        },
      ],
    },

    {
      id: "por-que-zelle",
      numero: "7",
      titulo: "Why we collect by Zelle and not by card",
      etiqueta: "collection method",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "This question always comes up and deserves an answer in numbers, not adjectives. The short version: on a 3% fee, card processing takes practically the entire margin, and it reintroduces a reversal risk this model cannot absorb.",
        },
        {
          tipo: "tabla",
          encabezados: [
            "Method",
            "Cost on US$1,000",
            "Availability",
            "Reversible?",
            "Verdict",
          ],
          filas: [
            ["Zelle", "US$0.00", "Minutes", "No", "Chosen"],
            [
              "Bank ACH",
              "≈ US$0.50",
              "2 to 3 days",
              "Yes, up to 60 days",
              "Backup",
            ],
            [
              "ACH via Stripe",
              "US$5.00",
              "2 to 3 days",
              "Yes, up to 60 days",
              "Backup",
            ],
            [
              "Domestic card",
              "US$29.30",
              "2 days to payout",
              "Yes, chargeback",
              "Ruled out",
            ],
            ["Domestic wire", "US$25 – 40", "Same day", "No", "Not viable"],
            [
              "Foreign card",
              "US$44.30",
              "2 days to payout",
              "Yes, chargeback",
              "Loss-making",
            ],
          ],
          nota: "Cost of collecting a US$1,000 order against a gross fee of US$30. Stripe pricing per public 2026 sources: 2.9% + US$0.30 for domestic cards, plus 1.5% for cards issued outside the US; ACH at 0.8% capped at US$5. Domestic wire per retail banking schedules.",
        },
        { tipo: "subtitulo", texto: "The three reasons, in order of weight" },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "First: the margin cannot take it",
              texto:
                "On a US$1,000 order the gross fee is US$30. A domestic card costs US$29.30. That leaves seventy cents per order, before any other expense. With a card issued outside the United States the cost rises to about US$44.30 and the order is processed at a loss. The effect gets worse as ticket size rises, which is exactly the profile of a hardware store: a US$3,000 materials order pays nearly ninety dollars in card fees.",
            },
            {
              titulo: "Second: chargebacks are a risk that cannot be covered",
              texto:
                "In this model the goods are delivered in Venezuela. If a chargeback arrives weeks later, the product no longer exists as collateral and there is no way to recover it. A single lost chargeback on a US$1,000 order means losing the amount plus dispute fees, on the order of US$1,030. At a margin of US$0.70 per card order, it would take more than fourteen hundred orders to make up that one incident. Zelle, by contrast, allows no reversal: once credited, the payment is final.",
            },
            {
              titulo: "Third: the middle options do not solve it",
              texto:
                "ACH is cheap but takes two to three days and, above all, can be returned. When payment comes from a consumer account, the window to claim a transaction as unauthorized runs to sixty calendar days, long after the product has been delivered. A domestic wire is immediate and irreversible, but it costs the buyer twenty-five to forty dollars, which makes it unworkable for retail purchases.",
            },
          ],
        },
        { tipo: "subtitulo", texto: "What has to be watched about Zelle" },
        {
          tipo: "parrafo",
          texto:
            "It would be dishonest to present Zelle without its limits. There are three, and they are worth stating:",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Per-transaction and per-period caps",
              texto:
                "Banks set their own limits for business accounts and do not always publish them. They have to be negotiated with the bank and confirmed in writing before volume scales.",
            },
            {
              titulo: "Ongoing regulatory pressure",
              texto:
                "The federal suit against Zelle's operator was dismissed with prejudice in March 2025, but the New York Attorney General's action remains alive and in 2026 the court declined to dismiss it. If it succeeds, it could introduce reimbursement obligations for induced transfers. No policy changes have been implemented to date, but it is a risk to monitor.",
            },
            {
              titulo: "It is a consumer rail",
              texto:
                "Zelle works well for the pilot phase. The natural destination at scale is the instant business rails — RTP and FedNow — which are irrevocable, settle in seconds around the clock, support amounts up to ten million dollars per transaction, and carry interbank costs of pennies. This path is worth raising with the bank from the first conversation.",
            },
          ],
        },
      ],
    },

    {
      id: "economia",
      numero: "8",
      titulo: "The economics of one order",
      etiqueta: "margins",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "There is a single source of revenue: the 3% fee on order value. Everything else that passes through the account is third-party funds.",
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "Basis for these numbers",
          parrafos: [
            "The figures in this section use a reference ticket of US$1,000 and a batch of twenty orders per settlement. These are illustrative assumptions, not observed data. They should be replaced with the pilot's actual average ticket and frequency once there are three months of operation.",
          ],
        },
        {
          tipo: "tabla",
          encabezados: ["Item", "With Zelle", "With card", "Note"],
          filas: [
            ["Order value", "US$1,000.00", "US$1,000.00", "Not our revenue"],
            [
              "Gross fee (3%)",
              "US$30.00",
              "US$30.00",
              "The only revenue recognized",
            ],
            ["Cost of collection", "US$0.00", "− US$29.30", "Domestic card"],
            [
              "Cost of settlement",
              "− US$1.25",
              "− US$1.25",
              "A US$25 wire split across 20 orders",
            ],
            [
              "Gross margin per order",
              "US$28.75",
              "− US$0.55",
              "Before platform and staff",
            ],
            ["Margin on the fee", "96%", "negative", ""],
          ],
        },
        { tipo: "subtitulo", texto: "What the pilot has to measure" },
        {
          tipo: "parrafo",
          texto:
            "To present the model with data rather than projections, these are the five metrics the system records from the first order:",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Average ticket per order",
              texto:
                "determines whether 3% is sustainable or whether the fee has to be tiered.",
            },
            {
              titulo: "Cycle turns per merchant per month",
              texto:
                "the real measure of traction: one merchant turning eight times is worth more than eight merchants turning once.",
            },
            {
              titulo: "Days between collection and settlement",
              texto:
                "what a bank looks at to understand how much third-party balance is held in the account.",
            },
            {
              titulo: "Rejection rate at verification",
              texto: "demonstrates that the control exists and works.",
            },
            {
              titulo: "Repeat payers per merchant",
              texto:
                "indicates whether the model builds habit or depends on one-off purchases.",
            },
          ],
        },
      ],
    },

    {
      id: "resumen-final",
      numero: "9",
      titulo: "The whole model on one page",
      etiqueta: "closing recap",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "If someone reads only one section of this document, this is the one. It is the complete model, without the jargon.",
        },
        { tipo: "figuraResumen" },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "The one sentence that covers it",
          parrafos: [
            "A Venezuelan merchant hires us to collect from its buyers in the United States and to pay, with that same money and following its written instruction, the invoices that merchant owes its US supplier. We charge 3% to do it. The money never leaves the country, the recipient gets a product rather than a transfer, and every transaction is documented end to end.",
          ],
        },
      ],
    },
  ],

  figuras: {
    ciclo: {
      titulo: "The full cycle of one order",
      eeuu: "United States",
      venezuela: "Venezuela",
      pagador: {
        rol: "D · Payer",
        nombre: "Family member in the US",
        detalle: "Buys the products. Sends no money.",
      },
      mercatren: {
        rol: "B · Platform operator",
        nombre: "Mercatren",
        detalle:
          "The merchant's purchasing and collection agent. Records, verifies, reconciles, and settles. Charges a 3% fee.",
      },
      proveedor: {
        rol: "C · Authorized supplier",
        nombre: "Wholesaler in the US",
        detalle:
          "The merchant's trade creditor. Receives the funds. Has its own branch in Venezuela.",
      },
      comercio: {
        rol: "A · Pilot client",
        nombre: "Merchant in Venezuela",
        detalle:
          "Independent company. Not owned by Mercatren. Restocks from the supplier's local branch.",
      },
      consumidor: {
        rol: "End consumer",
        nombre: "Customer in Venezuela",
        detalle: "Chooses the product and receives it.",
      },
      paga: "Pays the order by Zelle · irrevocable · zero cost · funds inside the US",
      liquida:
        "Settles to the supplier · consolidated and traceable · funds inside the US",
      pide: "Requests and reserves the product",
      entrega: "Delivers the product once payment is confirmed",
      enlace: "Shares the order link",
      orden: "Order recorded and payment confirmed",
      fuera:
        "Outside Mercatren's scope: the supplier restocks the merchant through its own local branch. We do not ship, import, clear customs, or finance any movement of goods.",
      pie: "The left column is the United States and the right is Venezuela. Thick lines are movements of money, and all of them happen inside the United States.",
    },
    frontera: {
      remesaTitulo: "What we do not do · remittances",
      remesaTexto:
        "Money crosses the border and ends up in a person's hands. That is money transmission.",
      remesaCajas: ["Sender", "Operator", "Beneficiary"],
      remesaCruza: "money crosses the border",
      nuestroTitulo: "What we do · product purchases with domestic settlement",
      nuestroTexto:
        "Money enters and leaves inside the US. Nothing Mercatren moves crosses the border.",
      nuestrasCajas: [
        "Payer",
        "Mercatren",
        "Supplier",
        "Supplier's branch",
        "Merchant",
        "Consumer",
      ],
      circuito: "funds: closed circuit inside the US",
      frontera: "US · Venezuela",
      consecuencia:
        "No transfer leaves the United States, no beneficiary receives cash, and there is no currency conversion.",
    },
    resumen: {
      pasos: [
        {
          titulo: "Someone in the US buys products",
          detalle: "and names who receives them",
        },
        {
          titulo: "Mercatren collects in the United States",
          detalle: "verifies, accepts, and records",
        },
        {
          titulo: "Pays the supplier in the United States",
          detalle: "against the client's invoices",
        },
        {
          titulo: "The merchant delivers in Venezuela",
          detalle: "a product, never money",
        },
      ],
      banda: "All the money happens here, inside the United States",
      sinDinero: "No money here",
      afirmaciones: [
        "No one in Venezuela receives money at any point. They receive a physical product.",
        "No transfer leaves the United States. There is no currency conversion.",
        "The merchant is an independent client. It appointed us in writing as its collection agent.",
        "From the moment we collect, the funds belong to the merchant. We apply them where it instructs us in writing.",
        "Our revenue is only the 3% fee. The rest is third-party funds, and that is how the books show it.",
        "Every order leaves a complete file: who bought, what they bought, who paid, and where it was applied.",
      ],
    },
  },

  preguntasTitulo: "If the reviewer has only three questions",
  preguntas: [
    {
      pregunta: "Does money leave the country?",
      respuesta:
        "No. It is received into a US account and paid to a US company. No Venezuelan financial institution takes part in the circuit.",
    },
    {
      pregunta: "Whose money is it?",
      respuesta:
        "The selling merchant's, from the moment of collection. Mercatren holds it and applies it on written instruction. Our revenue is only the fee.",
    },
    {
      pregunta: "What does the person in Venezuela receive?",
      respuesta:
        "A physical product, delivered by the merchant. Never money, in any form.",
    },
  ],

  aviso:
    "This document describes an operating model. It is not legal, accounting, or tax advice. Regulatory references and collection-cost figures come from public sources consulted on August 3, 2026 and should be verified before any decision is made. The complete version, covering contractual structure, regulatory framing, compliance controls, and the growth plan, is provided to banks, auditors, and partners on request.",
};
