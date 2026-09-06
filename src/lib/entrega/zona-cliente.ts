import "server-only";

import { cookies } from "next/headers";

import { zonaPorSlug } from "@/lib/entrega/zonas";
import { mercadoActual } from "@/lib/mercado/actual";
import { seRetiraEnCiudad } from "@/lib/mercado/mercados";

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
  /**
   * ══ FUERA DE VENEZUELA NO HAY CIUDAD, AUNQUE LA COOKIE EXISTA (6 sep 2026) ══
   *
   * Las ciudades son el mapa venezolano. Con la mudanza a mercatren.com.ve,
   * quien venía usando mercatren.com desde El Vigía tiene la cookie puesta:
   * si se leyera igual, en mercatren.com le filtraríamos el catálogo de
   * Estados Unidos por una ciudad venezolana, y vería medio catálogo sin
   * saber por qué.
   *
   * Se corta AQUÍ y no en cada pantalla porque esta es la única puerta a ese
   * dato: el encabezado, la portada y el catálogo la llaman a ella.
   */
  const mercado = await mercadoActual();
  if (!seRetiraEnCiudad(mercado)) return null;

  const galleta = (await cookies()).get(COOKIE_ZONA)?.value;
  return zonaPorSlug(galleta);
}
