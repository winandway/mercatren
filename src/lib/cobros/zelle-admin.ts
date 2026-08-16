"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { esSoporteDeVerdad } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { configuracion, zelleCobrosTienda } from "@/lib/db/schema";
import { mensajes } from "@/lib/mensajes";

/**
 * EL CONTROL DE ZELLE EN LOS ENLACES DE COBRO. Solo el rol `soporte`.
 *
 * ══ POR QUÉ SOPORTE Y NO TODO EL EQUIPO ══
 *
 * Esto decide POR DÓNDE puede entrar el dinero de cada comercio y desde qué
 * monto. Un validador aprueba pagos; decidir las reglas del cobro es otra
 * silla. Y se comprueba con `esSoporteDeVerdad()`, que ignora el disfraz de
 * «ver su panel»: el alcance prestado jamás puede cambiar configuración.
 *
 * ══ EL MONTO VIAJA EN DÓLARES Y SE GUARDA EN CENTAVOS ══
 *
 * La casilla del panel se escribe en dólares porque así piensa quien la llena.
 * La conversión va con `toPrecision`, la misma del cobro: `45.90 * 100` da
 * 4589.999… en coma flotante y ese centavo aparece después en una decisión de
 * mínimo que no cuadra.
 */

type Resultado = { ok: boolean; mensaje: string };

const LLAVE_MINIMO_GLOBAL = "zelle_cobros_minimo_centavos";

function aCentavos(texto: string): number | null {
  const limpio = texto.trim().replace(",", ".");
  if (!limpio) return null;
  const valor = Number(limpio);
  if (!Number.isFinite(valor) || valor < 0) return Number.NaN;
  /* Tope de cordura: un mínimo de un millón de dólares es un dedo de más,
     no una política. */
  if (valor > 1_000_000) return Number.NaN;
  return Math.round(Number((valor * 100).toPrecision(12)));
}

/** El mínimo general, para las tiendas que no tengan uno propio. */
export async function guardarMinimoGlobalZelle(
  formulario: FormData,
): Promise<Resultado> {
  const t = await mensajes();
  if (!(await esSoporteDeVerdad())) {
    return { ok: false, mensaje: t("sinPermiso") };
  }

  const centavos = aCentavos(String(formulario.get("minimo") ?? ""));
  if (centavos === null || Number.isNaN(centavos)) {
    return { ok: false, mensaje: t("zelleCobros.montoInvalido") };
  }

  const db = getDb();
  await db
    .insert(configuracion)
    .values({ clave: LLAVE_MINIMO_GLOBAL, valor: String(centavos) })
    .onConflictDoUpdate({
      target: configuracion.clave,
      set: { valor: String(centavos) },
    });

  revalidatePath("/[locale]/panel/configuracion", "page");
  return { ok: true, mensaje: t("zelleCobros.guardado") };
}

/** El interruptor y el mínimo propio de UNA tienda. */
export async function guardarZelleDeTienda(
  formulario: FormData,
): Promise<Resultado> {
  const t = await mensajes();
  if (!(await esSoporteDeVerdad())) {
    return { ok: false, mensaje: t("sinPermiso") };
  }

  const tiendaId = String(formulario.get("tienda") ?? "").trim();
  if (!tiendaId || tiendaId.length > 80) {
    return { ok: false, mensaje: t("zelleCobros.tiendaInvalida") };
  }

  const habilitado = formulario.get("habilitado") === "si";

  /* Casilla vacía = usa el general (null). Un cero escrito = sin mínimo, que
     es una decisión distinta y se respeta. */
  const textoMinimo = String(formulario.get("minimo") ?? "");
  const minimoCentavos = aCentavos(textoMinimo);
  if (Number.isNaN(minimoCentavos)) {
    return { ok: false, mensaje: t("zelleCobros.montoInvalido") };
  }

  const db = getDb();
  await db
    .insert(zelleCobrosTienda)
    .values({
      tiendaId,
      habilitado,
      minimoCentavos,
      actualizadoEn: new Date(),
    })
    .onConflictDoUpdate({
      target: zelleCobrosTienda.tiendaId,
      set: {
        habilitado,
        minimoCentavos,
        actualizadoEn: new Date(),
      },
    });

  revalidatePath("/[locale]/panel/configuracion", "page");
  return { ok: true, mensaje: t("zelleCobros.guardado") };
}

/** Lo que la pantalla necesita para dibujar la sección. */
export async function estadoZelleCobros(): Promise<{
  minimoGlobalCentavos: number | null;
  tiendas: Array<{
    tiendaId: string;
    nombre: string;
    habilitado: boolean;
    minimoCentavos: number | null;
  }>;
} | null> {
  if (!(await esSoporteDeVerdad())) return null;

  const db = getDb();
  const { sociosTienda, tiendas } = await import("@/lib/db/schema");

  const [global] = await db
    .select({ valor: configuracion.valor })
    .from(configuracion)
    .where(eq(configuracion.clave, LLAVE_MINIMO_GLOBAL))
    .limit(1);

  /* Las tiendas que usan la API de cobros (las vinculadas), no las 25 del
     catálogo: Zelle en el enlace solo existe para quien manda enlaces. */
  const vinculadas = await db
    .selectDistinct({
      tiendaId: sociosTienda.tiendaId,
      nombre: tiendas.nombre,
    })
    .from(sociosTienda)
    .innerJoin(tiendas, eq(tiendas.id, sociosTienda.tiendaId));

  const config = await db
    .select({
      tiendaId: zelleCobrosTienda.tiendaId,
      habilitado: zelleCobrosTienda.habilitado,
      minimoCentavos: zelleCobrosTienda.minimoCentavos,
    })
    .from(zelleCobrosTienda);

  const porTienda = new Map(config.map((c) => [c.tiendaId, c]));
  const minimoGlobal = global ? Number.parseInt(global.valor, 10) : null;

  return {
    minimoGlobalCentavos: Number.isFinite(minimoGlobal) ? minimoGlobal : null,
    tiendas: vinculadas.map((v) => ({
      tiendaId: v.tiendaId,
      nombre: v.nombre,
      habilitado: Boolean(porTienda.get(v.tiendaId)?.habilitado),
      minimoCentavos: porTienda.get(v.tiendaId)?.minimoCentavos ?? null,
    })),
  };
}
