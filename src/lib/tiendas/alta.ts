import "server-only";

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { aceptaciones, billeteras, tiendas, user } from "@/lib/db/schema";
import { VERSION_TERMINOS } from "@/lib/legal";
import { codigoDePais } from "@/lib/mercado/codigo-de-pais";
import {
  documentoDelMercado,
  type DocumentoDelMercado,
} from "@/lib/mercado/identificacion";
import type { Mercado } from "@/lib/mercado/mercados";
import { monedaDelMercado } from "@/lib/mercado/moneda";

/**
 * EL ALTA DE UN COMERCIO, EN UN SOLO SITIO (5 nov 2026).
 *
 * La usan la web (`solicitarComercio`, en `acciones.ts`) y la app nativa
 * (`/datos/app/mi/tienda`). Antes vivía dentro de la acción de la web; se
 * sacó aquí para que la app no tenga un alta propia que se aparte de esta
 * con el tiempo. NO va en un archivo «use server»: ahí cada función exportada
 * se puede llamar desde el navegador, y esta recibe el usuario ya resuelto.
 * Quien la llama resuelve SIEMPRE el usuario desde la sesión.
 */
type Textos = (clave: string) => string;

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
const esquemaComercio = (t: Textos, documento: DocumentoDelMercado) =>
  z.object({
    nombre: z.string().trim().min(2, t("nombreTiendaObligatorio")).max(80),
    razonSocial: z.string().trim().min(2, t("faltaRazonSocial")).max(120),
    /**
     * EL DOCUMENTO DE LA EMPRESA, CON LA REGLA DE SU PAÍS.
     *
     * En Chile es el RUT y lleva dígito verificador, así que se comprueba de
     * verdad: un dedazo se atrapa aquí y no semanas después, al facturarle.
     * En los demás mercados sigue la regla genérica de siempre — mercatren.com
     * no cambia ni un carácter.
     *
     * Se guarda NORMALIZADO (sin puntos ni guiones): lo guardado es lo que
     * alguien copia y pega en un banco o en una factura.
     */
    identificacionFiscal: z
      .string()
      .trim()
      .min(1, t("faltaIdentificacion"))
      .max(40)
      .superRefine((valor, ctx) => {
        const aviso = documento.revisar(valor);
        if (aviso) {
          ctx.addIssue({ code: "custom", message: t(aviso) });
        }
      })
      .transform((valor) => documento.normalizar(valor)),
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

export type ResultadoAlta = { ok: boolean; mensaje: string; slug?: string };

export async function darDeAltaComercio({
  usuario,
  mercado,
  datos,
  t,
  contexto,
}: {
  usuario: { id: string };
  mercado: Mercado;
  datos: Record<string, string>;
  t: Textos;
  /** Desde dónde se firmó: queda grabado con la aceptación de los términos. */
  contexto: "alta-comercio" | "alta-comercio-app";
}): Promise<ResultadoAlta> {
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
  if (datos.aceptaTerminos !== "on") {
    return { ok: false, mensaje: t("aceptaTerminosComercio") };
  }
  /* La firma se graba JUNTO con la tienda (abajo, en el mismo grupo): antes
     se grababa aquí, antes de revisar los datos, y cada intento con un dato
     mal escrito dejaba una fila de más (5 nov 2026, «la nube no se come el
     dinero»). Una firma sin tienda no firma nada. */

  const revisado = esquemaComercio(t, documentoDelMercado(mercado)).safeParse(
    datos,
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
    db.insert(aceptaciones).values({
      id: nanoid(),
      userId: usuario.id,
      documento: "terminos",
      version: VERSION_TERMINOS,
      contexto,
      creadoEn: new Date(),
    }),
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
      /* Se guarda el CÓDIGO, venga como venga del formulario: ver
         `codigo-de-pais.ts`, que cuenta lo que costó no hacerlo. */
      paisOrigen: codigoDePais(d.paisOrigen),
      /**
       * LA VITRINA DONDE VA A VENDER: el dominio por el que se registró.
       *
       * No se deduce de `paisOrigen` y son cosas distintas: la ferretería
       * despacha DESDE Venezuela y vende EN mercatren.com. Quien se dé de alta
       * entrando por mercatren.cl vende en Chile, salga su mercancía de donde
       * salga.
       *
       * Sin esto, un comercio chileno se registraba y su tienda aparecía en el
       * catálogo de mercatren.com —el default de la columna— mientras su
       * propio dominio seguía vacío. El comercio no vería su tienda por ningún
       * lado y no tendría forma de entender por qué.
       *
       * El equipo lo puede corregir después desde Comercios.
       */
      mercado: mercado.codigo,
      sitioWeb: d.sitioWeb || null,
      descripcionEs: d.descripcionEs || null,
      /**
       * NACE ACTIVA. Decision del dueño, 15 ago 2026.
       *
       * Antes nacia `pendiente` y la aprobaba el equipo. En la practica eso era
       * una cola que nadie miraba: los comercios que se registran son gente a
       * la que el dueño MANDA a registrarse, asi que la aprobacion era un
       * tramite que el siempre iba a conceder — y mientras tanto el comercio
       * veia su tienda en 404 y creia que el sitio habia perdido su trabajo.
       *
       * El control no desaparece, cambia de momento: se revisa DESPUES y se
       * suspende a quien no cumpla. Es la diferencia entre frenar a todos por
       * si acaso y frenar a quien de verdad hace algo raro.
       *
       * `pendiente` y `borrador` siguen existiendo y las pantallas los saben
       * leer: es lo que queda al suspender a alguien.
       */
      estado: "activa",
    }),

    // Su billetera, desde el primer día.
    db.insert(billeteras).values({
      id: `billetera-${nanoid(10)}`,
      tiendaId,
      /* La de su país. El saldo se calcula con `monedaDeLaTienda`, pero la
         fila tampoco debe decir USD para una tienda que vende en euros. */
      moneda: monedaDelMercado(mercado),
    }),

    // Ya es un comercio: el panel deja de tratarlo como comprador.
    db.update(user).set({ rol: "vendedor" }).where(eq(user.id, usuario.id)),
  ]);

  revalidatePath("/[locale]/panel", "layout");

  /* Al equipo, para enterarse — NO para aprobar nada. El aviso dice que la
     tienda ya está activa: pedirle al equipo que «verifique» a alguien que ya
     está vendiendo es una tarea que no existe, y de las que enseñan a ignorar
     los correos del sistema. Nunca es requisito: si el correo falla, el alta
     ya está hecha. */
  try {
    const { correoAvisoComercioNuevo } = await import("@/lib/correo/correos");
    await correoAvisoComercioNuevo({ ...d, slug });
  } catch (e) {
    console.error("[comercio] alta creada; aviso interno fallido:", e);
  }

  return { ok: true, mensaje: t("comercioListo"), slug };
}
