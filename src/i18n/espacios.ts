/**
 * ESPACIOS DE TRADUCCIÓN QUE NO VIAJAN AL NAVEGADOR en las páginas públicas.
 *
 * Sin esta lista, el paquete COMPLETO de textos va embebido en cada página:
 * 65 KB por idioma, de los cuales el panel solo son 31. Un cliente que entra
 * a mirar un taladro descargaba y procesaba todos los textos del panel de
 * administración y de los correos del sistema — la mitad del paquete, para
 * pantallas que jamás va a ver. En un celular eso es pantalla en blanco de
 * más.
 *
 * - `panel`: sus componentes de navegador viven solo bajo /panel, y el layout
 *   del panel re-provee los mensajes completos ahí adentro.
 * - `correos`: se usan únicamente del lado del servidor, al armar los envíos.
 *   No hay ningún componente de navegador que los lea.
 *
 * `tests/unit/mensajes-cliente.test.ts` vigila que esto siga siendo verdad:
 * si un componente de navegador fuera del panel usa uno de estos espacios,
 * la prueba falla ANTES de que la pantalla salga con las claves crudas.
 */
export const ESPACIOS_QUE_NO_VIAJAN = ["panel", "correos"] as const;
