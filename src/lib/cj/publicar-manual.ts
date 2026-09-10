import "server-only";

import { eq } from "drizzle-orm";

import { slugDeLaUrl } from "@/lib/cj/diagnostico-puro";
import { pedirVariantes } from "@/lib/cj/flete";
import { guardarTallas } from "@/lib/cj/guardar";
import { stockDeVariante } from "@/lib/cj/masivo";
import { plazaDelMercado } from "@/lib/cj/plazas";
import { quitarDePrioridad } from "@/lib/cj/prioridad";
import {
  fleteManualValido,
  TRANSPORTE_MANUAL,
} from "@/lib/cj/publicar-manual-puro";
import { getDb } from "@/lib/db";
import { enviosProducto, productos, tiendas } from "@/lib/db/schema";
import { precioPublicadoDe } from "@/lib/destino/precio-plaza";
import { mercadoPorCodigo } from "@/lib/mercado/mercados";
import { tasaVigente } from "@/lib/mercado/tasas";

export {
  fleteManualValido,
  TRANSPORTE_MANUAL,
} from "@/lib/cj/publicar-manual-puro";

/**
 * ══ PUBLICAR CON EL FLETE QUE PUSO UNA PERSONA (9 sep 2026) ══
 *
 * CJ cotiza en $0 el envío de algunos productos de su almacén de Estados
 * Unidos (FedEx y UPS «US to US» a cero: no sabe cotizar esa caja). Sin
 * flete real la regla no los publica —y con razón: un envío inventado ya
 * costó una venta a pérdida—. Pero un cliente esperaba dos monitores de
 * estudio y Richard decidió venderlos: aquí una PERSONA pone el flete, y
 * queda escrito que lo puso una persona (`transporte = "Manual (persona)"`).
 *
 * Hace exactamente lo que hace el afinado cuando CJ sí cotiza: las tallas
 * con su stock real, el precio con el margen de la plaza, el envío guardado
 * como cotizado, y el producto a la venta. El candado de margen antes de
 * pagarle a CJ sigue puesto: si el envío real sale más caro que el manual,
 * la compra la decide una persona con la cifra delante.
 */
export async function publicarConFleteManual(
  enlace: string,
  fleteCentavos: number,
): Promise<{ ok: boolean; mensaje: string; url?: string }> {
  if (!fleteManualValido(fleteCentavos)) {
    return { ok: false, mensaje: "El flete va en centavos, entre 1 y 50.000." };
  }
  const slug = slugDeLaUrl(enlace);
  if (!slug) return { ok: false, mensaje: "Pega el enlace de un producto." };

  const db = getDb();
  const [p] = await db
    .select({
      id: productos.id,
      slug: productos.slug,
      titulo: productos.tituloEs,
      pid: productos.externoId,
      costo: productos.precioBaseCentavos,
      estado: productos.estado,
      pais: tiendas.paisOrigen,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(eq(productos.slug, slug))
    .limit(1);
  if (!p) return { ok: false, mensaje: `No existe «${slug}».` };
  if (!p.pid)
    return { ok: false, mensaje: "El producto no tiene código de CJ." };
  if (!p.costo || p.costo <= 0)
    return { ok: false, mensaje: "El producto no tiene costo base." };
  if (p.estado === "borrador")
    return {
      ok: false,
      mensaje:
        "Está en borrador: lo dejó así una persona. Cámbialo en el panel.",
    };

  const mercado = mercadoPorCodigo(p.pais ?? "US");
  const plaza = plazaDelMercado(mercado);
  const tasa = plaza.mercado === "US" ? null : await tasaVigente(plaza.mercado);

  const variantes = await pedirVariantes(p.pid, plaza.almacen);
  if (!variantes)
    return {
      ok: false,
      mensaje: "CJ no devolvió variantes con stock en ese almacén.",
    };
  const stock = variantes.reduce(
    (t, v) => t + stockDeVariante(v as Record<string, unknown>),
    0,
  );
  if (stock <= 0)
    return { ok: false, mensaje: "CJ dice que no hay stock en ese almacén." };

  const precio = precioPublicadoDe(plaza, p.costo, fleteCentavos, tasa);
  if (!precio.ok)
    return {
      ok: false,
      mensaje: `No se pudo fijar el precio (${precio.motivo}).`,
    };

  const ahora = new Date();
  await db.batch([
    db
      .insert(enviosProducto)
      .values({
        productoId: p.id,
        costoCentavos: fleteCentavos,
        origen: "cotizado",
        transporte: TRANSPORTE_MANUAL,
        cotizadoEn: ahora,
      })
      .onConflictDoUpdate({
        target: enviosProducto.productoId,
        set: {
          costoCentavos: fleteCentavos,
          origen: "cotizado",
          transporte: TRANSPORTE_MANUAL,
          cotizadoEn: ahora,
        },
      }),
    db
      .update(productos)
      .set({
        precioCentavos: precio.publicadoCentavos,
        estado: "publicado",
        existencias: stock,
        controlaExistencias: true,
        sincronizadoEn: ahora,
        actualizadoEn: ahora,
      })
      .where(eq(productos.id, p.id)),
  ]);
  await guardarTallas(
    p.id,
    p.pid,
    plaza.almacen,
    precio.publicadoCentavos,
    ahora,
    variantes,
  );
  await quitarDePrioridad(p.id, db);

  const url = `https://${mercado.dominio}/es/producto/${p.slug}`;
  return {
    ok: true,
    mensaje: `«${p.titulo}» publicado a ${(precio.publicadoCentavos / 100).toFixed(2)} con envío manual de ${(fleteCentavos / 100).toFixed(2)} y ${stock} en stock.`,
    url,
  };
}
