"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { obtenerAlcance, obtenerUsuario } from "@/lib/autorizacion";
import { comoSePago } from "@/lib/cobros/como-se-pago";
import { getDb } from "@/lib/db";
import { cobrosSolicitados, cobrosZelle, tiendas } from "@/lib/db/schema";
import { getStripe, stripeConfigurado } from "@/lib/stripe";

/**
 * DEVOLVERLE EL DINERO A QUIEN PAGÓ UN COBRO POR ENLACE.
 *
 * ══ POR QUÉ TIENE QUE ESTAR A LA MANO ══
 *
 * Lo pidió el dueño con estas palabras: *«ese botón téngalo a la mano porque el
 * cliente lo tiene que tener a la mano. Eso es normal, muchas veces toca»*. Y
 * es cierto: se cobró de más, el cliente se arrepintió, la mercancía no estaba.
 * Un comercio que no puede devolver por su cuenta escribe a soporte, y mientras
 * tanto quien pagó llama a su banco — que es como empieza un contracargo.
 *
 * ══ SOLO LO COBRADO CON TARJETA ══
 *
 * Un Zelle **no tiene marcha atrás**: el dinero llegó a una cuenta de banco y
 * volver a mandarlo es una transferencia nueva, hecha por una persona. Fingir
 * que el botón lo resuelve sería peor que decirlo — el comercio se quedaría
 * esperando una devolución que nadie hizo.
 *
 * ══ EL ALCANCE VA DENTRO DE LA BÚSQUEDA ══
 *
 * Un comercio solo devuelve lo suyo. Si el cobro es de otro, no aparece, y no
 * hay forma de devolver el dinero de nadie escribiendo su id a mano.
 */

export type ResultadoDevolucion = { ok: boolean; mensaje: string };

export async function devolverCobro(
  _previo: unknown,
  datos: FormData,
): Promise<ResultadoDevolucion> {
  const alcance = await obtenerAlcance().catch(() => null);
  if (!alcance) return { ok: false, mensaje: "Tu sesión no tiene permiso." };

  const cobroId = String(datos.get("cobroId") ?? "").trim();
  const motivo = String(datos.get("motivo") ?? "").trim();

  /* EL MOTIVO ES OBLIGATORIO. Una devolución sin explicación es un movimiento
     de dinero que nadie puede justificar tres meses después — justo lo que
     este sistema entero existe para evitar. */
  if (motivo.length < 4) {
    return { ok: false, mensaje: "Escribe por qué se devuelve." };
  }

  const db = getDb();

  const [cobro] = await db
    .select({
      id: cobrosSolicitados.id,
      referencia: cobrosSolicitados.referencia,
      montoCentavos: cobrosSolicitados.montoCentavos,
      estado: cobrosSolicitados.estado,
      pagoId: cobrosSolicitados.pagoId,
      tiendaNombre: tiendas.nombre,
    })
    .from(cobrosSolicitados)
    .leftJoin(tiendas, eq(tiendas.id, cobrosSolicitados.tiendaId))
    .where(
      and(
        eq(cobrosSolicitados.id, cobroId),
        alcance.tipo === "tienda"
          ? eq(cobrosSolicitados.tiendaId, alcance.tiendaId)
          : undefined,
      ),
    )
    .limit(1);

  if (!cobro) return { ok: false, mensaje: "No encontramos ese cobro." };

  if (cobro.estado !== "pagado") {
    /* Sin dinero entrado no hay nada que devolver. Si está abierto y ya no se
       quiere cobrar, lo que toca es cancelarlo. */
    return {
      ok: false,
      mensaje:
        "Ese cobro no está pagado. Si ya no lo quieres cobrar, cancélalo.",
    };
  }

  const [zelle] = await db
    .select({ id: cobrosZelle.cobroId })
    .from(cobrosZelle)
    .where(eq(cobrosZelle.cobroId, cobro.id))
    .limit(1)
    .catch(() => []);

  const metodo = comoSePago({
    pagoId: cobro.pagoId,
    tieneZelle: Boolean(zelle),
  });

  if (metodo !== "tarjeta") {
    return {
      ok: false,
      mensaje:
        metodo === "zelle"
          ? "Este pago entró por Zelle y no se puede devolver desde aquí: el dinero está en una cuenta de banco y hay que transferirlo a mano. Escríbenos y lo hacemos."
          : "No podemos identificar el cobro en el procesador. Escríbenos y lo revisamos.",
    };
  }

  if (!stripeConfigurado()) {
    return { ok: false, mensaje: "El procesador no está configurado." };
  }

  /**
   * TODO, O LO QUE SE ESCRIBA.
   *
   * Una devolución parcial es lo normal: llegaron tres cosas y una vino rota.
   * Vacío significa «todo», que es el caso más común y el que no hay que
   * obligar a teclear.
   */
  const escrito = String(datos.get("monto") ?? "").trim();
  let centavos = cobro.montoCentavos;

  if (escrito) {
    const n = Number.parseFloat(escrito.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      return { ok: false, mensaje: "Ese monto no se entiende." };
    }
    centavos = Math.round(n * 100);
    if (centavos > cobro.montoCentavos) {
      /* Devolver más de lo cobrado sale de nuestro bolsillo, y Stripe lo
         rechazaría igual: mejor decirlo aquí, con su motivo. */
      return {
        ok: false,
        mensaje: "No puedes devolver más de lo que se cobró.",
      };
    }
  }

  let reembolso: { id: string } | null = null;
  try {
    reembolso = await getStripe().refunds.create({
      payment_intent: cobro.pagoId!,
      amount: centavos,
      metadata: {
        cobro: cobro.referencia,
        comercio: cobro.tiendaNombre ?? "",
        motivo: motivo.slice(0, 400),
      },
    });
  } catch (fallo) {
    /* El motivo entero del procesador. Un «no se pudo» obliga a adivinar entre
       un cobro ya devuelto, uno demasiado viejo y un problema de red. */
    console.error("[cobro] no se pudo devolver:", fallo);
    const detalle =
      fallo instanceof Error ? fallo.message : "error del procesador";
    return { ok: false, mensaje: `No se pudo devolver: ${detalle}` };
  }

  const usuario = await obtenerUsuario();

  /**
   * SE DEJA ESCRITO QUIÉN, CUÁNTO Y POR QUÉ, y después se cierra el cobro.
   *
   * La devolución YA salió en Stripe. Si algo de esto falla, el dinero está
   * devuelto igual: se registra el error y se sigue. Perder la marca es feo;
   * hacer creer que la devolución falló, cuando el dinero ya salió, es peor —
   * alguien la volvería a intentar.
   */
  try {
    const { nanoid } = await import("nanoid");
    const { devolucionesCobro } = await import("@/lib/db/schema");
    await db.insert(devolucionesCobro).values({
      id: `dev-${nanoid(12)}`,
      cobroId: cobro.id,
      montoCentavos: centavos,
      externoId: reembolso?.id ?? null,
      motivo: motivo.slice(0, 400),
      hechaPorId: usuario?.id ?? null,
      creadoEn: new Date(),
    });
  } catch (fallo) {
    console.error("[cobro] devuelto en Stripe, sin registrar:", fallo);
  }

  /* Solo una devolución TOTAL cierra el cobro. Con una parcial sigue pagado:
     el comercio entregó mercancía y cobró por ella, solo devolvió una parte.
     Y «pagado» va DENTRO del WHERE: entre leer y escribir puede haber entrado
     otra, y marcarlo dos veces no rompe nada. */
  if (centavos >= cobro.montoCentavos) {
    await db
      .update(cobrosSolicitados)
      .set({ estado: "devuelto" })
      .where(
        and(
          eq(cobrosSolicitados.id, cobro.id),
          eq(cobrosSolicitados.estado, "pagado"),
        ),
      )
      .catch((fallo) => {
        console.error("[cobro] devuelto en Stripe, sin cerrar:", fallo);
      });
  }

  revalidatePath("/[locale]/panel/cobros/enlaces", "page");
  return { ok: true, mensaje: "Devuelto." };
}
