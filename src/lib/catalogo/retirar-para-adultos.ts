import "server-only";

import { inArray, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { productos } from "@/lib/db/schema";

import { esProductoParaAdultos, FRASES_PARA_ADULTOS } from "./para-adultos";

/** Cada cuánto corre: el reloj lo reserva con su marca. */
export const RETIRAR_PARA_ADULTOS_CADA_MS = 60 * 60_000;

/**
 * Pasa a `borrador` los productos a la venta (o por publicar) que sean ayudas
 * sexuales. Ver `para-adultos.ts`.
 *
 * Primero un filtro grueso en la base (LIKE sobre el texto ya normalizado de
 * `texto_de_busqueda`, que trae los dos títulos), y después la comprobación
 * con frase completa en código: lo que pasa las dos, se retira.
 */
export async function retirarProductosParaAdultos(
  limite = 200,
): Promise<{ revisados: number; retirados: string[] }> {
  const db = getDb();
  const condiciones = FRASES_PARA_ADULTOS.map(
    (f) => sql`t."texto" like ${`%${f}%`}`,
  );
  const filas = (await db.all(
    sql`select t."producto_id" as id, t."texto" as texto
        from "texto_de_busqueda" t
        join "productos" p on p."id" = t."producto_id"
        where p."estado" in ('publicado', 'en_revision', 'agotado')
          and (${sql.join(condiciones, sql` or `)})
        limit ${limite}`,
  )) as { id: string; texto: string }[];

  const retirar = filas
    .filter((f) => esProductoParaAdultos(f.texto))
    .map((f) => f.id);

  /* De cien en cien: la base de la nube no admite más variables por
     sentencia (regla `filas × columnas ≤ 100`). */
  for (let i = 0; i < retirar.length; i += 90) {
    await db
      .update(productos)
      .set({ estado: "borrador" })
      .where(inArray(productos.id, retirar.slice(i, i + 90)));
  }

  if (retirar.length > 0) {
    console.warn(
      `[catalogo] retirados ${retirar.length} producto(s) para adultos: ${retirar.slice(0, 20).join(", ")}`,
    );
  }
  return { revisados: filas.length, retirados: retirar };
}
