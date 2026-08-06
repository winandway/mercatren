import { BadgeCheck, MapPin, Store } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { TarjetaProducto } from "@/components/catalogo/tarjeta-producto";
import { Link } from "@/i18n/navigation";
import { obtenerTiendaPorSlug } from "@/lib/catalogo/consultas";
import type { Idioma } from "@/lib/dinero";
import { fechaCorta } from "@/lib/fechas";
import { RUTA_MEDIA } from "@/lib/rutas";
import { comoJsonLd, fichaDeTienda } from "@/lib/seo/datos-estructurados";
import { rutaCanonica, SITIO } from "@/lib/sitio";

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

  /* Sin descripción propia, se dice lo que sí sabemos: quién es y dónde
     está. Una ficha sin descripción la resume Google como quiere. */
  const resumen =
    descripcion ??
    [datos.tienda.nombre, datos.tienda.ciudad].filter(Boolean).join(" · ");

  return {
    title: datos.tienda.nombre,
    description: resumen,
    alternates: rutaCanonica(`/tienda/${slug}`, locale),
    openGraph: {
      type: "website",
      title: datos.tienda.nombre,
      description: resumen,
      url: `${SITIO.url}/${locale}/tienda/${slug}`,
    },
  };
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

  const logoUrl = tienda.logoClave ? `${RUTA_MEDIA}/${tienda.logoClave}` : null;
  const portadaUrl = tienda.portadaClave
    ? `${RUTA_MEDIA}/${tienda.portadaClave}`
    : null;

  // Solo lo que el comercio lleno de verdad.
  const fichaEmpresa = [
    { etiqueta: t("razonSocial"), valor: tienda.razonSocial },
    {
      etiqueta: t("identificacionFiscal"),
      valor: tienda.identificacionFiscal,
    },
    {
      etiqueta: t("correo"),
      valor: tienda.correoContacto,
      enlace: tienda.correoContacto ? `mailto:${tienda.correoContacto}` : null,
    },
    {
      etiqueta: t("telefono"),
      valor: tienda.telefono,
      enlace: tienda.telefono
        ? `tel:${tienda.telefono.replace(/\s/g, "")}`
        : null,
    },
    {
      etiqueta: t("direccion"),
      valor: [tienda.direccion, tienda.ciudad].filter(Boolean).join(", "),
    },
    {
      etiqueta: t("sitioWeb"),
      valor: tienda.sitioWeb,
      enlace: tienda.sitioWeb,
    },
    { etiqueta: t("horario"), valor: tienda.horario },
  ].filter(
    (d): d is { etiqueta: string; valor: string; enlace?: string | null } =>
      Boolean(d.valor),
  );
  const descripcion =
    idioma === "en"
      ? (tienda.descripcionEn ?? tienda.descripcionEs)
      : tienda.descripcionEs;

  /* La ficha del comercio para Google: sale como una tienda de verdad, con
     su ciudad, y no como una página cualquiera del sitio. */
  const paraGoogle = fichaDeTienda(
    {
      slug: tienda.slug,
      nombre: tienda.nombre,
      descripcion,
      ciudad: tienda.ciudad,
      telefono: tienda.telefono,
      sitioWeb: tienda.sitioWeb,
      logoUrl: logoUrl ? `${SITIO.url}${logoUrl}` : null,
    },
    locale,
  );

  return (
    <>
      <script
        type="application/ld+json"
        // Escapado: el nombre y la descripción los escribe el comercio.
        dangerouslySetInnerHTML={{ __html: comoJsonLd(paraGoogle) }}
      />

      {/* Portada del comercio. Si subio una, se usa; si no, el color de la
          marca en vez de dejar un hueco gris. */}
      <div className="relative h-32 overflow-hidden bg-gradient-to-r from-riel-900 via-riel-800 to-riel-700 sm:h-44">
        {portadaUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={portadaUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px] opacity-20" />
        )}
      </div>

      <div className="mx-auto max-w-[1500px] px-4">
        {/* El logo pisa el banner; el nombre va debajo, sobre fondo claro,
            para que se lea siempre. */}
        <header>
          <span className="relative -mt-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white text-riel-800 shadow-lg ring-1 ring-borde sm:-mt-12 sm:h-24 sm:w-24">
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logoUrl}
                alt={tienda.nombre}
                className="h-full w-full object-cover"
              />
            ) : (
              <Store className="h-9 w-9" aria-hidden />
            )}
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

        {/* Los datos de la empresa. Solo se dibuja lo que el comercio lleno:
            una ficha con huecos da menos confianza que una ficha corta. */}
        {fichaEmpresa.length > 0 ? (
          <section className="mt-6 rounded-xl border border-borde bg-slate-50/60 p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <BadgeCheck className="h-4 w-4 text-precio-600" aria-hidden />
              {t("datosEmpresa")}
            </h2>
            <dl className="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {fichaEmpresa.map((dato) => (
                <div key={dato.etiqueta} className="flex flex-wrap gap-x-2">
                  <dt className="text-tinta-suave">{dato.etiqueta}:</dt>
                  <dd className="font-medium break-all">
                    {dato.enlace ? (
                      <a
                        href={dato.enlace}
                        className="text-carga-600 hover:underline"
                        {...(dato.enlace.startsWith("http")
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {dato.valor}
                      </a>
                    ) : (
                      dato.valor
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

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
