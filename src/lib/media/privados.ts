/**
 * QUÉ ES PRIVADO DENTRO DE `/media`, EN UN SOLO SITIO.
 *
 * Por `/media` salen dos cosas muy distintas: las FOTOS DE LOS PRODUCTOS, que
 * son públicas y tienen que verse en Google, y los documentos de personas y
 * comercios, que no los ve nadie más.
 *
 * ══ POR QUÉ ESTA LISTA VIVE APARTE (8 ago 2026) ══
 *
 * Antes el robots.txt cerraba `/media/` ENTERO, para los tres robots. Y el
 * catálogo que lee Merchant Center manda las fotos como
 * `https://mercatren.com/media/productos/...`.
 *
 * O sea: le dábamos a Google la dirección de la foto y en el mismo sitio le
 * prohibíamos abrirla. Merchant Center rechazó **634 productos, el 99,8 % del
 * catálogo**, con "Unable to do quality & policy checks on product pages". El
 * catálogo entero quedó fuera de Google Shopping sin que nada se viera roto.
 *
 * Peor: la prueba de robots EXIGÍA que `/media/` estuviera cerrado, así que el
 * error estaba clavado por escrito.
 *
 * Ahora la lista se escribe una vez y la usan los dos: la ruta que sirve los
 * archivos y el robots.txt. Cerrar algo nuevo aquí lo cierra en los dos lados a
 * la vez, y abrir las fotos no puede volver a abrir un comprobante.
 *
 * OJO: el robots.txt es un AVISO, no una cerradura. Lo que de verdad protege
 * los comprobantes es `src/app/media/[...clave]/route.ts`, que exige sesión y
 * responde 404 a quien no corresponde. Un robot sin sesión no los vería
 * aunque el robots.txt no dijera nada.
 */
export const MEDIA_PRIVADOS = [
  /** La captura del banco de una persona. Solo quien hizo ese pedido y el equipo. */
  "comprobantes/",
  /** La factura que nos manda un comercio: sus datos fiscales y sus precios. */
  "facturas-compra/",
  /**
   * La captura de la transferencia que se le hizo a un comercio. Lleva el
   * nombre del titular y los últimos dígitos de su cuenta: la ve él y el
   * equipo, nadie más.
   */
  "retiros/",
] as const;

/** Las mismas rutas como las escribe el robots.txt. */
export const MEDIA_PRIVADOS_URL = MEDIA_PRIVADOS.map(
  (prefijo) => `/media/${prefijo}`,
);
