import "server-only";

import { getTranslations } from "next-intl/server";

/**
 * Los avisos que devuelven las acciones del panel, en el idioma de quien las
 * usa.
 *
 * POR QUÉ HACE FALTA: el panel se ve en los dos idiomas, pero los mensajes de
 * "guardado", "no tienes permiso" o "pago aprobado" estaban escritos en
 * español dentro del código. Un banco, una aceleradora o un inversionista que
 * abra el panel en inglés se encontraba media pantalla en español justo en el
 * momento en que algo pasa — que es cuando más se mira.
 *
 * Se usa así, en cualquier acción del servidor:
 *
 *   const t = await mensajes();
 *   return { ok: false, mensaje: t("sinPermiso") };
 *
 * El idioma sale del que está navegando, sin tener que pasarlo por parámetro:
 * la dirección ya empieza por /es o /en y next-intl lo resuelve solo.
 */
export function mensajes() {
  return getTranslations("panel.mensajes");
}

/**
 * Traduce el aviso de una casilla mal llenada.
 *
 * Las reglas de `src/lib/validacion/campos.ts` no devuelven una frase, sino una
 * clave (`telefonoCaracteres`, `nombreCaracteres`). Tiene que ser así: el mismo
 * esquema corre en el navegador y en el servidor, y en el navegador no hay
 * forma de saber en qué idioma está mirando la persona.
 *
 * Aquí esa clave se convierte en la frase del idioma correcto. Si la clave no
 * está traducida se devuelve el aviso genérico, nunca la clave en crudo: leer
 * "telefonoCaracteres" en pantalla no le dice nada a nadie.
 */
export async function avisoDeCampo(clave: string | undefined): Promise<string> {
  const t = await getTranslations("formularios.errores");
  return clave && t.has(clave) ? t(clave) : t("invalido");
}
