"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { obtenerAlcance } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { ordenesCompra } from "@/lib/db/schema";
import { avisoDeCampo } from "@/lib/mensajes";
import { CAMPOS } from "@/lib/validacion/campos";
import { subirDocumento } from "@/lib/subidas";

/**
 * EL COMERCIO ADJUNTA SU FACTURA CONTRA UNA ORDEN DE COMPRA.
 *
 * Esta es la mitad del modelo que no podemos generar nosotros: la factura de
 * compra la emite el comercio. Aquí se guarda contra su orden, y con eso el
 * par queda completo — sin ella, quedaría una entrada de dinero sin una compra
 * que la respalde, que es justo lo que no puede pasar.
 *
 * ══ QUIÉN PUEDE ══
 *
 * La orden se busca **filtrando por el comercio del alcance**, no por el id
 * que llegue del formulario. Un vendedor no puede tocar la orden de otro
 * aunque mande su id a mano: la consulta sencillamente no la encuentra.
 *
 * ══ NO SE PISA UNA FACTURA YA SUBIDA ══
 *
 * Si la orden ya está facturada, no se reemplaza en silencio. Reemplazar un
 * documento contable sin dejar rastro es lo que no se hace: si de verdad hay
 * que corregir, lo resuelve el equipo.
 */

const ESQUEMA = z.object({
  ordenId: z.string().min(1),
  numero: CAMPOS.alfanumerico.esquema,
});

export type ResultadoAdjuntar = { ok: true } | { ok: false; mensaje: string };

export async function adjuntarFacturaDeCompra(
  _previo: unknown,
  datos: FormData,
): Promise<ResultadoAdjuntar> {
  const alcance = await obtenerAlcance().catch(() => null);
  if (!alcance) return { ok: false, mensaje: "Entra para hacer esto." };

  const analisis = ESQUEMA.safeParse({
    ordenId: String(datos.get("ordenId") ?? ""),
    numero: String(datos.get("numero") ?? "").trim(),
  });

  if (!analisis.success) {
    const primero = analisis.error.issues[0];
    return { ok: false, mensaje: await avisoDeCampo(primero?.message) };
  }

  const { ordenId, numero } = analisis.data;
  const db = getDb();

  /* La condición del comercio va DENTRO de la búsqueda, no después: si el
     alcance es de una tienda, una orden de otra no aparece. */
  const [orden] = await db
    .select({
      id: ordenesCompra.id,
      tiendaId: ordenesCompra.tiendaId,
      yaTiene: ordenesCompra.facturaProveedorClave,
    })
    .from(ordenesCompra)
    .where(
      and(
        eq(ordenesCompra.id, ordenId),
        alcance.tipo === "tienda"
          ? eq(ordenesCompra.tiendaId, alcance.tiendaId)
          : undefined,
      ),
    )
    .limit(1);

  if (!orden) return { ok: false, mensaje: "No encontramos esa orden." };

  if (orden.yaTiene) {
    return {
      ok: false,
      mensaje:
        "Esa orden ya tiene su factura. Si hay que corregirla, escríbenos.",
    };
  }

  const subida = await subirDocumento(
    datos.get("archivo"),
    `facturas-compra/${orden.tiendaId}`,
  );

  if (!subida.ok) return { ok: false, mensaje: subida.mensaje };

  await db
    .update(ordenesCompra)
    .set({
      facturaProveedorNumero: numero,
      facturaProveedorClave: subida.clave,
      estado: "facturada",
      facturadaEn: new Date(),
    })
    /* El estado va en el WHERE: si dos envíos entraron a la vez, el segundo no
       encuentra nada que actualizar y no pisa al primero. */
    .where(
      and(eq(ordenesCompra.id, orden.id), eq(ordenesCompra.estado, "emitida")),
    );

  revalidatePath("/[locale]/panel/ordenes-compra", "page");
  return { ok: true };
}
