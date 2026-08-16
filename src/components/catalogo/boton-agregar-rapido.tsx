"use client";

import { Check, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useCarrito, type LineaCarrito } from "@/lib/carrito/store";
import { cn } from "@/lib/utils";
import { ventaPausada } from "@/lib/ventas/pausa";

/**
 * Agregar al carrito SIN abrir el producto, desde la tarjeta del catálogo.
 *
 * Antes, para llevarse un tornillo de $0.40 había que abrir la ficha, agregar,
 * volver atrás y buscar dónde se quedó uno. Comprando diez cosas de ferretería
 * eso son treinta clics y una lista a medias: la gente se cansa y se va con
 * tres. Ahora se agrega desde la parrilla y se sigue viendo.
 *
 * VA DENTRO DE UN ENLACE: la tarjeta entera lleva a la ficha, así que el clic
 * y el toque del dedo se detienen aquí a mano. Sin eso, agregar al carrito
 * navegaría al producto — justo lo que se quería evitar.
 *
 * Un producto agotado no lo lleva: no hay nada que agregar.
 */
export function BotonAgregarRapido({
  linea,
  agotado = false,
  paisOrigen,
}: {
  linea: Omit<LineaCarrito, "cantidad">;
  agotado?: boolean;
  /** De dónde despacha la tienda. Decide si la venta está en pausa. */
  paisOrigen?: string | null;
}) {
  const t = useTranslations("catalogo.producto");
  const agregar = useCarrito((estado) => estado.agregar);
  const [agregado, setAgregado] = useState(false);

  /* En pausa NO se dibuja el botón de agregar rápido, y tampoco un cartel: en
     una parrilla de cien tarjetas, cien avisos amarillos se leen como que el
     sitio entero está roto. El motivo se cuenta entero al abrir la ficha, que
     es donde la persona ya decidió que ese producto le interesa. */
  if (ventaPausada(paisOrigen)) return null;

  if (agotado) return null;

  return (
    <button
      type="button"
      aria-label={t("agregar")}
      onClick={(e) => {
        // La tarjeta es un enlace: sin esto, agregar abriría el producto.
        e.preventDefault();
        e.stopPropagation();
        agregar(linea, 1);
        setAgregado(true);
        // Vuelve al "+" solo: el aviso es para confirmar el toque, no para
        // quedarse. Si se queda, el siguiente clic parece que no hizo nada.
        setTimeout(() => setAgregado(false), 1400);
      }}
      className={cn(
        "inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors",
        agregado
          ? "bg-precio-600 text-white"
          : "text-carga-700 bg-carga-500/15 hover:bg-carga-500 hover:text-riel-950",
      )}
    >
      {agregado ? (
        <>
          <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {t("agregado")}
        </>
      ) : (
        <>
          <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {/* "Agregar" a secas: con tres por hilera, "Agregar al carrito"
              parte en dos líneas y el botón se come media tarjeta. El texto
              largo se queda en la etiqueta accesible. */}
          {t("agregarCorto")}
        </>
      )}
    </button>
  );
}
