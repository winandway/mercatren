/**
 * CÓMO SE APLICAN LAS SEÑALES: SE REORDENA, NUNCA SE FILTRA (24 ago 2026).
 *
 * La lista llega ya justa (rondas de tienda, intercalado por familia). Aquí
 * solo se **adelanta** lo que le interesa a esta persona, con dos topes que
 * no se tocan:
 *
 *  1. **Nunca más de `MAXIMO_AFINES_SEGUIDOS` afines seguidos.** Si no, la
 *     pantalla de un cliente fiel de la ferretería sería la ferretería entera
 *     otra vez — justo lo que arreglaron las rondas del 23 de agosto.
 *  2. **Lo que no es afín conserva su orden.** Un comercio nuevo sigue
 *     saliendo donde salía; solo se le cuelan delante unos pocos conocidos.
 *
 * Es PURO a propósito: sin señales devuelve la lista TAL CUAL, y tiene sus
 * pruebas. La parte que toca la base vive en `senales.ts`.
 */
import type { Senales } from "@/lib/recomendar/senales";

export const MAXIMO_AFINES_SEGUIDOS = 2;

export type IdentidadDeItem = {
  tiendaId?: string | null;
  tiendaSlug?: string | null;
  categoriaId?: string | null;
  /** Para los videos: si ESTA persona ya le dio corazón, va de primero. */
  leGusto?: boolean;
};

export function esAfin(quien: IdentidadDeItem, senales: Senales): boolean {
  if (quien.leGusto) return true;
  if (quien.tiendaId && senales.tiendas.includes(quien.tiendaId)) return true;
  if (quien.tiendaSlug && senales.tiendas.includes(quien.tiendaSlug))
    return true;
  return Boolean(
    quien.categoriaId && senales.categorias.includes(quien.categoriaId),
  );
}

export function ordenarPorAfinidad<T>(
  lista: T[],
  senales: Senales,
  identificar: (item: T) => IdentidadDeItem,
): T[] {
  if (lista.length < 3) return lista;

  const afines: T[] = [];
  const resto: T[] = [];
  for (const item of lista) {
    (esAfin(identificar(item), senales) ? afines : resto).push(item);
  }
  /* Sin nada afín —o con TODO afín— no hay nada que adelantar. */
  if (afines.length === 0 || resto.length === 0) return lista;

  /* Dentro de los afines, lo que la persona marcó con su corazón va primero:
     es la señal más directa de todas. El resto conserva su orden relativo. */
  afines.sort((a, b) => {
    const ga = identificar(a).leGusto ? 1 : 0;
    const gb = identificar(b).leGusto ? 1 : 0;
    return gb - ga;
  });

  /* Se intercalan: dos afines, uno del resto, dos afines… así lo conocido va
     delante sin volverse un bloque. */
  const salida: T[] = [];
  let i = 0;
  let j = 0;
  let seguidos = 0;
  while (i < afines.length || j < resto.length) {
    const tocaAfin =
      i < afines.length &&
      (seguidos < MAXIMO_AFINES_SEGUIDOS || j >= resto.length);
    if (tocaAfin) {
      salida.push(afines[i] as T);
      i += 1;
      seguidos += 1;
    } else {
      salida.push(resto[j] as T);
      j += 1;
      seguidos = 0;
    }
  }
  return salida;
}
