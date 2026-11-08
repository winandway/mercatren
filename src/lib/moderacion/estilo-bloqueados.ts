/**
 * La hoja de estilo que esconde, en la web, las tarjetas de los vendedores
 * que quien mira bloqueó (8 nov 2026). Pura, para probarla: solo deja pasar
 * slugs válidos, así nadie mete CSS por un slug raro.
 */
export const LLAVE_BLOQUEADOS = "mercatren:bloqueados";

export function estiloParaBloqueados(slugs: readonly string[]): string {
  const validos = slugs.filter((s) => /^[a-z0-9-]{1,200}$/i.test(s));
  if (validos.length === 0) return "";
  const sel = validos
    .map((s) => `a[data-tienda="${s}"]`)
    .flatMap((a) => [`li:has(> ${a})`, `div:has(> ${a})`, a]);
  return `${sel.join(",")}{display:none!important}`;
}

/**
 * Bloquear o desbloquear deja vieja la lista guardada en la pestaña. Lo llama
 * el menú de tres puntos en CUALQUIER bloqueo (ficha, tienda, opiniones,
 * videos) y la pantalla de bloqueados al deshacer.
 */
export function olvidarBloqueados() {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(LLAVE_BLOQUEADOS)) sessionStorage.removeItem(k);
    }
  } catch {
    /* Sin almacenamiento no hay nada que olvidar. */
  }
}
