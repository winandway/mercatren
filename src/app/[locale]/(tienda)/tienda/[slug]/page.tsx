import {
  BadgeCheck,
  CalendarDays,
  Clock,
  MapPin,
  MessageCircle,
  Package,
  Store,
  Truck,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { TarjetaProducto } from "@/components/catalogo/tarjeta-producto";
import { Link } from "@/i18n/navigation";
import { obtenerTiendaPorSlug } from "@/lib/catalogo/consultas";
import type { Idioma } from "@/lib/dinero";
import { politicaDeEnvio } from "@/lib/envios/consultas";
import { porcentajeVisible } from "@/lib/envios/politica";
import { colorGuardado } from "@/lib/marca/acciones";
import { colorDeBanner } from "@/lib/marca/colores";
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
  const te = await getTranslations("envio");

  const datos = await obtenerTiendaPorSlug(slug, Number(pagina) || 1);
  if (!datos) notFound();

  const { tienda, productos, total, paginas } = datos;

  /* Cómo despacha. Un comercio sin fila devuelve "sin definir", que NO es lo
     mismo que "no envía": es que todavía no lo dijo, y así se enseña. */
  const envio = await politicaDeEnvio(tienda.id);
  const colorElegido = await colorGuardado(tienda.id);
  const cobertura =
    idioma === "en"
      ? (envio.coberturaEn ?? envio.coberturaEs)
      : envio.coberturaEs;
  const plazo =
    idioma === "en" ? (envio.plazoEn ?? envio.plazoEs) : envio.plazoEs;

  /* El enlace de WhatsApp se arma del teléfono que el comercio ya cargó. Si no
     lo cargó, no se dibuja el botón: mejor sin botón que un botón roto. */
  const soloDigitos = (tienda.telefono ?? "").replace(/[^0-9]/g, "");
  const whatsapp = soloDigitos ? `https://wa.me/${soloDigitos}` : null;

  /* El color de este comercio: el que eligió, o uno derivado de su nombre si
     nunca eligió. Nunca queda sin fondo. */
  const color = colorDeBanner(colorElegido, tienda.nombre);

  /* "VE" no le dice nada a nadie, y ahora va en grande debajo del nombre.
     `Intl.DisplayNames` lo traduce al idioma de quien mira sin que tengamos que
     mantener una lista de países. Si el código no existe, se deja como está:
     mejor "VE" que una pantalla rota. */
  let pais = tienda.paisOrigen;
  try {
    pais =
      new Intl.DisplayNames([idioma], { type: "region" }).of(
        tienda.paisOrigen,
      ) ?? tienda.paisOrigen;
  } catch {
    /* Un código inventado en la base no puede tumbar la ficha. */
  }

  const logoUrl = tienda.logoClave ? `${RUTA_MEDIA}/${tienda.logoClave}` : null;
  const portadaUrl = tienda.portadaClave
    ? `${RUTA_MEDIA}/${tienda.portadaClave}`
    : null;

  /* LOS DATOS QUE VAN EN EL BANNER (7 ago 2026).

     Suben aquí desde el final de la página, y es un cambio de fondo: quien
     llega sin conocer la tienda necesita ver que hay una empresa de verdad
     detrás ANTES de bajar, no después de los productos.

     Solo cuatro, a propósito: la razón social NO sube porque ya es el nombre
     grande, y el teléfono tampoco porque ya es el botón de WhatsApp.

     Se dibuja SOLO lo que el comercio llenó: un renglón que diga
     "Sitio web: —" da menos confianza que no tenerlo. */
  const datosEmpresa = [
    {
      etiqueta: t("identificacionFiscal"),
      valor: tienda.identificacionFiscal,
      enlace: null as string | null,
      ancho: false,
    },
    {
      etiqueta: t("correo"),
      valor: tienda.correoContacto,
      enlace: tienda.correoContacto ? `mailto:${tienda.correoContacto}` : null,
      ancho: false,
    },
    {
      etiqueta: t("direccion"),
      valor: [tienda.direccion, tienda.ciudad].filter(Boolean).join(", "),
      enlace: null as string | null,
      ancho: true,
    },
    {
      etiqueta: t("sitioWeb"),
      valor: tienda.sitioWeb,
      enlace: tienda.sitioWeb,
      ancho: true,
    },
  ].filter(
    (
      d,
    ): d is {
      etiqueta: string;
      valor: string;
      enlace: string | null;
      ancho: boolean;
    } => Boolean(d.valor),
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

      {/* LA PORTADA.

          El nombre va DENTRO, en grande, y a la derecha los datos fiscales.
          El color sale del comercio: el que eligió, o uno derivado de su
          nombre. Así veinte tiendas no se ven todas iguales; el porqué de que
          la paleta sea cerrada está en `marca/colores.ts`. */}
      <div
        className="relative overflow-hidden"
        style={{ backgroundColor: color.hex }}
      >
        {portadaUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={portadaUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Sin esta capa el nombre se pierde sobre una foto clara. Lleva
                el color del comercio, no un negro genérico. */}
            <div
              className="absolute inset-0 opacity-80"
              style={{ backgroundColor: color.hex }}
            />
          </>
        ) : (
          <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px] opacity-20" />
        )}

        <div className="relative mx-auto flex max-w-[1500px] flex-wrap gap-x-10 gap-y-6 px-4 pt-7 pb-14 sm:pt-9 sm:pb-16">
          <div className="min-w-[240px] flex-[1.3]">
            <h1 className="max-w-2xl text-3xl leading-tight font-bold tracking-tight text-white sm:text-4xl">
              {tienda.nombre}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-xs tracking-wide text-white/65 uppercase">
              <MapPin className="h-4 w-4" aria-hidden />
              {[tienda.ciudad, pais].filter(Boolean).join(", ")}
            </p>
          </div>

          {/* Separados por una línea fina y no por una caja: una caja dentro
              del banner se ve como un parche pegado encima.

              Los enlaces van en BLANCO subrayado, no en naranja: el naranja se
              ve bien sobre el azul pero se ensucia sobre el vino y el tierra, y
              ahora el fondo lo elige cada comercio. */}
          {datosEmpresa.length > 0 ? (
            <dl className="grid min-w-[230px] flex-1 grid-cols-1 gap-x-6 gap-y-2.5 border-l-2 border-white/15 pl-4 sm:grid-cols-2">
              {datosEmpresa.map((dato) => (
                <div
                  key={dato.etiqueta}
                  className={dato.ancho ? "sm:col-span-2" : ""}
                >
                  <dt className="text-[10.5px] tracking-wider text-white/55 uppercase">
                    {dato.etiqueta}
                  </dt>
                  <dd className="mt-0.5 text-[12.5px] break-words text-white">
                    {dato.enlace ? (
                      <a
                        href={dato.enlace}
                        className="underline decoration-white/40 underline-offset-2 hover:decoration-white"
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
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4">
        {/* El logo pisa el borde de la portada: medio arriba, medio abajo. */}
        <header className="flex flex-wrap items-end gap-4">
          {/* El logo pisa el borde de la portada, y el sello va MONTADO en su
              esquina — colocado en el flujo, al lado, se lo comía el botón de
              contacto. Por eso el envoltorio es `relative` y el sello
              `absolute`: así no ocupa sitio y nada se le pone encima. */}
          <div className="relative -mt-11 shrink-0 sm:-mt-12">
            <span className="flex h-22 w-22 items-center justify-center overflow-hidden rounded-2xl bg-white text-riel-800 shadow-lg ring-4 ring-white">
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

            {/* Abajo a la derecha y no arriba: arriba choca con el borde de la
                portada y se pierde sobre el color; abajo cae sobre fondo blanco
                y se lee siempre. Como en las redes sociales. */}
            <span
              className="absolute -right-1.5 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-precio-600 ring-3 ring-white"
              title={t("verificada")}
            >
              <BadgeCheck className="h-4 w-4 text-white" aria-hidden />
              <span className="sr-only">{t("verificada")}</span>
            </span>
          </div>

          {/* El contacto va JUNTO al logo, no al final: quien entra y quiere
              preguntar algo lo hace en los primeros segundos, no después de
              bajar por todo el catálogo. */}
          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-3 inline-flex items-center gap-2 rounded-lg bg-riel-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              {t("escribir")}
            </a>
          ) : null}
        </header>

        {/* La franja de confianza: es lo que necesita quien llega de Google y
            no conoce a este comercio. */}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-tinta-suave">
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck className="h-4 w-4 text-precio-600" aria-hidden />
            {t("verificada")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Package className="h-4 w-4" aria-hidden />
            {tc("resultados", { n: total })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" aria-hidden />
            {t("desde")} {fechaCorta(tienda.creadoEn, idioma)}
          </span>
        </div>

        {/* En texto normal, no dentro de una caja: es lo único escrito con las
            palabras del comercio y en una tarjeta gris se lee como un dato
            más y se salta. */}
        <p className="mt-5 max-w-3xl text-base leading-relaxed">
          {descripcion || t("sinDescripcion")}
        </p>

        {/* Cómo se recibe. La línea de envío aparece SIEMPRE, incluso cuando
            el comercio no lo ha definido — así ve el hueco en su propia ficha
            y entra a completarlo. */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="flex items-center gap-1.5 text-xs text-tinta-suave">
              <Truck className="h-4 w-4" aria-hidden />
              {te("titulo")}
            </p>
            <p className="mt-1 text-sm font-medium">
              {envio.modo === "porcentaje"
                ? te("conCosto", {
                    pct: porcentajeVisible(envio.porcentajePuntosBase),
                  })
                : te(
                    envio.modo === "incluido"
                      ? "incluido"
                      : envio.modo === "solo_retiro"
                        ? "soloRetiro"
                        : "sinDefinir",
                  )}
            </p>
            {cobertura ? (
              <p className="mt-0.5 text-xs text-tinta-suave">{cobertura}</p>
            ) : null}
            {plazo ? (
              <p className="text-xs text-tinta-suave">
                {te("plazo", { plazo })}
              </p>
            ) : null}
          </div>

          {tienda.horario ? (
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="flex items-center gap-1.5 text-xs text-tinta-suave">
                <Clock className="h-4 w-4" aria-hidden />
                {t("horario")}
              </p>
              <p className="mt-1 text-sm font-medium">{tienda.horario}</p>
            </div>
          ) : null}

          {tienda.direccion ? (
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="flex items-center gap-1.5 text-xs text-tinta-suave">
                <Store className="h-4 w-4" aria-hidden />
                {t("dondeSeRetira")}
              </p>
              <p className="mt-1 text-sm font-medium">{tienda.direccion}</p>
            </div>
          ) : null}
        </div>

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
