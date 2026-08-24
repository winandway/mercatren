import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { webhooksTienda } from "@/lib/db/schema";
import { firmar } from "@/lib/cobros/firma";

/**
 * EL AVISO AL SISTEMA DEL COMERCIO CUANDO ENTRA UN PAGO.
 *
 * Su sistema hizo la factura y creó el cobro; esto le dice «te pagaron» sin
 * que tenga que estar preguntando cada minuto. Va firmado, y **nunca** puede
 * tumbar la acreditación: se llama al final, dentro de su propio try.
 *
 * ══ LA FIRMA NO ES UN ADORNO ══
 *
 * Sin ella, cualquiera que averigüe la dirección del comercio podría decirle
 * que le pagaron una factura y su sistema la marcaría cobrada. Se firma el
 * cuerpo con HMAC-SHA256 y el secreto que solo tienen los dos, y va la fecha
 * dentro del cuerpo para que un envío viejo no se pueda repetir a discreción.
 */
export type PagoAvisado = {
  tiendaId: string;
  referencia: string;
  /** `tarjeta` o `zelle`: el comercio concilia distinto según cuál. */
  metodo: "tarjeta" | "zelle";
  montoCentavos: number;
  /** Lo que se le acredita a él, ya sin el margen de Mercatren. */
  netoCentavos: number;
  moneda: string;
  referenciaDeuda?: string | null;
  pagoId?: string | null;
};

const TIEMPO_MAXIMO_MS = 8000;

export async function avisarAlComercio(pago: PagoAvisado): Promise<void> {
  const db = getDb();
  const [destino] = await db
    .select({
      url: webhooksTienda.url,
      secreto: webhooksTienda.secreto,
      activo: webhooksTienda.activo,
    })
    .from(webhooksTienda)
    .where(eq(webhooksTienda.tiendaId, pago.tiendaId))
    .limit(1);

  /* Sin dirección configurada no hay nada que hacer, y no es un error. */
  if (!destino || !destino.activo || !destino.url) return;

  const cuerpo = JSON.stringify({
    evento: "cobro.pagado",
    version: 1,
    enviado_en: new Date().toISOString(),
    referencia: pago.referencia,
    referencia_deuda: pago.referenciaDeuda ?? null,
    metodo: pago.metodo,
    monto_centavos: pago.montoCentavos,
    neto_centavos: pago.netoCentavos,
    moneda: pago.moneda,
    pago_id: pago.pagoId ?? null,
  });

  let ok = false;
  let error: string | null = null;
  try {
    const firma = await firmar(cuerpo, destino.secreto);
    const respuesta = await fetch(destino.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-mercatren-evento": "cobro.pagado",
        "x-mercatren-firma": firma,
      },
      body: cuerpo,
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    });
    ok = respuesta.ok;
    if (!ok) error = `HTTP ${respuesta.status}`;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  /* Se anota SIEMPRE, salga bien o mal: un aviso que falla en silencio es
     peor que no tenerlo — el comercio cree que su sistema está al día y no lo
     está. En su panel ve la fecha del último envío y el motivo del último
     fallo. */
  try {
    await db
      .update(webhooksTienda)
      .set({
        ultimoIntentoEn: new Date(),
        ...(ok
          ? { ultimoOkEn: new Date(), ultimoError: null }
          : { ultimoError: error }),
      })
      .where(eq(webhooksTienda.tiendaId, pago.tiendaId));
  } catch {
    /* Ni esto puede tumbar la acreditación. */
  }
}
