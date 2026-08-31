/**
 * DE «Black-XXL» A COLOR Y TALLA — puro, para poder probarlo.
 *
 * ══ POR QUÉ ESTO ES GRAVE (30 ago 2026) ══
 *
 * Lo cazó el dueño mirando el catálogo: «cuando un producto de ropa agregamos
 * que no tiene talla, ¿cómo lo vendemos? eso es grave». Y tenía razón: el
 * circuito de tallas existía entero —la ficha las ofrece, el carrito las
 * lleva, el pedido las guarda, la compra a CJ las manda— pero el importador
 * de CJ **no guardaba ninguna**, así que una camiseta se vendía sin talla y
 * el sistema le compraba a CJ «la más barata». Es decir: el cliente pagaba y
 * recibía la talla que eligió una máquina.
 *
 * CJ manda las opciones en un solo texto (`variantKey`), separadas por guion
 * y sin decir cuál es cuál: «Black-XXL», «XXL», «Red», «Blue-4XL-Cotton».
 * Aquí se parte con una regla simple y comprobable: **lo que parece talla es
 * talla; el resto es color.**
 */

/** Las tallas de ropa, en las formas que de verdad manda CJ. */
const TALLAS_CONOCIDAS = new Set([
  "XXXS",
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
  "XXXXL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
  "ONE SIZE",
  "ONESIZE",
  "FREE SIZE",
  "F",
]);

/** ¿Este trozo es una talla? */
export function pareceTalla(trozo: string): boolean {
  const t = trozo.trim().toUpperCase();
  if (t.length === 0) return false;
  if (TALLAS_CONOCIDAS.has(t)) return true;
  /* Tallas numéricas de ropa y calzado: «38», «42», «10.5», «US 9». Se
     admite el rango que de verdad se usa en tallas — un «2026» de un título
     no es una talla. */
  if (/^(us|eu|uk)?\s?\d{1,2}(\.5)?$/i.test(t)) {
    const numero = Number(t.replace(/[^\d.]/g, ""));
    return Number.isFinite(numero) && numero >= 2 && numero <= 60;
  }
  /* «3XL» ya está en la lista; esto cubre «12XL» y compañía. */
  return /^\d{1,2}XL$/i.test(t);
}

export type OpcionesDeVariante = {
  /** La talla, normalizada en mayúsculas. `null` si no trae. */
  talla: string | null;
  /** El color (o lo que distinga la variante). `null` si no trae. */
  color: string | null;
};

/**
 * Parte el texto de la variante de CJ en talla y color.
 *
 * Los separadores reales de CJ son el guion y la barra. Lo que parece talla
 * se guarda como talla; lo demás se junta como color — nada se descarta,
 * porque un «Cotton» perdido es una variante que el comprador no distingue
 * de la otra.
 */
export function partirVariante(
  texto: string | null | undefined,
): OpcionesDeVariante {
  const limpio = (texto ?? "").trim();
  if (limpio.length === 0) return { talla: null, color: null };

  const trozos = limpio
    .split(/[-/|]/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  if (trozos.length === 0) return { talla: null, color: null };

  const tallas: string[] = [];
  const resto: string[] = [];
  for (const trozo of trozos) {
    if (pareceTalla(trozo) && tallas.length === 0) {
      tallas.push(trozo.trim().toUpperCase());
    } else {
      resto.push(trozo);
    }
  }

  return {
    talla: tallas[0] ?? null,
    /* El color se guarda como viene: es lo que el comprador ve escrito. */
    color: resto.length > 0 ? resto.join(" · ").slice(0, 60) : null,
  };
}

/**
 * ¿Vale la pena guardar esta variante?
 *
 * Una sola variante sin talla ni color no es una variante — es el producto.
 * Guardarla obligaría al comprador a «elegir» una opción única, que es un
 * paso de más sin ninguna información.
 */
export function valeLaPenaGuardar(
  opciones: Array<OpcionesDeVariante>,
): boolean {
  if (opciones.length < 2) return false;
  return opciones.some((o) => o.talla !== null || o.color !== null);
}
