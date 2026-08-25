"use server";

import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { esSoporteDeVerdad } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { seccionesVideo, videosDeSeccion } from "@/lib/db/schema";
import { mensajes } from "@/lib/mensajes";
import {
  derivarPin,
  nuevaLlaveDeSubida,
  nuevaSal,
  pinCoincide,
} from "@/lib/secciones/pin";
import {
  cookieDeSeccion,
  revisarPin,
  slugDeSeccion,
} from "@/lib/secciones/reglas";
import {
  anotarFallo,
  dejaIntentar,
  olvidarFallos,
} from "@/lib/seguridad/limite";
import { mercadoActual } from "@/lib/mercado/actual";

export type ResultadoSeccion =
  | { ok: true; mensaje: string; llave?: string }
  | { ok: false; mensaje: string };

/**
 * CREAR UNA SECCIÓN. Solo el equipo, y solo de verdad.
 *
 * `esSoporteDeVerdad()` y no `esEquipoInterno()`: quien está mirando el panel
 * de un comercio con el disfraz de «ver su panel» no crea canales de Mercatren.
 */
export async function crearSeccion(datos: FormData): Promise<ResultadoSeccion> {
  const t = await mensajes();
  if (!(await esSoporteDeVerdad().catch(() => false))) {
    return { ok: false, mensaje: t("sinPermiso") };
  }

  const nombreEs = String(datos.get("nombreEs") ?? "").trim();
  const pin = String(datos.get("pin") ?? "").trim();
  if (nombreEs.length < 3) return { ok: false, mensaje: t("revisaLosDatos") };

  const revision = revisarPin(pin);
  if (!revision.ok) {
    return {
      ok: false,
      mensaje:
        revision.motivo === "obvio"
          ? t("secciones.pinObvio")
          : t("secciones.pinFormato"),
    };
  }

  const db = getDb();
  const mercado = await mercadoActual();

  /* El slug es la dirección pública: si está ocupado se le suma un sufijo en
     vez de fallar — quien lo crea no tiene por qué saber qué slugs existen. */
  let slug = slugDeSeccion(nombreEs);
  const [ocupado] = await db
    .select({ id: seccionesVideo.id })
    .from(seccionesVideo)
    .where(eq(seccionesVideo.slug, slug))
    .limit(1);
  if (ocupado) slug = `${slug}-${nanoid(5).toLowerCase()}`;

  const llave = nuevaLlaveDeSubida();
  const sal = nuevaSal();

  await db.insert(seccionesVideo).values({
    id: `seccion-${nanoid(10)}`,
    slug,
    nombreEs: nombreEs.slice(0, 80),
    nombreEn:
      String(datos.get("nombreEn") ?? "")
        .trim()
        .slice(0, 80) || null,
    descripcionEs:
      String(datos.get("descripcionEs") ?? "")
        .trim()
        .slice(0, 400) || null,
    descripcionEn:
      String(datos.get("descripcionEn") ?? "")
        .trim()
        .slice(0, 400) || null,
    llaveSubida: llave,
    pinHash: await derivarPin(pin, sal),
    pinSal: sal,
    estado: "publicada",
    mercado: mercado.codigo,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
  });

  revalidatePath("/[locale]/panel/secciones", "page");
  /* La llave se devuelve UNA vez, al crearla: es el enlace que se manda por
     WhatsApp. Después se puede volver a ver en el panel — quien puede verla
     ya es soporte. */
  return { ok: true, mensaje: t("guardadoCorto"), llave };
}

/** Cambiar el PIN de una sección. */
export async function cambiarPinDeSeccion(
  seccionId: string,
  pin: string,
): Promise<ResultadoSeccion> {
  const t = await mensajes();
  if (!(await esSoporteDeVerdad().catch(() => false))) {
    return { ok: false, mensaje: t("sinPermiso") };
  }
  const revision = revisarPin(pin);
  if (!revision.ok) {
    return {
      ok: false,
      mensaje:
        revision.motivo === "obvio"
          ? t("secciones.pinObvio")
          : t("secciones.pinFormato"),
    };
  }
  const sal = nuevaSal();
  await getDb()
    .update(seccionesVideo)
    .set({
      pinHash: await derivarPin(pin, sal),
      pinSal: sal,
      actualizadoEn: new Date(),
    })
    .where(eq(seccionesVideo.id, seccionId));
  revalidatePath("/[locale]/panel/secciones", "page");
  return { ok: true, mensaje: t("guardadoCorto") };
}

/**
 * ABRIR EL ENLACE: comprobar el PIN.
 *
 * ══ TRES COSAS QUE NO SE TOCAN ══
 *
 * 1. **Se comprueba en el SERVIDOR.** Un PIN validado en el navegador se
 *    salta con la consola abierta, y detrás hay una puerta que sube archivos.
 * 2. **Con límite de intentos**, el mismo del login. Cuatro dígitos son diez
 *    mil combinaciones: sin límite, una máquina las prueba todas.
 * 3. **A una llave que no existe se le contesta igual que a un PIN malo.**
 *    Decir «esa sección no existe» convierte el enlace en un detector de
 *    llaves válidas.
 */
export async function comprobarPin(
  llave: string,
  pin: string,
): Promise<{ ok: boolean; mensaje: string; esperaSegundos?: number }> {
  const t = await mensajes();
  const marcador = `seccion:${llave.slice(0, 16)}`;

  const permiso = await dejaIntentar(marcador, null);
  if (!permiso.permitido) {
    return {
      ok: false,
      mensaje: t("secciones.demasiadosIntentos"),
      esperaSegundos: permiso.esperaSegundos,
    };
  }

  const [seccion] = await getDb()
    .select({
      id: seccionesVideo.id,
      pinHash: seccionesVideo.pinHash,
      pinSal: seccionesVideo.pinSal,
    })
    .from(seccionesVideo)
    .where(eq(seccionesVideo.llaveSubida, llave))
    .limit(1);

  const correcto =
    Boolean(seccion) &&
    (await pinCoincide(pin, seccion?.pinHash ?? null, seccion?.pinSal ?? null));

  if (!correcto) {
    await anotarFallo(marcador, null);
    return { ok: false, mensaje: t("secciones.pinMalo") };
  }

  await olvidarFallos(marcador);

  /* La cookie recuerda el PIN en ESE teléfono: el dueño está en un almacén
     subiendo quince videos y volver a teclearlo en cada uno es la diferencia
     entre una herramienta y un castigo. Va httpOnly: el navegador la manda
     sola y ningún guion de la página la puede leer. */
  const tarro = await cookies();
  tarro.set(cookieDeSeccion(llave), await derivarPin(pin, seccion!.pinSal!), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return { ok: true, mensaje: t("secciones.pinOk") };
}

/** ¿Este teléfono ya puso el PIN de esta sección? */
export async function tienePase(llave: string): Promise<boolean> {
  try {
    const tarro = await cookies();
    const guardado = tarro.get(cookieDeSeccion(llave))?.value;
    if (!guardado) return false;
    const [seccion] = await getDb()
      .select({ pinHash: seccionesVideo.pinHash })
      .from(seccionesVideo)
      .where(eq(seccionesVideo.llaveSubida, llave))
      .limit(1);
    /* Se compara contra el hash guardado: si el PIN se cambia, los pases
       viejos dejan de valer solos. */
    return Boolean(seccion?.pinHash) && seccion!.pinHash === guardado;
  } catch {
    return false;
  }
}

/** Quitar un video de la sección. No borra el video. */
export async function quitarDeSeccion(
  seccionId: string,
  videoId: string,
): Promise<ResultadoSeccion> {
  const t = await mensajes();
  if (!(await esSoporteDeVerdad().catch(() => false))) {
    return { ok: false, mensaje: t("sinPermiso") };
  }
  await getDb()
    .delete(videosDeSeccion)
    .where(
      and(
        eq(videosDeSeccion.seccionId, seccionId),
        eq(videosDeSeccion.videoId, videoId),
      ),
    );
  revalidatePath("/[locale]/panel/secciones", "page");
  return { ok: true, mensaje: t("guardadoCorto") };
}
