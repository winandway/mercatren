import { Megaphone, Plus } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AccionesBanner } from "@/components/panel/banners/acciones-banner";
import { Link } from "@/i18n/navigation";
import { esSoporteDeVerdad, exigirEquipoInterno } from "@/lib/autorizacion";
import { listarBanners } from "@/lib/banners/consultas";
import { estaVigente } from "@/lib/banners/reglas";
import { direccionImagen } from "@/lib/catalogo/consultas";
import { fechaCorta } from "@/lib/fechas";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("panel.banners");
  return { title: t("titulo") };
}

/**
 * LOS BANNERS PUBLICITARIOS — solo el rol soporte. Lo pidió el dueño el
 * 23 ago 2026: «unos banners que van a salir en el medio de todas las tiendas…
 * los vamos a manejar nosotros». Aquí se ve qué hay, dónde sale cada uno, cada
 * cuántos productos, si está vigente, y se crea, edita, pausa o elimina.
 */
export default async function PaginaBanners({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await exigirEquipoInterno();
  if (!(await esSoporteDeVerdad())) notFound();

  const t = await getTranslations("panel.banners");
  const lista = await listarBanners();
  const ahora = new Date();

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.08em] text-carga-600 uppercase">
            <Megaphone className="h-4 w-4" aria-hidden />
            {t("etiqueta")}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {t("titulo")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tinta-suave">
            {t("entradilla")}
          </p>
        </div>
        <Link
          href="/panel/banners/nuevo"
          className="inline-flex items-center gap-2 rounded-lg bg-riel-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-riel-800"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t("nuevo")}
        </Link>
      </header>

      {lista.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-borde px-6 py-16 text-center text-sm text-tinta-suave">
          {t("vacio")}
        </p>
      ) : (
        <>
          <p className="mt-6 text-xs text-tinta-suave">
            {t("cuantos", { n: lista.length })}
          </p>
          <ul className="mt-3 space-y-3">
            {lista.map((b) => {
              const vigente = estaVigente(b, ahora);
              const estado = !b.activo
                ? "pausado"
                : vigente
                  ? "activo"
                  : b.desde && ahora < b.desde
                    ? "programado"
                    : "vencido";
              const imagen = direccionImagen({
                url: null,
                clave: b.imagenClave,
              });
              return (
                <li
                  key={b.id}
                  className="flex flex-col gap-3 rounded-xl border border-borde bg-white p-3 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="h-16 w-full shrink-0 overflow-hidden rounded-lg bg-riel-900 sm:w-32">
                    {imagen ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={imagen}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{b.tituloEs}</p>
                    <p className="mt-0.5 truncate text-xs text-tinta-suave">
                      {b.enlace}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-tinta-suave">
                      <span>
                        {b.tiendaId && b.tiendaNombre
                          ? t("soloEnTienda", { tienda: b.tiendaNombre })
                          : t(
                              `ubicaciones.${b.ubicacion === "portada" || b.ubicacion === "tienda" || b.ubicacion === "catalogo" ? b.ubicacion : "todas"}`,
                            )}
                      </span>
                      <span>· {t("cadaProductos", { n: b.cadaCuantos })}</span>
                      <span>
                        ·{" "}
                        {b.desde && b.hasta
                          ? t("desdeHasta", {
                              desde:
                                fechaCorta(b.desde.toISOString(), locale) ?? "",
                              hasta:
                                fechaCorta(b.hasta.toISOString(), locale) ?? "",
                            })
                          : b.desde
                            ? t("soloDesde", {
                                desde:
                                  fechaCorta(b.desde.toISOString(), locale) ??
                                  "",
                              })
                            : b.hasta
                              ? t("soloHasta", {
                                  hasta:
                                    fechaCorta(b.hasta.toISOString(), locale) ??
                                    "",
                                })
                              : t("sinFechas")}
                      </span>
                      <span>· {b.mercado}</span>
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 self-start rounded-full px-2.5 py-1 text-xs font-semibold sm:self-center",
                      estado === "activo" && "bg-emerald-50 text-emerald-800",
                      estado === "pausado" && "bg-slate-100 text-slate-700",
                      estado === "programado" && "bg-amber-50 text-amber-800",
                      estado === "vencido" && "bg-red-50 text-red-800",
                    )}
                  >
                    {t(`estados.${estado}`)}
                  </span>
                  <AccionesBanner id={b.id} activo={b.activo} />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
