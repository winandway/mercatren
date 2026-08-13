/**
 * EL IDENTIFICADOR DE CONVERSACIÓN CON EL AGENTE.
 *
 * ══ QUÉ ES Y POR QUÉ IMPORTA QUE ESTÉ BIEN ══
 *
 * El agente guarda la conversación bajo el identificador que le mandemos. Dos
 * personas con el mismo identificador comparten conversación: la de una
 * aparece en la pantalla de la otra, con lo que haya preguntado sobre la
 * operación. Por eso sale del identificador de la CUENTA y no de nada que se
 * pueda escribir desde el navegador.
 *
 * ══ LO QUE ACEPTA EL AGENTE ══
 *
 * Letras, números y guiones, entre 6 y 64 caracteres. Nuestros identificadores
 * los genera `nanoid()`, que además usa **guion bajo**, y ese no entra: hay que
 * limpiarlo o el agente rechaza la petición con un identificador que a simple
 * vista parece correcto.
 *
 * Puro y con pruebas a propósito: es una regla de formato que decide de quién
 * es cada conversación.
 */

/** Lo que el agente admite. */
export const LARGO_MINIMO = 6;
export const LARGO_MAXIMO = 64;

/**
 * El identificador de la conversación de una cuenta.
 *
 * Lleva el prefijo `mercatren-` por dos razones: son diez caracteres, así que
 * el mínimo se cumple SIEMPRE por corto que sea el identificador de la cuenta
 * —y si no se cumpliera, esa persona se quedaría sin asistente sin que nadie
 * supiera por qué—; y en el panel del agente se distingue de un vistazo qué
 * conversaciones vienen de aquí.
 */
export function idDeConversacion(idCuenta: string): string | null {
  const limpio = idCuenta
    .trim()
    /* El guion bajo de nanoid y cualquier otra cosa rara pasan a guion. */
    .replace(/[^A-Za-z0-9-]/g, "-")
    /* Guiones repetidos y de los bordes: el agente los admite, pero un
       identificador con `--` al final se copia mal al depurar. */
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!limpio) return null;

  const id = `mercatren-${limpio}`.slice(0, LARGO_MAXIMO);

  /* Después de recortar puede quedar un guion al final. */
  const final = id.replace(/-+$/g, "");

  return final.length >= LARGO_MINIMO ? final : null;
}

/** ¿Este identificador lo aceptaría el agente? */
export function idValido(id: string): boolean {
  return (
    id.length >= LARGO_MINIMO &&
    id.length <= LARGO_MAXIMO &&
    /^[A-Za-z0-9-]+$/.test(id)
  );
}

/* -------------------------------------------------------------------------- */
/* Lo que contesta el agente                                                  */
/* -------------------------------------------------------------------------- */

export type ToolUsada = { nombre: string; ok: boolean };

export type RespuestaAgente = {
  respuesta: string;
  tools_usadas?: ToolUsada[];
  detenido_por?: "confirmacion" | "fallo_repetido" | "limite_iteraciones";
  pendiente_confirmacion?: { tool: string; parametros: unknown };
};

/**
 * ¿El agente está esperando que la persona confirme algo?
 *
 * **No se responde solo que sí, nunca.** Cuando el agente se detiene por una
 * confirmación es porque va a hacer algo que no se deshace —mandar un correo,
 * suspender un servicio—, y su propio texto explica qué hay que escribir: a
 * veces «sí», y si la acción es grave, el nombre exacto de lo que se va a
 * tocar. Un botón que mandara «sí» automático convertiría esa barrera en un
 * clic de más, que es justo lo que la barrera existe para impedir.
 */
export function esperaConfirmacion(r: RespuestaAgente): boolean {
  return r.detenido_por === "confirmacion";
}

/* -------------------------------------------------------------------------- */
/* Los errores                                                                */
/* -------------------------------------------------------------------------- */

export type MotivoFallo =
  | "sin_token"
  | "token_rechazado"
  | "demasiadas_peticiones"
  | "agente_sin_configurar"
  | "sin_respuesta";

/**
 * Qué significa cada código que puede devolver el agente.
 *
 * Se traduce aquí, en una función pura, y no en la pantalla: el mismo mapa lo
 * usan la ruta del servidor y la interfaz, y con dos copias se separan al
 * primer arreglo.
 */
export function motivoDelEstado(estado: number): MotivoFallo {
  if (estado === 401 || estado === 403) return "token_rechazado";
  if (estado === 429) return "demasiadas_peticiones";
  if (estado === 503) return "agente_sin_configurar";
  return "sin_respuesta";
}

/**
 * Cuántos segundos hay que esperar tras un 429.
 *
 * La cabecera viene en segundos. Si no viene o es rara se devuelve un minuto:
 * es mejor decir un número razonable que dejar a la persona probando cada dos
 * segundos y agravando el bloqueo.
 */
export function segundosDeEspera(cabecera: string | null): number {
  const n = Number((cabecera ?? "").trim());
  if (!Number.isFinite(n) || n <= 0) return 60;
  /* Un valor absurdo tampoco sirve: media hora ya es «vuelve mañana». */
  return Math.min(Math.ceil(n), 1800);
}
