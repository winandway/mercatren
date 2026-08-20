import { and, eq, inArray } from "drizzle-orm";

import { motivoLimpio, sePuedeAnular } from "@/lib/cobros/anular";
import { getDb } from "@/lib/db";
import {
  anulacionesCobro,
  cobrosSolicitados,
  sociosTienda,
} from "@/lib/db/schema";
import {
  hashDeToken,
  igualesEnTiempoConstante,
  tokenDeLaPeticion,
} from "@/lib/socios/token";

/**
 * APAGAR UN COBRO QUE YA NO VA.
 *
 *   POST /datos/socios/cobro/anular
 *   Authorization: Bearer <token de la tienda>
 *   { "referencia": "VIG-02497-A1", "motivo": "el correo estaba mal escrito" }
 *
 * ══ EL CASO REAL QUE LO PIDIÓ (20 ago 2026) ══
 *
 * El cobro `VIG-02497-A1` salió hacia `hernandezbleider@gmai.com` — falta la
 * «l» de gmail. El correo no existe, así que el enlace nació muerto **y seguía
 * vivo y cobrable hasta vencer**. No había forma de apagarlo.
 *
 * Y los otros dos casos pasan igual de seguido: el cliente pagó en efectivo o
 * por Zelle mientras el enlace andaba dando vueltas —si después alguien lo abre
 * y lo paga, pagó dos veces— o se equivocaron de monto, de cliente o de
 * factura.
 *
 * ══ EL ESTADO SE LLAMA `cancelado`, NO `anulado` ══
 *
 * El comercio pidió `anulado`. Aquí se devuelve **`cancelado`**, que es el que
 * ya existía en el proyecto y el que la página de pago ya sabía dibujar. Se
 * les avisó expresamente: inventar una segunda palabra para el mismo estado es
 * como empiezan los fallos que nadie encuentra — un día alguien compara contra
 * la que no es, y el cobro sigue cobrable creyendo que está apagado.
 */
function error(estado: number, clave: string, extra?: unknown) {
  return Response.json({ error: clave, ...(extra ?? {}) }, { status: estado });
}

export async function POST(peticion: Request) {
  const token = tokenDeLaPeticion(peticion);
  if (!token) return error(401, "sin_token");

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await peticion.json()) as Record<string, unknown>;
  } catch {
    return error(400, "cuerpo_invalido");
  }

  const db = getDb();

  const hash = await hashDeToken(token);
  const [vinculo] = await db
    .select({
      tiendaId: sociosTienda.tiendaId,
      tokenHash: sociosTienda.tokenHash,
    })
    .from(sociosTienda)
    .where(eq(sociosTienda.tokenHash, hash))
    .limit(1);

  if (!vinculo || !igualesEnTiempoConstante(vinculo.tokenHash, hash)) {
    return error(401, "token_invalido");
  }

  const referencia = String(cuerpo.referencia ?? "").trim();
  if (!referencia) return error(400, "referencia_requerida");

  /**
   * SE BUSCA DENTRO DE LA TIENDA DEL TOKEN, SIEMPRE.
   *
   * Sin ese filtro, un comercio podría apagarle un cobro a otro escribiendo su
   * referencia — y las referencias son cortas y adivinables. A quien no le
   * corresponde se le devuelve **404**: ni siquiera se le confirma que exista.
   */
  const [cobro] = await db
    .select({
      id: cobrosSolicitados.id,
      enlace: cobrosSolicitados.enlace,
      estado: cobrosSolicitados.estado,
      montoCentavos: cobrosSolicitados.montoCentavos,
    })
    .from(cobrosSolicitados)
    .where(
      and(
        eq(cobrosSolicitados.tiendaId, vinculo.tiendaId),
        eq(cobrosSolicitados.referencia, referencia),
      ),
    )
    .limit(1);

  if (!cobro) return error(404, "no_existe");

  const url = new URL(peticion.url);
  const respuesta = {
    id: cobro.id,
    referencia,
    estado: "cancelado" as const,
    monto_centavos: cobro.montoCentavos,
    url: `${url.origin}/es/cobro/${cobro.enlace}`,
  };

  const decision = sePuedeAnular(cobro.estado);

  /* Ya estaba cancelado: 200, no error. Es idempotente a propósito — un doble
     clic no puede parecer un fallo, o quien lo pulsó se queda dudando de si de
     verdad se apagó. */
  if (!decision.sePuede && decision.yaEstaba) {
    return Response.json(respuesta);
  }

  if (!decision.sePuede) {
    /* Un pagado no se cancela: taparía dinero que ya entró y dejaría al
       cliente sin comprobante de lo que pagó. Si hay que devolvérselo, eso es
       una devolución y tiene su propio camino. */
    return error(409, "no_anulable", { estado: cobro.estado });
  }

  const ahora = new Date();

  /**
   * EL ESTADO SE VUELVE A COMPROBAR DENTRO DEL `WHERE`, Y NO ANTES.
   *
   * Entre la lectura de arriba y esta escritura puede entrar el pago del
   * cliente. Sin esta segunda comprobación, un cobro que acaba de pagarse
   * quedaría marcado como cancelado: el comercio dejaría de verlo y el dinero
   * estaría en la cuenta sin que nadie lo asocie a nada.
   *
   * Es el mismo candado que ya lleva `/reactivar`, y el comercio lo pidió
   * nombrándolo así.
   */
  const cambiados = await db
    .update(cobrosSolicitados)
    .set({ estado: "cancelado" })
    .where(
      and(
        eq(cobrosSolicitados.id, cobro.id),
        inArray(cobrosSolicitados.estado, ["abierto", "vencido"]),
      ),
    )
    .returning({ id: cobrosSolicitados.id });

  if (cambiados.length === 0) {
    /* Alguien ganó la carrera. Si fue el pago, esto es un 409 correcto; si fue
       otra cancelación simultánea, la fila ya quedó cancelada y el siguiente
       intento devuelve 200 por la rama de arriba. */
    const [ahoraEsta] = await db
      .select({ estado: cobrosSolicitados.estado })
      .from(cobrosSolicitados)
      .where(eq(cobrosSolicitados.id, cobro.id))
      .limit(1);

    if (ahoraEsta?.estado === "cancelado") return Response.json(respuesta);
    return error(409, "no_anulable", { estado: ahoraEsta?.estado ?? null });
  }

  /**
   * LA BITÁCORA VA DESPUÉS Y EN SU PROPIO `try`.
   *
   * Lo que de verdad importa es que el enlace quede apagado. Si esta anotación
   * falla, el cobro ya está cancelado y lo único que se pierde es saber por
   * qué — molesto, pero infinitamente menos que dejar vivo un enlace que
   * alguien podría pagar.
   */
  try {
    await db
      .insert(anulacionesCobro)
      .values({
        cobroId: cobro.id,
        motivo: motivoLimpio(cuerpo.motivo),
        origen: "socio",
        anuladoEn: ahora,
      })
      .onConflictDoNothing();
  } catch (fallo) {
    console.error("[cobro] no se pudo anotar la anulación:", fallo);
  }

  return Response.json(respuesta);
}
