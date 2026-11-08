/**
 * CJ DROPSHIPPING, RETIRADO (5 nov 2026, orden de Richard; interruptor del
 * 8 nov 2026).
 *
 * Mercatren dejó de trabajar con CJ: su catálogo, sus tiendas y sus llaves se
 * borraron el 5 nov. Pero el vigilante seguía probando la conexión y mandaba
 * «La conexión con CJ no responde (sin_llave)» cada vez que corría. Richard:
 * «el sistema debería saber que no estamos trabajando con esa empresa; si no
 * hay conexión, no deberían llegar correos».
 *
 * Mientras esto sea `true`: la salud del proveedor dice «retirado» sin llamar a
 * CJ, el vigilante no avisa nada de CJ (conexión, puntos, importaciones) y no
 * intenta ninguna acción contra CJ. Los pedidos viejos de CJ siguen en la base,
 * intactos. Candado: `tests/unit/cj-retirado.test.ts`.
 */
export const CJ_RETIRADO = true;
