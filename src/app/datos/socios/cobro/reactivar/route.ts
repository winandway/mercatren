import { and, eq } from "drizzle-orm";

import { venceEn } from "@/lib/cobros/reglas";
import { getDb } from "@/lib/db";
import { cobrosSolicitados } from "@/lib/db/schema";
import {
  hashDeToken,
  igualesEnTiempoConstante,
  tokenDeLaPeticion,
} from "@/lib/socios/token";
import { sociosTienda } from "@/lib/db/schema";

/**
 * REVIVIR UN COBRO VENCIDO, CON SU MISMA REFERENCIA.
 *
 * ══ POR QUÉ HACE FALTA (19 ago 2026) ══
 *
 * Lo pidió el comercio piloto con el motivo exacto: hoy, cuando un enlace se
 * vence, hay que crear otro — y eso obliga a cambiar la referencia
 * (`VIG-02497-A1` → `A2`). **Eso ensucia la conciliación**: en el extracto
 * parecen dos cobros distintos cuando es el mismo abono, y quien cuadra las
 * cuentas a fin de mes tiene que ir a mano a decidir cuál es cuál.
 *
 * ══ SE CONSERVA TAMBIÉN EL ENLACE, Y ESO ES LO MEJOR DE TODO ══
 *
 * No solo la referencia: **la misma dirección**. Así el correo que se mandó
 * hace cuatro días vuelve a funcionar, y muchas veces **no hay que volver a
 * escribirle al cliente**. Eso era lo caro: «cada vez que hay que volver a
 * escribirle, se pierden cobros».
 *
 *   POST /datos/socios/cobro/reactivar
 *   Authorization: Bearer <token de la tienda>
 *   { "referencia": "VIG-02497-A1", "dias": 7 }
 *
 * ══ UN COBRO PAGADO NO REVIVE NUNCA ══
 *
 * Solo se reactiva lo que está `abierto`. Revivir uno pagado sería abrirle la
 * puerta a que el cliente pague dos veces la misma factura, y esa segunda vez
 * se devuelve con una disculpa y una comisión perdida.
 */
function error(estado: number, clave: string) {
  return Response.json({ error: clave }, { status: estado });
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
   * Sin ese filtro, un comercio podría reactivar el cobro de otro escribiendo
   * su referencia — y las referencias son cortas y adivinables.
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

  /**
   * `abierto` ES LO ÚNICO QUE REVIVE.
   *
   * Un pagado volvería a cobrarse. Y un CANCELADO tampoco revive, que es lo
   * que pidió el comercio al abrir `/anular` (20 ago 2026): cancelar es
   * decidir que ese cobro no va, y revivirlo por esta otra puerta lo desharía
   * sin que nadie lo pida — justo el enlace que se apagó porque el correo
   * estaba mal escrito volvería a quedar cobrable.
   *
   * No hizo falta agregar nada: exigir `abierto` ya lo deja fuera. Queda
   * escrito aquí para que nadie lo relaje pensando que «vencido y cancelado
   * son parecidos».
   */
  if (cobro.estado !== "abierto") {
    return Response.json(
      { error: "no_reactivable", estado: cobro.estado },
      { status: 409 },
    );
  }

  const ahora = new Date();
  const vence = venceEn(ahora, cuerpo.dias);

  /**
   * EL ESTADO SE COMPRUEBA OTRA VEZ DENTRO DEL `WHERE`.
   *
   * Entre la lectura de arriba y esta escritura puede entrar el pago del
   * cliente. Sin esta segunda comprobación, un cobro que acaba de pagarse
   * volvería a quedar vivo para pagarse de nuevo.
   */
  const cambiados = await db
    .update(cobrosSolicitados)
    .set({ venceEn: vence })
    .where(
      and(
        eq(cobrosSolicitados.id, cobro.id),
        eq(cobrosSolicitados.estado, "abierto"),
      ),
    )
    .returning({ id: cobrosSolicitados.id });

  if (cambiados.length === 0) {
    return Response.json({ error: "no_reactivable" }, { status: 409 });
  }

  return Response.json({
    id: cobro.id,
    /* El MISMO enlace: el correo que ya se mandó vuelve a funcionar. */
    enlace: cobro.enlace,
    url: `${new URL(peticion.url).origin}/es/cobro/${cobro.enlace}`,
    referencia,
    estado: "abierto",
    vence_en: vence.toISOString(),
    monto_centavos: cobro.montoCentavos,
  });
}
