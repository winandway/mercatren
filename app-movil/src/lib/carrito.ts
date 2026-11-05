import type { Precio } from "./api";

/**
 * EL CARRITO, PURO (lo prueba el sitio en `tests/unit/app-movil-carrito.test.ts`).
 *
 * Vive en el teléfono, uno por país (la moneda no se mezcla). El precio que
 * guarda es SOLO para enseñar: al comprar, el servidor vuelve a leer precio,
 * existencia y pausa de la base, y a él solo le llegan el producto y la
 * cantidad.
 */
export const CANTIDAD_MAXIMA = 99;
export const LINEAS_MAXIMAS = 50;

export type LineaCarrito = {
  productoId: string;
  slug: string;
  titulo: string;
  foto: string | null;
  precio: Precio;
  cantidad: number;
};

export function llaveDelCarrito(pais: string): string {
  return `mercatren:carrito:${pais}`;
}

export function sumar(
  lineas: LineaCarrito[],
  nueva: LineaCarrito,
): LineaCarrito[] {
  const ya = lineas.find((l) => l.productoId === nueva.productoId);
  if (ya) {
    return lineas.map((l) =>
      l.productoId === nueva.productoId
        ? {
            ...l,
            cantidad: Math.min(CANTIDAD_MAXIMA, l.cantidad + nueva.cantidad),
          }
        : l,
    );
  }
  if (lineas.length >= LINEAS_MAXIMAS) return lineas;
  return [
    ...lineas,
    {
      ...nueva,
      cantidad: Math.min(CANTIDAD_MAXIMA, Math.max(1, nueva.cantidad)),
    },
  ];
}

/** Cambia la cantidad; en cero (o menos) la línea se quita. */
export function ponerCantidad(
  lineas: LineaCarrito[],
  productoId: string,
  cantidad: number,
): LineaCarrito[] {
  if (cantidad <= 0) return lineas.filter((l) => l.productoId !== productoId);
  return lineas.map((l) =>
    l.productoId === productoId
      ? { ...l, cantidad: Math.min(CANTIDAD_MAXIMA, Math.floor(cantidad)) }
      : l,
  );
}

export function cuantos(lineas: LineaCarrito[]): number {
  return lineas.reduce((s, l) => s + l.cantidad, 0);
}

/** El total para enseñar, en la moneda del carrito (todas iguales). */
export function totalCentavos(lineas: LineaCarrito[]): number {
  return lineas.reduce((s, l) => s + l.precio.centavos * l.cantidad, 0);
}

/** Lo ÚNICO que se manda al servidor: qué producto y cuántos. */
export function lineasParaElPedido(
  lineas: LineaCarrito[],
): Array<{ productoId: string; cantidad: number }> {
  return lineas.map((l) => ({
    productoId: l.productoId,
    cantidad: l.cantidad,
  }));
}

/** Lo guardado, leído con cuidado: una fila rara no tumba el carrito. */
export function leerCarrito(crudo: string | null): LineaCarrito[] {
  if (!crudo) return [];
  try {
    const v = JSON.parse(crudo) as unknown;
    if (!Array.isArray(v)) return [];
    return v
      .filter(
        (l): l is LineaCarrito =>
          !!l &&
          typeof l === "object" &&
          typeof (l as LineaCarrito).productoId === "string" &&
          typeof (l as LineaCarrito).cantidad === "number" &&
          (l as LineaCarrito).cantidad > 0 &&
          typeof (l as LineaCarrito).precio?.centavos === "number",
      )
      .slice(0, LINEAS_MAXIMAS);
  } catch {
    return [];
  }
}
