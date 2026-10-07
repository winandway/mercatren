/**
 * LEER UNA VEZ, RECORDAR, Y REINTENTAR SI LA BASE TARDA (7 oct 2026).
 *
 * ══ EL FALLO QUE ESTO CIERRA ══
 *
 * La clave que firma las sesiones no está cargada como variable en el panel, y
 * el sitio la lee de la tabla `configuracion` **en cada visita**. Cuando la base
 * tarda, esa lectura falla y la visita entera no reconoce la sesión: en el
 * registro de fallos, `sesion/leer`, 187 veces entre el 5 sep y el 4 oct, unas
 * seis al día. Para quien estaba dentro, eso es «me sacó sin razón».
 *
 * Y de paso, una lectura de la base por cada visita es gasto de D1 que no
 * compra nada: la clave no cambia nunca.
 *
 * ══ LO QUE HACE ══
 *
 * La primera lectura buena se recuerda mientras viva el servidor; las visitas
 * siguientes ya no tocan la base. Si una lectura falla, se reintenta una vez
 * antes de rendirse. **Un fallo no se recuerda**: la próxima visita vuelve a
 * intentar, en vez de quedarse con el error para siempre.
 *
 * Es puro y genérico para poder probarlo sin base ni servidor.
 */
export function leerUnaVezYRecordar<T>(
  leer: () => Promise<T>,
  reintentos = 1,
): { obtener: () => Promise<T>; olvidar: () => void } {
  /* SE COMPARTE EL VALOR, NUNCA UNA LECTURA EN CURSO. En los Workers de
     Cloudflare una visita no puede esperar una promesa que nació en otra: si
     la primera visita termina antes, su lectura se cancela y la segunda se
     queda colgada. Por eso, mientras no hay valor recordado, cada visita lee
     por su cuenta; son unas pocas al arrancar el servidor y ninguna después. */
  let recordado: { valor: T } | null = null;

  async function conReintento(): Promise<T> {
    let ultimoFallo: unknown;
    for (let intento = 0; intento <= reintentos; intento++) {
      try {
        return await leer();
      } catch (fallo) {
        ultimoFallo = fallo;
      }
    }
    throw ultimoFallo;
  }

  return {
    async obtener() {
      if (recordado) return recordado.valor;
      const valor = await conReintento();
      recordado = { valor };
      return valor;
    },
    olvidar() {
      recordado = null;
    },
  };
}
