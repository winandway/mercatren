"use client";

import { Check, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { SelectorCantidad } from "@/components/catalogo/selector-cantidad";
import { AvisoDestino } from "@/components/carrito/aviso-destino";
import { useCarrito, type LineaCarrito } from "@/lib/carrito/store";
import { sePuedeAgregar } from "@/lib/destino/carrito";
import type { Destino } from "@/lib/destino/reglas";
import { cn } from "@/lib/utils";
import { ventaPausada } from "@/lib/ventas/pausa";

/**
 * Agrega el producto al carrito y avisa que se agrego, para que el cliente no
 * se quede con la duda de si hizo clic o no.
 */
export function BotonAgregar({
  linea,
  minimo = 1,
  agotado = false,
  paisOrigen,
  esEquipoInterno = false,
}: {
  linea: Omit<LineaCarrito, "cantidad">;
  /** Lo mínimo que se puede llevar. Doce en la tienda mayorista. */
  minimo?: number;
  agotado?: boolean;
  /** De dónde despacha la tienda. Decide si la venta está en pausa. */
  paisOrigen?: string | null;
  /** El equipo puede comprar en pausa, para probar el circuito completo. */
  esEquipoInterno?: boolean;
}) {
  const t = useTranslations("catalogo.producto");
  const agregar = useCarrito((estado) => estado.agregar);
  const lineas = useCarrito((estado) => estado.lineas);
  const reemplazarPor = useCarrito((estado) => estado.reemplazarPor);
  /* En la mayorista se arranca en el mínimo, no en 1: si el desplegable
     empieza en uno, el comprador pide una unidad de algo que solo se vende por
     docena y se entera al final — o no se entera. */
  const [cantidad, setCantidad] = useState(minimo);
  const [agregado, setAgregado] = useState(false);
  /* Si lo que se quiere meter se entrega en el otro país, se avisa ANTES en
     vez de dejar que el checkout lo rechace. */
  const [choque, setChoque] = useState<{ hay: Destino; entra: Destino } | null>(
    null,
  );

  /**
   * EL CARTEL DE MANTENIMIENTO VA DONDE ESTABA EL BOTÓN.
   *
   * No se esconde la ficha ni se saca del catálogo: el producto se sigue
   * viendo, se busca y Google lo sigue leyendo. Lo único que no se puede es
   * comprarlo — porque todavía no se puede despachar.
   *
   * Se comprueba ANTES que «agotado»: enseñar «sin existencias» de algo que en
   * realidad está en pausa es mentirle al comprador, y además le hace creer que
   * mañana vuelve.
   */
  if (ventaPausada(paisOrigen, { esEquipoInterno })) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
        <p className="text-sm font-bold text-amber-900">{t("pausaTitulo")}</p>
        <p className="mt-0.5 text-sm text-amber-900">{t("pausaTexto")}</p>
      </div>
    );
  }

  if (agotado) {
    return (
      <p className="rounded-lg bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-tinta-suave">
        {t("sinExistencias")}
      </p>
    );
  }

  const enPausaParaElPublico = esEquipoInterno && ventaPausada(paisOrigen);

  return (
    <div>
      {enPausaParaElPublico ? (
        /* Sin este aviso, quien compra desde una cuenta del equipo creería que
           la tienda ya está abierta al público — y no lo está. */
        <p className="mb-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
          {t("pausaEquipo")}
        </p>
      ) : null}

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
            const puede = sePuedeAgregar(lineas, linea);
            if (!puede.ok) {
              setChoque({ hay: puede.hay, entra: puede.entra });
              return;
            }
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

      {choque ? (
        <AvisoDestino
          hay={choque.hay}
          entra={choque.entra}
          onVaciarYAgregar={() => {
            reemplazarPor(linea, cantidad);
            setChoque(null);
            setAgregado(true);
            window.setTimeout(() => setAgregado(false), 2000);
          }}
          onCancelar={() => setChoque(null)}
        />
      ) : null}
    </div>
  );
}
