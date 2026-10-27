/**
 * ══ DENUNCIAR Y BLOQUEAR: LAS REGLAS (27 oct 2026) ══
 *
 * Google Play pide, para todo contenido de usuarios que el público puede ver,
 * un sistema DENTRO de la app para denunciarlo y para bloquear a quien lo
 * publicó. En Mercatren eso es:
 *
 * - los comentarios de los videos de las tiendas;
 * - las opiniones (estrellas y texto) de los productos;
 * - las preguntas de los productos (las publica y contesta el comercio, pero
 *   las escribió un comprador).
 *
 * Con TRES denuncias abiertas de personas distintas, el contenido se oculta
 * solo para todos, sin esperar a nadie del equipo. El equipo recibe cada
 * denuncia por correo y puede descartarla (vuelve a verse) o atenderla.
 *
 * Bloquear esconde lo que publica esa persona solo para quien bloqueó.
 *
 * Este archivo es puro: no toca la base.
 */
export const TIPOS_DENUNCIABLES = [
  "comentario",
  "opinion",
  "pregunta",
] as const;
export type TipoDenunciable = (typeof TIPOS_DENUNCIABLES)[number];

export const MOTIVOS_DE_DENUNCIA = [
  "spam",
  "ofensivo",
  "sexual",
  "odio",
  "fraude",
  "otro",
] as const;
export type MotivoDeDenuncia = (typeof MOTIVOS_DE_DENUNCIA)[number];

/** Con cuántas denuncias abiertas se oculta solo. */
export const DENUNCIAS_PARA_OCULTAR = 3;

export function esTipoDenunciable(x: unknown): x is TipoDenunciable {
  return (TIPOS_DENUNCIABLES as readonly unknown[]).includes(x);
}

export function esMotivoDeDenuncia(x: unknown): x is MotivoDeDenuncia {
  return (MOTIVOS_DE_DENUNCIA as readonly unknown[]).includes(x);
}

/** ¿Ya se oculta para todos? */
export function seOcultaPorDenuncias(denunciasAbiertas: number): boolean {
  return denunciasAbiertas >= DENUNCIAS_PARA_OCULTAR;
}

/**
 * ¿Puede esta persona denunciar o bloquear esto? No su propio contenido, y
 * no sin sesión (la denuncia lleva nombre para que no la llenen robots).
 */
export function puedeModerar(
  quien: string | null,
  autor: string | null,
): "ok" | "sesion" | "propio" {
  if (!quien) return "sesion";
  if (autor && autor === quien) return "propio";
  return "ok";
}
