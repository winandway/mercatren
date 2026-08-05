"use server";

import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  exigirEquipoInterno,
  obtenerAlcance,
  obtenerUsuario,
} from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { VERSION_TERMINOS } from "@/lib/legal";
import { mensajes } from "@/lib/mensajes";
import { aceptaciones, billeteras, tiendas, user } from "@/lib/db/schema";
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

  const alcance = await obtenerAlcance();

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

/**
 * ALTA DE UN COMERCIO NUEVO, hecha por él mismo.
 *
 * Antes esto solo lo podía hacer el equipo, a mano, contra la base. Quien se
 * registraba por "Vender en Mercatren" acababa con una cuenta de comprador,
 * sin tienda, mirando un panel vacío — sin ningún error en pantalla, porque
 * no había ningún error: sencillamente nadie le había asignado nada.
 *
 * TRES REGLAS QUE NO SE NEGOCIAN:
 *
 * 1. Los datos de la empresa son OBLIGATORIOS. No se crea una tienda a medias
 *    para andar después llamando al comercio a pedirle lo que falta. O están
 *    todos, o no hay alta.
 *
 * 2. La tienda nace PENDIENTE, nunca activa. Cobrar en nombre de Mercatren no
 *    puede ser algo que uno se conceda solo: lo aprueba el equipo.
 *
 * 3. Se le abre su billetera desde el primer día. Sin ella, el primer pago
 *    que le aprueben no tendría dónde acreditarse.
 */
const esquemaComercio = (t: Textos) =>
  z.object({
    nombre: z.string().trim().min(2, t("nombreTiendaObligatorio")).max(80),
    razonSocial: z.string().trim().min(2, t("faltaRazonSocial")).max(120),
    identificacionFiscal: z
      .string()
      .trim()
      .min(4, t("faltaIdentificacion"))
      .max(40),
    correoContacto: z.string().trim().email(t("correoInvalido")),
    telefono: z.string().trim().min(6, t("faltaTelefono")).max(40),
    direccion: z.string().trim().min(4, t("faltaDireccion")).max(200),
    ciudad: z.string().trim().min(2, t("faltaCiudad")).max(80),
    paisOrigen: z.string().trim().min(2, t("faltaPais")).max(60),
    descripcionEs: z.string().trim().max(600).optional(),
    sitioWeb: z.union([z.literal(""), z.string().trim().url()]).optional(),
  });

/** Convierte "Ferremateriales Bley" en "ferrematerailes-bley". */
function aSlug(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function solicitarComercio(
  _previo: unknown,
  datos: FormData,
): Promise<{ ok: boolean; mensaje: string }> {
  const t = await mensajes();
  const usuario = await obtenerUsuario().catch(() => null);

  if (!usuario) return { ok: false, mensaje: t("entraParaComprar") };

  const db = getDb();

  // Si ya tiene comercio, no se le crea otro: se le manda a su panel.
  const [suya] = await db
    .select({ id: tiendas.id })
    .from(tiendas)
    .where(eq(tiendas.propietarioId, usuario.id))
    .limit(1);

  if (suya) return { ok: false, mensaje: t("yaTienesComercio") };

  /* LA FIRMA, EXIGIDA EN EL SERVIDOR. La casilla del navegador se puede
     manipular; esta comprobación no. Y la aceptación queda grabada con
     quién, cuándo y qué versión — es lo que convierte el clic en firma. */
  if (String(datos.get("aceptaTerminos") ?? "") !== "on") {
    return { ok: false, mensaje: t("aceptaTerminosComercio") };
  }
  await db.insert(aceptaciones).values({
    id: nanoid(),
    userId: usuario.id,
    documento: "terminos",
    version: VERSION_TERMINOS,
    contexto: "alta-comercio",
    creadoEn: new Date(),
  });

  const revisado = esquemaComercio(t).safeParse(
    Object.fromEntries(datos) as Record<string, string>,
  );

  if (!revisado.success) {
    return {
      ok: false,
      mensaje: revisado.error.issues[0]?.message ?? t("revisaLosDatos"),
    };
  }

  const d = revisado.data;

  // El slug tiene que ser único: es la dirección pública de la tienda.
  let slug = aSlug(d.nombre) || "comercio";
  const [ocupado] = await db
    .select({ id: tiendas.id })
    .from(tiendas)
    .where(eq(tiendas.slug, slug))
    .limit(1);
  if (ocupado) slug = `${slug}-${nanoid(5).toLowerCase()}`;

  const tiendaId = `tienda-${nanoid(10)}`;

  await db.batch([
    db.insert(tiendas).values({
      id: tiendaId,
      propietarioId: usuario.id,
      slug,
      nombre: d.nombre,
      razonSocial: d.razonSocial,
      identificacionFiscal: d.identificacionFiscal,
      correoContacto: d.correoContacto,
      telefono: d.telefono,
      direccion: d.direccion,
      ciudad: d.ciudad,
      paisOrigen: d.paisOrigen,
      sitioWeb: d.sitioWeb || null,
      descripcionEs: d.descripcionEs || null,
      // Nace pendiente: la aprueba el equipo, no el propio comercio.
      estado: "pendiente",
    }),

    // Su billetera, desde el primer día.
    db.insert(billeteras).values({
      id: `billetera-${nanoid(10)}`,
      tiendaId,
    }),

    // Ya es un comercio: el panel deja de tratarlo como comprador.
    db.update(user).set({ rol: "vendedor" }).where(eq(user.id, usuario.id)),
  ]);

  revalidatePath("/[locale]/panel", "layout");

  // Al equipo: hay una tienda esperando aprobación. Nunca es requisito.
  try {
    const { correoAvisoComercioNuevo } = await import("@/lib/correo/correos");
    await correoAvisoComercioNuevo(d);
  } catch (e) {
    console.error("[comercio] alta creada; aviso interno fallido:", e);
  }

  return { ok: true, mensaje: t("comercioEnRevision") };
}

/**
 * Aprueba un comercio que se dio de alta solo.
 *
 * Es el paso que convierte una solicitud en una tienda que puede vender. Lo
 * hace el equipo de Mercatren y nadie más: si el propio comercio pudiera
 * aprobarse, la revisión no revisaría nada.
 */
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
