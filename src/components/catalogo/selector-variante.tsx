"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { BotonAgregar } from "@/components/catalogo/boton-agregar";
import type { LineaCarrito } from "@/lib/carrito/store";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import type { VarianteVista } from "@/lib/productos/variantes";
import { cn } from "@/lib/utils";

/**
 * ELEGIR TALLA Y COLOR, y comprar la variante elegida.
 *
 * El patrón es el de Amazon: una fila de tallas y una de colores; al elegir
 * una combinación cambian el precio, el stock y lo que se agrega al carrito.
 * Lo que NO se puede hacer es dejar comprar una combinación que no existe —
 * talla XL solo en negro es lo normal—, así que las opciones imposibles se
 * enseñan tachadas en vez de esconderse: esconderlas haría pensar que la
 * talla no existe, y verla agotada informa mejor.
 *
 * SE ELIGE ANTES DE PODER COMPRAR. Sin combinación válida el botón no está:
 * agregar "una camisa" sin decir cuál deja al comercio adivinando, y ese es
 * el pedido que termina mal.
 */
export function SelectorVariante({
  variantes,
  linea,
  idioma,
  hayTallas,
  hayColores,
  paisOrigen,
  esEquipoInterno = false,
}: {
  variantes: VarianteVista[];
  /** Lo del producto padre: título, foto, tienda. La variante pone lo suyo. */
  linea: Omit<LineaCarrito, "cantidad" | "precioCentavos" | "maximo">;
  idioma: Idioma;
  hayTallas: { valor: string }[];
  hayColores: { nombre: string; hex: string | null }[];
  /** De dónde despacha la tienda. Decide si la venta está en pausa. */
  paisOrigen?: string | null;
  /** El equipo puede comprar en pausa, para probar el circuito completo. */
  esEquipoInterno?: boolean;
}) {
  const t = useTranslations("catalogo.producto");

  const [talla, setTalla] = useState<string | null>(
    hayTallas.length > 0 ? (hayTallas[0]?.valor ?? null) : null,
  );
  const [color, setColor] = useState<string | null>(
    hayColores.length > 0 ? (hayColores[0]?.nombre ?? null) : null,
  );

  const elegida =
    variantes.find(
      (v) =>
        (talla === null || v.talla === talla) &&
        (color === null || v.color === color),
    ) ?? null;

  /** Si una combinación existe y tiene stock, para tachar las que no. */
  const existe = (t2: string | null, c: string | null) =>
    variantes.some(
      (v) =>
        (t2 === null || v.talla === t2) &&
        (c === null || v.color === c) &&
        v.existencias > 0,
    );

  const agotada = elegida !== null && elegida.existencias <= 0;

  return (
    <div className="space-y-4">
      {hayColores.length > 0 ? (
        <div>
          <p className="text-sm font-semibold">
            {t("color")}
            {color ? (
              <span className="font-normal text-tinta-suave"> · {color}</span>
            ) : null}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {hayColores.map((c) => {
              const disponible = existe(talla, c.nombre);
              return (
                <button
                  key={c.nombre}
                  type="button"
                  onClick={() => setColor(c.nombre)}
                  aria-pressed={color === c.nombre}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                    color === c.nombre
                      ? "border-carga-500 ring-2 ring-carga-500/30"
                      : "border-borde hover:border-tinta-suave",
                    !disponible && "opacity-50",
                  )}
                >
                  {c.hex ? (
                    <span
                      className="h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10"
                      style={{ backgroundColor: c.hex }}
                      aria-hidden
                    />
                  ) : null}
                  <span className={cn(!disponible && "line-through")}>
                    {c.nombre}
                  </span>
                  {color === c.nombre ? (
                    <Check className="h-3.5 w-3.5 text-carga-600" aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {hayTallas.length > 0 ? (
        <div>
          <p className="text-sm font-semibold">
            {t("talla")}
            {talla ? (
              <span className="font-normal text-tinta-suave"> · {talla}</span>
            ) : null}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {hayTallas.map((s) => {
              const disponible = existe(s.valor, color);
              return (
                <button
                  key={s.valor}
                  type="button"
                  onClick={() => setTalla(s.valor)}
                  aria-pressed={talla === s.valor}
                  className={cn(
                    "min-w-12 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    talla === s.valor
                      ? "border-carga-500 ring-2 ring-carga-500/30"
                      : "border-borde hover:border-tinta-suave",
                    !disponible && "line-through opacity-50",
                  )}
                >
                  {s.valor}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* EL PRECIO ES EL DE LA VARIANTE, no el del padre. Una talla especial
          puede costar más, y el número que se ve tiene que ser el que se
          cobra. */}
      {elegida ? (
        <div>
          <p className="text-3xl font-extrabold tracking-tight tabular-nums">
            {formatearPrecio(elegida.precioCentavos, idioma, linea.moneda)}
          </p>
          {agotada ? (
            <p className="mt-1 text-sm font-semibold text-red-700">
              {t("sinExistencias")}
            </p>
          ) : (
            <p className="text-precio-700 mt-1 text-sm font-medium">
              {t("disponibles", { n: Math.floor(elegida.existencias) })}
            </p>
          )}
        </div>
      ) : (
        /* La combinación no existe: se dice, y no se deja comprar. */
        <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-tinta-suave">
          {t("combinacionNoDisponible")}
        </p>
      )}

      {elegida && !agotada ? (
        <BotonAgregar
          paisOrigen={paisOrigen}
          esEquipoInterno={esEquipoInterno}
          linea={{
            ...linea,
            /* El id lleva la variante pegada: si no, dos tallas del mismo
               producto se sumarían en una sola línea del carrito y el
               comercio despacharía la que no era. */
            productoId: `${linea.productoId}:${elegida.id}`,
            titulo: [linea.titulo, elegida.color, elegida.talla]
              .filter(Boolean)
              .join(" · "),
            precioCentavos: elegida.precioCentavos,
            maximo: Math.floor(elegida.existencias),
          }}
        />
      ) : null}
    </div>
  );
}
