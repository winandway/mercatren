import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { retiros, tiendas, user } from "@/lib/db/schema";
import {
  crearDestinatario,
  mercuryConfigurado,
  solicitarEnvio,
} from "@/lib/mercury/cliente";
import {
  aDolares,
  destinatarioParaMercury,
  metodoDeMercury,
  MOTIVO_DEL_PAGO,
} from "@/lib/retiros/a-mercury";
import { paisBancario } from "@/lib/retiros/paises";

/**
 * MANDARLE EL RETIRO A MERCURY, SIN LLENAR UN SOLO FORMULARIO.
 *
 * ══ QUÉ HACE Y QUÉ NO ══
 *
 * Hace dos cosas: da de alta al comercio como destinatario y crea la
 * **solicitud de pago**. Lo que NO hace es sacar el dinero — eso lo aprueba
 * una persona dentro de Mercury, con un botón.
 *
 * No es una limitación: es el endpoint `request-send-money`, y esa aprobación
 * es justo lo que permite que esto funcione desde aquí. El endpoint que envía
 * de una exige lista blanca de IP, y el sitio corre en el borde sin IP fija;
 * este está EXENTO precisamente porque el dinero no sale solo.
 *
 * ══ POR QUÉ ESTO ESCALA Y EL FORMULARIO NO ══
 *
 * Con tres mil retiros al mes, transcribir a mano cada titular, banco, cuenta,
 * SWIFT y dirección son tres mil oportunidades de equivocarse en un dígito. Y
 * un wire mal dirigido no rebota al día siguiente: se queda dando vueltas
 * entre bancos y puede tardar semanas.
 *
 * ══ LA IDEMPOTENCIA VA POR EL ID DEL RETIRO ══
 *
 * Repetir la misma llave devuelve 409 en vez de crear un segundo pago. Es la
 * diferencia entre un reintento y pagarle dos veces al comercio.
 */

export type ResultadoEnvio =
  { ok: true; solicitudId: string | null } | { ok: false; motivo: string };

export async function enviarRetiroPorMercury(
  retiroId: string,
): Promise<ResultadoEnvio> {
  if (!mercuryConfigurado()) {
    return { ok: false, motivo: "Falta MERCURY_TOKEN en el panel del sitio." };
  }

  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const cuentaId = getCloudflareContext().env.MERCURY_CUENTA_ID?.trim();
  if (!cuentaId) {
    return {
      ok: false,
      motivo:
        "Falta MERCURY_CUENTA_ID: es la cuenta de Mercury de la que sale el dinero.",
    };
  }

  const db = getDb();

  const [retiro] = await db
    .select({
      id: retiros.id,
      estado: retiros.estado,
      forma: retiros.forma,
      montoCentavos: retiros.montoCentavos,
      destino: retiros.destino,
      referencia: retiros.referencia,
      tiendaNombre: tiendas.nombre,
      correoTienda: tiendas.correoContacto,
      correoDuenno: user.email,
    })
    .from(retiros)
    .innerJoin(tiendas, eq(tiendas.id, retiros.tiendaId))
    .leftJoin(user, eq(user.id, tiendas.propietarioId))
    .where(eq(retiros.id, retiroId))
    .limit(1);

  if (!retiro) return { ok: false, motivo: "Ese retiro no existe." };

  /* Solo lo que está esperando transferencia. Uno ya pagado o rechazado no se
     vuelve a mandar: sería pagar dos veces por la puerta de atrás. */
  if (retiro.estado !== "solicitado") {
    return {
      ok: false,
      motivo: "Este retiro ya no está esperando transferencia.",
    };
  }

  /* El traspaso entre comercios no toca el banco: se mueve dinero de una
     billetera a otra dentro de Mercatren. */
  if (retiro.forma === "comercio") {
    return {
      ok: false,
      motivo: "Este retiro va a otro comercio, no al banco.",
    };
  }

  if (!retiro.referencia) {
    /* Sin referencia no hay con qué reconocerlo en el extracto, y la
       conciliación bancaria de Mercatren LLC es estricta. */
    return { ok: false, motivo: "Este retiro no tiene referencia." };
  }

  const destino = (retiro.destino ?? {}) as Record<string, string | undefined>;
  const codigoPais = (destino.pais ?? "").trim().toUpperCase();
  const pais = paisBancario(codigoPais);
  if (!pais) {
    return { ok: false, motivo: "Este retiro no tiene país de destino." };
  }

  /* El correo del comercio, o el de su dueño. Mercury lo exige para avisarle
     al destinatario de que le llega dinero. */
  const correo = (retiro.correoTienda || retiro.correoDuenno || "").trim();
  if (!correo) {
    return {
      ok: false,
      motivo: "El comercio no tiene un correo de contacto cargado.",
    };
  }

  const datos = destinatarioParaMercury({
    codigoPais,
    cuenta: destino,
    correo,
  });
  if (!datos) {
    return {
      ok: false,
      motivo:
        "Faltan datos bancarios del comercio. Revisa el titular, la cuenta y el SWIFT.",
    };
  }

  const alta = await crearDestinatario(datos);
  if (!alta.ok) {
    return {
      ok: false,
      /* El motivo del banco, entero: un «no se pudo» obliga a adivinar entre
         un SWIFT mal escrito, un país no permitido y un permiso del token. */
      motivo: `Mercury rechazó el destinatario: ${alta.motivo}`,
    };
  }

  const envio = await solicitarEnvio(cuentaId, {
    recipientId: alta.datos.id,
    amount: aDolares(retiro.montoCentavos),
    paymentMethod: metodoDeMercury(pais),
    /* La llave es el id del retiro: reintentar devuelve 409 en vez de pagar
       dos veces. */
    idempotencyKey: retiro.id,
    purpose: MOTIVO_DEL_PAGO,
    /* Lo que verá en el extracto del comercio y en el nuestro. La
       conciliación de Mercatren LLC es estricta y esto es lo que la cuadra. */
    externalMemo: `Mercatren ${retiro.referencia}`,
    note: `Retiro de ${retiro.tiendaNombre}`,
  });

  if (!envio.ok) {
    return {
      ok: false,
      motivo: `Mercury rechazó el pago: ${envio.motivo}`,
    };
  }

  return { ok: true, solicitudId: envio.datos.id ?? null };
}
