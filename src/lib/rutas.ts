/**
 * Rutas del servidor.
 *
 * REGLA DE LA PLATAFORMA: en YaDominios Cloud el prefijo /api/ lo capturan los
 * archivos estaticos antes de que corra el codigo, asi que ninguna ruta de
 * servidor puede empezar por /api. Usamos estos prefijos:
 *
 *   /datos   -> login, formularios, avisos de pago
 *   /media   -> imagenes de productos servidas desde el bucket
 *   /upload  -> subida de archivos (fotos, capturas de pago)
 */

export const RUTA_AUTH = "/datos/auth";
/**
 * DONDE STRIPE MANDA SUS AVISOS. Es la direccion que se pega en el panel de
 * Stripe, y tiene que ser EXACTA: si Stripe llama a una direccion que no
 * existe recibe un 404, da el aviso por fallido y lo reintenta unas horas.
 * Mientras tanto el comprador pago y su pedido sigue diciendo "esperando el
 * pago" — que es justo el fallo que la conciliacion vino a tapar.
 *
 * Decia `/datos/stripe/aviso` y esa ruta NUNCA existio: el archivo esta en
 * `src/app/datos/stripe/route.ts`, o sea `/datos/stripe`. No rompia nada
 * porque ningun codigo la usaba, pero es la constante que uno lee para
 * configurar el webhook. `tests/unit/rutas.test.ts` ya no deja que se
 * desincronicen.
 */
export const RUTA_STRIPE_WEBHOOK = "/datos/stripe";
export const RUTA_MEDIA = "/media";
export const RUTA_UPLOAD = "/upload";

/**
 * El agente operativo. El navegador habla SOLO con esta ruta de nuestro sitio;
 * el token del agente se lo pega el servidor y nunca sale de allí.
 */
export const RUTA_ASISTENTE = "/datos/asistente";
