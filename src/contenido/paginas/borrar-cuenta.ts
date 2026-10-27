import type { PaginaContenido } from "./tipos";
import { CORREO_CONTACTO } from "@/lib/correo/direcciones";

/**
 * Borrar la cuenta (27 oct 2026).
 *
 * Es la página que Google Play pide en la ficha de la app: un enlace donde
 * cualquiera, tenga o no la app instalada, ve cómo borrar su cuenta y qué
 * pasa con sus datos. La dirección va en inglés (/delete-account) también en
 * la versión en español, como manda la regla de las páginas para EE. UU.
 *
 * Lo que dice aquí tiene que coincidir con lo que hace `lib/cuenta/borrar.ts`.
 * Si uno cambia, cambia el otro.
 */
export const BORRAR_CUENTA_ES: PaginaContenido = {
  titulo: "Borrar tu cuenta de Mercatren",
  entradilla:
    "Puedes borrar tu cuenta cuando quieras, desde la app de Mercatren o desde esta página. Aquí te contamos cómo, qué se borra y qué guardamos porque la ley nos obliga.",
  secciones: [
    {
      id: "como",
      numero: "1",
      titulo: "Cómo se borra",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Entra a tu cuenta",
              texto:
                "en la app de Mercatren o en mercatren.com, con tu correo y tu contraseña.",
            },
            {
              titulo: "Abre «Mi cuenta»",
              texto:
                "y toca el botón de los tres puntos, junto a «Cerrar sesión».",
            },
            {
              titulo: "Elige «Borrar mi cuenta»",
              texto:
                "escribe la palabra BORRAR para confirmar y toca el botón rojo.",
            },
          ],
        },
        {
          tipo: "parrafo",
          texto:
            "Se borra en ese momento y te llega un correo de confirmación a la dirección que tenía la cuenta.",
        },
      ],
    },
    {
      id: "que-se-borra",
      numero: "2",
      titulo: "Qué se borra",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            { texto: "Tu nombre, tu correo y tu teléfono." },
            { texto: "Tu contraseña y todas tus sesiones abiertas." },
            { texto: "Tus direcciones de entrega guardadas." },
            {
              texto:
                "Tus reseñas, comentarios y «me gusta» en productos y videos.",
            },
            {
              texto:
                "El correo que hayas dejado en una búsqueda por foto, y el nombre y el teléfono de tu casillero.",
            },
          ],
        },
      ],
    },
    {
      id: "que-se-guarda",
      numero: "3",
      titulo: "Qué guardamos, y por cuánto tiempo",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Los pedidos, los pagos y las facturas se conservan cinco años, con los datos de entrega que tenían, porque la ley nos obliga a poder reconstruir cada venta. Después se eliminan. Ya no quedan unidos a ninguna cuenta con tu nombre ni tu correo.",
        },
        {
          tipo: "parrafo",
          texto:
            "Las preguntas que hayas hecho en un producto se quedan publicadas, pero ya no dicen quién las hizo.",
        },
      ],
    },
    {
      id: "cuando-no",
      numero: "4",
      titulo: "Cuándo hay que esperar o escribirnos",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Si tienes un pedido pagado que todavía no llega",
              texto:
                "espera a recibirlo. Si borras la cuenta antes, pierdes la guía y los avisos de entrega.",
            },
            {
              titulo: "Si tienes paquetes esperando en tu casillero de Miami",
              texto: "primero recíbelos o despáchalos.",
            },
            {
              titulo: "Si tu cuenta tiene una tienda",
              texto: `detrás hay ventas y pagos pendientes. Escríbenos a ${CORREO_CONTACTO} y la cerramos contigo.`,
            },
          ],
        },
      ],
    },
    {
      id: "sin-acceso",
      numero: "5",
      titulo: "Si no puedes entrar a tu cuenta",
      bloques: [
        {
          tipo: "parrafo",
          texto: `Escríbenos a ${CORREO_CONTACTO} desde el correo de tu cuenta, con el asunto «Borrar mi cuenta». La borramos y te contestamos dentro de los 30 días.`,
        },
      ],
    },
  ],
};

export const BORRAR_CUENTA_EN: PaginaContenido = {
  titulo: "Delete your Mercatren account",
  entradilla:
    "You can delete your account at any time, from the Mercatren app or from this page. Here's how, what gets deleted, and what we're required by law to keep.",
  secciones: [
    {
      id: "how",
      numero: "1",
      titulo: "How to delete it",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Sign in",
              texto:
                "in the Mercatren app or at mercatren.com, with your email and password.",
            },
            {
              titulo: "Open “My account”",
              texto: "and tap the three-dot button next to “Sign out.”",
            },
            {
              titulo: "Choose “Delete my account”",
              texto:
                "type the word DELETE to confirm, then tap the red button.",
            },
          ],
        },
        {
          tipo: "parrafo",
          texto:
            "Your account is deleted right away, and we send a confirmation to the email address it used.",
        },
      ],
    },
    {
      id: "what-is-deleted",
      numero: "2",
      titulo: "What gets deleted",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            { texto: "Your name, email address, and phone number." },
            { texto: "Your password and every signed-in session." },
            { texto: "Your saved delivery addresses." },
            {
              texto:
                "Your reviews, comments, and likes on products and videos.",
            },
            {
              texto:
                "The email you left on a photo search, and the name and phone number on your locker.",
            },
          ],
        },
      ],
    },
    {
      id: "what-we-keep",
      numero: "3",
      titulo: "What we keep, and for how long",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Orders, payments, and invoices are kept for five years, with the delivery details they had, because the law requires us to be able to reconstruct every sale. After that, they're deleted. They're no longer linked to any account with your name or email.",
        },
        {
          tipo: "parrafo",
          texto:
            "Questions you asked on a product stay up, but they no longer show who asked them.",
        },
      ],
    },
    {
      id: "when-to-wait",
      numero: "4",
      titulo: "When you'll need to wait or contact us",
      bloques: [
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "If you have a paid order that hasn't arrived yet",
              texto:
                "wait until it's delivered. If you delete your account first, you lose the tracking number and delivery updates.",
            },
            {
              titulo: "If you have packages waiting in your Miami locker",
              texto: "receive or ship them first.",
            },
            {
              titulo: "If your account has a store",
              texto: `there are sales and payments behind it. Email us at ${CORREO_CONTACTO} and we'll close it with you.`,
            },
          ],
        },
      ],
    },
    {
      id: "no-access",
      numero: "5",
      titulo: "If you can't sign in",
      bloques: [
        {
          tipo: "parrafo",
          texto: `Email ${CORREO_CONTACTO} from the address on your account, with the subject “Delete my account.” We'll delete it and reply within 30 days.`,
        },
      ],
    },
  ],
};
