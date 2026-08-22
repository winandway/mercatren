/**
 * ¿ESTA PÁGINA SE ABRIÓ DENTRO DE UNA APP, Y NO EN EL NAVEGADOR? — parte pura.
 *
 * ══ EL PROBLEMA QUE RESUELVE ══
 *
 * Cuando alguien toca el enlace de cobro desde WhatsApp, la página **no se
 * abre en Chrome ni en Safari**: se abre en un navegador de mentira que va
 * dentro de la propia app (un *webview*). Se ve casi igual, pero le faltan
 * cosas.
 *
 * Y una de las que le faltan es justo la que importa aquí: **el pago con la
 * cuenta del banco desaparece**. No es un fallo nuestro ni de Stripe — pagar
 * con el banco obliga a abrir una ventana del propio banco para identificarse,
 * y eso un webview no lo puede hacer. Stripe lo sabe y directamente no ofrece
 * ese método.
 *
 * Resultado: el comercio manda el enlace por WhatsApp, quien paga lo abre ahí,
 * **no ve los bancos**, y nadie entiende por qué. Desde nuestro lado la página
 * se ve perfecta.
 *
 * ══ LO QUE SE PUEDE HACER, Y LO QUE NO ══
 *
 * **No se puede** forzar que se abra en el navegador de verdad: ninguna página
 * puede sacarse a sí misma de un webview. Eso lo decide la app.
 *
 * **Sí se puede** decirlo: avisar que para pagar con el banco hay que abrir el
 * enlace en el navegador, y dejarlo copiado de un toque. Un aviso de dos líneas
 * convierte un «esto no funciona» en un paso más.
 *
 * ══ POR QUÉ SE MIRA EL NAVEGADOR Y NO SE ADIVINA ══
 *
 * El aviso solo aparece dentro de una app. En Chrome o en Safari sobra, y un
 * aviso que sale cuando no hace falta se aprende a ignorar — y entonces tampoco
 * se lee el día que sí importa.
 */

/**
 * Las marcas que dejan las apps más usadas en su webview.
 *
 * Se comparan en minúsculas. La lista es corta a propósito: son las apps por
 * las que de verdad se reenvía un enlace de cobro. Añadir una es añadir una
 * línea.
 */
const MARCAS_DE_APP = [
  "whatsapp",
  "instagram",
  "fban", // Facebook para iOS
  "fbav", // Facebook para Android
  "fb_iab", // el navegador dentro de Facebook
  "messenger",
  "micromessenger", // WeChat
  "telegram",
] as const;

/** El nombre para enseñar, cuando se puede reconocer. */
export function appQueLoAbrio(
  userAgent: string | null | undefined,
): string | null {
  const ua = (userAgent ?? "").toLowerCase();
  if (!ua) return null;
  if (ua.includes("whatsapp")) return "WhatsApp";
  if (ua.includes("instagram")) return "Instagram";
  /* «micromessenger» es WeChat, y CONTIENE «messenger»: sin descartarlo
     primero, a un usuario de WeChat se le diría que está dentro de Messenger,
     que es otra app. Lo encontró su propia prueba. */
  if (ua.includes("messenger") && !ua.includes("micromessenger")) {
    return "Messenger";
  }
  if (ua.includes("fban") || ua.includes("fbav") || ua.includes("fb_iab")) {
    return "Facebook";
  }
  if (ua.includes("telegram")) return "Telegram";
  return null;
}

/**
 * ¿Se abrió dentro de una app?
 *
 * OJO con los falsos positivos: casi todos los navegadores de móvil llevan
 * «Safari» o «Chrome» en su identificación, incluidos los webviews. Por eso se
 * busca la marca de la APP, que solo la ponen ellas, y no se intenta deducir
 * «no es Chrome, luego es un webview» — eso marcaría media clientela.
 */
export function abiertoDentroDeUnaApp(
  userAgent: string | null | undefined,
): boolean {
  const ua = (userAgent ?? "").toLowerCase();
  if (!ua) return false;
  return MARCAS_DE_APP.some((marca) => ua.includes(marca));
}
