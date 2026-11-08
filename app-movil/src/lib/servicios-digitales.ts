import { Platform } from "react-native";

/**
 * EL PLAN PRO Y LOS PROMOCIONADOS NO SE OFRECEN EN ANDROID (8 nov 2026).
 *
 * Son servicios digitales que se consumen dentro de la app. Google Play exige
 * cobrarlos con su propio sistema de pagos, y mostrar su precio sin ese
 * sistema es motivo de rechazo (dictamen del auditor, DICTAMEN-2026-11-08-
 * NATIVA). Hasta que Richard decida cómo cobrarlos en Android, ahí no se
 * ofrecen; en la web y en el panel siguen igual.
 */
export function ofreceServiciosDigitales(
  sistema: string = Platform.OS,
): boolean {
  return sistema !== "android";
}
