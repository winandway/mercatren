"use client";

import {
  ImageOff,
  MoreVertical,
  ShoppingCart,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";

import { SelectorCantidad } from "@/components/catalogo/selector-cantidad";
import { Link } from "@/i18n/navigation";
import { contarUnidades, sumarCarrito, useCarrito } from "@/lib/carrito/store";
import { carritoMezclado, lineasDeOtroDestino } from "@/lib/destino/carrito";
import { formatearPrecio, type Idioma } from "@/lib/dinero";

/**
 * El carrito, que vive en el navegador.
 *
 * Los precios que se ven aqui son de referencia: al confirmar el pedido se
 * vuelven a leer de la base, asi que nadie puede pagar de menos manipulando
 * lo que tiene guardado.
 */
export function ListaCarrito() {
  /* Un carrito guardado ANTES de la regla puede mezclar destinos: se avisa y
     se le da el botón para dejar solo unos u otros. Sin esto, el checkout lo
     rechazaría y la persona no sabría por qué. */
  const t = useTranslations("carrito");
  const idioma = useLocale() as Idioma;
  const { lineas, cambiarCantidad, quitar, vaciar, quitarVarias } =
    useCarrito();
  const [pidiendoVaciar, setPidiendoVaciar] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Hasta que el navegador no lea lo guardado, se muestra vacio: asi el primer
  // dibujo coincide con el del servidor.
  const enElNavegador = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!enElNavegador) return null;

  if (lineas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-borde px-6 py-16 text-center">
        <ShoppingCart
          className="mx-auto h-10 w-10 text-tinta-suave"
          aria-hidden
        />
        <h2 className="mt-4 text-lg font-bold">{t("vacio")}</h2>
        <p className="mt-1 text-sm text-tinta-suave">{t("vacioTexto")}</p>
        <Link href="/catalogo" className="boton-principal mt-6">
          {t("verCatalogo")}
        </Link>
      </div>
    );
  }

  const total = sumarCarrito(lineas);

  const mezclado = carritoMezclado(lineas);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        {mezclado ? (
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-900">
            <p className="flex items-start gap-2 font-semibold">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {t("destino.mezclado")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 pl-6">
              <button
                type="button"
                onClick={() =>
                  quitarVarias(
                    lineasDeOtroDestino(lineas, "VE").map((l) => l.productoId),
                  )
                }
                className="rounded-lg bg-amber-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-800"
              >
                {t("destino.quitarLosDeEEUU")}
              </button>
              <button
                type="button"
                onClick={() =>
                  quitarVarias(
                    lineasDeOtroDestino(lineas, "US").map((l) => l.productoId),
                  )
                }
                className="rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-semibold hover:bg-amber-100"
              >
                {t("destino.quitarLosDeVenezuela")}
              </button>
            </div>
          </div>
        ) : null}

        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">
            {t("articulos", { n: contarUnidades(lineas) })}
          </p>

          {/* Vaciar el carrito es lo unico destructivo de verdad, y por eso
              vive dentro del menu, no suelto a la vista. */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuAbierto((v) => !v)}
              aria-label={t("masOpciones")}
              aria-expanded={menuAbierto}
              className="rounded-lg p-2 text-tinta-suave transition-colors hover:bg-slate-100"
            >
              <MoreVertical className="h-4 w-4" aria-hidden />
            </button>

            {menuAbierto ? (
              <div className="absolute right-0 z-10 mt-1 w-56 rounded-lg border border-borde bg-white p-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMenuAbierto(false);
                    setPidiendoVaciar(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-700 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {t("vaciar")}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {pidiendoVaciar ? (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-medium text-red-900">
              {t("confirmarVaciar")}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  vaciar();
                  setPidiendoVaciar(false);
                }}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                {t("si")}
              </button>
              <button
                type="button"
                onClick={() => setPidiendoVaciar(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-white"
              >
                {t("no")}
              </button>
            </div>
          </div>
        ) : null}

        <ul className="divide-y divide-borde rounded-xl border border-borde">
          {lineas.map((linea) => (
            <li
              key={linea.productoId}
              className="flex gap-3 p-3 sm:gap-4 sm:p-4"
            >
              <Link
                href={`/producto/${linea.slug}`}
                className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-borde bg-slate-50"
              >
                {linea.imagenUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={linea.imagenUrl}
                    alt={linea.titulo}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-tinta-suave">
                    <ImageOff className="h-5 w-5" aria-hidden />
                  </span>
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/producto/${linea.slug}`}
                  className="line-clamp-2 text-sm font-medium hover:text-carga-600"
                >
                  {linea.titulo}
                </Link>
                <p className="mt-0.5 text-xs text-tinta-suave">
                  {t("vendidoPor")} {linea.tiendaNombre}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    <span className="text-tinta-suave">{t("cantidad")}</span>
                    {/* La misma pieza de la ficha: 1–9 y "10+" para escribir
                        la cantidad. El tope es la existencia real. */}
                    <SelectorCantidad
                      valor={linea.cantidad}
                      maximo={linea.maximo}
                      onCambiar={(n) => cambiarCantidad(linea.productoId, n)}
                      etiqueta={t("cantidad")}
                      compacto
                    />
                  </span>

                  <button
                    type="button"
                    onClick={() => quitar(linea.productoId)}
                    className="text-xs font-medium text-tinta-suave underline underline-offset-2 hover:text-red-700"
                  >
                    {t("quitar")}
                  </button>
                </div>
              </div>

              <p className="shrink-0 text-sm font-bold tabular-nums">
                {formatearPrecio(
                  linea.precioCentavos * linea.cantidad,
                  idioma,
                  linea.moneda,
                )}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <aside className="h-fit rounded-xl border border-borde p-4 lg:sticky lg:top-28">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-tinta-suave">{t("subtotal")}</dt>
            <dd className="font-medium tabular-nums">
              {formatearPrecio(total, idioma)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-tinta-suave">{t("envio")}</dt>
            <dd className="text-right text-xs text-tinta-suave">
              {t("envioPorAcordar")}
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-borde pt-2 text-base font-bold">
            <dt>{t("total")}</dt>
            <dd className="tabular-nums">{formatearPrecio(total, idioma)}</dd>
          </div>
        </dl>

        <Link href="/checkout" className="boton-principal mt-4 w-full">
          {t("pagar")}
        </Link>

        <Link
          href="/catalogo"
          className="mt-2 block text-center text-xs font-medium text-tinta-suave hover:text-riel-900"
        >
          {t("seguirComprando")}
        </Link>
      </aside>
    </div>
  );
}
