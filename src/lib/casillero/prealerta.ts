"use server";

import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { obtenerUsuario } from "@/lib/autorizacion";
import { casilleroDe } from "@/lib/casillero/crear";
import {
  detectarCarrier,
  normalizarTracking,
  trackingPlausible,
} from "@/lib/casillero/tracking";
import { getDb } from "@/lib/db";
import { prealertas } from "@/lib/db/schema";

/**
 * ══ «AVÍSAME QUE COMPRASTE» ══
 *
 * Es la pista más fuerte para saber de quién es una caja, porque la puso el
 * propio cliente ANTES de que llegara: en la cadena de matching vale 100 y
 * se asigna sola. Sin prealerta hay que esperar a que el lector saque el
 * código de la etiqueta, y si la tienda lo recortó, a huérfanos.
 *
 * Por eso el formulario pide poco y no exige la guía: una prealerta sin
 * guía todavía sirve —cruza por comercio y remitente— y pedir un dato que
 * el cliente no tiene a mano es una prealerta que no se escribe.
 */
export async function avisarCompra(
  _previo: { error?: string; ok?: boolean } | null,
  formulario: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const usuario = await obtenerUsuario();
  if (!usuario) return { error: "sesion" };

  const casillero = await casilleroDe(usuario.id);
  if (!casillero) return { error: "sin-casillero" };

  const descripcion = String(formulario.get("descripcion") ?? "").trim();
  if (descripcion.length < 3) return { error: "descripcion" };

  const valor = Number(String(formulario.get("valor") ?? "").replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0) return { error: "valor" };

  const trackingCrudo = String(formulario.get("tracking") ?? "").trim();
  /* Una guía mal escrita es peor que ninguna: no cruza, y el cliente cree
     que sí. Si no es plausible se guarda la prealerta SIN guía y se le
     dice, en vez de aceptarla en silencio. */
  if (trackingCrudo && !trackingPlausible(trackingCrudo)) {
    return { error: "tracking" };
  }
  const tracking = trackingCrudo ? normalizarTracking(trackingCrudo) : null;

  try {
    await getDb()
      .insert(prealertas)
      .values({
        id: nanoid(),
        casilleroId: casillero.id,
        tracking,
        carrier: tracking ? detectarCarrier(tracking) : null,
        comercio: String(formulario.get("comercio") ?? "").trim() || null,
        descripcion,
        cantidad: Math.max(1, Number(formulario.get("cantidad")) || 1),
        valorCentavos: Math.round(valor * 100),
        origen: "manual",
        estado: "abierta",
        creadoEn: new Date(),
      });
    return { ok: true };
  } catch (fallo) {
    console.error("[casillero] no se pudo guardar la prealerta:", fallo);
    return { error: "fallo" };
  }
}

/** Lo que el cliente anunció y todavía no llega. */
export async function misPrealertas(casilleroId: string) {
  return getDb()
    .select({
      id: prealertas.id,
      tracking: prealertas.tracking,
      comercio: prealertas.comercio,
      descripcion: prealertas.descripcion,
      valorCentavos: prealertas.valorCentavos,
      estado: prealertas.estado,
      creadoEn: prealertas.creadoEn,
    })
    .from(prealertas)
    .where(
      and(
        eq(prealertas.casilleroId, casilleroId),
        eq(prealertas.estado, "abierta"),
      ),
    )
    .orderBy(desc(prealertas.creadoEn))
    .limit(50)
    .catch(() => []);
}
