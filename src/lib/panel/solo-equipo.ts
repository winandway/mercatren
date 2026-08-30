/**
 * QUÉ SECCIONES DEL PANEL SON SOLO DEL EQUIPO DE MERCATREN — la parte pura.
 *
 * ══ POR QUÉ HACE FALTA UNA LISTA ══
 *
 * El menú ya sabía ocultar lo que un comercio no debe ver, pero **ocultar no
 * es cerrar**: escribiendo la dirección a mano se entraba igual. Y en el modo
 * «ver el panel como este comercio» ni siquiera se ocultaba — el menú miraba
 * el ROL de la sesión, que sigue siendo `soporte`, así que Soporte veía el
 * panel de un comercio con su propio menú completo encima.
 *
 * Palabras del dueño, y describen exactamente el riesgo: *«estoy viendo la
 * cuenta del superadmin entrando como cliente… hasta usted se puede
 * equivocar»*.
 *
 * ══ QUÉ SE CIERRA Y POR QUÉ ══
 *
 * No es una lista de secciones «internas» abstractas: es lo que **no existe**
 * en el panel de un comercio. Ahí adentro hay:
 *
 *   · los enlaces que cobran de NUESTRA tarjeta (pedidos al proveedor),
 *   · el costo real de la mercancía, del que sale el margen,
 *   · los datos y el dinero de TODOS los demás comercios,
 *   · las cuentas y los permisos de todo el sistema.
 *
 * ══ POR QUÉ VIVE APARTE Y ES PURA ══
 *
 * La usan tres sitios que no se pueden llamar entre sí: el middleware (que
 * corre en el borde y no puede tocar la base), el menú (que es un componente
 * de cliente) y las pantallas. Con la lista escrita tres veces, la próxima
 * sección se olvida en dos de ellas.
 */

/**
 * Los tramos del panel que solo ve el equipo de Mercatren.
 *
 * Se comparan por TRAMO COMPLETO, nunca por prefijo de texto: `/panel/tiendas`
 * y `/panel/tiendas-usa` empiezan igual, y con un `startsWith` a secas cerrar
 * una cerraría la otra sin que nadie se diera cuenta.
 */
export const TRAMOS_SOLO_EQUIPO = [
  "tiendas",
  "tiendas-usa",
  "cuentas",
  "usuarios",
  "configuracion",
  "diccionario",
  "banners",
  "busquedas-imagen",
  "trafico",
  "catalogo-usa",
  "proveedor",
  "validacion",
] as const;

/**
 * ¿Esta dirección del panel es solo del equipo?
 *
 * Recibe la ruta completa (`/es/panel/tiendas/algo`) y devuelve si el tramo que
 * viene justo después de `/panel/` está en la lista.
 */
export function esRutaSoloEquipo(ruta: string): boolean {
  const tramo = tramoDelPanel(ruta);
  return (
    tramo !== null && (TRAMOS_SOLO_EQUIPO as readonly string[]).includes(tramo)
  );
}

/** El primer tramo después de `/panel/`, o null si la ruta no es del panel. */
export function tramoDelPanel(ruta: string): string | null {
  /* Se parte por `/` y se busca el trozo siguiente a «panel». Así da igual el
     idioma que venga delante y no hace falta conocer la lista de idiomas
     aquí. */
  const partes = ruta.split("?")[0]!.split("/").filter(Boolean);
  const i = partes.indexOf("panel");
  if (i === -1) return null;
  return partes[i + 1] ?? null;
}
