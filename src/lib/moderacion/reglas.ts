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
 *   las escribió un comprador);
 * - los PRODUCTOS y las TIENDAS que cualquiera abre desde la app (6 nov 2026,
 *   política UGC de Google Play): el autor es el dueño de la tienda.
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
  "producto",
  "tienda",
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

/**
 * LO QUE LA APP ESCONDE (6 nov 2026). Lo ocultado por denuncias lo ve nadie;
 * lo de un vendedor bloqueado lo deja de ver solo quien lo bloqueó.
 */
export type OcultosParaLaApp = {
  /** Ids de productos con tres denuncias abiertas o más. */
  productos: ReadonlySet<string>;
  /** Slugs de tiendas con tres denuncias abiertas o más. */
  tiendasDenunciadas: ReadonlySet<string>;
  /** Slugs de tiendas cuyo dueño bloqueó quien mira. */
  tiendasBloqueadas: ReadonlySet<string>;
};

export function estaOcultoParaLaApp(
  item: { id: string; tienda: { slug: string } },
  ocultos: OcultosParaLaApp,
): boolean {
  return (
    ocultos.productos.has(item.id) ||
    ocultos.tiendasDenunciadas.has(item.tienda.slug) ||
    ocultos.tiendasBloqueadas.has(item.tienda.slug)
  );
}

/** Quita de una lista lo que la app no debe enseñar. */
export function sinOcultos<T extends { id: string; tienda: { slug: string } }>(
  lista: readonly T[],
  ocultos: OcultosParaLaApp,
): T[] {
  return lista.filter((p) => !estaOcultoParaLaApp(p, ocultos));
}

/** El estado HTTP de cada motivo de rechazo de una denuncia o un bloqueo. */
export function estadoDeRechazo(
  motivo: "sesion" | "propio" | "invalido" | "fallo",
): number {
  return motivo === "sesion"
    ? 401
    : motivo === "propio"
      ? 403
      : motivo === "invalido"
        ? 404
        : 500;
}
