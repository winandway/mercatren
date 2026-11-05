/**
 * El precio, escrito como en la web (`src/lib/dinero.ts` del sitio): en
 * pesos chilenos y colombianos lo guardado YA son pesos (sin centavos); en el
 * resto, centavos. En español con euros se escribe como en España («12,50 €»).
 * Puro: lo prueban las pruebas del sitio (`tests/unit/app-movil-pantallas.test.ts`).
 */
export type Idioma = "es" | "en";

const SIN_CENTAVOS = new Set(["CLP", "COP", "PYG", "JPY", "KRW"]);

export function divisorDe(moneda: string): number {
  return SIN_CENTAVOS.has(moneda.toUpperCase()) ? 1 : 100;
}

function regionDe(idioma: Idioma, moneda: string): string {
  if (idioma === "en") return "en-US";
  return moneda.toUpperCase() === "EUR" ? "es-ES" : "es-US";
}

export function precioTexto(
  centavos: number,
  moneda: string,
  idioma: Idioma,
): string {
  return new Intl.NumberFormat(regionDe(idioma, moneda), {
    style: "currency",
    currency: moneda,
  }).format(centavos / divisorDe(moneda));
}
