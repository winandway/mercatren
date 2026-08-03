"use client";

import { Check, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useCarrito, type LineaCarrito } from "@/lib/carrito/store";
import { cn } from "@/lib/utils";

/**
 * Agrega el producto al carrito y avisa que se agrego, para que el cliente no
 * se quede con la duda de si hizo clic o no.
 */
export function BotonAgregar({
  linea,
  agotado = false,
}: {
  linea: Omit<LineaCarrito, "cantidad">;
  agotado?: boolean;
}) {
  const t = useTranslations("catalogo.producto");
  const agregar = useCarrito((estado) => estado.agregar);
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);

  if (agotado) {
    return (
      <p className="rounded-lg bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-tinta-suave">
        {t("sinExistencias")}
      </p>
    );
  }

  // Las existencias pueden venir fraccionadas (13.5 kg). Para el selector se
  // baja al entero: por ahora se compran unidades enteras.
  const maximo = Math.max(1, Math.floor(linea.maximo ?? 99));

  return (
    <div className="flex flex-wrap gap-2">
      <label className="inline-flex items-center">
        <span className="sr-only">{t("agregar")}</span>
        <select
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
          className="h-11 rounded-lg border border-borde bg-white px-3 text-sm outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30"
        >
          {Array.from({ length: Math.min(10, maximo) }, (_, i) => i + 1).map(
            (n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ),
          )}
        </select>
      </label>

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
