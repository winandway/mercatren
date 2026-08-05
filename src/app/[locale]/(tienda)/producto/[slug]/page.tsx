import { Store } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BotonAgregar } from "@/components/catalogo/boton-agregar";
import { GaleriaProducto } from "@/components/catalogo/galeria-producto";
import { Link } from "@/i18n/navigation";
import { obtenerProductoPorSlug } from "@/lib/catalogo/consultas";
import { formatearPrecio, type Idioma } from "@/lib/dinero";

export const dynamic = "force-dynamic";

const POCAS_UNIDADES = 5;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const ficha = await obtenerProductoPorSlug(slug);
  if (!ficha) return {};

  const titulo =
    locale === "en"
      ? (ficha.producto.tituloEn ?? ficha.producto.tituloEs)
      : ficha.producto.tituloEs;
  const descripcion =
    (locale === "en"
      ? ficha.producto.descripcionEn
      : ficha.producto.descripcionEs) ?? undefined;

  return {
    title: titulo,
    description: descripcion,
    openGraph: {
      title: titulo,
      description: descripcion,
      images: ficha.imagenes[0] ? [ficha.imagenes[0].url] : undefined,
    },
  };
}

export default async function PaginaProducto({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const t = await getTranslations("catalogo.producto");
  const ficha = await obtenerProductoPorSlug(slug);

  if (!ficha) notFound();

  const { producto } = ficha;
  const titulo =
    idioma === "en"
      ? (producto.tituloEn ?? producto.tituloEs)
      : producto.tituloEs;
  const descripcion =
    idioma === "en"
      ? (producto.descripcionEn ?? producto.descripcionEs)
      : producto.descripcionEs;

  const agotado = producto.controlaExistencias && producto.existencias <= 0;
  const pocas =
    producto.controlaExistencias &&
    producto.existencias > 0 &&
    producto.existencias <= POCAS_UNIDADES;

  const ahorro =
    producto.precioAntesCentavos &&
    producto.precioAntesCentavos > producto.precioCentavos
      ? producto.precioAntesCentavos - producto.precioCentavos
      : null;

  const datos = [
    { etiqueta: t("marca"), valor: producto.marca },
    { etiqueta: t("sku"), valor: producto.sku },
    {
      etiqueta: t("categoria"),
      valor:
        idioma === "en"
          ? (ficha.categoriaNombreEn ?? ficha.categoriaNombreEs)
          : ficha.categoriaNombreEs,
    },
  ].filter((d) => d.valor);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/catalogo"
        className="text-sm font-medium text-tinta-suave hover:text-riel-900"
      >
        ← {t("volverCatalogo")}
      </Link>

      <div className="mt-5 grid gap-8 md:grid-cols-2">
        <GaleriaProducto fotos={ficha.imagenes} titulo={titulo} />

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            {titulo}
          </h1>

          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-tinta-suave">
            <Store className="h-4 w-4" aria-hidden />
            {t("vendidoPor")}{" "}
            <Link
              href={`/tienda/${ficha.tiendaSlug}`}
              className="font-semibold text-riel-900 hover:text-carga-600"
            >
              {ficha.tiendaNombre}
            </Link>
          </p>

          <div className="mt-5 border-y border-borde py-4">
            <p className="flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight tabular-nums">
                {formatearPrecio(
                  producto.precioCentavos,
                  idioma,
                  producto.moneda,
                )}
              </span>
              {producto.unidad ? (
                <span className="text-sm text-tinta-suave">
                  {t("porUnidad", { unidad: producto.unidad })}
                </span>
              ) : null}
            </p>

            {ahorro ? (
              <p className="mt-1 text-sm">
                <span className="text-tinta-suave tabular-nums line-through">
                  {t("antes")}{" "}
                  {formatearPrecio(producto.precioAntesCentavos!, idioma)}
                </span>{" "}
                <span className="font-semibold text-precio-600">
                  {t("ahorras", { monto: formatearPrecio(ahorro, idioma) })}
                </span>
              </p>
            ) : null}

            <p className="mt-2 text-sm">
              {agotado ? (
                <span className="font-semibold text-red-700">
                  {t("sinExistencias")}
                </span>
              ) : producto.controlaExistencias ? (
                <span
                  className={
                    pocas ? "font-semibold text-carga-600" : "text-precio-600"
                  }
                >
                  {t("disponibles", { n: producto.existencias })}
                </span>
              ) : (
                <span className="text-precio-600">{t("disponible")}</span>
              )}
            </p>
          </div>

          <div className="mt-5">
            <BotonAgregar
              agotado={agotado}
              linea={{
                productoId: producto.id,
                slug: producto.slug,
                titulo,
                precioCentavos: producto.precioCentavos,
                moneda: producto.moneda,
                imagenUrl: ficha.imagenes[0]?.url ?? null,
                tiendaNombre: ficha.tiendaNombre,
                tiendaSlug: ficha.tiendaSlug,
                unidad: producto.unidad,
                maximo: producto.controlaExistencias
                  ? producto.existencias
                  : null,
              }}
            />
          </div>

          {datos.length > 0 ? (
            <dl className="mt-6 space-y-2 text-sm">
              {datos.map((d) => (
                <div key={d.etiqueta} className="flex gap-2">
                  <dt className="w-28 shrink-0 text-tinta-suave">
                    {d.etiqueta}
                  </dt>
                  <dd className="font-medium">{d.valor}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>

      <section className="mt-10 max-w-3xl">
        <h2 className="text-lg font-bold">{t("descripcion")}</h2>
        <p className="mt-2 text-sm whitespace-pre-line text-tinta-suave">
          {descripcion || t("sinDescripcion")}
        </p>
      </section>
    </div>
  );
}
