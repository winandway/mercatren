/**
 * EL CASILLERO, CERRADO POR AHORA (7 nov 2026, orden de Richard).
 *
 * La empresa que nos daba el casillero en Miami no tiene todos sus permisos y
 * está cerrada temporalmente. Si alguien compra y manda su paquete a esa
 * dirección, nadie lo recibe. Por eso, mientras esto sea `false`:
 *
 * - ningún botón, enlace ni recuadro del sitio ofrece el casillero;
 * - las páginas del casillero solo dicen que no está disponible, y NO enseñan
 *   la dirección de Miami a nadie, ni a quien ya tenía su casillero;
 * - no se puede crear un casillero ni avisar un paquete, ni desde el sitio ni
 *   desde el widget.
 *
 * El panel del equipo (casilleros, bodega) sigue igual: hace falta para lo que
 * ya estaba en camino. Se vuelve a abrir con una línea, cuando haya un
 * casillero que funcione, y lo decide Richard. Candado:
 * `tests/unit/casillero-cerrado.test.ts`.
 */
export const CASILLERO_ABIERTO = false;
