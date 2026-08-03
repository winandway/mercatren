"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Carrito del comprador.
 *
 * Vive en el navegador (se guarda solo, asi no se pierde al recargar). Cuando
 * el cliente entra a pagar, el pedido se arma en el servidor y ahi se vuelven a
 * comprobar precios y existencias: NUNCA se confia en lo que diga el carrito
 * del navegador para cobrar.
 *
 * El dinero, como en todo el proyecto, va en centavos enteros.
 */

export type LineaCarrito = {
  productoId: string;
  slug: string;
  titulo: string;
  precioCentavos: number;
  moneda: string;
  imagenUrl: string | null;
  tiendaNombre: string;
  tiendaSlug: string;
  unidad: string | null;
  /** Tope de unidades cuando el comercio lleva inventario. */
  maximo: number | null;
  cantidad: number;
};

type EstadoCarrito = {
  lineas: LineaCarrito[];
  agregar: (linea: Omit<LineaCarrito, "cantidad">, cantidad?: number) => void;
  cambiarCantidad: (productoId: string, cantidad: number) => void;
  quitar: (productoId: string) => void;
  vaciar: () => void;
};

function acotar(cantidad: number, maximo: number | null) {
  const entero = Math.floor(cantidad);
  if (entero < 1) return 1;
  if (maximo !== null && entero > maximo) return maximo;
  return entero;
}

export const useCarrito = create<EstadoCarrito>()(
  persist(
    (set) => ({
      lineas: [],

      agregar: (linea, cantidad = 1) =>
        set((estado) => {
          const existente = estado.lineas.find(
            (l) => l.productoId === linea.productoId,
          );

          if (!existente) {
            return {
              lineas: [
                ...estado.lineas,
                { ...linea, cantidad: acotar(cantidad, linea.maximo) },
              ],
            };
          }

          return {
            lineas: estado.lineas.map((l) =>
              l.productoId === linea.productoId
                ? { ...l, cantidad: acotar(l.cantidad + cantidad, l.maximo) }
                : l,
            ),
          };
        }),

      cambiarCantidad: (productoId, cantidad) =>
        set((estado) => ({
          lineas:
            cantidad < 1
              ? estado.lineas.filter((l) => l.productoId !== productoId)
              : estado.lineas.map((l) =>
                  l.productoId === productoId
                    ? { ...l, cantidad: acotar(cantidad, l.maximo) }
                    : l,
                ),
        })),

      quitar: (productoId) =>
        set((estado) => ({
          lineas: estado.lineas.filter((l) => l.productoId !== productoId),
        })),

      vaciar: () => set({ lineas: [] }),
    }),
    { name: "mercatren-carrito", version: 1 },
  ),
);

/** Cuantas unidades hay en total (lo que se ve en el numerito del carrito). */
export function contarUnidades(lineas: LineaCarrito[]) {
  return lineas.reduce((total, l) => total + l.cantidad, 0);
}

/** Cuanto suma el carrito, en centavos. */
export function sumarCarrito(lineas: LineaCarrito[]) {
  return lineas.reduce((total, l) => total + l.precioCentavos * l.cantidad, 0);
}
