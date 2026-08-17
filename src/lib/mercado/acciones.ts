"use server";

import { esSoporteDeVerdad } from "@/lib/autorizacion";
import { guardarMercadoDelPanel } from "@/lib/mercado/panel";

/**
 * Cambiar el país que mira el panel.
 *
 * ══ EL ROL SE COMPRUEBA AQUÍ, EN EL SERVIDOR ══
 *
 * El selector solo se le dibuja a Soporte, pero un botón dibujado no es un
 * permiso: cualquiera puede llamar a una acción de servidor desde la consola.
 * La comprobación de verdad vive aquí — y se repite al LEER la cookie
 * (`mercadoDelPanel`), para que a una cuenta a la que le bajen el rol se le
 * deje de respetar en el acto.
 *
 * ══ `esSoporteDeVerdad`, NO «tiene rol soporte» ══
 *
 * Quien esté mirando el panel de un comercio con el disfraz de «ver su panel»
 * NO puede cambiar de país: estaría mezclando dos modos de mirar, y la franja
 * de arriba diría una cosa mientras los números dirían otra.
 */
export async function cambiarMercadoDelPanel(codigo: string | null) {
  if (!(await esSoporteDeVerdad())) return;
  await guardarMercadoDelPanel(codigo);
}
