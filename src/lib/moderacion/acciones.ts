"use server";

import { obtenerUsuario } from "@/lib/autorizacion";

import { bloquearComo, denunciarComo, type Rechazo } from "./nucleo";
import {
  desbloquearTienda,
  listarBloqueados,
  tiendasBloqueadasPor,
} from "./para-la-app";

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

/** Los slugs de los vendedores que bloqueó quien mira (para esconder sus tarjetas). */
export async function misVendedoresBloqueados(): Promise<string[]> {
  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) return [];
  return [...(await tiendasBloqueadasPor(usuario.id))];
}

/** La lista con nombres, para «Vendedores bloqueados» en la cuenta. */
export async function listaDeBloqueados(): Promise<
  Array<{ slug: string; nombre: string }>
> {
  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) return [];
  return listarBloqueados(usuario.id);
}

/** Deshacer un bloqueo desde la web. */
export async function desbloquearVendedor(
  slug: string,
): Promise<{ ok: boolean }> {
  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario || typeof slug !== "string" || !/^[a-z0-9-]{1,200}$/i.test(slug))
    return { ok: false };
  return { ok: await desbloquearTienda(usuario.id, slug) };
}
