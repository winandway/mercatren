"use server";

import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getTranslations } from "next-intl/server";

import { obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { desistimientos, hitosPedido, pedidos } from "@/lib/db/schema";
import { motivoParaNoDesistir } from "@/lib/pedidos/desistimiento";
import { numeroDePedido, revisar } from "@/lib/validacion/acciones";

/**
 * «CONFIRMAR DESISTIMIENTO» (5 nov 2026, Fase 5: España).
 *
 * La MISMA acción para la web y para la app (`/datos/app/mi/pedidos/…`). El
 * dueño sale SIEMPRE de la sesión; el plazo y el mercado se vuelven a leer de
 * la base. Guarda el aviso (una fila por pedido), manda el acuse con la fecha
 * y la hora al comprador y avisa al equipo, que hace el reembolso.
 *
 * Escribe una fila por desistimiento real, nunca por mirar.
 */
export type ResultadoDesistimiento =
  | { ok: true; recibidoEn: string; yaEstaba: boolean }
  | { ok: false; mensaje: string };

export async function desistirDelPedido(
  numeroCrudo: string,
  opciones: { idioma?: "es" | "en" } = {},
): Promise<ResultadoDesistimiento> {
  const idioma = opciones.idioma ?? "es";
  const t = await getTranslations({
    locale: idioma,
    namespace: "desistimiento",
  });

  const usuario = await obtenerUsuario();
  if (!usuario) return { ok: false, mensaje: t("entra") };

  const revisado = revisar(numeroDePedido, numeroCrudo);
  if (!revisado.ok) return { ok: false, mensaje: t("noExiste") };

  const db = getDb();
  const [pedido] = await db
    .select({
      id: pedidos.id,
      numero: pedidos.numero,
      estado: pedidos.estado,
      mercado: pedidos.mercado,
    })
    .from(pedidos)
    .where(
      and(
        eq(pedidos.numero, revisado.datos),
        eq(pedidos.clienteId, usuario.id),
      ),
    )
    .limit(1);
  if (!pedido) return { ok: false, mensaje: t("noExiste") };

  const [ya] = await db
    .select({ creadoEn: desistimientos.creadoEn })
    .from(desistimientos)
    .where(eq(desistimientos.pedidoId, pedido.id))
    .limit(1);
  /* Avisar dos veces no crea dos desistimientos: se responde con el primero. */
  if (ya) {
    return {
      ok: true,
      recibidoEn: ya.creadoEn.toISOString(),
      yaEstaba: true,
    };
  }

  const [entrega] = await db
    .select({ creadoEn: hitosPedido.creadoEn })
    .from(hitosPedido)
    .where(
      and(
        eq(hitosPedido.pedidoId, pedido.id),
        eq(hitosPedido.hito, "entregado"),
      ),
    )
    .orderBy(desc(hitosPedido.creadoEn))
    .limit(1);

  const motivo = motivoParaNoDesistir({
    mercado: pedido.mercado,
    estado: pedido.estado,
    entregadoEn: entrega?.creadoEn ?? null,
    desistidoEn: null,
  });
  if (motivo) {
    return {
      ok: false,
      mensaje: t(motivo === "fuera_de_plazo" ? "fueraDePlazo" : "noAplica"),
    };
  }

  const ahora = new Date();
  await db.insert(desistimientos).values({
    id: nanoid(),
    pedidoId: pedido.id,
    clienteId: usuario.id,
    nombre: usuario.name ?? "",
    correo: usuario.email,
    creadoEn: ahora,
  });

  /* El acuse y el aviso nunca frenan el desistimiento: ya quedó guardado. */
  try {
    const { correoAcuseDesistimiento, correoAvisoAlEquipo } =
      await import("@/lib/correo/correos");
    await correoAcuseDesistimiento(
      { email: usuario.email, name: usuario.name, idioma },
      { numero: pedido.numero, recibidoEn: ahora },
    );
    const { SITIO } = await import("@/lib/sitio");
    await correoAvisoAlEquipo({
      asunto: `Desistimiento del pedido ${pedido.numero}`,
      lineas: [
        `El comprador desistió del pedido ${pedido.numero} (España) el ${ahora.toISOString()}.`,
        "Hay que reembolsarle todo, incluido el envío estándar, en un máximo de 14 días, por el mismo medio de pago. Se puede esperar a recibir el producto o la prueba del envío.",
      ],
      url: `${SITIO.url}/es/panel/ordenes/${pedido.numero}`,
      boton: "Ver el pedido",
    });
  } catch (fallo) {
    console.error("[desistimiento] no salió el correo", fallo);
    try {
      const { registrarError } = await import("@/lib/errores/registro");
      await registrarError("pedidos/desistimiento-correo", fallo);
    } catch {
      /* Anotar el fallo no puede provocar otro. */
    }
  }

  return { ok: true, recibidoEn: ahora.toISOString(), yaEstaba: false };
}
