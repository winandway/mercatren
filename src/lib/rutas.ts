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
export const RUTA_STRIPE_WEBHOOK = "/datos/stripe/aviso";
export const RUTA_MEDIA = "/media";
export const RUTA_UPLOAD = "/upload";

/**
 * El agente operativo. El navegador habla SOLO con esta ruta de nuestro sitio;
 * el token del agente se lo pega el servidor y nunca sale de allí.
 */
export const RUTA_ASISTENTE = "/datos/asistente";
