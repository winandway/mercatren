import { MERCADOS } from "@/lib/mercado/mercados";

/**
 * EL PAÍS CON QUE SE CREA LA CUENTA (5 nov 2026, plan PLAN-UNA-SOLA-MERCATREN).
 *
 * La app nativa crea la cuenta con el país que la persona eligió en la
 * bienvenida (`paisEntrega`), y de ahí sale su moneda. Solo se acepta un código
 * de la lista cerrada de mercados: un texto cualquiera en ese campo es un país
 * que ningún muro reconoce. Si no viene (la web no lo manda), se deja vacío.
 */
export function paisDelAltaValido(valor: unknown): boolean {
  if (valor === undefined || valor === null) return true;
  return typeof valor === "string" && MERCADOS.some((m) => m.codigo === valor);
}
