/**
 * Las direcciones de correo de Mercatren. REGLA DEL PROYECTO.
 *
 * ══ EL PÚBLICO PASÓ A @mercatren.com (12 ago 2026) ══
 *
 * Hasta hoy el contacto de la web era `mercatren@windoce.com`, de cuando la
 * tienda la operaba Windoce. Ya no la opera: la sociedad es Mercatren LLC y
 * todas las páginas lo dicen.
 *
 * Ese correo era **la mención de Windoce más visible que quedaba en el sitio**
 * —salía en el pie, en términos, en privacidad y en contacto—, y era la razón
 * por la que Google, al preguntarle con qué empresa funciona Mercatren, seguía
 * contestando «Windoce, LLC»: leía la página y la dirección de contacto le
 * decía eso. Lo notó el dueño buscándose a sí mismo.
 *
 * ══ POR QUÉ SON DOS Y NO UNA ══
 *
 * - `CORREO_CONTACTO` es el que ve el mundo: la web, los documentos y el
 *   Reply-To de lo que enviamos. Va en @mercatren.com, que es la marca.
 * - `CORREO_EQUIPO` recibe los avisos internos —una venta nueva, un
 *   contracargo, un retiro pedido—. **También pasó a @mercatren.com el 14 ago
 *   2026**, cuando ya no quedaba una sola dirección de Windoce en el sistema.
 *   Se movió después y no a la vez que el público, a propósito: de estos
 *   avisos depende que alguien mire la cola de retiros y que a un comercio le
 *   llegue su plata, así que primero había que estar seguros de que el buzón
 *   nuevo se lee.
 *
 * ══ ESTA NO ERA LA QUE CONFUNDÍA A GOOGLE ══
 *
 * `CORREO_EQUIPO` no sale en ninguna página: es solo el destinatario de los
 * avisos internos. La que Google leía era `CORREO_CONTACTO`, y esa se cambió
 * el 12 de agosto. Se mueve igual porque no hay razón para que una dirección
 * de la sociedad anterior siga operando el sistema de la nueva.
 *
 * Los dos existen y RECIBEN de verdad. Esa es la regla dura: **PROHIBIDO
 * poner de contacto una dirección sin buzón real** —no recibe, y el mensaje
 * del cliente se pierde sin que nadie se entere—. Vale igual para las cuentas
 * del sistema: una cuenta creada con una dirección inventada queda perdida el
 * día que haya que recuperar su contraseña, y eso se descubre en el peor
 * momento.
 *
 * `avisos@mercatren.com` SOLO ENVÍA los avisos del sistema. No recibe nada.
 * Cualquier buzón @mercatren.com sirve como remitente: el dominio entero está
 * autorizado y firmado.
 *
 * Vive aparte de enviar.ts para poder importarse desde cualquier componente
 * (el pie de página, los términos) sin arrastrar nada del servidor.
 */

/** El buzón público: recibe. Va en la web, en los documentos y en el Reply-To. */
export const CORREO_CONTACTO = "hola@mercatren.com";

/**
 * Donde le llegan al equipo los avisos del sistema.
 *
 * Tiene que ser DISTINTA del contacto público, y hay una prueba que lo exige:
 * si fueran la misma, los avisos de dinero se mezclarían con los mensajes de
 * los clientes y el que importa se pierde entre los otros veinte.
 *
 * De estos correos depende que alguien mire la cola de retiros y que a un
 * comercio le llegue su dinero. Al cambiarla, se comprueba con **Panel →
 * Configuración → Probar el envío** que el buzón recibe de verdad.
 */
export const CORREO_EQUIPO = "soporte@mercatren.com";

/** El remitente del sistema: solo envía. */
export const CORREO_REMITENTE = "Mercatren <avisos@mercatren.com>";
