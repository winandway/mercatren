/**
 * A DÓNDE VUELVE LA FLECHA «← VOLVER» DE LA FICHA DEL PRODUCTO — la parte pura.
 *
 * ══ EL FALLO QUE ARREGLA (22 ago 2026) ══
 *
 * La ficha tenía arriba un «← Volver al catálogo» con `href="/catalogo"` fijo.
 * Quien entraba a una tienda, abría un producto y tocaba esa flecha caía en el
 * catálogo entero —«un océano de mil productos», palabras del dueño— y tenía
 * que ir a Tiendas, buscar la suya entre sesenta y volver a entrar. El botón
 * «atrás» del navegador sí volvía a la tienda; la flecha nuestra, no.
 *
 * ══ LA REGLA ══
 *
 * La flecha vuelve **a donde la persona venía**, si venía de este mismo sitio
 * (la tienda, una búsqueda, la portada, otro producto): eso es lo que el
 * navegador sabe hacer con `history.back()`. Si llegó por un enlace de fuera
 * —WhatsApp, Google— no hay adónde volver, y entonces va **a la tienda del
 * producto**, que es lo más cercano a «de dónde salió esto».
 *
 * Nunca más al catálogo a secas.
 */

export type Vuelta = { modo: "atras" } | { modo: "enlace"; href: string };

export function destinoDeVuelta(p: {
  /** `document.referrer` tal cual: vacío cuando se llega de fuera. */
  referrer: string | null | undefined;
  /** `location.origin` de la página actual. */
  origen: string;
  /** `location.pathname` de la ficha, para no "volver" a sí misma. */
  paginaActual: string;
  /** Si el navegador tiene a dónde volver (`history.length > 1`). */
  hayHistorial: boolean;
  /** La tienda del producto: el respaldo cuando no hay de dónde venir. */
  hrefTienda: string;
}): Vuelta {
  const enlace: Vuelta = { modo: "enlace", href: p.hrefTienda };
  if (!p.hayHistorial || !p.referrer) return enlace;

  let ref: URL;
  try {
    ref = new URL(p.referrer);
  } catch {
    return enlace;
  }

  /* Solo se vuelve atrás dentro del sitio. Un referrer de otro dominio
     significa que el «atrás» sacaría a la persona de Mercatren. */
  if (ref.origin !== p.origen) return enlace;

  /* Una recarga de la propia ficha deja como referrer la ficha misma: volver
     «atrás» ahí es recargar otra vez. Mejor la tienda. */
  if (ref.pathname === p.paginaActual) return enlace;

  return { modo: "atras" };
}
