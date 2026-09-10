"use server";

import { desc, eq } from "drizzle-orm";

import { esSoporteDeVerdad, obtenerUsuario } from "@/lib/autorizacion";
import type { TarifaPais } from "@/lib/casillero/cotizar";
import { getDb } from "@/lib/db";
import { tarifasCasillero } from "@/lib/db/schema";

/**
 * ══ LAS TARIFAS LAS PONE UNA PERSONA, DESDE EL PANEL ══
 *
 * Richard, 9 sep 2026: _«son datos sensibles que requieren de estudio, de
 * investigar, de preguntar»_. Y cambian con el combustible, con la aduana y
 * con lo que cobre el agente de carga: cada cambio no puede ser una
 * publicación del sitio.
 *
 * Lo hace `esSoporteDeVerdad` y no `esEquipoInterno`: cambiar lo que se le
 * cobra a un cliente no es algo que se haga desde el disfraz de «ver el
 * panel de un comercio».
 */

const numero = (v: FormDataEntryValue | null, porDefecto = 0): number => {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : porDefecto;
};
/** Los dólares que escribe una persona, a centavos enteros. */
const aCentavos = (v: FormDataEntryValue | null): number =>
  Math.round(numero(v) * 100);

export async function guardarTarifa(
  _previo: { error?: string; ok?: boolean } | null,
  formulario: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  if (!(await esSoporteDeVerdad())) return { error: "permiso" };
  const usuario = await obtenerUsuario();

  const pais = String(formulario.get("pais") ?? "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z]{2}$/.test(pais)) return { error: "pais" };

  const tarifaLibraCentavos = aCentavos(formulario.get("tarifaLibra"));
  const activa = formulario.get("activa") === "on";
  /* No se puede activar una tarifa sin precio: sería cotizar en cero. */
  if (activa && tarifaLibraCentavos <= 0) return { error: "sin-precio" };

  const fila = {
    pais,
    tarifaLibraCentavos,
    minimoLb: numero(formulario.get("minimoLb"), 1),
    minimoCobroCentavos: aCentavos(formulario.get("minimoCobro")),
    despachoCentavos: aCentavos(formulario.get("despacho")),
    /* El seguro se escribe en por ciento y se guarda en puntos base: el
       dinero de este proyecto va siempre en enteros. */
    seguroPuntosBase: Math.round(
      numero(formulario.get("seguroPorciento")) * 100,
    ),
    seguroDesdeCentavos: aCentavos(formulario.get("seguroDesde")),
    divisorVolumetrico:
      Math.round(numero(formulario.get("divisor"), 166)) || 166,
    diasAlmacenajeGratis: Math.round(numero(formulario.get("diasGratis"), 30)),
    almacenajeDiaCentavos: aCentavos(formulario.get("almacenajeDia")),
    impuestoIncluido: formulario.get("impuestoIncluido") === "on",
    activa,
    nota: String(formulario.get("nota") ?? "").trim() || null,
    actualizadoEn: new Date(),
    actualizadoPor: usuario?.id ?? null,
  };

  try {
    await getDb()
      .insert(tarifasCasillero)
      .values(fila)
      .onConflictDoUpdate({ target: tarifasCasillero.pais, set: fila });
    return { ok: true };
  } catch (fallo) {
    console.error("[casillero] no se pudo guardar la tarifa:", fallo);
    return { error: "fallo" };
  }
}

export async function listarTarifas() {
  return getDb()
    .select({
      pais: tarifasCasillero.pais,
      tarifaLibraCentavos: tarifasCasillero.tarifaLibraCentavos,
      minimoLb: tarifasCasillero.minimoLb,
      minimoCobroCentavos: tarifasCasillero.minimoCobroCentavos,
      despachoCentavos: tarifasCasillero.despachoCentavos,
      seguroPuntosBase: tarifasCasillero.seguroPuntosBase,
      seguroDesdeCentavos: tarifasCasillero.seguroDesdeCentavos,
      divisorVolumetrico: tarifasCasillero.divisorVolumetrico,
      diasAlmacenajeGratis: tarifasCasillero.diasAlmacenajeGratis,
      almacenajeDiaCentavos: tarifasCasillero.almacenajeDiaCentavos,
      impuestoIncluido: tarifasCasillero.impuestoIncluido,
      activa: tarifasCasillero.activa,
      nota: tarifasCasillero.nota,
      actualizadoEn: tarifasCasillero.actualizadoEn,
    })
    .from(tarifasCasillero)
    .orderBy(desc(tarifasCasillero.activa), tarifasCasillero.pais)
    .limit(50)
    .catch(() => []);
}

/** La tarifa de un país, para cotizar. `null` si no hay o está apagada. */
export async function tarifaDe(pais: string): Promise<TarifaPais | null> {
  const [fila] = await getDb()
    .select({
      pais: tarifasCasillero.pais,
      tarifaLibraCentavos: tarifasCasillero.tarifaLibraCentavos,
      minimoLb: tarifasCasillero.minimoLb,
      minimoCobroCentavos: tarifasCasillero.minimoCobroCentavos,
      despachoCentavos: tarifasCasillero.despachoCentavos,
      seguroPuntosBase: tarifasCasillero.seguroPuntosBase,
      seguroDesdeCentavos: tarifasCasillero.seguroDesdeCentavos,
      divisorVolumetrico: tarifasCasillero.divisorVolumetrico,
      diasAlmacenajeGratis: tarifasCasillero.diasAlmacenajeGratis,
      almacenajeDiaCentavos: tarifasCasillero.almacenajeDiaCentavos,
      impuestoIncluido: tarifasCasillero.impuestoIncluido,
      activa: tarifasCasillero.activa,
    })
    .from(tarifasCasillero)
    .where(eq(tarifasCasillero.pais, pais.toUpperCase()))
    .limit(1)
    .catch(() => []);
  return fila ?? null;
}
