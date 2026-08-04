import { ArrowRight, Clock, PiggyBank, Store, TrendingUp } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { TarjetaMetrica } from "@/components/panel/tarjeta-metrica";
import { Link } from "@/i18n/navigation";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaCorta } from "@/lib/fechas";
import { tiendaDeLaSesion } from "@/lib/tiendas/consultas";
import { obtenerResumen } from "@/lib/zelle/consultas";

export const dynamic = "force-dynamic";

export default async function PaginaResumen({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const t = await getTranslations("panel");
  const tz = await getTranslations("panel.zelle");
  const resumen = await obtenerResumen();

  /**
   * Un comercio recién dado de alta entra a un panel con todo en cero y sin
   * saber por qué. No está roto: está esperando que Mercatren lo apruebe. Si
   * no se le dice, lo primero que hace es escribir preguntando qué pasó.
   */
  const miTienda = await tiendaDeLaSesion().catch(() => null);
  const enEspera = miTienda?.estado === "pendiente";

  return (
    <div className="space-y-6">
      {enEspera ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="flex items-center gap-2 font-bold text-amber-900">
            <Clock className="h-5 w-5" aria-hidden />
            {t("enRevision.titulo")}
          </h2>
          <p className="mt-2 text-sm text-amber-900/90">
            {t("enRevision.texto", { tienda: miTienda?.nombre ?? "" })}
          </p>
          <p className="mt-2 text-sm text-amber-900/90">
            {t("enRevision.mientras")}
          </p>
        </section>
      ) : null}
      <header>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("resumen.titulo")}
        </h1>
        <p className="mt-1 text-sm text-tinta-suave">
          {t("resumen.subtitulo")}
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaMetrica
          tono="principal"
          Icono={TrendingUp}
          titulo={tz("tarjetas.ingresos")}
          valor={formatearPrecio(
            resumen.entradas.montoAprobadoCentavos,
            idioma,
          )}
          pie={tz("tarjetas.ingresosPie", { n: resumen.entradas.aprobados })}
        />
        <TarjetaMetrica
          Icono={PiggyBank}
          titulo={tz("tarjetas.comision")}
          valor={formatearPrecio(resumen.entradas.comisionCentavos, idioma)}
          pie={tz("tarjetas.comisionPie")}
        />
        <TarjetaMetrica
          Icono={Store}
          titulo={tz("tarjetas.sellers")}
          valor={String(resumen.sellers)}
          pie={tz("tarjetas.sellersPie")}
        />
        <TarjetaMetrica
          tono={resumen.entradas.pendientes > 0 ? "alerta" : "neutro"}
          Icono={Clock}
          titulo={tz("tarjetas.pendientes")}
          valor={String(resumen.entradas.pendientes)}
          pie={tz("tarjetas.pendientesPie", {
            monto: formatearPrecio(
              resumen.entradas.montoPendienteCentavos,
              idioma,
            ),
          })}
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold">{tz("titulo")}</h2>
        <p className="mt-1 max-w-2xl text-sm text-tinta-suave">
          {tz("subtitulo")}
        </p>
        {resumen.primerPago && resumen.ultimoPago ? (
          <p className="mt-2 text-xs text-tinta-suave">
            {tz("periodoDatos", {
              desde: fechaCorta(resumen.primerPago * 1000, idioma) ?? "",
              hasta: fechaCorta(resumen.ultimoPago * 1000, idioma) ?? "",
            })}
          </p>
        ) : null}
        <Link
          href="/panel/pagos-zelle"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-riel-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-riel-800"
        >
          {t("resumen.verPagos")}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
