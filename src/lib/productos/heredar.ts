/**
 * LA VARIANTE SIN PRECIO HEREDA EL DEL PRODUCTO (31 ago 2026 — urgente).
 *
 * Lo destapó un caso real con un cliente esperando: un comercio cargó su
 * router en $50, le agregó la variante «Negro» para llevar el stock y dejó
 * el precio de la fila en 0 — que es lo natural: el precio ya lo había
 * escrito arriba. La ficha publicó **$0.00** y `crearPedido` lo habría
 * cobrado: un router de $53.46 comprable gratis.
 *
 * La regla: **cero en la variante significa «vale lo del producto»**, no
 * «vale cero». El comercio que sí quiere un precio distinto por talla lo
 * escribe, y ese manda.
 */

/** El precio publicado de una línea: el de la variante si lo tiene, si no el del producto. */
export function precioDeVariante(
  varianteCentavos: number | null | undefined,
  productoCentavos: number,
): number {
  const propio = Math.round(Number(varianteCentavos ?? 0));
  return propio > 0 ? propio : productoCentavos;
}

/**
 * ¿Hay dos filas que son LA MISMA combinación?
 *
 * «Negro» y «NEGRO» son el mismo color para cualquier persona — y para el
 * selector de la ficha, dos chips iguales donde nadie sabe cuál elegir.
 * Antes se guardaban las dos (la comparación era por texto exacto) y el
 * stock quedaba partido entre ellas sin que el comercio lo supiera.
 *
 * Devuelve el nombre de la primera repetida, para decírselo con nombre y
 * apellido — «revisa las filas» con ocho filas delante no ayuda a nadie.
 */
export function combinacionRepetida(
  filas: Array<{ talla: string | null; color: string | null }>,
): string | null {
  const vistas = new Set<string>();
  for (const f of filas) {
    const talla = (f.talla ?? "").trim();
    const color = (f.color ?? "").trim();
    if (!talla && !color) continue;
    const clave = `${talla.toLowerCase()}|${color.toLowerCase()}`;
    if (vistas.has(clave)) {
      return [color, talla].filter(Boolean).join(" · ");
    }
    vistas.add(clave);
  }
  return null;
}
