"use server";

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { obtenerAlcance } from "@/lib/autorizacion";
import { avisarAlComercio } from "@/lib/cobros/aviso-al-comercio";
import { getDb } from "@/lib/db";
import { webhooksTienda } from "@/lib/db/schema";
import { mensajes } from "@/lib/mensajes";

/**
 * GUARDAR Y PROBAR EL AVISO AL SISTEMA DEL COMERCIO.
 *
 * La tienda sale del ALCANCE de la sesión, nunca del formulario: nadie
 * configura el aviso de otro. La dirección tiene que ser **https**: por ahí
 * viaja el importe de una venta.
 */
export type ResultadoAviso =
  | { ok: true; mensaje: string; secreto?: string }
  | { ok: false; mensaje: string };

export async function guardarAvisoDePagos(
  formulario: FormData,
): Promise<ResultadoAviso> {
  const t = await mensajes();
  const alcance = await obtenerAlcance().catch(() => null);
  if (!alcance || alcance.tipo !== "tienda")
    return { ok: false, mensaje: t("cuentaSinComercio") };

  const url = String(formulario.get("url") ?? "").trim();
  const activo = formulario.get("activo") === "on";

  if (url && !/^https:\/\/[^\s]+$/i.test(url)) {
    return { ok: false, mensaje: t("avisoPagos.urlInvalida") };
  }

  const db = getDb();
  const [actual] = await db
    .select({
      tiendaId: webhooksTienda.tiendaId,
      secreto: webhooksTienda.secreto,
    })
    .from(webhooksTienda)
    .where(eq(webhooksTienda.tiendaId, alcance.tiendaId))
    .limit(1);

  /* Sin dirección se apaga, no se borra: así el secreto sobrevive y no hay que
     volver a configurar el otro lado si mañana se vuelve a encender. */
  if (!url) {
    if (actual) {
      await db
        .update(webhooksTienda)
        .set({ activo: false })
        .where(eq(webhooksTienda.tiendaId, alcance.tiendaId));
    }
    revalidatePath("/[locale]/panel/mi-tienda", "page");
    return { ok: true, mensaje: t("avisoPagos.apagado") };
  }

  if (actual) {
    await db
      .update(webhooksTienda)
      .set({ url, activo })
      .where(eq(webhooksTienda.tiendaId, alcance.tiendaId));
    revalidatePath("/[locale]/panel/mi-tienda", "page");
    return { ok: true, mensaje: t("guardadoCorto") };
  }

  /* El secreto se genera UNA vez y se enseña UNA vez: es lo que su
     programador necesita para comprobar la firma. */
  const secreto = `whsec_${nanoid(32)}`;
  await db.insert(webhooksTienda).values({
    tiendaId: alcance.tiendaId,
    url,
    secreto,
    activo,
    creadoEn: new Date(),
  });
  revalidatePath("/[locale]/panel/mi-tienda", "page");
  return { ok: true, mensaje: t("guardadoCorto"), secreto };
}

/**
 * Manda un aviso DE PRUEBA a la dirección configurada y dice qué contestó.
 * Sin esto, el comercio se entera de que su dirección está mal el día que
 * pierde un pago. La referencia va marcada como prueba para que su sistema no
 * la confunda con una factura real.
 */
export async function probarAvisoDePagos(): Promise<ResultadoAviso> {
  const t = await mensajes();
  const alcance = await obtenerAlcance().catch(() => null);
  if (!alcance || alcance.tipo !== "tienda")
    return { ok: false, mensaje: t("cuentaSinComercio") };

  await avisarAlComercio({
    tiendaId: alcance.tiendaId,
    referencia: "PRUEBA-MERCATREN",
    metodo: "tarjeta",
    montoCentavos: 100,
    netoCentavos: 97,
    moneda: "USD",
    pagoId: "prueba",
  });

  const [estado] = await getDb()
    .select({
      ultimoOkEn: webhooksTienda.ultimoOkEn,
      ultimoError: webhooksTienda.ultimoError,
    })
    .from(webhooksTienda)
    .where(eq(webhooksTienda.tiendaId, alcance.tiendaId))
    .limit(1);

  revalidatePath("/[locale]/panel/mi-tienda", "page");
  if (estado?.ultimoError) {
    return {
      ok: false,
      mensaje: t("avisoPagos.falloLaPrueba", { motivo: estado.ultimoError }),
    };
  }
  return { ok: true, mensaje: t("avisoPagos.pruebaOk") };
}
