"use client";

import { ArrowRight, MapPin, Search, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Link } from "@/i18n/navigation";

/**
 * EL DIRECTORIO DE TIENDAS, con su buscador.
 *
 * Lo pidió el dueño el 5 ago 2026: no había NINGUNA forma de encontrar el
 * perfil de un vendedor sin saberse la dirección de memoria. Un marketplace
 * donde las tiendas no se pueden descubrir no es un marketplace: es un
 * catálogo con inquilinos invisibles.
 *
 * El buscador filtra EN LA PÁGINA, sin viaje al servidor: son decenas de
 * tiendas, no miles, y la respuesta instantánea vale más que la precisión de
 * un buscador de verdad. El día que sean miles, esto cambia a búsqueda del
 * lado del servidor con paginación.
 */
export type TiendaDirectorio = {
  slug: string;
  nombre: string;
  descripcion: string | null;
  ciudad: string | null;
  logoUrl: string | null;
  cuantos: number;
};

export function DirectorioTiendas({
  tiendas,
}: {
  tiendas: TiendaDirectorio[];
}) {
  const t = useTranslations("tiendasDirectorio");
  const [busqueda, setBusqueda] = useState("");

  const limpio = busqueda.trim().toLowerCase();
  const visibles = limpio
    ? tiendas.filter(
        (tienda) =>
          tienda.nombre.toLowerCase().includes(limpio) ||
          (tienda.ciudad ?? "").toLowerCase().includes(limpio),
      )
    : tiendas;

  return (
    <div>
      <label className="relative block max-w-md">
        <Search
          className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-tinta-suave"
          aria-hidden
        />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder={t("buscar")}
          aria-label={t("buscar")}
          className="w-full rounded-lg border border-borde bg-white py-2.5 pr-3 pl-9 text-sm outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30"
        />
      </label>

      {visibles.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-borde px-6 py-12 text-center text-sm text-tinta-suave">
          {t("sinResultados")}
        </p>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((tienda) => (
            <li key={tienda.slug}>
              <Link
                href={`/tienda/${tienda.slug}`}
                className="group flex h-full items-start gap-4 rounded-xl bg-white p-4 ring-1 ring-borde transition-all hover:ring-2 hover:ring-carga-500"
              >
                {/* El logo del comercio, o la tiendita genérica si no subió
                    uno. Nunca un hueco. */}
                {tienda.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tienda.logoUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-borde"
                  />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-riel-900 text-carga-400">
                    <Store className="h-6 w-6" aria-hidden />
                  </span>
                )}

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold group-hover:text-carga-600">
                    {tienda.nombre}
                  </span>
                  {tienda.ciudad ? (
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-tinta-suave">
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                      {tienda.ciudad}
                    </span>
                  ) : null}
                  <span className="mt-0.5 block text-xs text-tinta-suave">
                    {t("productos", { n: tienda.cuantos })}
                  </span>
                  {tienda.descripcion ? (
                    <span className="mt-1.5 line-clamp-2 block text-xs leading-relaxed text-tinta-suave">
                      {tienda.descripcion}
                    </span>
                  ) : null}
                </span>

                <ArrowRight
                  className="mt-1 h-4 w-4 shrink-0 text-tinta-suave transition-transform group-hover:translate-x-1 group-hover:text-carga-600"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
