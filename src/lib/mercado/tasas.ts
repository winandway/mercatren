"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { esSoporteDeVerdad } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { configuracion } from "@/lib/db/schema";
import { mensajes } from "@/lib/mensajes";

/**
 * LA TASA DEL DÓLAR PARA CADA PAÍS: PESOS POR DÓLAR, EN CENTÉSIMAS.
 *
 * ══ POR QUÉ EN CENTÉSIMAS Y ENTERA ══
 *
 * Regla dura del proyecto: el dinero es entero, siempre. La tasa del día se
 * publica con dos decimales (967,42 pesos por dólar) y se guarda como 96742.
 * Un decimal guardado como texto tarde o temprano se parsea con la coma del
 * idioma equivocado, y una tasa leída mal multiplica el catálogo entero.
 *
 * ══ POR QUÉ LA EDITA UNA PERSONA Y NO LA TRAE UN ROBOT ══
 *
 * La norma chilena manda la tasa del Banco Central del día del cobro. Traerla
 * sola exigiría depender de un servicio ajeno en la ruta del dinero; por ahora
 * el equipo la actualiza desde Configuración —es un número al día— y el
 * automático queda para cuando el volumen lo pida. La pantalla enseña CUÁNDO
 * se actualizó por última vez: una tasa de hace dos semanas se ve, no se
 * descubre.
 *
 * ══ LAS GUARDAS SON LAS MISMAS DEL MÓDULO DE PRECIO ══
 *
 * Por debajo de 100,00 pesos por dólar no es un tipo de cambio: es un dedo de
 * menos. `precio-chile.ts` ya se niega a calcular con una tasa rota; aquí
 * además se niega a GUARDARLA, que es atajar el error un paso antes.
 */

const LLAVES = {
  CL: "dolar_clp_centesimas",
  CO: "dolar_cop_centesimas",
} as const;

const FECHAS = {
  CL: "dolar_clp_actualizado",
  CO: "dolar_cop_actualizado",
} as const;

export type PaisConTasa = keyof typeof LLAVES;

/** El piso compartido con `precio-chile.ts`: menos que esto es un tecleo. */
const TASA_MINIMA_CENTESIMAS = 10_000;

export type EstadoDeTasa = {
  pais: PaisConTasa;
  /** Centésimas de peso por dólar, o null si nunca se cargó. */
  centesimas: number | null;
  /** Cuándo se guardó por última vez, o null. */
  actualizadaEn: Date | null;
};

export async function leerTasas(): Promise<EstadoDeTasa[] | null> {
  if (!(await esSoporteDeVerdad())) return null;
  const db = getDb();

  const filas = await db
    .select({ clave: configuracion.clave, valor: configuracion.valor })
    .from(configuracion);
  const por = new Map(filas.map((f) => [f.clave, f.valor]));

  return (Object.keys(LLAVES) as PaisConTasa[]).map((pais) => {
    const crudo = Number.parseInt(por.get(LLAVES[pais]) ?? "", 10);
    const fecha = Number.parseInt(por.get(FECHAS[pais]) ?? "", 10);
    return {
      pais,
      centesimas:
        Number.isFinite(crudo) && crudo >= TASA_MINIMA_CENTESIMAS
          ? crudo
          : null,
      actualizadaEn: Number.isFinite(fecha) ? new Date(fecha * 1000) : null,
    };
  });
}

/**
 * La tasa vigente de un país, para quien calcula precios. Sin sesión: la usa
 * el importador del catálogo, que ya pasó por su propio permiso.
 */
export async function tasaVigente(pais: PaisConTasa): Promise<number | null> {
  const db = getDb();
  const [fila] = await db
    .select({ valor: configuracion.valor })
    .from(configuracion)
    .where(eq(configuracion.clave, LLAVES[pais]))
    .limit(1);
  const n = Number.parseInt(fila?.valor ?? "", 10);
  return Number.isFinite(n) && n >= TASA_MINIMA_CENTESIMAS ? n : null;
}

export async function guardarTasa(
  formulario: FormData,
): Promise<{ ok: boolean; mensaje: string }> {
  const t = await mensajes();
  if (!(await esSoporteDeVerdad())) {
    return { ok: false, mensaje: t("panel.configuracion.sinPermiso") };
  }

  const pais = String(formulario.get("pais") ?? "") as PaisConTasa;
  if (!(pais in LLAVES)) {
    return { ok: false, mensaje: t("panel.tasas.paisInvalido") };
  }

  /* Se escribe como se lee del Banco Central: «967.42». La coma también se
     acepta — es como la escribe medio continente. */
  const texto = String(formulario.get("tasa") ?? "")
    .trim()
    .replace(",", ".");
  const valor = Number(texto);
  const centesimas = Math.round(valor * 100);

  if (
    !Number.isFinite(valor) ||
    centesimas < TASA_MINIMA_CENTESIMAS ||
    /* Más de 100.000 pesos por dólar tampoco es una tasa de estos países: es
       otro dedo de más. El tope corta el error simétrico al del piso. */
    centesimas > 10_000_000
  ) {
    return { ok: false, mensaje: t("panel.tasas.tasaInvalida") };
  }

  const db = getDb();
  const ahora = String(Math.floor(Date.now() / 1000));
  await db.batch([
    db
      .insert(configuracion)
      .values({ clave: LLAVES[pais], valor: String(centesimas) })
      .onConflictDoUpdate({
        target: configuracion.clave,
        set: { valor: String(centesimas) },
      }),
    db
      .insert(configuracion)
      .values({ clave: FECHAS[pais], valor: ahora })
      .onConflictDoUpdate({
        target: configuracion.clave,
        set: { valor: ahora },
      }),
  ]);

  revalidatePath("/[locale]/panel/configuracion", "page");
  return { ok: true, mensaje: t("panel.tasas.guardada") };
}
