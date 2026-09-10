import "server-only";

import { eq } from "drizzle-orm";

import { descripcionDeCj } from "@/lib/cj/descripcion";
import { slugDeLaUrl } from "@/lib/cj/diagnostico-puro";
import { getDb } from "@/lib/db";
import { intentosDescripcion, productos } from "@/lib/db/schema";
import { traducirDescripciones } from "@/lib/traduccion/modelo";

/**
 * ══ LA DESCRIPCIÓN DE UNA FICHA CONCRETA, YA (9 sep 2026) ══
 *
 * Richard, con dos monitores de estudio recién publicados y un cliente
 * preguntando si son amplificadas y si el precio es por el par: _«sin eso
 * no se puede vender»_. Tenía razón, y el dato existía — CJ lo trae en el
 * DETALLE del producto, que la importación masiva no pide.
 *
 * Ya había un traedor por tandas para el catálogo entero
 * (`traerDescripciones`, en el panel). Esto no lo reemplaza: es la misma
 * pieza (`descripcionDeCj`, con su ritmo y sus motivos) para UN producto,
 * porque cuando un cliente está esperando no se puede depender de que a esa
 * ficha le toque el turno en una cola de miles.
 *
 * **El texto sale de CJ, nunca de la foto ni de nuestra cabeza**: la regla
 * entera está escrita en `descripcion.ts` y no se toca aquí. Si CJ no la
 * trae, el motivo queda anotado en `intentos_descripcion` y la ficha se
 * queda sin descripción.
 */
export async function describirUnProducto(enlace: string): Promise<{
  ok: boolean;
  mensaje: string;
  textoEn?: string;
  textoEs?: string;
}> {
  const slug = slugDeLaUrl(enlace);
  if (!slug) return { ok: false, mensaje: "Pega el enlace de un producto." };

  const db = getDb();
  const [p] = await db
    .select({
      id: productos.id,
      titulo: productos.tituloEs,
      pid: productos.externoId,
    })
    .from(productos)
    .where(eq(productos.slug, slug))
    .limit(1);
  if (!p) return { ok: false, mensaje: `No existe «${slug}».` };
  if (!p.pid)
    return { ok: false, mensaje: "El producto no tiene código de CJ." };

  const ahora = new Date();
  const r = await descripcionDeCj(p.pid);
  if (!r.ok) {
    /* El motivo queda escrito, en su tabla y sin pisar lo que ve el
       comprador: igual que en el traedor por tandas. */
    await db
      .insert(intentosDescripcion)
      .values({ productoId: p.id, motivo: r.motivo, intentadoEn: ahora })
      .onConflictDoUpdate({
        target: intentosDescripcion.productoId,
        set: { motivo: r.motivo, intentadoEn: ahora },
      })
      .catch(() => undefined);
    return { ok: false, mensaje: `CJ: ${r.motivo}` };
  }

  await db
    .update(productos)
    .set({ descripcionEn: r.texto, actualizadoEn: ahora })
    .where(eq(productos.id, p.id));

  /* Y el español en el acto: el reloj también lo haría, pero el cliente
     está esperando ahora. Si el traductor falla, el inglés ya quedó y el
     reloj lo reintenta solo. */
  let textoEs: string | undefined;
  const t = await traducirDescripciones([{ id: p.id, textoEn: r.texto }]);
  if (t.ok && t.traducciones[0]) {
    textoEs = t.traducciones[0].texto;
    await db
      .update(productos)
      .set({ descripcionEs: textoEs, actualizadoEn: ahora })
      .where(eq(productos.id, p.id))
      .catch(() => undefined);
  }

  return {
    ok: true,
    mensaje: `«${p.titulo}»: descripción de CJ guardada (${r.texto.length} caracteres)${textoEs ? " y traducida al español" : "; el español lo hace el reloj"}.`,
    textoEn: r.texto.slice(0, 400),
    textoEs: textoEs?.slice(0, 400),
  };
}
