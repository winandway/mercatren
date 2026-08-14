"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { mensajes } from "@/lib/mensajes";
import { anotarFallo, dejaIntentar } from "@/lib/seguridad/limite";
import { ipDeLaPeticion } from "@/lib/seguridad/intentos";
import { revisar } from "@/lib/validacion/acciones";

/**
 * ¿ESTE CORREO TIENE CUENTA AQUÍ?
 *
 * ══ POR QUÉ SE CAMBIÓ DE OPINIÓN (14 ago 2026) ══
 *
 * Hasta hoy la pantalla contestaba lo mismo siempre: «si esa dirección tiene
 * cuenta, ya salió el enlace». Era una defensa contra la enumeración de
 * correos — que alguien averigüe quién tiene cuenta aquí probando direcciones.
 *
 * Y le costó la cuenta a una persona de verdad. Se registró con un correo,
 * olvidó la clave, fue a recuperarla y **escribió otro correo**. La pantalla le
 * dijo que el enlace había salido con éxito. Se quedó esperando un correo que
 * nunca iba a llegar, y no tenía cómo saber que el equivocado era el que había
 * escrito.
 *
 * Decisión del dueño: **no se le miente a la gente**. Si el correo no tiene
 * cuenta, se lo decimos.
 *
 * ══ LO QUE SE PIERDE Y CÓMO SE COMPENSA ══
 *
 * Se pierde el secreto de quién tiene cuenta. Es un intercambio consciente, y
 * es el que hacen casi todas las tiendas grandes por esta misma razón.
 *
 * Lo que NO se pierde es el freno: esta puerta pasa por el mismo límite de
 * intentos que entrar —ocho por cuenta y cuarenta por dirección cada quince
 * minutos—, así que sigue sin servir para barrer una lista de correos. Y cada
 * consulta cuenta como intento, exista o no la cuenta: si solo contaran las
 * fallidas, probar mil direcciones saldría gratis mientras se acierte de vez
 * en cuando.
 *
 * ══ LO QUE ESTA FUNCIÓN NO HACE ══
 *
 * No manda el correo ni toca la contraseña. Solo contesta sí o no. El envío lo
 * sigue haciendo el sistema de cuentas, que es quien sabe firmar ese enlace.
 */

const correoValido = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, "correoInvalido")
  .max(160, "correoInvalido")
  .email("correoInvalido");

export type RespuestaRecuperar =
  | { estado: "existe" }
  | { estado: "no_existe" }
  | { estado: "invalido"; mensaje: string }
  | { estado: "demasiados"; mensaje: string };

export async function tieneCuenta(
  correoEscrito: string,
): Promise<RespuestaRecuperar> {
  const t = await mensajes();

  const revisado = revisar(correoValido, correoEscrito);
  if (!revisado.ok) {
    return { estado: "invalido", mensaje: t(revisado.aviso) };
  }
  const correo = revisado.datos;

  const cabeceras = await headers();
  const ip = ipDeLaPeticion({
    cfConnectingIp: cabeceras.get("cf-connecting-ip"),
    xForwardedFor: cabeceras.get("x-forwarded-for"),
  });

  const veredicto = await dejaIntentar(correo, ip);
  if (!veredicto.permitido) {
    return { estado: "demasiados", mensaje: t("demasiadosIntentos") };
  }

  /* Cuenta como intento SIEMPRE, acierte o no. Ver el comentario de arriba. */
  await anotarFallo(correo, ip);

  const [cuenta] = await getDb()
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, correo))
    .limit(1);

  return { estado: cuenta ? "existe" : "no_existe" };
}
