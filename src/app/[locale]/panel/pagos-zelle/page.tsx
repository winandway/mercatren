import {
  Ban,
  Building2,
  Clock,
  Landmark,
  PiggyBank,
  Store,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { TarjetaMetrica } from "@/components/panel/tarjeta-metrica";
import { CierreVentas } from "@/components/panel/zelle/cierre-ventas";
import { Controles } from "@/components/panel/zelle/controles";
import { ListaPagos } from "@/components/panel/zelle/lista-pagos";
import { Paginacion } from "@/components/panel/zelle/paginacion";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaCorta } from "@/lib/fechas";
import {
  listarPagos,
  obtenerCierre,
  obtenerOpcionesFiltros,
  obtenerResumen,
} from "@/lib/zelle/consultas";
import { aPagoVista } from "@/lib/zelle/vista";

export const dynamic = "force-dynamic";

type Parametros = {
  q?: string;
  cuenta?: string;
  banco?: string;
  estado?: string;
  tipo?: string;
  pagina?: string;
};

export default async function PaginaPagosZelle({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Parametros>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const filtros = await searchParams;
  const t = await getTranslations("panel.zelle");

  const [resumen, opciones, cierreDia, cierreSemana, cierreMes, listado] =
    await Promise.all([
      obtenerResumen(),
      obtenerOpcionesFiltros(),
      obtenerCierre("dia"),
      obtenerCierre("semana"),
      obtenerCierre("mes"),
      listarPagos({
        busqueda: filtros.q,
        cuentaReceptora: filtros.cuenta,
        banco: filtros.banco,
        estado: filtros.estado as "aprobado" | "pendiente" | "rechazado",
        tipo: filtros.tipo as "entrada" | "retiro",
        pagina: Number(filtros.pagina) || 1,
      }),
    ]);

  const { entradas, retiros } = resumen;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-tinta-suave">
          {t("subtitulo")}
        </p>
        {resumen.primerPago && resumen.ultimoPago ? (
          <p className="mt-1 text-xs text-tinta-suave">
            {t("periodoDatos", {
              desde: fechaCorta(resumen.primerPago * 1000, idioma) ?? "",
              hasta: fechaCorta(resumen.ultimoPago * 1000, idioma) ?? "",
            })}
          </p>
        ) : null}
      </header>

      {/* Lo que importa de un vistazo */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaMetrica
          tono="principal"
          Icono={TrendingUp}
          titulo={t("tarjetas.ingresos")}
          valor={formatearPrecio(entradas.montoAprobadoCentavos, idioma)}
          pie={t("tarjetas.ingresosPie", { n: entradas.aprobados })}
        />
        <TarjetaMetrica
          Icono={PiggyBank}
          titulo={t("tarjetas.comision")}
          valor={formatearPrecio(entradas.comisionCentavos, idioma)}
          pie={t("tarjetas.comisionPie")}
        />
        <TarjetaMetrica
          Icono={Wallet}
          titulo={t("tarjetas.neto")}
          valor={formatearPrecio(entradas.netoCentavos, idioma)}
          pie={t("tarjetas.netoPie")}
        />
        <TarjetaMetrica
          Icono={Store}
          titulo={t("tarjetas.sellers")}
          valor={String(resumen.sellers)}
          pie={t("tarjetas.sellersPie")}
        />
        <TarjetaMetrica
          tono={entradas.pendientes > 0 ? "alerta" : "neutro"}
          Icono={Clock}
          titulo={t("tarjetas.pendientes")}
          valor={String(entradas.pendientes)}
          pie={t("tarjetas.pendientesPie", {
            monto: formatearPrecio(entradas.montoPendienteCentavos, idioma),
          })}
        />
        <TarjetaMetrica
          Icono={Ban}
          titulo={t("tarjetas.rechazados")}
          valor={String(entradas.rechazados)}
          pie={t("tarjetas.rechazadosPie")}
        />
        <TarjetaMetrica
          Icono={Landmark}
          titulo={t("tarjetas.bancos")}
          valor={String(resumen.bancos)}
          pie={t("tarjetas.bancosPie")}
        />
        <TarjetaMetrica
          tono="apagado"
          Icono={Building2}
          titulo={t("tarjetas.retiros")}
          valor={String(retiros.cantidad)}
          pie={t("tarjetas.retirosPie")}
          etiqueta={t("noContabiliza")}
        />
      </section>

      <CierreVentas
        cierres={{ dia: cierreDia, semana: cierreSemana, mes: cierreMes }}
      />

      <Controles
        cuentasReceptoras={opciones.cuentasReceptoras}
        bancos={opciones.bancos}
      />

      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">
            {t("buscador.resultados", { n: listado.total })}
          </p>
          {listado.sumaFiltrada.contados > 0 ? (
            <p className="text-xs text-tinta-suave">
              {t("buscador.sumaFiltrada", {
                monto: formatearPrecio(
                  listado.sumaFiltrada.montoCentavos,
                  idioma,
                ),
              })}
            </p>
          ) : null}
        </div>

        <ListaPagos pagos={listado.pagos.map(aPagoVista)} />

        <Paginacion pagina={listado.pagina} paginas={listado.paginas} />
      </section>
    </div>
  );
}
