/**
 * ¿ESTE CORREO PUEDE RECIBIR DE VERDAD?
 *
 * ══ EL PROBLEMA (14 ago 2026) ══
 *
 * Cualquiera podía registrarse con un correo inventado. Nunca recibía la
 * bienvenida, ni el aviso de su compra, ni el enlace para recuperar la clave —
 * y del lado de la base quedaba una cuenta que no sirve para nada. Es un
 * usuario basura y, casi siempre, un cliente perdido: alguien que se equivocó
 * al escribir y no se enteró.
 *
 * ══ LAS TRES CAPAS, Y POR QUÉ EN ESTE ORDEN ══
 *
 * 1. **Dominios de ejemplo.** `example.com` y compañía existen para poner en
 *    manuales; ninguno recibe correo. Es la lista más segura de todas.
 * 2. **Correos temporales.** Funcionan de verdad, pero se autodestruyen en
 *    diez minutos. Aceptarlos es abrir una cuenta a la que mañana no se le
 *    puede avisar nada.
 * 3. **Y el DNS**, que es la que de verdad importa, porque las dos listas
 *    siempre se quedan cortas: los dominios inventados son infinitos. Vive en
 *    `dns-correo.ts` porque necesita red; aquí solo está lo que se decide sin
 *    salir a preguntar.
 *
 * ══ LO QUE ESTO NO INTENTA HACER ══
 *
 * Los dominios que imitan a los grandes —`gmial.com`, `hotmial.com`— existen y
 * tienen servidor de correo, así que pasan. **Y está bien que pasen.** Cazarlos
 * por parecido significaría rechazar dominios legítimos que se parecen a otro,
 * y rechazar a un cliente real es mucho más caro que dejar entrar un correo que
 * de todos modos se queda sin confirmar.
 */

/** Dominios reservados para ejemplos y documentación. Ninguno recibe correo. */
export const DOMINIOS_DE_EJEMPLO = new Set([
  "example.com",
  "example.org",
  "example.net",
  "example.edu",
  "test.com",
  "test.test",
  "invalid",
  "localhost",
  "ejemplo.com",
  "ejemplo.org",
  "ejemplo.net",
  "prueba.com",
  "pruebas.com",
  "dominio.com",
]);

/** Buzones que se autodestruyen. Existen, pero mañana ya no. */
export const DOMINIOS_TEMPORALES = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "yopmail.com",
  "sharklasers.com",
  "getnada.com",
  "trashmail.com",
  "maildrop.cc",
  "dispostable.com",
  "fakeinbox.com",
  "mohmal.com",
  "emailondeck.com",
  "spamgourmet.com",
  "mailnesia.com",
  "tempr.email",
  "discard.email",
  "moakt.com",
  "tmpmail.org",
  "bevriz.com",
]);

/**
 * El motivo del rechazo. Es una CLAVE, no una frase: el sitio es bilingüe y la
 * frase la pone la pantalla. Además así se puede guardar en la base y contar
 * cuántos rechazos hubo de cada tipo.
 */
export type MotivoRechazo =
  | "correoDeEjemplo"
  | "correoTemporal"
  | "correoSinServidor"
  | "correoMalEscrito";

export type Veredicto =
  | { ok: true; dominio: string }
  | { ok: false; motivo: MotivoRechazo; dominio: string };

/**
 * El dominio de un correo, en minúsculas.
 *
 * Devuelve `null` si no hay forma de sacarlo — sin arroba, con dos, o con el
 * lado derecho vacío. Eso ya lo comprueba `zod` antes, pero esta función no
 * puede dar por hecho por dónde la llaman.
 */
export function dominioDe(correo: string): string | null {
  const partes = correo.trim().toLowerCase().split("@");
  if (partes.length !== 2) return null;
  const dominio = partes[1]?.trim();
  return dominio || null;
}

/**
 * Lo que se decide SIN salir a la red.
 *
 * Se resuelve aquí lo que se pueda para no gastar una consulta de DNS —y dos
 * segundos de la vida de quien se está registrando— en un `example.com` que ya
 * sabemos que no existe.
 */
export function revisarPorLista(correo: string): Veredicto {
  const dominio = dominioDe(correo);
  if (!dominio) {
    return { ok: false, motivo: "correoMalEscrito", dominio: "" };
  }

  if (DOMINIOS_DE_EJEMPLO.has(dominio)) {
    return { ok: false, motivo: "correoDeEjemplo", dominio };
  }

  if (DOMINIOS_TEMPORALES.has(dominio)) {
    return { ok: false, motivo: "correoTemporal", dominio };
  }

  /**
   * Un dominio sin punto no puede existir en Internet — `root@localhost`,
   * `a@intranet`. Se atrapa aquí porque preguntarle al DNS por algo así es
   * gastar la consulta para nada.
   */
  if (!dominio.includes(".")) {
    return { ok: false, motivo: "correoDeEjemplo", dominio };
  }

  return { ok: true, dominio };
}
