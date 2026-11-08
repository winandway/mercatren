import { PAQUETE_ANDROID } from "@/lib/app-android/enlaces";

/**
 * ══ EL BOTÓN DE GOOGLE PLAY (8 nov 2026) ══
 *
 * Mercatren ya es pública en Google Play y la web no ofrecía la descarga
 * (orden de Richard, vía Gerencia). El botón usa el distintivo OFICIAL de
 * Google sin tocarlo: solo se le quitó el margen transparente del archivo
 * para que el inglés y el español midan lo mismo. Normas de marca de Google:
 * no se recolorea, no se deforma, no baja de 40 px de alto en pantalla, va
 * en el idioma de la página y enlaza a la ficha de la app. La frase de marca
 * («Google Play y el logotipo… son marcas de Google LLC») va en el pie.
 *
 * Candado: `tests/unit/google-play.test.ts`.
 */
export function fichaDeGooglePlay(idioma: string): string {
  const hl = idioma === "en" ? "en" : "es";
  return `https://play.google.com/store/apps/details?id=${PAQUETE_ANDROID}&hl=${hl}`;
}

/** El distintivo oficial en el idioma de la página (646×192 y 564×168). */
export function insigniaDeGooglePlay(idioma: string) {
  return idioma === "en"
    ? { src: "/insignias/google-play-en.png", ancho: 564, alto: 168 }
    : { src: "/insignias/google-play-es.png", ancho: 646, alto: 192 };
}

/**
 * ¿Se le ofrece la app a este visitante? Solo en un celular Android, y nunca
 * a quien ya está dentro de la app (la app abre el sitio a pantalla completa:
 * el aviso ahí sería ofrecerle lo que ya tiene).
 */
export function ofrecerLaApp(entorno: {
  agente: string;
  referente: string;
  pantallaCompleta: boolean;
  cerradoAntes: boolean;
}): boolean {
  if (entorno.cerradoAntes || entorno.pantallaCompleta) return false;
  if (entorno.referente.startsWith(`android-app://${PAQUETE_ANDROID}`)) {
    return false;
  }
  return /Android/i.test(entorno.agente) && /Mobile/i.test(entorno.agente);
}
