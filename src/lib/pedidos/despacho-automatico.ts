import "server-only";

import { and, asc, eq, inArray, isNull, lt } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { pedidos, pedidosProveedor } from "@/lib/db/schema";

/**
 * LA GUÍA LLEGA SOLA, Y EL COMPRADOR SE ENTERA SOLO.
 *
 * ══ CÓMO ERA HASTA HOY (21 sep 2026) ══
 *
 * El número de guía de CJ solo entraba al sistema cuando alguien del equipo
 * abría Panel → Pedidos al proveedor y pulsaba «actualizar» en esa fila. Si
 * nadie pulsaba —y nadie pulsa todos los días— el comprador de Estados
 * Unidos se quedaba con su pedido en «pagado» hasta que el paquete
 * apareciera en su puerta. Días de silencio después de haber pagado.
 *
 * Y aunque la guía entrara, no salía ningún correo: el aviso solo se
 * disparaba si además un comercio pulsaba «enviado» en su panel, que en las
 * ventas de EE. UU. —donde despacha CJ, no el comercio— nadie pulsa.
 *
 * ══ QUÉ HACE ESTO ══
 *
 * En cada latido mira unas pocas compras al proveedor que están pagadas y
 * todavía sin guía, le pregunta a CJ, y cuando aparece el número:
 *
 *   1. lo guarda en la fila de la compra,
 *   2. pasa el pedido a «enviado» —con el estado en el WHERE, así que dos
 *      latidos a la vez no lo mueven dos veces—,
 *   3. y solo si ESE update movió la fila, manda el correo.
 *
 * Ese orden es el candado contra el correo duplicado: quien mueve el estado
 * es quien avisa, y el estado solo se puede mover una vez.
 *
 * ══ LOS PUNTOS DE CJ ══
 *
 * Preguntar por un pedido cuesta puntos, los mismos con los que se publica
 * catálogo. Por eso: tope bajo por latido, nada si CJ está sin puntos, y una
 * fila no se vuelve a preguntar antes de `ESPERA_ENTRE_PREGUNTAS_MS`. Ese
 * freno no necesita una columna nueva —que no llegaría a producción, porque
 * `schema.sql` solo crea tablas— sino `actualizadoEn`, que se toca en cada
 * intento.
 */

/** Cuántas compras se preguntan por latido. */
export const COMPRAS_POR_LATIDO = 2;

/**
 * Cuánto se espera antes de volver a preguntar por la misma compra: dos
 * horas. CJ no despacha en minutos, y preguntar cada minuto por un pedido
 * que sale mañana es quemar el presupuesto del catálogo.
 */
export const ESPERA_ENTRE_PREGUNTAS_MS = 2 * 60 * 60 * 1000;

/**
 * Los estados del pedido desde los que se puede pasar a «enviado». Fuera de
 * estos no se toca: uno cancelado o ya entregado no se despacha.
 */
const DESDE = ["pagado", "preparando"] as const;

export type ResultadoDespacho = {
  preguntadas: number;
  conGuia: number;
  despachados: number;
  avisados: number;
  /** El último motivo por el que algo no salió, para que se vea en el reloj. */
  ultimoFallo: string | null;
};

export async function mirarDespachosDelProveedor(
  tope = COMPRAS_POR_LATIDO,
): Promise<ResultadoDespacho> {
  const salida: ResultadoDespacho = {
    preguntadas: 0,
    conGuia: 0,
    despachados: 0,
    avisados: 0,
    ultimoFallo: null,
  };

  const db = getDb();
  const limite = new Date(Date.now() - ESPERA_ENTRE_PREGUNTAS_MS);

  const filas = await db
    .select({
      compraId: pedidosProveedor.id,
      pedidoId: pedidos.id,
      numero: pedidos.numero,
      clienteId: pedidos.clienteId,
      totalCentavos: pedidos.totalCentavos,
      mercado: pedidos.mercado,
    })
    .from(pedidosProveedor)
    .innerJoin(pedidos, eq(pedidos.id, pedidosProveedor.pedidoId))
    .where(
      and(
        eq(pedidosProveedor.estado, "pagado"),
        isNull(pedidosProveedor.guia),
        inArray(pedidos.estado, [...DESDE]),
        lt(pedidosProveedor.actualizadoEn, limite),
      ),
    )
    /* La más vieja primero: la que lleva más tiempo esperando su guía es la
       del comprador que lleva más tiempo sin saber nada. */
    .orderBy(asc(pedidosProveedor.actualizadoEn))
    .limit(tope);

  if (filas.length === 0) return salida;

  const { comoVaEnCj } = await import("@/lib/cj/pedidos");

  for (const f of filas) {
    salida.preguntadas += 1;
    try {
      const r = await comoVaEnCj(f.numero);

      /* El intento se anota SIEMPRE, con guía o sin ella: es lo que impide
         que la misma fila se pregunte en el latido siguiente. */
      await db
        .update(pedidosProveedor)
        .set({ actualizadoEn: new Date() })
        .where(eq(pedidosProveedor.id, f.compraId));

      if (!r.ok) {
        salida.ultimoFallo = r.motivo;
        continue;
      }

      if (!r.datos.guia) continue;

      salida.conGuia += 1;
      await db
        .update(pedidosProveedor)
        .set({
          guia: r.datos.guia,
          /* Un `null` de CJ no borra lo que ya teníamos. */
          ...(r.datos.transportista
            ? { transportista: r.datos.transportista }
            : {}),
          ...(r.datos.costoCentavos !== null
            ? { costoCentavos: r.datos.costoCentavos }
            : {}),
          actualizadoEn: new Date(),
        })
        .where(eq(pedidosProveedor.id, f.compraId));

      /* EL CANDADO CONTRA EL CORREO DUPLICADO: el estado va en el WHERE, así
         que solo una corrida mueve la fila, y solo la que la mueve avisa. */
      const movido = await db
        .update(pedidos)
        .set({ estado: "enviado", actualizadoEn: new Date() })
        .where(
          and(eq(pedidos.id, f.pedidoId), inArray(pedidos.estado, [...DESDE])),
        )
        .returning({ id: pedidos.id });

      if (movido.length === 0) continue;

      salida.despachados += 1;

      /* QUIÉN LO MOVIÓ: aquí no fue una persona, fue el proveedor al dar la
         guía. Queda escrito así para que el historial del pedido no diga
         que alguien del equipo lo despachó a mano. */
      const { anotarHito } = await import("@/lib/pedidos/hitos");
      await anotarHito(db, {
        pedidoId: f.pedidoId,
        hito: "enviado",
        hechoPorId: null,
        hechoPorNombre: "Proveedor (guía recibida)",
      });

      const { avisarAvanceAlCliente } =
        await import("@/lib/pedidos/aviso-de-avance");
      const aviso = await avisarAvanceAlCliente(
        {
          id: f.pedidoId,
          numero: f.numero,
          clienteId: f.clienteId,
          totalCentavos: f.totalCentavos,
          mercado: f.mercado,
        },
        "enviado",
      );
      if (aviso.avisado) salida.avisados += 1;
      else if (aviso.motivo) salida.ultimoFallo = aviso.motivo;
    } catch (fallo) {
      salida.ultimoFallo =
        fallo instanceof Error ? fallo.message : String(fallo);
    }
  }

  return salida;
}
