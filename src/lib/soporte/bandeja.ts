/**
 * LA BANDEJA DE SOPORTE DE WINDOCE: EL FORMULARIO DE AYUDA (1 nov 2026).
 *
 * Decisión de Richard, «plan mixto»: en la web sigue a la vista el correo de
 * Mercatren (`CORREO_CONTACTO`, nunca uno @windoce.com: ver
 * `correo/direcciones.ts`), y ADEMÁS el formulario de ayuda manda cada
 * mensaje directo a la bandeja única de soporte de Windoce, con la etiqueta
 * de Mercatren. Así un cliente llega aunque algún día se deje de pagar el
 * correo de Mercatren.
 *
 * La bandeja acepta el origen mercatren.com, deja 5 mensajes por hora por IP
 * y trae una trampa para robots (`sitio_web`, que una persona deja vacía).
 * Esto es lo puro: el cuerpo y cómo se lee la respuesta.
 */

export const URL_BANDEJA_SOPORTE =
  "https://soporte-windoce.sitios.dev/datos/contacto";

export type CamposDeAyuda = {
  nombre: string;
  email: string;
  asunto: string;
  mensaje: string;
  /** La trampa para robots: una persona no la ve ni la llena. */
  sitio_web?: string;
};

export function cuerpoDeAyuda(campos: CamposDeAyuda, idioma: string) {
  return {
    app: "mercatren",
    nombre: campos.nombre.trim().slice(0, 120),
    email: campos.email.trim().slice(0, 200),
    asunto: campos.asunto.trim().slice(0, 200),
    mensaje: campos.mensaje.trim().slice(0, 4000),
    idioma: idioma === "en" ? "en" : "es",
    sitio_web: (campos.sitio_web ?? "").trim(),
  };
}

export type ResultadoAyuda =
  { ok: true } | { ok: false; motivo: "demasiados" | "fallo" | "sinConexion" };

/**
 * Manda el mensaje. SOLO es «enviado» si la bandeja lo confirma: el
 * formulario no borra lo escrito hasta ver este `ok: true` (regla global de
 * los formularios). El `fetch` se recibe para poder probarlo sin red.
 */
export async function enviarAyuda(
  campos: CamposDeAyuda,
  idioma: string,
  pedir: typeof fetch = fetch,
): Promise<ResultadoAyuda> {
  let respuesta: Response;
  try {
    respuesta = await pedir(URL_BANDEJA_SOPORTE, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(cuerpoDeAyuda(campos, idioma)),
    });
  } catch {
    /* `fetch` también se cae así cuando la BANDEJA no contesta (apagada, o
       sin permiso para este origen). «No hay conexión» solo si el teléfono de
       verdad no tiene internet; si no, la culpa es nuestra y se dice así. */
    const sinInternet =
      typeof navigator !== "undefined" && navigator.onLine === false;
    return { ok: false, motivo: sinInternet ? "sinConexion" : "fallo" };
  }
  if (respuesta.status === 429) return { ok: false, motivo: "demasiados" };
  if (!respuesta.ok) return { ok: false, motivo: "fallo" };
  const datos = (await respuesta.json().catch(() => null)) as {
    ok?: boolean;
  } | null;
  return datos?.ok === false ? { ok: false, motivo: "fallo" } : { ok: true };
}
