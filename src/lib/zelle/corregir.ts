"use server";

import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { exigirEquipoInterno, obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { correccionesPago, pagosZelle } from "@/lib/db/schema";
import { mensajes } from "@/lib/mensajes";
import { idDeRegistro, revisar } from "@/lib/validacion/acciones";
import { revisarCorreccion } from "@/lib/zelle/reglas-correccion";

/**
 * CORREGIR EL MONTO DE UN PAGO ANTES DE APROBARLO.
 *
 * ══ POR QUÉ EXISTE, CON EL CASO DELANTE (27 ago 2026) ══
 *
 * Un cobro de $2.774,04 recibió una transferencia de **$500,00**: quien pagaba
 * se equivocó de monto. La captura es legítima —ese dinero entró de verdad—
 * pero por quinientos dólares.
 *
 * El neto de un pago se calcula **al subir la captura**, a partir de lo que
 * PIDE el cobro y no de lo que LLEGÓ. Así que aprobarlo tal cual le habría
 * acreditado al comercio **$2.690,82**: $2.190 de la cuenta de Mercatren, en un
 * solo clic, sin que ninguna pantalla dijera nada. No había forma de arreglarlo
 * desde el panel — solo aprobar por el monto equivocado o rechazar un pago que
 * de verdad se hizo.
 *
 * ══ CORREGIR Y APROBAR SON DOS ACTOS SEPARADOS, A PROPÓSITO ══
 *
 * Esta función **no aprueba nada**: deja el pago pendiente con los números
 * correctos. Aprobar sigue siendo el mismo botón de siempre, con sus alertas y
 * su candado. Juntarlos haría que un solo clic cambiara un monto y moviera
 * dinero a la vez, que es justo lo que no se puede revisar después.
 *
 * ══ Y NO CIERRA LA FACTURA ══
 *
 * Al aprobar, un cobro que recibió menos de lo que pide **se queda abierto**:
 * el comercio cobró quinientos y le siguen debiendo el resto. Eso lo decide
 * `alcanzaParaCerrar`, en las reglas puras.
 */
export type ResultadoDeCorreccion =
  | { ok: true; mensaje: string; netoCentavos: number }
  | { ok: false; mensaje: string };

export async function corregirMontoDePago(
  id: string,
  montoRealCentavos: number,
  motivo: string,
): Promise<ResultadoDeCorreccion> {
  const t = await mensajes();

  try {
    await exigirEquipoInterno();
  } catch {
    return { ok: false, mensaje: t("panel.correccion.sinPermiso") };
  }

  /* Se comprueba ANTES de tocar la base: esto reescribe el número del que sale
     el dinero que se le acredita a un comercio. */
  const revisado = revisar(idDeRegistro, id);
  if (!revisado.ok)
    return { ok: false, mensaje: t("panel.zelle.pagoNoExiste") };
  id = revisado.datos;

  const db = getDb();
  const usuario = await obtenerUsuario();

  /* Se nombran las columnas, nunca `.select()` a secas: una columna nueva en
     el esquema que la base de producción no tenga tumbaría esta pantalla. */
  const [pago] = await db
    .select({
      id: pagosZelle.id,
      estado: pagosZelle.estado,
      tipo: pagosZelle.tipo,
      montoCentavos: pagosZelle.montoCentavos,
    })
    .from(pagosZelle)
    .where(eq(pagosZelle.id, id))
    .limit(1);

  if (!pago) return { ok: false, mensaje: t("panel.zelle.pagoNoExiste") };

  /* Un pago ya revisado no se toca: su dinero ya se movió. Si hay que
     arreglarlo, eso es una devolución, no una corrección. */
  if (pago.estado !== "pendiente") {
    return { ok: false, mensaje: t("panel.correccion.yaRevisado") };
  }
  if (pago.tipo !== "entrada") {
    return { ok: false, mensaje: t("panel.zelle.soloEntradas") };
  }

  const calculo = revisarCorreccion({
    montoDeclaradoCentavos: pago.montoCentavos,
    montoRealCentavos,
    motivo,
  });
  if (!calculo.ok) {
    return { ok: false, mensaje: t(`panel.correccion.${calculo.aviso}`) };
  }

  const { montoCentavos, comisionCentavos, netoCentavos } = calculo.datos;

  /**
   * TODO EN UN SOLO ENVÍO, Y EL ESTADO SE VUELVE A COMPROBAR DENTRO.
   *
   * Entre leer el pago y escribirlo puede entrar un validador y aprobarlo. Sin
   * el `estado = 'pendiente'` en el WHERE, la corrección caería sobre un pago
   * ya acreditado y los números dejarían de cuadrar con el dinero que salió.
   */
  await db.batch([
    db
      .update(pagosZelle)
      .set({ montoCentavos, comisionCentavos, netoCentavos })
      .where(and(eq(pagosZelle.id, id), eq(pagosZelle.estado, "pendiente"))),
    db.insert(correccionesPago).values({
      id: `corr-${nanoid(14)}`,
      pagoZelleId: id,
      montoDeclaradoCentavos: pago.montoCentavos,
      montoRealCentavos: montoCentavos,
      motivo: calculo.datos.motivo,
      corregidoPor: usuario?.id ?? null,
      corregidoPorNombre: usuario?.name ?? null,
    }),
  ]);

  revalidatePath("/[locale]/panel", "layout");

  return {
    ok: true,
    mensaje: t("panel.correccion.listo"),
    netoCentavos,
  };
}
