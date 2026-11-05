import { enLaApp } from "@/lib/mercado/interruptores";
import { MERCADOS, type Mercado } from "@/lib/mercado/mercados";

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

/**
 * LOS PAÍSES QUE SE OFRECEN AL CREAR LA CUENTA, en la web y en la app (la
 * misma pieza, 5 nov 2026): los encendidos en la app (`interruptores.ts`) y,
 * siempre, el de la visita (quien entra por mercatren.com.ve es de
 * Venezuela aunque su país no esté todavía en la app). El de la visita va
 * primero, porque es el que casi todos eligen.
 */
export function paisesParaElAlta(paisDeLaVisita: string): Mercado[] {
  const lista = MERCADOS.filter(
    (m) => enLaApp(m.codigo) || m.codigo === paisDeLaVisita,
  );
  return [
    ...lista.filter((m) => m.codigo === paisDeLaVisita),
    ...lista.filter((m) => m.codigo !== paisDeLaVisita),
  ];
}

/**
 * ¿Este país se puede poner al crear la cuenta desde esta visita? La misma
 * regla de la pantalla (`paisesParaElAlta`), revisada en el servidor: nadie
 * abre una cuenta en un país apagado llamando directo a la puerta de cuentas.
 * Sin país (la web vieja no lo mandaba) se deja pasar: la cuenta queda sin
 * país y vale el de la visita.
 */
export function paisDelAltaPermitido(
  valor: unknown,
  paisDeLaVisita: string,
): boolean {
  if (valor === undefined || valor === null) return true;
  return (
    typeof valor === "string" &&
    paisesParaElAlta(paisDeLaVisita).some((m) => m.codigo === valor)
  );
}
