"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { obtenerAlcance } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { formulariosFiscales, tiendas } from "@/lib/db/schema";

import {
  DECLARACION_ES,
  estadoFiscal,
  loQueFalta,
  pareceApartadoPostal,
  TIPOS_DE_ENTIDAD,
  venceEl,
  type DatosW8,
  type EstadoFiscal,
  type TipoDeEntidad,
} from "./w8bene";

/**
 * GUARDAR EL FORMULARIO FISCAL DE UN COMERCIO.
 *
 * ══ LO FIRMA EL COMERCIO, NO NOSOTROS ══
 *
 * La tienda sale del ALCANCE de la sesión, nunca de lo que venga en el
 * formulario. Un comercio solo puede firmar el suyo, y el equipo de Mercatren
 * no puede firmar por nadie: sería falsificar una declaración jurada.
 *
 * ══ Y SE GUARDA LO QUE HACE VÁLIDA LA FIRMA ══
 *
 * Fecha, hora, desde dónde, y el texto exacto de la declaración que se le
 * enseñó. Sin eso el formulario no vale, y lo peor es que no se nota hasta que
 * alguien lo pide.
 */

export type ResultadoFiscal =
  | { ok: true }
  | { ok: false; faltan?: string[]; motivo?: string };

export async function guardarFormularioFiscal(
  _previo: unknown,
  datos: FormData,
): Promise<ResultadoFiscal> {
  /* CON `.catch`, y no a pelo: si la cuenta no tiene comercio asignado esto
     lanza, y una acción de servidor que lanza le revienta el formulario al
     cliente sin decir nada. Hay una prueba del proyecto que lo exige. */
  const alcance = await obtenerAlcance().catch(() => null);

  /* SOLO EL PROPIO COMERCIO. Ni el equipo firma por él: esto es una
     declaración bajo pena de perjurio y la firma tiene que ser suya. */
  if (!alcance || alcance.tipo !== "tienda") {
    return { ok: false, motivo: "solo-el-comercio" };
  }

  const texto = (clave: string) => String(datos.get(clave) ?? "").trim();
  const opcional = (clave: string) => texto(clave) || null;

  const tipo = texto("tipoEntidad") as TipoDeEntidad;
  const valores: Partial<DatosW8> = {
    nombreLegal: texto("nombreLegal"),
    paisConstitucion: texto("paisConstitucion").toUpperCase(),
    tipoEntidad: TIPOS_DE_ENTIDAD.includes(tipo) ? tipo : undefined,
    direccion: texto("direccion"),
    ciudad: texto("ciudad"),
    region: opcional("region"),
    codigoPostal: opcional("codigoPostal"),
    identificacionFiscal: opcional("identificacionFiscal"),
    firmanteNombre: texto("firmanteNombre"),
    firmanteCargo: texto("firmanteCargo"),
  };

  const faltan = loQueFalta(valores);
  if (faltan.length > 0) return { ok: false, faltan };

  if (pareceApartadoPostal(valores.direccion!)) {
    return { ok: false, motivo: "apartado-postal" };
  }

  /* LA CASILLA DE FIRMA ES OBLIGATORIA Y SE COMPRUEBA AQUÍ.
     En la pantalla es una casilla que se puede saltar abriendo la consola; lo
     que hace válida la firma es esta comprobación del servidor. */
  if (datos.get("firma") !== "si") {
    return { ok: false, motivo: "sin-firmar" };
  }

  const ahora = new Date();
  const db = getDb();

  await db
    .insert(formulariosFiscales)
    .values({
      tiendaId: alcance.tiendaId,
      nombreLegal: valores.nombreLegal!,
      paisConstitucion: valores.paisConstitucion!,
      tipoEntidad: valores.tipoEntidad!,
      direccion: valores.direccion!,
      ciudad: valores.ciudad!,
      region: valores.region ?? null,
      codigoPostal: valores.codigoPostal ?? null,
      identificacionFiscal: valores.identificacionFiscal ?? null,
      firmanteNombre: valores.firmanteNombre!,
      firmanteCargo: valores.firmanteCargo!,
      firmadoEn: ahora,
      firmadoDesde: await direccionDeQuienFirma(),
      /* El texto EXACTO que se le enseñó. Si mañana cambia, quien firmó hoy
         tiene que poder demostrar qué aceptó. */
      declaracion: DECLARACION_ES,
      venceEn: venceEl(ahora),
    })
    .onConflictDoUpdate({
      target: formulariosFiscales.tiendaId,
      set: {
        nombreLegal: valores.nombreLegal!,
        paisConstitucion: valores.paisConstitucion!,
        tipoEntidad: valores.tipoEntidad!,
        direccion: valores.direccion!,
        ciudad: valores.ciudad!,
        region: valores.region ?? null,
        codigoPostal: valores.codigoPostal ?? null,
        identificacionFiscal: valores.identificacionFiscal ?? null,
        firmanteNombre: valores.firmanteNombre!,
        firmanteCargo: valores.firmanteCargo!,
        firmadoEn: ahora,
        firmadoDesde: await direccionDeQuienFirma(),
        declaracion: DECLARACION_ES,
        venceEn: venceEl(ahora),
      },
    });

  revalidatePath("/[locale]/panel", "layout");
  return { ok: true };
}

/** Desde dónde se firmó. Parte de la prueba, no un dato de más. */
async function direccionDeQuienFirma(): Promise<string | null> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    return h.get("cf-connecting-ip") ?? h.get("x-forwarded-for") ?? null;
  } catch {
    return null;
  }
}

/** En qué situación fiscal está una tienda. Para el panel y para el candado. */
export async function situacionFiscal(
  tiendaId: string,
): Promise<EstadoFiscal & { datos?: DatosGuardados | null }> {
  const db = getDb();

  const [tienda] = await db
    .select({ pais: tiendas.paisOrigen })
    .from(tiendas)
    .where(eq(tiendas.id, tiendaId))
    .limit(1);

  const [f] = await db
    .select({
      nombreLegal: formulariosFiscales.nombreLegal,
      paisConstitucion: formulariosFiscales.paisConstitucion,
      tipoEntidad: formulariosFiscales.tipoEntidad,
      direccion: formulariosFiscales.direccion,
      ciudad: formulariosFiscales.ciudad,
      region: formulariosFiscales.region,
      codigoPostal: formulariosFiscales.codigoPostal,
      identificacionFiscal: formulariosFiscales.identificacionFiscal,
      firmanteNombre: formulariosFiscales.firmanteNombre,
      firmanteCargo: formulariosFiscales.firmanteCargo,
      firmadoEn: formulariosFiscales.firmadoEn,
      declaracion: formulariosFiscales.declaracion,
      venceEn: formulariosFiscales.venceEn,
    })
    .from(formulariosFiscales)
    .where(eq(formulariosFiscales.tiendaId, tiendaId))
    .limit(1);

  const estado = estadoFiscal(tienda?.pais ?? null, f?.venceEn ?? null, new Date());
  return { ...estado, datos: f ?? null };
}

export type DatosGuardados = {
  nombreLegal: string;
  paisConstitucion: string;
  tipoEntidad: string;
  direccion: string;
  ciudad: string;
  region: string | null;
  codigoPostal: string | null;
  identificacionFiscal: string | null;
  firmanteNombre: string;
  firmanteCargo: string;
  firmadoEn: Date;
  declaracion: string;
  venceEn: Date;
};
