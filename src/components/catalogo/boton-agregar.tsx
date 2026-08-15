"use client";

import { Check, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { SelectorCantidad } from "@/components/catalogo/selector-cantidad";
import { useCarrito, type LineaCarrito } from "@/lib/carrito/store";
import { cn } from "@/lib/utils";

/**
 * Agrega el producto al carrito y avisa que se agrego, para que el cliente no
 * se quede con la duda de si hizo clic o no.
 */
export function BotonAgregar({
  linea,
  minimo = 1,
  agotado = false,
}: {
  linea: Omit<LineaCarrito, "cantidad">;
  /** Lo mínimo que se puede llevar. Doce en la tienda mayorista. */
  minimo?: number;
  agotado?: boolean;
}) {
  const t = useTranslations("catalogo.producto");
  const agregar = useCarrito((estado) => estado.agregar);
  /* En la mayorista se arranca en el mínimo, no en 1: si el desplegable
     empieza en uno, el comprador pide una unidad de algo que solo se vende por
     docena y se entera al final — o no se entera. */
  const [cantidad, setCantidad] = useState(minimo);
  const [agregado, setAgregado] = useState(false);

  if (agotado) {
    return (
      <p className="rounded-lg bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-tinta-suave">
        {t("sinExistencias")}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* 1–9 y "10+": el que quiere cien, la escribe. El tope real lo ponen
          las existencias, no el desplegable. */}
      <SelectorCantidad
        valor={cantidad}
        minimo={minimo}
        maximo={linea.maximo}
        onCambiar={setCantidad}
        etiqueta={t("cantidad")}
      />

      <button
        type="button"
        onClick={() => {
          agregar(linea, cantidad);
          setAgregado(true);
          window.setTimeout(() => setAgregado(false), 2000);
        }}
        className={cn(
          "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold transition-colors",
          agregado
            ? "bg-precio-600 text-white"
            : "bg-carga-500 text-riel-950 hover:bg-carga-600",
        )}
      >
        {agregado ? (
          <Check className="h-4 w-4" aria-hidden />
        ) : (
          <ShoppingCart className="h-4 w-4" aria-hidden />
        )}
        {t("agregar")}
      </button>
    </div>
  );
}
