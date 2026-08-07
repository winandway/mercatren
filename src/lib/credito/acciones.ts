"use server";

import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { obtenerAlcance, obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { creditosCliente, pedidosCredito, user } from "@/lib/db/schema";
import { avisoDeCampo, mensajes } from "@/lib/mensajes";
import { TOPE_MAXIMO_CENTAVOS } from "@/lib/credito/cupo";
import { CAMPOS, opcional } from "@/lib/validacion/campos";

/**
 * EL CRÉDITO, DESDE EL PANEL DEL COMERCIO.
 *
 * **Lo activa el comercio, nunca Mercatren.** Es la regla que sostiene toda la
 * figura legal: el crédito lo da él, con su riesgo y su acuerdo con su cliente.
 * Nosotros no decidimos a quién se le fía ni por cuánto.
 *
 * Aprobado por el abogado en agosto de 2026; el documento está en
 * `docs/mercatren-ventas-a-credito.pdf`.
 */

export type Resultado = { ok: boolean; mensaje: string };

/** Lo mismo que ve el comercio en pantalla, comprobado en el servidor. */
function esquema() {
  return z.object({
    clienteId: z.string().min(1),
    /* El tope se escribe en dólares y se guarda en centavos enteros. */
    tope: z.string().trim().min(1),
    diasPlazo: z.string().trim().min(1),
    notaInterna: opcional(CAMPOS.textoCorto),
  });
}

/** De lo que escribe una persona ("2.000" o "2000,50") a centavos enteros. */
function aCentavos(texto: string): number | null {
  const limpio = texto.replace(/[^\d.,-]/g, "").replace(",", ".");
  const numero = Number(limpio);
  if (!Number.isFinite(numero) || numero < 0) return null;
  return Math.round(numero * 100);
}

/**
 * Da o cambia el cupo de un cliente.
 *
 * Se usa para las dos cosas —crear y editar— a propósito: son la misma
 * decisión, y tener dos acciones separadas termina en dos validaciones que un
 * día dejan de coincidir.
 */
export async function guardarCredito(
  _previo: unknown,
  datos: FormData,
): Promise<Resultado> {
  const t = await mensajes();

  const alcance = await obtenerAlcance().catch(() => null);
  if (!alcance) return { ok: false, mensaje: t("soloComercio") };

  /* QUIÉN AUTORIZA EL CUPO QUEDA FIRMADO. Dar crédito es una decisión de
     dinero: si mañana hay una discusión sobre cuánto se le autorizó a alguien,
     esto es la respuesta. */
  const quienActiva = await obtenerUsuario();

  /* Un vendedor solo puede dar crédito en SU tienda. El equipo puede hacerlo
     en nombre de un comercio, pero tiene que decir en cuál. */
  const tiendaId =
    alcance.tipo === "tienda"
      ? alcance.tiendaId
      : String(datos.get("tiendaId") ?? "");

  if (!tiendaId) return { ok: false, mensaje: t("tiendaSinIdentificar") };

  const revisado = esquema().safeParse(
    Object.fromEntries(datos) as Record<string, string>,
  );
  if (!revisado.success) {
    return {
      ok: false,
      mensaje: await avisoDeCampo(revisado.error.issues[0]?.message),
    };
  }

  const d = revisado.data;

  const topeCentavos = aCentavos(d.tope);
  if (topeCentavos === null || topeCentavos <= 0) {
    return { ok: false, mensaje: t("creditoTopeInvalido") };
  }
  if (topeCentavos > TOPE_MAXIMO_CENTAVOS) {
    return { ok: false, mensaje: t("creditoTopeMuyAlto") };
  }

  const diasPlazo = Number(d.diasPlazo);
  if (!Number.isInteger(diasPlazo) || diasPlazo < 1 || diasPlazo > 365) {
    return { ok: false, mensaje: t("creditoPlazoInvalido") };
  }

  const db = getDb();

  // Que el cliente exista de verdad antes de darle cupo.
  const [cliente] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, d.clienteId))
    .limit(1);

  if (!cliente) return { ok: false, mensaje: t("clienteNoExiste") };

  const ahora = new Date();

  /**
   * UN SOLO CUPO POR PAREJA comercio-cliente.
   *
   * El índice único de la base ya lo impide; esto hace que al volver a
   * guardarlo se ACTUALICE en vez de reventar con un error de duplicado que el
   * comercio no entendería.
   */
  await db
    .insert(creditosCliente)
    .values({
      id: `credito-${nanoid(10)}`,
      tiendaId,
      clienteId: d.clienteId,
      topeCentavos,
      diasPlazo,
      estado: "activo",
      activadoPorId: quienActiva?.id,
      notaInterna: d.notaInterna || null,
      creadoEn: ahora,
      actualizadoEn: ahora,
    })
    .onConflictDoUpdate({
      target: [creditosCliente.tiendaId, creditosCliente.clienteId],
      set: {
        topeCentavos,
        diasPlazo,
        estado: "activo",
        notaInterna: d.notaInterna || null,
        // Al cambiar el cupo se refirma quién lo hizo: es una decisión nueva.
        activadoPorId: quienActiva?.id,
        actualizadoEn: ahora,
      },
    });

  revalidatePath("/[locale]/panel", "layout");
  return { ok: true, mensaje: t("creditoGuardado") };
}

/**
 * Suspende el cupo de un cliente.
 *
 * **No se borra: se suspende.** Lo que ya debe sigue debiéndolo y hay que poder
 * verlo. Borrar el crédito de alguien que te debe $1.500 es perder de vista el
 * dinero, que es justo lo contrario de para qué sirve esto.
 */
export async function suspenderCredito(id: string): Promise<Resultado> {
  return cambiarEstado(id, "suspendido");
}

/** Vuelve a habilitarle el cupo. */
export async function reactivarCredito(id: string): Promise<Resultado> {
  return cambiarEstado(id, "activo");
}

async function cambiarEstado(
  id: string,
  estado: "activo" | "suspendido",
): Promise<Resultado> {
  const t = await mensajes();

  const alcance = await obtenerAlcance().catch(() => null);
  if (!alcance) return { ok: false, mensaje: t("soloComercio") };

  const db = getDb();

  /* La barrera de siempre: un comercio solo toca los créditos de SU tienda.
     Va dentro del propio UPDATE para que no haya un hueco entre comprobar y
     escribir. */
  const donde =
    alcance.tipo === "tienda"
      ? and(
          eq(creditosCliente.id, id),
          eq(creditosCliente.tiendaId, alcance.tiendaId),
        )
      : eq(creditosCliente.id, id);

  const cambiadas = await db
    .update(creditosCliente)
    .set({ estado, actualizadoEn: new Date() })
    .where(donde)
    .returning({ id: creditosCliente.id });

  if (cambiadas.length === 0) {
    return { ok: false, mensaje: t("creditoNoExiste") };
  }

  revalidatePath("/[locale]/panel", "layout");
  return {
    ok: true,
    mensaje:
      estado === "activo" ? t("creditoReactivado") : t("creditoSuspendido"),
  };
}

/**
 * Quita el crédito del todo.
 *
 * Solo se puede si no queda nada por cobrar. Si el cliente todavía debe, se
 * suspende — pero el registro se queda, porque el dinero se queda.
 */
export async function quitarCredito(id: string): Promise<Resultado> {
  const t = await mensajes();

  const alcance = await obtenerAlcance().catch(() => null);
  if (!alcance) return { ok: false, mensaje: t("soloComercio") };

  const db = getDb();

  const [credito] = await db
    .select({
      id: creditosCliente.id,
      tiendaId: creditosCliente.tiendaId,
      clienteId: creditosCliente.clienteId,
    })
    .from(creditosCliente)
    .where(eq(creditosCliente.id, id))
    .limit(1);

  if (!credito) return { ok: false, mensaje: t("creditoNoExiste") };
  if (alcance.tipo === "tienda" && credito.tiendaId !== alcance.tiendaId) {
    return { ok: false, mensaje: t("creditoNoExiste") };
  }

  // ¿Le queda algo por pagar?
  const abiertos = await db
    .select({ pedidoId: pedidosCredito.pedidoId })
    .from(pedidosCredito)
    .where(
      and(
        eq(pedidosCredito.creditoId, id),
        eq(pedidosCredito.estado, "abierto"),
      ),
    )
    .limit(1);

  if (abiertos.length > 0) {
    return { ok: false, mensaje: t("creditoConDeudaPendiente") };
  }

  await db.delete(creditosCliente).where(eq(creditosCliente.id, id));

  revalidatePath("/[locale]/panel", "layout");
  return { ok: true, mensaje: t("creditoQuitado") };
}
