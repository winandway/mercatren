import { MapPin, Store } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { TarjetaProducto } from "@/components/catalogo/tarjeta-producto";
import { Link } from "@/i18n/navigation";
import { obtenerTiendaPorSlug } from "@/lib/catalogo/consultas";
import type { Idioma } from "@/lib/dinero";
import { fechaCorta } from "@/lib/fechas";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const datos = await obtenerTiendaPorSlug(slug);
  if (!datos) return {};

  const descripcion =
    (locale === "en"
      ? datos.tienda.descripcionEn
      : datos.tienda.descripcionEs) ?? undefined;

  return { title: datos.tienda.nombre, description: descripcion };
}

/**
 * La tienda de un comercio.
 *
 * Es lo que se abre al hacer clic en el nombre del vendedor: su portada, su
 * presentacion y todo su catalogo. Cada comercio tiene la suya.
 */
export default async function PaginaTienda({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const { pagina } = await searchParams;
  const t = await getTranslations("tiendaPublica");
  const tc = await getTranslations("catalogo");

  const datos = await obtenerTiendaPorSlug(slug, Number(pagina) || 1);
  if (!datos) notFound();

  const { tienda, productos, total, paginas } = datos;
  const descripcion =
    idioma === "en"
      ? (tienda.descripcionEn ?? tienda.descripcionEs)
      : tienda.descripcionEs;

  return (
    <>
      {/* Portada del comercio. Mientras no suba una imagen, se usa el color
          de la marca en vez de dejar un hueco gris. */}
      <div className="relative h-32 bg-gradient-to-r from-riel-900 via-riel-800 to-riel-700 sm:h-44">
        <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px] opacity-20" />
      </div>

      <div className="mx-auto max-w-[1500px] px-4">
        {/* El logo pisa el banner; el nombre va debajo, sobre fondo claro,
            para que se lea siempre. */}
        <header>
          <span className="-mt-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-riel-800 shadow-lg ring-1 ring-borde sm:-mt-12 sm:h-24 sm:w-24">
            <Store className="h-9 w-9" aria-hidden />
          </span>

          <div className="mt-3 min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {tienda.nombre}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-tinta-suave">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {tienda.paisOrigen}
              </span>
              <span>{tc("resultados", { n: total })}</span>
              <span>
                {t("desde")} {fechaCorta(tienda.creadoEn, idioma)}
              </span>
            </p>
          </div>
        </header>

        <p className="mt-4 max-w-3xl text-sm text-tinta-suave">
          {descripcion || t("sinDescripcion")}
        </p>

        <section className="mt-8 pb-4">
          <h2 className="mb-4 text-lg font-bold">{t("productos")}</h2>

          {productos.length === 0 ? (
            <p className="rounded-xl border border-dashed border-borde px-6 py-16 text-center text-sm text-tinta-suave">
              {tc("vacio")}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
              {productos.map((producto) => (
                <li key={producto.id}>
                  <TarjetaProducto producto={producto} idioma={idioma} />
                </li>
              ))}
            </ul>
          )}

          {paginas > 1 ? (
            <p className="mt-8 text-center">
              <Link
                href={`/catalogo?comercio=${tienda.slug}`}
                className="inline-flex items-center gap-2 rounded-lg border border-borde px-5 py-2.5 text-sm font-semibold transition-colors hover:border-carga-500"
              >
                {tc("resultados", { n: total })} →
              </Link>
            </p>
          ) : null}
        </section>
      </div>
    </>
  );
}
