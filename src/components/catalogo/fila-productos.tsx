"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

/**
 * Una fila de productos que se desplaza de lado, como en las tiendas grandes.
 *
 * Las flechas solo se ven en pantallas grandes: en celular se arrastra con el
 * dedo, que es lo natural.
 */
export function FilaProductos({
  children,
  etiquetaAnterior,
  etiquetaSiguiente,
}: {
  children: React.ReactNode;
  etiquetaAnterior: string;
  etiquetaSiguiente: string;
}) {
  const carril = useRef<HTMLDivElement>(null);

  function mover(direccion: 1 | -1) {
    const caja = carril.current;
    if (!caja) return;
    // Se avanza casi una pantalla, dejando un producto a la vista como pista
    // de que hay mas.
    caja.scrollBy({
      left: direccion * (caja.clientWidth * 0.85),
      behavior: "smooth",
    });
  }

  const boton =
    "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-riel-900 shadow-lg ring-1 ring-black/5 transition-colors hover:bg-slate-50 lg:flex";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => mover(-1)}
        aria-label={etiquetaAnterior}
        className={`${boton} -left-4`}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>

      <div
        ref={carril}
        className="flex snap-x snap-mandatory [scrollbar-width:none] gap-3 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <button
        type="button"
        onClick={() => mover(1)}
        aria-label={etiquetaSiguiente}
        className={`${boton} -right-4`}
      >
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
