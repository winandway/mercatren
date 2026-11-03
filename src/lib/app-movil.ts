/**
 * ¿LA PÁGINA SE ABRIÓ DESDE LA APP DE MERCATREN? (3 nov 2026)
 *
 * Mercatren pasa a ser app (orden de Richard): la de iPhone y la de Android
 * muestran el sitio por dentro, y cada cosa que el sitio escribe en la base
 * al abrir una pantalla se multiplica por cada apertura de la app. Esto deja
 * que el sitio sepa dónde está para no escribir de más.
 *
 * - iPhone: la app se presenta como `MercatrenApp-iOS/…` en el navegador
 *   (`app-ios/Mercatren/PestanaWeb.swift`).
 * - Android: la app abre el sitio a pantalla completa, sin barra de
 *   direcciones (`display-mode: standalone`), y la primera página llega con
 *   el referido `android-app://`.
 */
export function esLaAppMovil(o: {
  agente: string;
  independiente: boolean;
  referido: string;
}): boolean {
  return (
    o.agente.includes("MercatrenApp") ||
    o.independiente ||
    o.referido.startsWith("android-app://")
  );
}

/** Lo mismo, leído del navegador. Fuera del navegador, nunca es la app. */
export function dentroDeLaApp(): boolean {
  if (typeof window === "undefined") return false;
  const independiente = ["standalone", "fullscreen", "minimal-ui"].some(
    (modo) => window.matchMedia?.(`(display-mode: ${modo})`).matches ?? false,
  );
  return esLaAppMovil({
    agente: navigator.userAgent,
    independiente,
    referido: document.referrer,
  });
}
