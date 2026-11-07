"use server";

import { obtenerUsuario } from "@/lib/autorizacion";

import { bloquearComo, denunciarComo, type Rechazo } from "./nucleo";

/**
 * DENUNCIAR Y BLOQUEAR (27 oct 2026). Ver `reglas.ts`.
 *
 * Es la puerta de la WEB: saca a la persona de la sesión del navegador y deja
 * el trabajo al núcleo (`nucleo.ts`), que es el mismo de la app nativa.
 *
 * Solo exporta funciones async: un archivo "use server" con una constante o
 * un tipo exportado rompe la compilación entera.
 */
export async function denunciarContenido(entrada: {
  tipo: string;
  id: string;
  motivo: string;
}): Promise<{ ok: true; oculto: boolean } | { ok: false; motivo: Rechazo }> {
  const usuario = await obtenerUsuario();
  return denunciarComo(usuario?.id ?? null, entrada);
}

export async function bloquearAutor(entrada: {
  tipo: string;
  id: string;
}): Promise<{ ok: true } | { ok: false; motivo: Rechazo }> {
  const usuario = await obtenerUsuario();
  return bloquearComo(usuario?.id ?? null, entrada);
}
