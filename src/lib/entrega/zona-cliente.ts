import "server-only";

import { cookies } from "next/headers";

import { zonaPorSlug } from "@/lib/entrega/zonas";

/**
 * La ciudad que eligió quien está mirando.
 *
 * VIVE EN UNA COOKIE, no en la sesión, y a propósito: quien todavía no tiene
 * cuenta también necesita saber si su compra le queda cerca. Amazon hace lo
 * mismo con el código postal — lo pregunta antes de que te registres, porque
 * si no, la mitad de la tienda no significa nada.
 *
 * NO SE ADIVINA POR IP NI POR GPS. La IP se equivoca (un celular en El Vigía
 * puede salir con IP de Caracas o de Bogotá) y el GPS exige un permiso que
 * asusta y que la mayoría niega. Se pregunta, se guarda, y listo.
 *
 * Sin cookie devuelve null: quien acaba de llegar ve la tienda entera sin
 * avisos, y elige su ciudad cuando le sirva.
 */
export const COOKIE_ZONA = "mercatren_zona";

export async function zonaDelCliente() {
  const galleta = (await cookies()).get(COOKIE_ZONA)?.value;
  return zonaPorSlug(galleta);
}
