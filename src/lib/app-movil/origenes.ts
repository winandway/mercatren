/**
 * LA APP NATIVA ES UN ORIGEN DE CONFIANZA (5 nov 2026).
 *
 * La app de Mercatren (Expo, `app-movil/`) entra con su esquema `mercatren://`.
 * En desarrollo corre dentro de Expo Go, que se presenta como `exp://`: ese se
 * acepta SOLO fuera de producción, porque cualquier proyecto de Expo Go lleva
 * el mismo esquema.
 */
export function origenesDeLaApp(entorno = process.env.NODE_ENV): string[] {
  return entorno === "production"
    ? ["mercatren://"]
    : ["mercatren://", "exp://", "exp://**"];
}
