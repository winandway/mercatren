import "server-only";

import { eq } from "drizzle-orm";

import {
  costoMinimoCentavos,
  existenciasDeVariantes,
  primeraImagen,
} from "@/lib/cj/agregar-por-pid-puro";
import { departamentoDeCj } from "@/lib/cj/departamento";
import { describirProductoPorId } from "@/lib/cj/describir-uno";
import { pedirVariantes } from "@/lib/cj/flete";
import { guardarProducto } from "@/lib/cj/guardar-producto";
import { stockDeVariante } from "@/lib/cj/masivo";
import { plazaDelMercado } from "@/lib/cj/plazas";
import { llamarCjConRitmo } from "@/lib/cj/ritmo";
import { TIENDA_US_GENERAL } from "@/lib/cj/rubros";
import { getDb } from "@/lib/db";
import { tiendas, user } from "@/lib/db/schema";
import { mercadoPorCodigo } from "@/lib/mercado/mercados";

/**
 * ══ UN PRODUCTO DE CJ, EN LA PLAZA QUE SE PIDA, DESDE LA PUERTA (14 sep 2026) ══
 *
 * Richard, con la foto de un limpiador de gorras: _«agrégalo en Estados
 * Unidos, en Colombia y en Chile… con todos los modelos que puedas, con
 * todos los datos»_. El botón del panel mete un producto en UNA plaza (la
 * del selector) y hay que estar delante de la pantalla. Esto hace lo mismo
 * desde la puerta, para las tres, sin tocar el panel.
 *
 * Es la misma pieza que el botón (`guardarProducto`): cotiza el flete DE
 * ESA plaza (EE. UU. desde su almacén, Chile y Colombia desde China), fija
 * el precio en su moneda, respeta el tope chileno y guarda las variantes
 * como tallas. Y de una vez trae la descripción de CJ y la traduce.
 *
 * El dueño de las tiendas que haga falta crear es el mismo de la tienda
 * general de EE. UU. (o, si no lo tuviera, la primera cuenta de Soporte).
 */
type DetalleCj = {
  pid?: string;
  productNameEn?: string | null;
  productImage?: unknown;
  productSku?: string | null;
  sellPrice?: unknown;
  categoryName?: string | null;
  variants?: Array<Record<string, unknown>> | null;
};

export type ResultadoAgregar = {
  ok: boolean;
  mercado: string;
  mensaje: string;
  slug?: string;
  enlace?: string;
  descripcion?: string;
};

async function propietarioDeLasTiendas(): Promise<string | null> {
  const db = getDb();
  const [t] = await db
    .select({ propietarioId: tiendas.propietarioId })
    .from(tiendas)
    .where(eq(tiendas.id, TIENDA_US_GENERAL))
    .limit(1)
    .catch(() => []);
  if (t?.propietarioId) return t.propietarioId;
  const [u] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.rol, "soporte"))
    .limit(1)
    .catch(() => []);
  return u?.id ?? null;
}

export async function agregarPorPid(
  pid: string,
  mercado: "US" | "CL" | "CO",
): Promise<ResultadoAgregar> {
  const plaza = plazaDelMercado(mercadoPorCodigo(mercado));

  const detalle = await llamarCjConRitmo<DetalleCj>(
    `/product/query?${new URLSearchParams({ pid }).toString()}`,
  );
  if (!detalle.ok || !detalle.datos) {
    return {
      ok: false,
      mercado,
      mensaje: `CJ no dio el detalle: ${detalle.ok ? "vacío" : detalle.motivo}`,
    };
  }
  const d = detalle.datos;
  const nombre = (d.productNameEn ?? "").trim();
  if (!nombre) return { ok: false, mercado, mensaje: "CJ no trae el nombre." };

  /* Las variantes DEL ALMACÉN DE LA PLAZA: un modelo puede estar surtido en
     China y agotado en EE. UU., o al revés. Sin ninguna con stock allí, no
     se agrega: sería una ficha que no se puede comprar. */
  const crudas = await pedirVariantes(pid, plaza.almacen);
  const existencias = crudas
    ? existenciasDeVariantes(
        crudas as unknown as Array<Record<string, unknown>>,
        stockDeVariante,
      )
    : 0;
  if (existencias <= 0) {
    return {
      ok: false,
      mercado,
      mensaje: `Sin existencias en el almacén ${plaza.almacen}: no se agrega.`,
    };
  }

  const costoCentavos = costoMinimoCentavos(
    d.sellPrice,
    (crudas ?? d.variants ?? []) as Array<{ variantSellPrice?: unknown }>,
  );
  if (costoCentavos <= 0) {
    return { ok: false, mercado, mensaje: "CJ no trae un precio válido." };
  }

  const propietarioId = await propietarioDeLasTiendas();
  if (!propietarioId) {
    return {
      ok: false,
      mercado,
      mensaje: "No hay cuenta de Soporte que firme las tiendas.",
    };
  }

  const r = await guardarProducto({
    plaza,
    propietarioId,
    externoId: pid,
    nombre,
    imagen: primeraImagen(d.productImage) ?? "",
    sku: (d.productSku ?? "").trim(),
    costoCentavos,
    existencias,
    departamento: departamentoDeCj([d.categoryName], nombre),
  });
  if (!r.ok || !r.productoId) return { ok: false, mercado, mensaje: r.mensaje };

  /* «Con todos los datos»: la descripción de CJ y su traducción, ya. */
  const desc = await describirProductoPorId(r.productoId);

  const enlace = `https://${mercadoPorCodigo(mercado).dominio}/es/producto/${r.slug}`;
  return {
    ok: true,
    mercado,
    mensaje: r.mensaje,
    slug: r.slug,
    enlace,
    descripcion: desc.ok
      ? "con descripción"
      : `sin descripción (${desc.mensaje})`,
  };
}
