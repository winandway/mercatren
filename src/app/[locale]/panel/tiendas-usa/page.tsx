import { ExternalLink, Package, PencilLine, Store } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { esEquipoInterno } from "@/lib/autorizacion";
import { esMayorista, MINIMO_MAYORISTA } from "@/lib/cj/mayorista";
import { resumenDeEstadosUnidos } from "@/lib/cj/tiendas-us";
import { RUTA_MEDIA } from "@/lib/rutas";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** La meta declarada por el dueño: mil productos. */
const META = 1000;

/**
 * TIENDAS DE ESTADOS UNIDOS: cuánto llevamos y quién tiene qué.
 *
 * ══ POR QUÉ ES OTRA PANTALLA Y NO UN TROZO DE LA DE AGREGAR ══
 *
 * La de «Catálogo de Estados Unidos» sirve para **buscar y agregar**: después
 * de pulsar el botón el producto desaparece de la vista y no queda ni un número
 * en pantalla. Con mil productos por delante eso es trabajar a ciegas — no se
 * sabe si van 78 o 400, ni qué departamento sigue vacío.
 *
 * Aquí se contesta lo contrario: **cuánto hay, dónde está y qué falta**. Son
 * dos trabajos distintos y por eso son dos botones distintos en el menú.
 *
 * ══ EL DEPARTAMENTO VACÍO ES EL DATO ÚTIL ══
 *
 * Saber que hay 300 productos no dice qué buscar mañana. Ver que Mascotas tiene
 * 4 y Ferretería 120, sí. Por eso salen **todos** los departamentos, también
 * los que están en cero: uno que no aparece no se echa de menos.
 */
export default async function PaginaTiendasUsa({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (!(await esEquipoInterno())) redirect(`/${locale}/panel`);

  const t = await getTranslations("panel.tiendasUsa");
  const resumen = await resumenDeEstadosUnidos(locale);

  const avance = Math.min(
    100,
    Math.round((resumen.totalProductos / META) * 100),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Store className="h-5 w-5 text-carga-500" aria-hidden />
          {t("titulo")}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-tinta-suave">{t("texto")}</p>
      </header>

      {/* LO PRIMERO, EL NÚMERO GRANDE. Es lo que se viene a mirar. */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-borde bg-white p-4">
          <p className="text-xs text-tinta-suave">{t("productos")}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {resumen.totalProductos}
          </p>
          <p className="mt-1 text-xs text-tinta-suave">
            {t("deMeta", { meta: META })}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-carga-500"
              style={{ width: `${avance}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-borde bg-white p-4">
          <p className="text-xs text-tinta-suave">{t("publicados")}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {resumen.totalPublicados}
          </p>
          <p className="mt-1 text-xs text-tinta-suave">{t("publicadosPie")}</p>
        </div>

        <div className="rounded-xl border border-borde bg-white p-4">
          <p className="text-xs text-tinta-suave">{t("tiendas")}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {resumen.totalTiendas}
          </p>
          <p className="mt-1 text-xs text-tinta-suave">{t("tiendasPie")}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-bold">{t("lasTiendas")}</h2>

        {resumen.tiendas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-tinta-suave">
            {t("todaviaNada")}
          </p>
        ) : (
          <ul className="divide-y divide-borde overflow-hidden rounded-xl border border-borde bg-white">
            {resumen.tiendas.map((tienda) => (
              <li
                key={tienda.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
              >
                {tienda.logoClave ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`${RUTA_MEDIA}/${tienda.logoClave}`}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-lg object-contain"
                  />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-tinta-suave">
                    <Store className="h-4 w-4" aria-hidden />
                  </span>
                )}

                <div className="min-w-[160px] flex-1">
                  <p className="text-sm font-semibold">
                    {tienda.nombre}
                    {esMayorista(tienda.id) ? (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                        {t("porLotes", { minimo: MINIMO_MAYORISTA })}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-tinta-suave">/{tienda.slug}</p>
                </div>

                <p className="text-right text-sm tabular-nums">
                  <span className="font-bold">{tienda.total}</span>{" "}
                  <span className="text-xs text-tinta-suave">
                    {t("productosCortito")}
                  </span>
                  {tienda.borradores > 0 ? (
                    <span className="block text-xs text-amber-700">
                      {t("enBorrador", { n: tienda.borradores })}
                    </span>
                  ) : null}
                </p>

                <div className="flex gap-2">
                  {/* Se edita en «Mi tienda», que ya sabe subir logo y portada
                      y comprimir la foto en el navegador. Duplicar aquí ese
                      formulario sería mantener dos que se separan al primer
                      arreglo que alguien haga en uno solo. */}
                  <Link
                    href={{
                      pathname: "/panel/mi-tienda",
                      query: { comercio: tienda.slug },
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-slate-50"
                  >
                    <PencilLine className="h-3.5 w-3.5" aria-hidden />
                    {t("editar")}
                  </Link>
                  <Link
                    href={{
                      pathname: "/panel/productos",
                      query: { comercio: tienda.slug },
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-slate-50"
                  >
                    <Package className="h-3.5 w-3.5" aria-hidden />
                    {t("verProductos")}
                  </Link>
                  <a
                    href={`/${locale}/tienda/${tienda.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-slate-50"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    {t("ver")}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-sm font-bold">{t("porDepartamento")}</h2>
        <p className="mb-2 text-xs text-tinta-suave">
          {t("porDepartamentoAyuda")}
        </p>

        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {resumen.departamentos.map((d) => (
            <li
              key={d.slug}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm",
                d.cuantos === 0
                  ? "border-dashed border-slate-300 bg-slate-50 text-tinta-suave"
                  : "border-borde bg-white",
              )}
            >
              <span className="truncate">{d.nombre}</span>
              <span
                className={cn(
                  "shrink-0 tabular-nums",
                  d.cuantos === 0 ? "" : "font-bold",
                )}
              >
                {d.cuantos}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
