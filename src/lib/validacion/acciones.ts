import { z } from "zod";

/**
 * LAS PIEZAS CON LAS QUE SE VALIDA LO QUE ENTRA A UNA ACCIÓN DE SERVIDOR.
 *
 * ══ POR QUÉ EXISTE (12 ago 2026) ══
 *
 * El blindaje de agosto dejó escrita esta deuda: de los archivos con acciones
 * de servidor, la mayoría **no valida nada**. Todas exigen sesión y rol, así
 * que no están abiertas a cualquiera — pero una vez dentro, un dato mal formado
 * llega hasta la base, y entre esas acciones están aprobar un pago, pedir un
 * retiro y acreditar un cobro.
 *
 * ══ NO ES `zod` SUELTO EN CADA ARCHIVO, A PROPÓSITO ══
 *
 * Escrito quince veces por separado, a la tercera hay tres criterios distintos
 * de qué es un identificador válido. Es la misma razón por la que las casillas
 * del sitio pasan todas por `campos.ts`: una regla por tipo de dato, escrita
 * una sola vez.
 *
 * ══ LOS AVISOS VIAJAN COMO CLAVE, NO COMO FRASE ══
 *
 * Igual que en `campos.ts`. El panel se ve en dos idiomas y el esquema no sabe
 * en cuál está mirando quien lo usa; la frase se arma con `mensajes()` en el
 * sitio donde se devuelve.
 */

/**
 * Un identificador de la base.
 *
 * Los genera `nanoid()` —letras, números, guion y guion bajo— y algunos vienen
 * del histórico con prefijos como `tienda-bley-ferreteria`. Se acota el juego
 * de caracteres a propósito: un identificador es algo que se compara, nunca
 * algo que se interpreta, y aceptar comillas o barras es abrirle la puerta a
 * quien las quiera meter en una consulta.
 */
export const idDeRegistro = z
  .string()
  .trim()
  .min(1, "identificadorObligatorio")
  .max(64, "identificadorLargo")
  .regex(/^[A-Za-z0-9_-]+$/, "identificadorRaro");

/**
 * El número de pedido que se ve en pantalla: `MT-000002`.
 *
 * Se valida con su forma y no como texto libre porque es lo que llega desde la
 * dirección del navegador, donde cualquiera escribe lo que quiera.
 */
export const numeroDePedido = z
  .string()
  .trim()
  .regex(/^MT-\d{1,12}$/i, "numeroDePedidoRaro");

/**
 * El motivo con que se rechaza algo.
 *
 * Mínimo de verdad, no de trámite: este texto se lo lleva el comprador en un
 * correo, y «no» no le explica nada ni le dice qué corregir. El tope alto es
 * para que quepa una explicación de verdad sin que quepa un libro.
 */
export const motivoEscrito = z
  .string()
  .trim()
  .min(5, "motivoCorto")
  .max(500, "motivoLargo");

/**
 * Un monto escrito por una persona, en dólares.
 *
 * Se acepta con coma o con punto porque las dos formas se escriben de verdad
 * según el teclado y el país. Rechazar un monto bien escrito es de los errores
 * más caros: el comercio ya vendió y no puede cobrar.
 */
export const montoEnDolares = z
  .string()
  .trim()
  .min(1, "montoObligatorio")
  .regex(/^\d{1,9}([.,]\d{1,2})?$/, "montoRaro");

/** Lo que devuelve una comprobación, para no repetir el `if` en cada acción. */
export type Revisado<T> = { ok: true; datos: T } | { ok: false; aviso: string };

/**
 * Pasa un valor por su esquema y devuelve el PRIMER aviso, no la lista entera.
 *
 * Enseñar cinco errores a la vez hace que no se lea ninguno; y en una acción de
 * servidor el aviso cabe en una línea, no en un formulario.
 */
export function revisar<T>(esquema: z.ZodType<T>, valor: unknown): Revisado<T> {
  const salida = esquema.safeParse(valor);

  if (salida.success) return { ok: true, datos: salida.data };

  return {
    ok: false,
    aviso: salida.error.issues[0]?.message ?? "revisaLosDatos",
  };
}
