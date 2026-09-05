"use server";

import { eq } from "drizzle-orm";

import {
  slugDeLaUrl,
  pasoFlete,
  pasoVariantes,
  type Diagnostico,
  type PasoDiagnostico,
} from "@/lib/cj/diagnostico";
import { almacenDeEntrega, plazaDelMercado } from "@/lib/cj/plazas";
import { getDb } from "@/lib/db";
import { productos, tiendas } from "@/lib/db/schema";
import { mercadoPorCodigo } from "@/lib/mercado/mercados";
import { esSoporteDeVerdad } from "@/lib/autorizacion";

/**
 * PROBAR EL TRAMO DE CJ PEGANDO UN ENLACE (5 sep 2026).
 *
 * Lo pidió el dueño después de la tercera compra fallida: «no puedo estar
 * probando en Stripe cada rato». Y es lo correcto — el cobro con tarjeta ya
 * está probado; lo que falla una y otra vez es el proveedor.
 *
 * Se pega el enlace del producto, se pulsa el botón, y devuelve **lo que CJ
 * contestó en cada paso, entero**. Sin cobrar, sin crear una venta y sin
 * tocar el catálogo.
 */
export async function probarCompraDeCj(entrada: {
  enlace: string;
  /** Adónde se entregaría, para cotizar el envío como en una venta real. */
  estado?: string;
  codigoPostal?: string;
}): Promise<Diagnostico & { ok: boolean; mensaje: string }> {
  /* Solo soporte DE VERDAD: esto le habla al proveedor y gasta puntos de CJ.
     Con el disfraz de «ver su panel» no se prueban compras. */
  if (!(await esSoporteDeVerdad())) {
    return {
      ok: false,
      mensaje: "No tienes permiso para esto.",
      pasos: [],
      seDetuvoEn: "permiso",
    };
  }

  const pasos: PasoDiagnostico[] = [];
  const parar = (donde: string, mensaje: string) => ({
    ok: false,
    mensaje,
    pasos,
    seDetuvoEn: donde,
  });

  const slug = slugDeLaUrl(entrada.enlace);
  if (!slug) {
    return parar(
      "enlace",
      "Pega el enlace de un producto (…/producto/loquesea) o su slug.",
    );
  }

  /* 1 · El producto, con lo que guardamos nosotros. */
  const [ficha] = await getDb()
    .select({
      id: productos.id,
      titulo: productos.tituloEs,
      pid: productos.externoId,
      estado: productos.estado,
      precioCentavos: productos.precioCentavos,
      costoCentavos: productos.precioBaseCentavos,
      existencias: productos.existencias,
      pais: tiendas.paisOrigen,
      tienda: tiendas.nombre,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(eq(productos.slug, slug))
    .limit(1);

  if (!ficha) {
    return parar(
      "producto",
      `No existe ningún producto con el slug «${slug}».`,
    );
  }
  if (!ficha.pid) {
    pasos.push({
      numero: 1,
      titulo: "El producto en nuestro catálogo",
      estado: "fallo",
      resumen: `«${ficha.titulo}» no tiene identificador de CJ guardado, así que no se le puede comprar a nadie.`,
    });
    return parar("producto", "El producto no tiene identificador de CJ.");
  }

  const plaza = plazaDelMercado(mercadoPorCodigo(ficha.pais ?? "US"));
  const almacen = almacenDeEntrega(plaza.paisEntrega);

  pasos.push({
    numero: 1,
    titulo: "El producto en nuestro catálogo",
    estado: ficha.estado === "publicado" ? "ok" : "aviso",
    resumen: `«${ficha.titulo}» · ${ficha.estado} · lo vendemos a ${(ficha.precioCentavos / 100).toFixed(2)} y nos cuesta ${
      ficha.costoCentavos ? (ficha.costoCentavos / 100).toFixed(2) : "—"
    } · stock guardado ${ficha.existencias} · tienda ${ficha.tienda} (${ficha.pais}) · almacén de salida ${almacen}`,
    crudo: ficha,
  });

  /* 2 · Las variantes con existencia EN ESE ALMACÉN. */
  const variantes = await pasoVariantes(ficha.pid, almacen);
  pasos.push(variantes);
  if (variantes.estado === "fallo") {
    return parar("variantes", variantes.resumen);
  }

  const lista = (
    Array.isArray(variantes.crudo) ? variantes.crudo : []
  ) as Array<{
    vid?: string;
    variantSku?: string;
  }>;
  const primera = lista.find((v) => v.vid);
  if (!primera?.vid) {
    return parar("variantes", "CJ devolvió variantes sin identificador.");
  }

  /* 3 · El envío de verdad, con TODAS las opciones y sus campos. */
  const flete = await pasoFlete(primera.vid, 1, {
    desde: almacen,
    hasta: plaza.paisEntrega,
    zip: entrada.codigoPostal || plaza.cotizacion.zip,
    provincia: entrada.estado || plaza.cotizacion.provincia,
  });
  pasos.push(flete);
  if (flete.estado === "fallo") return parar("flete", flete.resumen);

  return {
    ok: true,
    mensaje:
      "Diagnóstico terminado. Mira los almacenes de cada paso: si el transporte más barato sale de un almacén distinto al que tiene existencia, ahí muere el pago.",
    pasos,
    seDetuvoEn: null,
  };
}
