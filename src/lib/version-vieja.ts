/**
 * CUANDO LA PESTAÑA SE QUEDÓ EN LA VERSIÓN ANTERIOR.
 *
 * ══ QUÉ PASA ══
 *
 * Cada vez que se publica, Next le pone un identificador nuevo a cada acción de
 * servidor — es una firma del código. Una pestaña abierta desde **antes** del
 * despliegue sigue teniendo los identificadores viejos, y al pulsar un botón le
 * pide al servidor una acción que ahí ya no existe:
 *
 *   UnrecognizedActionError: Server Action "4021..." was not found on the server
 *
 * No es un fallo del código ni de la base. Es una pestaña vieja hablando con un
 * servidor nuevo, y le pasa a cualquiera que tenga el panel abierto mientras se
 * publica — que es exactamente lo que hace el equipo todo el día.
 *
 * ══ POR QUÉ NO BASTA CON ENSEÑAR EL ERROR ══
 *
 * Porque ese texto no le dice nada a nadie, y lo que hay que hacer —recargar—
 * no se le ocurre a quien lo lee. Peor: parece que el botón está roto, y el
 * trabajo se detiene ahí.
 *
 * ══ SE RECARGA UNA SOLA VEZ ══
 *
 * Con la página nueva cargada, la acción vuelve a existir y el botón funciona.
 * La marca en `sessionStorage` es lo que impide el bucle: si después de recargar
 * el error se repite, ya NO es una versión vieja —es un fallo de verdad— y
 * entonces sí se enseña. Una página que se recarga sola en bucle es peor que el
 * error original.
 */

/** La marca que impide recargar dos veces por lo mismo. */
const MARCA = "mercatren:recargado-por-version-vieja";
/** Dos recargas dentro de este rato son un bucle, no dos publicaciones. */
export const BUCLE_MS = 60_000;

/**
 * ¿Este fallo es «la acción ya no existe»?
 *
 * Se mira el texto porque Next no exporta un tipo para distinguirlo. Se
 * comprueban las dos formas en que aparece —el nombre del error y el mensaje—
 * para que un cambio de redacción de su parte no deje esto sin funcionar.
 */
export function esVersionVieja(fallo: unknown): boolean {
  const texto =
    fallo instanceof Error
      ? `${fallo.name} ${fallo.message}`
      : String(fallo ?? "");

  return (
    /UnrecognizedActionError/i.test(texto) ||
    /Server Action .* was not found/i.test(texto) ||
    /failed-to-find-server-action/i.test(texto)
  );
}

/**
 * Recarga la página si el fallo es de versión vieja.
 *
 * Devuelve `true` si se encargó del asunto (y por tanto quien llama no tiene
 * que enseñar ningún mensaje), y `false` si es un fallo de verdad que hay que
 * mostrar.
 */
export function recargarSiEsVersionVieja(fallo: unknown): boolean {
  if (typeof window === "undefined") return false;
  if (!esVersionVieja(fallo)) return false;

  try {
    /* ══ LA MARCA CADUCA (2 sep 2026) ══ Era «para siempre»: bastaba una
       recarga por una publicación de la tarde para que, a la publicación
       siguiente, la misma pestaña enseñara el error en vez de recargar. El
       dueño lo vio en rojo dos veces en una noche de cuatro publicaciones.
       La marca solo tiene que evitar un BUCLE de recargas: si la anterior
       fue hace menos de un minuto, esto no es versión vieja y se enseña; si
       fue hace más, es otra publicación y se recarga otra vez. */
    const anterior = Number(window.sessionStorage.getItem(MARCA));
    if (Number.isFinite(anterior) && Date.now() - anterior < BUCLE_MS) {
      window.sessionStorage.removeItem(MARCA);
      return false;
    }
    window.sessionStorage.setItem(MARCA, String(Date.now()));
  } catch {
    /* Sin sessionStorage —navegación privada, permisos— se recarga igual: es
       mejor una recarga de más que un botón que no responde. */
  }

  window.location.reload();
  return true;
}

/** Se llama al terminar bien: la siguiente vez vuelve a haber una oportunidad. */
export function olvidarRecarga() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(MARCA);
  } catch {
    /* Da igual: la marca solo evita un bucle. */
  }
}
