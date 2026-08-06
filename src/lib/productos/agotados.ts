import "server-only";

import { eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { productos, variantesProducto } from "@/lib/db/schema";

/**
 * AVISAR AL COMERCIO CUANDO UNA VENTA LE DEJÓ UN PRODUCTO EN CERO.
 *
 * Un producto agotado deja de poder comprarse, y el comercio no tiene forma
 * de enterarse salvo entrando a mirar su lista. Mientras tanto pierde ventas
 * de algo que probablemente sí tiene en el depósito y solo hay que actualizar.
 *
 * SE COMPRUEBA DESPUÉS DE DESCONTAR, no antes: lo que importa es el número en
 * el que quedó, no el que tenía. Y se lee de la base en vez de calcularlo,
 * porque dos pagos aprobados casi a la vez descuentan los dos y solo la base
 * sabe el resultado final.
 *
 * SOLO AVISA DE LO QUE LLEVA CUENTA. Un producto con `controlaExistencias`
 * apagado (el cemento que se vende por kilo y nunca se acaba) tiene existencias
 * en cero todo el tiempo; avisarle de eso al comercio sería ruido diario hasta
 * que deje de leer nuestros correos.
 *
 * NUNCA REVIENTA NI DESHACE NADA: se llama después de acreditar el dinero, y
 * un pago aprobado jamás se cae porque un aviso no salió.
 */
export async function avisarAgotados(
  renglones: { productoId: string | null; varianteId: string | null }[],
) {
  try {
    const db = getDb();

    const idsProducto = [
      ...new Set(
        renglones
          .filter((r) => !r.varianteId && r.productoId)
          .map((r) => r.productoId!),
      ),
    ];
    const idsVariante = [
      ...new Set(
        renglones.filter((r) => r.varianteId).map((r) => r.varianteId!),
      ),
    ];

    /** Los que quedaron en cero, con su título y su comercio. */
    const agotados: { tiendaId: string; titulo: string }[] = [];

    if (idsProducto.length > 0) {
      const filas = await db
        .select({
          tiendaId: productos.tiendaId,
          titulo: productos.tituloEs,
          existencias: productos.existencias,
          controla: productos.controlaExistencias,
        })
        .from(productos)
        .where(inArray(productos.id, idsProducto));

      for (const f of filas) {
        if (f.controla && Number(f.existencias) <= 0) {
          agotados.push({ tiendaId: f.tiendaId, titulo: f.titulo });
        }
      }
    }

    if (idsVariante.length > 0) {
      const filas = await db
        .select({
          tiendaId: productos.tiendaId,
          titulo: productos.tituloEs,
          talla: variantesProducto.talla,
          color: variantesProducto.color,
          existencias: variantesProducto.existencias,
          controla: productos.controlaExistencias,
        })
        .from(variantesProducto)
        .innerJoin(productos, eq(productos.id, variantesProducto.productoId))
        .where(inArray(variantesProducto.id, idsVariante));

      for (const f of filas) {
        if (f.controla && Number(f.existencias) <= 0) {
          // La talla y el color van en el título: "se agotó la camisa" no le
          // dice al comercio cuál de las seis tiene que reponer.
          agotados.push({
            tiendaId: f.tiendaId,
            titulo: [f.titulo, f.color, f.talla].filter(Boolean).join(" · "),
          });
        }
      }
    }

    if (agotados.length === 0) return;

    const { correoProductoAgotado } = await import("@/lib/correo/correos");
    const { duennoDeTienda } = await import("@/lib/correo/contactos");

    // Un mismo comercio puede haber agotado dos cosas en el mismo pedido: se
    // busca su cuenta una sola vez y se le escribe por cada una.
    const porTienda = new Map<string, string[]>();
    for (const a of agotados) {
      porTienda.set(a.tiendaId, [
        ...(porTienda.get(a.tiendaId) ?? []),
        a.titulo,
      ]);
    }

    for (const [tiendaId, titulos] of porTienda) {
      const duenno = await duennoDeTienda(tiendaId);
      if (!duenno) continue;
      for (const titulo of titulos) {
        await correoProductoAgotado(duenno, { titulo });
      }
    }
  } catch (e) {
    console.error("[agotados] no se pudo avisar:", e);
  }
}
