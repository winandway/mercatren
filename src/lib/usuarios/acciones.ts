"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { mensajes } from "@/lib/mensajes";
import { idDeRegistro, revisar } from "@/lib/validacion/acciones";

/**
 * CAMBIARLE EL CORREO A UNA CUENTA, DESDE EL PANEL.
 *
 * ══ POR QUÉ HACÍA FALTA (13 ago 2026) ══
 *
 * Los primeros comercios los dimos de alta nosotros, y les pusimos un correo
 * NUESTRO. El resultado es que el comercio **no puede entrar ni recuperar su
 * contraseña**: el enlace de recuperación llega a un buzón que él no maneja.
 * Le pasó a Ferremateriales Bley y le va a pasar a todos los que demos de alta
 * así.
 *
 * El panel enseñaba el correo de la cuenta y no dejaba cambiarlo. La única
 * salida era escribir a mano en la base de producción, que es justo la clase de
 * cosa que no debe hacerse a mano.
 *
 * ══ LA CONTRASEÑA NO SE PIERDE, Y ESO SE COMPROBÓ ══
 *
 * Better Auth guarda la credencial con `account_id = id del usuario`, no con el
 * correo. Cambiar `user.email` deja la contraseña intacta: la persona entra con
 * su correo nuevo y la misma clave de siempre. Si la credencial estuviera
 * atada al correo, esto la dejaría fuera de su propia cuenta.
 *
 * ══ SOLO SOPORTE ══
 *
 * No es una tarea operativa: es cambiar **quién puede entrar** a una cuenta.
 * Un validador trabaja la cola de pagos; esto no le toca. Y por descontado,
 * nadie desde fuera del equipo.
 */

type Resultado = { ok: boolean; mensaje: string };

/**
 * El correo, con la misma regla que el resto del sitio.
 *
 * Se guarda en minúsculas a propósito: Better Auth y el límite de intentos
 * comparan así, y `Correo@X.com` guardado con mayúsculas es una cuenta que
 * después no entra con lo que la persona escribe.
 */
const correoDeCuenta = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, "correoInvalido")
  .max(160, "correoInvalido")
  .email("correoInvalido");

export async function cambiarCorreoDeCuenta(
  formulario: FormData,
): Promise<Resultado> {
  const t = await mensajes();

  const quien = await obtenerUsuario();
  if (quien?.rol !== "soporte") {
    return { ok: false, mensaje: t("soloSoporte") };
  }

  const revisadoId = revisar(idDeRegistro, formulario.get("usuarioId"));
  if (!revisadoId.ok) return { ok: false, mensaje: t(revisadoId.aviso) };

  const revisadoCorreo = revisar(correoDeCuenta, formulario.get("correo"));
  if (!revisadoCorreo.ok) {
    return { ok: false, mensaje: t(revisadoCorreo.aviso) };
  }

  const usuarioId = revisadoId.datos;
  const correo = revisadoCorreo.datos;

  const db = getDb();

  const [cuenta] = await db
    .select({ id: user.id, correoActual: user.email, nombre: user.name })
    .from(user)
    .where(eq(user.id, usuarioId))
    .limit(1);

  if (!cuenta) return { ok: false, mensaje: t("cuentaNoExiste") };
  if (cuenta.correoActual.toLowerCase() === correo) {
    return { ok: false, mensaje: t("correoEsElMismo") };
  }

  /* Dos cuentas con el mismo correo dejan a las dos sin poder entrar: el
     sistema no sabría a cuál se refiere quien escribe esa dirección. */
  const [ocupado] = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.email, correo), ne(user.id, usuarioId)))
    .limit(1);

  if (ocupado) return { ok: false, mensaje: t("correoYaEnUso") };

  await db
    .update(user)
    .set({
      email: correo,
      /**
       * VUELVE A «SIN VERIFICAR», Y ES LO CORRECTO.
       *
       * La dirección nueva no la ha probado nadie todavía. No le impide
       * entrar —el sitio no exige el correo verificado para eso— pero deja
       * escrito lo que de verdad se sabe, que es nada.
       */
      emailVerified: false,
      updatedAt: new Date(),
    })
    .where(eq(user.id, usuarioId));

  /**
   * SE LE AVISA A LAS DOS DIRECCIONES.
   *
   * A la nueva, para que sepa que ya es la suya —y de paso comprueba que
   * recibe de verdad, que es justo lo que se está arreglando—. A la vieja,
   * porque si este cambio no lo pidió nadie, es la única forma de enterarse.
   *
   * Va en su propio `try`: un correo que no sale jamás puede deshacer un
   * cambio que ya está guardado.
   */
  try {
    const { correoCambioDeCorreo } = await import("@/lib/correo/correos");
    await correoCambioDeCorreo({
      nombre: cuenta.nombre,
      correoNuevo: correo,
      correoAnterior: cuenta.correoActual,
      quienLoCambio: quien.name,
    });
  } catch (fallo) {
    console.error("[usuarios] correo cambiado; el aviso no salio:", fallo);
  }

  revalidatePath("/[locale]/panel", "layout");
  return { ok: true, mensaje: t("correoCambiado", { correo }) };
}
