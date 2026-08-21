import "server-only";

import { llamarCj } from "./cliente";
import { limpiarHtml, recortar } from "./limpiar-descripcion";

/**
 * LA DESCRIPCIÓN DEL PRODUCTO, TRAÍDA DE CJ.
 *
 * ══ POR QUÉ LOS 1.071 PRODUCTOS ESTABAN SIN DESCRIPCIÓN ══
 *
 * No es que viniera en inglés y no se tradujera: **nunca se pidió**. El
 * catálogo se arma con el buscador de CJ (`/product/list`), que devuelve
 * nombre, foto, SKU y precio — y nada más. La descripción vive en el DETALLE
 * del producto, que es otra llamada.
 *
 * Se notó el 20 ago 2026 mirando el feed de Google: las 1.071 fichas iban con
 * una «descripción» que en realidad era el título con una coletilla pegada
 * («…Disponible en Mercatren · Estados Unidos»). Google no indexa una ficha
 * que no dice nada del producto, y por eso el catálogo no aparecía.
 *
 * ══ EL DATO SALE DE CJ, NO SE INVENTA ══
 *
 * Es la regla entera de este archivo. La descripción de CJ trae materiales,
 * medidas y qué viene en la caja: datos del fabricante, de los que él responde.
 *
 * Escribir una descripción a partir de la foto sería inventar afirmaciones
 * sobre un producto que nunca hemos tocado. Si decimos «100 % algodón» y es
 * poliéster, eso es una afirmación falsa NUESTRA — y las devoluciones de
 * Estados Unidos las paga Mercatren, además de que Merchant Center suspende
 * por tergiversación. **Si CJ no da descripción, se queda vacía.**
 */

/** Lo que devuelve CJ en el detalle del producto. */
type DetalleCj = {
  description?: string | null;
  productNameEn?: string | null;
  materialNameEn?: string | null;
  packingNameEn?: string | null;
};

/**
 * Trae la descripción de un producto de CJ.
 *
 * ══ CUANDO NO SE PUEDE, DEVUELVE EL MOTIVO — NUNCA UN `null` MUDO ══
 *
 * La primera versión devolvía `null` para todo: CJ caído, CJ limitándonos por
 * cantidad de llamadas, producto sin descripción, petición mal armada. De
 * 1.070 productos, 1.032 salieron «sin datos» y no había forma de saber cuál
 * de las cuatro era. Tres de esas cuatro se arreglan; la otra no. Sin el
 * motivo, no se puede ni empezar.
 */
export type DescripcionDeCj =
  | { ok: true; texto: string }
  | { ok: false; motivo: string };

export async function descripcionDeCj(pid: string): Promise<DescripcionDeCj> {
  const parametros = new URLSearchParams({ pid }).toString();
  const respuesta = await llamarCj<DetalleCj>(
    `/product/query?${parametros}`,
  ).catch((e) => ({ ok: false as const, motivo: `no contestó: ${String(e)}` }));

  if (!respuesta.ok) {
    /* El motivo entero de CJ, que es lo que distingue «este producto no tiene
       descripción» de «te estamos limitando las llamadas». */
    return { ok: false, motivo: respuesta.motivo };
  }

  const d = respuesta.datos;
  if (!d) return { ok: false, motivo: "CJ contestó bien pero sin datos" };

  const partes = [
    limpiarHtml(d.description),
    /* Material y empaque vienen en campos aparte y son justo el dato que la
       gente busca antes de comprar ropa o herramientas. Si están, se suman. */
    d.materialNameEn?.trim() ? `Material: ${d.materialNameEn.trim()}` : "",
    d.packingNameEn?.trim() ? `Incluye: ${d.packingNameEn.trim()}` : "",
  ].filter(Boolean);

  const texto = partes.join("\n\n").trim();
  if (texto.length < 20) {
    return {
      ok: false,
      motivo: texto
        ? `CJ solo dio ${texto.length} caracteres: «${texto}»`
        : "CJ no tiene descripción de este producto",
    };
  }

  return { ok: true, texto: recortar(texto) };
}
