"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  esSoporteDeVerdad,
  exigirEquipoInterno,
  obtenerAlcance,
  obtenerUsuario,
} from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { mercadoActual } from "@/lib/mercado/actual";
import { mensajes } from "@/lib/mensajes";
import { tiendas, user } from "@/lib/db/schema";
import { darDeAltaComercio } from "@/lib/tiendas/alta";
import { borrarImagen, subirImagen } from "@/lib/subidas";

/**
 * Lo que el comercio puede cambiar de su propia tienda.
 *
 * REGLA DE ALCANCE: un vendedor solo toca la SUYA. La tienda no se recibe del
 * formulario; se resuelve desde la sesion con obtenerAlcance(). Aunque alguien
 * mande otro identificador, se ignora.
 *
 * Lo que el comercio NO puede cambiar desde aqui, a proposito:
 *   - su comision (la acuerda Mercatren),
 *   - su estado (activa/suspendida),
 *   - su slug (romperia los enlaces que ya circulan).
 */

/**
 * El esquema se arma con los textos ya traducidos.
 *
 * Antes era una constante del modulo, y ahi no hay idioma todavia: los
 * avisos de validacion salian siempre en espanol aunque la persona
 * estuviera usando el panel en ingles.
 */
/** Los textos traducidos que necesita el esquema. */
type Textos = Awaited<ReturnType<typeof mensajes>>;

function construirEsquema(t: Textos) {
  return z.object({
    nombre: z.string().trim().min(2, t("nombreTiendaObligatorio")).max(80),
    descripcionEs: z.string().trim().max(600).optional(),
    descripcionEn: z.string().trim().max(600).optional(),
    razonSocial: z.string().trim().max(120).optional(),
    identificacionFiscal: z.string().trim().max(40).optional(),
    correoContacto: z
      .union([z.literal(""), z.string().trim().email(t("correoInvalido"))])
      .optional(),
    telefono: z.string().trim().max(40).optional(),
    direccion: z.string().trim().max(200).optional(),
    ciudad: z.string().trim().max(80).optional(),
    sitioWeb: z
      .union([z.literal(""), z.string().trim().url(t("direccionInvalida"))])
      .optional(),
    horario: z.string().trim().max(200).optional(),
  });
}

export type ResultadoTienda =
  { ok: true; mensaje: string } | { ok: false; mensaje: string };

/** Lo vacio se guarda como NULL, para que la ficha no muestre huecos. */
function oNulo(valor: string | undefined) {
  const limpio = valor?.trim();
  return limpio ? limpio : null;
}

export async function guardarMiTienda(
  formulario: FormData,
): Promise<ResultadoTienda> {
  const t = await mensajes();

  /* Si la cuenta no tiene comercio, se avisa: dejar que la excepción suba
     borraría el formulario de la tienda con todo lo que llevara escrito. */
  const alcance = await obtenerAlcance().catch(() => null);
  if (!alcance) return { ok: false, mensaje: t("cuentaSinComercio") };

  // El equipo de Mercatren puede editar la tienda que este viendo; un
  // comercio, solo la suya.
  const tiendaId =
    alcance.tipo === "tienda"
      ? alcance.tiendaId
      : String(formulario.get("tiendaId") ?? "");

  if (!tiendaId) {
    return { ok: false, mensaje: t("tiendaSinIdentificar") };
  }

  const revisado = construirEsquema(t).safeParse({
    nombre: formulario.get("nombre"),
    descripcionEs: formulario.get("descripcionEs"),
    descripcionEn: formulario.get("descripcionEn"),
    razonSocial: formulario.get("razonSocial"),
    identificacionFiscal: formulario.get("identificacionFiscal"),
    correoContacto: formulario.get("correoContacto"),
    telefono: formulario.get("telefono"),
    direccion: formulario.get("direccion"),
    ciudad: formulario.get("ciudad"),
    sitioWeb: formulario.get("sitioWeb"),
    horario: formulario.get("horario"),
  });

  if (!revisado.success) {
    return {
      ok: false,
      mensaje: revisado.error.issues[0]?.message ?? t("revisaLosDatos"),
    };
  }

  const db = getDb();
  const [actual] = await db
    .select({
      logoClave: tiendas.logoClave,
      portadaClave: tiendas.portadaClave,
    })
    .from(tiendas)
    .where(eq(tiendas.id, tiendaId))
    .limit(1);

  if (!actual) return { ok: false, mensaje: t("tiendaNoExiste") };

  const datos = revisado.data;
  const cambios: Record<string, unknown> = {
    nombre: datos.nombre,
    descripcionEs: oNulo(datos.descripcionEs),
    descripcionEn: oNulo(datos.descripcionEn),
    razonSocial: oNulo(datos.razonSocial),
    identificacionFiscal: oNulo(datos.identificacionFiscal),
    correoContacto: oNulo(datos.correoContacto),
    telefono: oNulo(datos.telefono),
    direccion: oNulo(datos.direccion),
    ciudad: oNulo(datos.ciudad),
    sitioWeb: oNulo(datos.sitioWeb),
    horario: oNulo(datos.horario),
    actualizadoEn: new Date(),
  };

  // El logo y la portada solo se tocan si mandaron una imagen nueva. La
  // anterior se borra despues de guardar la nueva, no antes: si algo falla,
  // el comercio se queda con la que tenia y no sin ninguna.
  const logo = formulario.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const subida = await subirImagen(logo, `tiendas/${tiendaId}/logo`);
    if (!subida.ok) return subida;
    cambios.logoClave = subida.clave;
  }

  const portada = formulario.get("portada");
  if (portada instanceof File && portada.size > 0) {
    const subida = await subirImagen(portada, `tiendas/${tiendaId}/portada`);
    if (!subida.ok) return subida;
    cambios.portadaClave = subida.clave;
  }

  await db.update(tiendas).set(cambios).where(eq(tiendas.id, tiendaId));

  if (cambios.logoClave && actual.logoClave) {
    await borrarImagen(actual.logoClave);
  }
  if (cambios.portadaClave && actual.portadaClave) {
    await borrarImagen(actual.portadaClave);
  }

  revalidatePath("/[locale]/panel", "layout");
  revalidatePath("/[locale]/tienda/[slug]", "page");

  return { ok: true, mensaje: t("tiendaGuardada") };
}

export async function solicitarComercio(
  _previo: unknown,
  datos: FormData,
): Promise<{ ok: boolean; mensaje: string; slug?: string }> {
  const t = await mensajes();
  const usuario = await obtenerUsuario().catch(() => null);

  if (!usuario) return { ok: false, mensaje: t("entraParaComprar") };

  /* El país por el que entró decide DOS cosas: con qué regla se comprueba su
     documento (RUT en Chile) y en qué vitrina nace su tienda. Se resuelve una
     vez, aquí. */
  const mercado = await mercadoActual();

  return darDeAltaComercio({
    usuario,
    mercado,
    datos: Object.fromEntries(
      [...datos.entries()].map(([k, v]) => [k, String(v)]),
    ),
    t,
    contexto: "alta-comercio",
  });
}

/**
 * Aprueba un comercio que se dio de alta solo.
 *
 * Es el paso que convierte una solicitud en una tienda que puede vender. Lo
 * hace el equipo de Mercatren y nadie más: si el propio comercio pudiera
 * aprobarse, la revisión no revisaría nada.
 */
/**
 * ══ ENCENDER Y APAGAR UN COMERCIO (21 sep 2026) ══
 *
 * Richard lo buscó en el panel para activar un seller de Venezuela y no
 * estaba: solo existía «Aprobar», que sirve una sola vez y únicamente si la
 * tienda está `pendiente`. Una tienda en `borrador`, o una que se suspendió,
 * no había forma de encenderla sin tocar la base a mano.
 *
 * **Apagar solo la esconde del público.** Su tienda y sus productos salen del
 * catálogo, del mapa del sitio y de Google; el dueño sigue entrando a su
 * panel, viendo sus ventas y pudiendo pedir su dinero. Es lo reversible: si
 * se apaga por error, encenderla lo deja todo como estaba. Quitarle la
 * entrada o congelarle el saldo son decisiones distintas y más duras, y no
 * se toman con un interruptor.
 *
 * Solo Soporte, y solo sobre comercios del país que está mirando el panel:
 * desde el panel de Venezuela no se apaga una tienda de Estados Unidos.
 */
export async function cambiarEstadoDeComercio(
  tiendaId: string,
  encendida: boolean,
): Promise<{ ok: boolean; mensaje: string }> {
  const t = await mensajes();

  if (!(await esSoporteDeVerdad())) {
    return { ok: false, mensaje: t("soloEquipo") };
  }

  const { mercadoDelPanel } = await import("@/lib/mercado/panel");
  const mercado = await mercadoDelPanel();

  const resultado = await getDb()
    .update(tiendas)
    .set({
      estado: encendida ? "activa" : "suspendida",
      actualizadoEn: new Date(),
    })
    .where(and(eq(tiendas.id, tiendaId), eq(tiendas.mercado, mercado.codigo)))
    .returning({ id: tiendas.id, nombre: tiendas.nombre });

  if (resultado.length === 0) {
    return { ok: false, mensaje: t("tiendaNoExiste") };
  }

  /* El catálogo y la ficha de la tienda cambian para todo el mundo. */
  revalidatePath("/[locale]/panel/tiendas", "page");
  revalidatePath("/[locale]/(tienda)/tienda/[slug]", "page");
  revalidatePath("/[locale]/(tienda)/tiendas", "page");
  revalidatePath("/[locale]/(tienda)/catalogo", "page");

  return {
    ok: true,
    mensaje: encendida
      ? t("comercioEncendido", { nombre: resultado[0]!.nombre })
      : t("comercioApagado", { nombre: resultado[0]!.nombre }),
  };
}

export async function aprobarComercio(
  tiendaId: string,
): Promise<{ ok: boolean; mensaje: string }> {
  const t = await mensajes();

  try {
    await exigirEquipoInterno();
  } catch {
    return { ok: false, mensaje: t("soloEquipo") };
  }

  const db = getDb();
  const resultado = await db
    .update(tiendas)
    .set({ estado: "activa", actualizadoEn: new Date() })
    .where(and(eq(tiendas.id, tiendaId), eq(tiendas.estado, "pendiente")))
    .returning({
      id: tiendas.id,
      nombre: tiendas.nombre,
      propietarioId: tiendas.propietarioId,
    });

  if (resultado.length === 0) {
    return { ok: false, mensaje: t("tiendaNoExiste") };
  }

  // El aviso de "ya puedes vender". Si falla, la tienda queda aprobada igual.
  try {
    if (resultado[0].propietarioId) {
      const [duenno] = await db
        .select({ email: user.email, name: user.name, idioma: user.idioma })
        .from(user)
        .where(eq(user.id, resultado[0].propietarioId))
        .limit(1);
      if (duenno) {
        const { correoComercioAprobado } = await import("@/lib/correo/correos");
        await correoComercioAprobado(duenno, { nombre: resultado[0].nombre });
      }
    }
  } catch (e) {
    console.error("[comercio] aprobado; aviso fallido:", e);
  }

  revalidatePath("/[locale]/panel", "layout");
  return { ok: true, mensaje: t("comercioAprobado") };
}
