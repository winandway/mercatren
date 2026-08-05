import type { PaginaContenido } from "./tipos";

/**
 * Politica de privacidad.
 *
 * Se escribe en el mismo tono llano del resto del sitio: qué datos se
 * recogen, para que, con quien se comparten y cuanto se guardan. Sin lenguaje
 * de abogado que nadie lee.
 *
 * Lo delicado de este servicio son los COMPROBANTES DE PAGO: llevan nombre,
 * banco y ultimos digitos de quien pago. Eso tiene su propia seccion.
 */
export const PRIVACIDAD_ES: PaginaContenido = {
  titulo: "Privacidad",
  entradilla:
    "Qué datos recogemos, para qué los usamos, con quién se comparten y cuánto tiempo los guardamos. En palabras normales.",
  vigencia: "Vigente desde el 3 de agosto de 2026",
  indiceTitulo: "En esta página",
  secciones: [
    {
      id: "quien",
      numero: "1",
      titulo: "Quién trata tus datos",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Windoce, LLC, sociedad registrada en Estados Unidos, operando bajo la marca Mercatren. Para cualquier asunto de privacidad puedes escribirnos a mercatren@windoce.com.",
        },
      ],
    },
    {
      id: "que-datos",
      numero: "2",
      titulo: "Qué datos recogemos",
      bloques: [
        {
          tipo: "tabla",
          encabezados: ["Dato", "De dónde sale", "Para qué"],
          filas: [
            [
              "Nombre y correo",
              "Los escribes al crear tu cuenta",
              "Identificarte, verificar tus pagos y avisarte de tus pedidos",
            ],
            [
              "Contraseña",
              "La eliges tú",
              "Entrar a tu cuenta. Se guarda cifrada: ni nosotros podemos leerla",
            ],
            [
              "Teléfono y dirección de entrega",
              "Los escribes al hacer un pedido",
              "Que el comercio pueda entregar el producto",
            ],
            [
              "Tus pedidos",
              "Se generan al comprar",
              "Atenderlos, conciliar el pago y llevar la contabilidad",
            ],
            [
              "Comprobantes de pago",
              "Los subes tú",
              "Verificar el pago contra el banco antes de aprobarlo",
            ],
            [
              "Datos técnicos",
              "Tu navegador, al entrar",
              "Mantener tu sesión abierta y detectar usos anómalos",
            ],
          ],
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "No pedimos lo que no necesitamos",
          parrafos: [
            "No te pedimos número de cuenta, número de tarjeta ni documento de identidad para comprar. Tampoco guardamos datos de tarjetas: no procesamos tarjetas.",
          ],
        },
      ],
    },
    {
      id: "comprobantes",
      numero: "3",
      titulo: "Los comprobantes de pago",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "La captura que subes es el dato más sensible que manejamos: suele mostrar el nombre del titular, el banco y los últimos dígitos de la cuenta. Por eso tiene reglas propias.",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Solo la ves tú y el equipo de Mercatren",
              texto:
                "ningún otro cliente puede abrirla, ni siquiera con el enlace directo. A quien no le corresponde, el sistema le responde que no existe.",
            },
            {
              titulo: "El comercio no la ve",
              texto:
                "al comercio le llega que su venta fue verificada y acreditada, no la imagen de tu comprobante.",
            },
            {
              titulo: "Se guarda en nuestro propio almacenamiento",
              texto:
                "con un nombre imposible de adivinar, no en una carpeta pública.",
            },
            {
              titulo: "Se usa solo para verificar",
              texto: "no se publica, no se comparte y no se usa para nada más.",
            },
          ],
        },
      ],
    },
    {
      id: "para-que",
      numero: "4",
      titulo: "Para qué usamos tus datos",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Prestar el servicio",
              texto:
                "crear tu cuenta, procesar tus pedidos, verificar los pagos y avisarte de cada paso.",
            },
            {
              titulo: "Cumplir con nuestras obligaciones",
              texto:
                "verificar la identidad de quien paga, contrastar contra listas de sanciones, detectar operaciones inusuales y conservar el expediente de cada operación.",
            },
            {
              titulo: "Mejorar el servicio",
              texto:
                "entender qué se busca y qué falla, en conjunto y sin mirar casos individuales.",
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "Lo que nunca hacemos",
          parrafos: [
            "No vendemos tus datos. No los cedemos a anunciantes. No te mandamos publicidad de terceros. Los correos que recibes de nosotros son avisos de tus propias operaciones.",
          ],
        },
      ],
    },
    {
      id: "con-quien",
      numero: "5",
      titulo: "Con quién se comparten",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Con el comercio al que le compras",
              texto:
                "solo lo necesario para entregar: nombre del destinatario, dirección, teléfono y qué pidió. No le damos tu comprobante ni tus datos bancarios.",
            },
            {
              titulo: "Con los proveedores que hacen funcionar el sitio",
              texto:
                "quien aloja la plataforma y quien envía los correos. Trabajan por instrucción nuestra y no pueden usar tus datos para otra cosa.",
            },
            {
              titulo: "Con bancos y autoridades",
              texto:
                "cuando la ley lo exija o cuando haga falta acreditar una operación concreta ante quien tiene derecho a pedirla.",
            },
          ],
        },
      ],
    },
    {
      id: "cuanto-tiempo",
      numero: "6",
      titulo: "Cuánto tiempo los guardamos",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Los registros de cada operación: cinco años",
              texto:
                "es el plazo de conservación que aplicamos a pedidos, pagos y comprobantes. Un revisor debe poder reconstruir cualquier operación.",
            },
            {
              titulo: "Tu cuenta: mientras la tengas abierta",
              texto:
                "si la cierras, borramos lo que no estemos obligados a conservar.",
            },
            {
              titulo: "Los datos técnicos: unos meses",
              texto: "lo justo para detectar problemas y usos anómalos.",
            },
          ],
        },
      ],
    },
    {
      id: "tus-derechos",
      numero: "7",
      titulo: "Tus derechos",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Escribiéndonos a mercatren@windoce.com desde el correo de tu cuenta puedes pedirnos:",
        },
        {
          tipo: "lista",
          puntos: [
            { texto: "Una copia de los datos que tenemos sobre ti." },
            { texto: "Que corrijamos algo que esté mal." },
            {
              texto:
                "Que borremos tu cuenta y lo que no estemos obligados a conservar.",
            },
            { texto: "Que dejemos de enviarte avisos que no sean esenciales." },
          ],
        },
        {
          tipo: "parrafo",
          texto:
            "Contestamos dentro de los 30 días. Si no podemos borrar algo porque la ley nos obliga a guardarlo, te decimos qué y por qué.",
        },
      ],
    },
    {
      id: "cookies",
      numero: "8",
      titulo: "Cookies y sesión",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Usamos solo lo indispensable: una cookie para mantener tu sesión abierta y otra para recordar tu idioma. No usamos cookies de publicidad ni de seguimiento entre sitios, así que no verás un cartel pidiéndote permiso: no hay nada que consentir.",
        },
        {
          tipo: "parrafo",
          texto:
            "Tu carrito se guarda en tu propio navegador, no en nuestros servidores, hasta que confirmas el pedido.",
        },
      ],
    },
    {
      id: "seguridad",
      numero: "9",
      titulo: "Seguridad",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              texto:
                "Todo el sitio va cifrado (HTTPS), incluidos los formularios y las imágenes de comprobantes.",
            },
            {
              texto:
                "Las contraseñas se guardan cifradas de una sola vía: nadie del equipo puede verlas.",
            },
            {
              texto:
                "Dentro del panel, cada proveedor ve únicamente sus propias operaciones y lo que se le compró. Está comprobado con pruebas automáticas.",
            },
            {
              texto:
                "El acceso a datos de pagos está limitado al equipo que valida.",
            },
          ],
        },
      ],
    },
    {
      id: "menores-cambios",
      numero: "10",
      titulo: "Menores, cambios y contacto",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Menores",
              texto:
                "el servicio es para mayores de 18 años. No recogemos datos de menores a sabiendas.",
            },
            {
              titulo: "Cambios",
              texto:
                "si cambiamos esta política, actualizamos la fecha de arriba y te avisamos cuando el cambio sea importante.",
            },
            {
              titulo: "Contacto",
              texto: "mercatren@windoce.com. Es un buzón real y contestamos.",
            },
          ],
        },
      ],
    },
  ],
  cierre:
    "Mercatren es una marca de Windoce, LLC, sociedad registrada en Estados Unidos.",
};

export const PRIVACIDAD_EN: PaginaContenido = {
  titulo: "Privacy",
  entradilla:
    "What data we collect, what we use it for, who we share it with, and how long we keep it. In plain language.",
  vigencia: "Effective August 3, 2026",
  indiceTitulo: "On this page",
  secciones: [
    {
      id: "quien",
      numero: "1",
      titulo: "Who handles your data",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Windoce, LLC, a company registered in the United States, operating under the Mercatren brand. For any privacy matter, write to us at mercatren@windoce.com.",
        },
      ],
    },
    {
      id: "que-datos",
      numero: "2",
      titulo: "What data we collect",
      bloques: [
        {
          tipo: "tabla",
          encabezados: ["Data", "Where it comes from", "What it's for"],
          filas: [
            [
              "Name and email",
              "You enter it when creating your account",
              "Identifying you, verifying your payments, and notifying you about orders",
            ],
            [
              "Password",
              "You choose it",
              "Signing in. Stored encrypted: not even we can read it",
            ],
            [
              "Phone and delivery address",
              "You enter it when placing an order",
              "So the merchant can deliver the product",
            ],
            [
              "Your orders",
              "Generated when you buy",
              "Fulfilling them, reconciling payment, and keeping the books",
            ],
            [
              "Payment receipts",
              "You upload them",
              "Verifying payment against the bank before approving it",
            ],
            [
              "Technical data",
              "Your browser, when you visit",
              "Keeping your session open and detecting unusual use",
            ],
          ],
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "We don't ask for what we don't need",
          parrafos: [
            "We don't ask for your account number, card number, or ID document to buy. We also don't store card data: we don't process cards.",
          ],
        },
      ],
    },
    {
      id: "comprobantes",
      numero: "3",
      titulo: "Payment receipts",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "The screenshot you upload is the most sensitive data we handle: it usually shows the account holder's name, the bank, and the last digits of the account. That's why it has its own rules.",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Only you and the Mercatren team can see it",
              texto:
                "no other customer can open it, not even with the direct link. Anyone it doesn't belong to gets told it doesn't exist.",
            },
            {
              titulo: "The merchant doesn't see it",
              texto:
                "the merchant is told their sale was verified and credited, not shown your receipt image.",
            },
            {
              titulo: "It's stored in our own storage",
              texto: "under an unguessable name, not in a public folder.",
            },
            {
              titulo: "It's used only to verify",
              texto:
                "it isn't published, isn't shared, and isn't used for anything else.",
            },
          ],
        },
      ],
    },
    {
      id: "para-que",
      numero: "4",
      titulo: "What we use your data for",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Running the service",
              texto:
                "creating your account, processing your orders, verifying payments, and keeping you posted at every step.",
            },
            {
              titulo: "Meeting our obligations",
              texto:
                "verifying the buyer's identity, screening against sanctions lists, detecting unusual transactions, and retaining the file for each operation.",
            },
            {
              titulo: "Improving the service",
              texto:
                "understanding what people search for and what breaks, in aggregate, not by looking at individual cases.",
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "What we never do",
          parrafos: [
            "We don't sell your data. We don't hand it to advertisers. We don't send you third-party marketing. The emails you get from us are notices about your own transactions.",
          ],
        },
      ],
    },
    {
      id: "con-quien",
      numero: "5",
      titulo: "Who we share it with",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "The merchant you buy from",
              texto:
                "only what's needed to deliver: recipient name, address, phone, and what was ordered. We don't give them your receipt or your banking details.",
            },
            {
              titulo: "The providers that keep the site running",
              texto:
                "whoever hosts the platform and whoever delivers the emails. They act on our instructions and can't use your data for anything else.",
            },
            {
              titulo: "Banks and authorities",
              texto:
                "when the law requires it, or when a specific transaction needs to be evidenced to someone entitled to ask.",
            },
          ],
        },
      ],
    },
    {
      id: "cuanto-tiempo",
      numero: "6",
      titulo: "How long we keep it",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Transaction records: five years",
              texto:
                "that's the retention period we apply to orders, payments, and receipts. A reviewer must be able to reconstruct any operation.",
            },
            {
              titulo: "Your account: as long as it's open",
              texto:
                "if you close it, we delete what we aren't required to retain.",
            },
            {
              titulo: "Technical data: a few months",
              texto: "just enough to detect problems and unusual use.",
            },
          ],
        },
      ],
    },
    {
      id: "tus-derechos",
      numero: "7",
      titulo: "Your rights",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "By writing to mercatren@windoce.com from your account email, you can ask us to:",
        },
        {
          tipo: "lista",
          puntos: [
            { texto: "Send you a copy of the data we hold about you." },
            { texto: "Correct anything that's wrong." },
            {
              texto:
                "Delete your account and anything we aren't required to retain.",
            },
            { texto: "Stop sending you non-essential notices." },
          ],
        },
        {
          tipo: "parrafo",
          texto:
            "We answer within 30 days. If we can't delete something because the law requires us to keep it, we'll tell you what and why.",
        },
      ],
    },
    {
      id: "cookies",
      numero: "8",
      titulo: "Cookies and sessions",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "We use only the essentials: one cookie to keep your session open and one to remember your language. We don't use advertising or cross-site tracking cookies, so you won't see a consent banner — there's nothing to consent to.",
        },
        {
          tipo: "parrafo",
          texto:
            "Your cart is stored in your own browser, not on our servers, until you confirm the order.",
        },
      ],
    },
    {
      id: "seguridad",
      numero: "9",
      titulo: "Security",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              texto:
                "The whole site is encrypted (HTTPS), including forms and receipt images.",
            },
            {
              texto:
                "Passwords are stored one-way encrypted: no one on the team can read them.",
            },
            {
              texto:
                "Inside the panel, each supplier sees only their own transactions and what was purchased from them. This is enforced and covered by automated tests.",
            },
            {
              texto:
                "Access to payment data is limited to the team that verifies.",
            },
          ],
        },
      ],
    },
    {
      id: "menores-cambios",
      numero: "10",
      titulo: "Minors, changes, and contact",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Minors",
              texto:
                "the service is for people 18 and over. We don't knowingly collect data from minors.",
            },
            {
              titulo: "Changes",
              texto:
                "if we change this policy, we update the date above and tell you when the change is significant.",
            },
            {
              titulo: "Contact",
              texto: "mercatren@windoce.com. It's a real inbox and we answer.",
            },
          ],
        },
      ],
    },
  ],
  cierre:
    "Mercatren is a brand of Windoce, LLC, a company registered in the United States.",
};
