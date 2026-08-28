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
import { esEquipoInterno } from "@/lib/autorizacion";
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
  comercio?: string;
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
  /* La misma pantalla la miran dos personas distintas. Al equipo le importa
     cuántos comercios y cuántos bancos hay; al comercio, cuánto le pagaron y
     cuánto le quedó. Con un solo texto, uno de los dos lee algo que no habla
     de él. */
  const interno = await esEquipoInterno();

  const [resumen, opciones, cierreDia, cierreSemana, cierreMes, listado] =
    await Promise.all([
      obtenerResumen(filtros.comercio),
      obtenerOpcionesFiltros(filtros.comercio),
      obtenerCierre("dia", filtros.comercio),
      obtenerCierre("semana", filtros.comercio),
      obtenerCierre("mes", filtros.comercio),
      listarPagos({
        busqueda: filtros.q,
        cuentaReceptora: filtros.cuenta,
        banco: filtros.banco,
        estado: filtros.estado as "aprobado" | "pendiente" | "rechazado",
        tipo: filtros.tipo as "entrada" | "retiro",
        comercio: filtros.comercio,
        pagina: Number(filtros.pagina) || 1,
      }),
    ]);

  const { entradas, retiros } = resumen;

  return (
    <div className="space-y-6">
      {/* El título de la sección lo pone el diseño de Cobros: aquí solo va lo
          propio de Zelle, que es de cuándo a cuándo llegan estos datos. */}
      {resumen.primerPago && resumen.ultimoPago ? (
        <p className="text-xs text-tinta-suave">
          {t("periodoDatos", {
            desde: fechaCorta(resumen.primerPago * 1000, idioma) ?? "",
            hasta: fechaCorta(resumen.ultimoPago * 1000, idioma) ?? "",
          })}
        </p>
      ) : null}

      {/* Lo que importa de un vistazo */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaMetrica
          tono="principal"
          Icono={TrendingUp}
          titulo={t(
            interno ? "tarjetas.ingresos" : "tarjetas.ingresosComercio",
          )}
          valor={formatearPrecio(entradas.montoAprobadoCentavos, idioma, "USD")}
          pie={t(
            interno ? "tarjetas.ingresosPie" : "tarjetas.ingresosPieComercio",
            { n: entradas.aprobados },
          )}
        />
        <TarjetaMetrica
          Icono={PiggyBank}
          titulo={t(
            interno ? "tarjetas.comision" : "tarjetas.comisionComercio",
          )}
          valor={formatearPrecio(entradas.comisionCentavos, idioma, "USD")}
          pie={t(
            interno ? "tarjetas.comisionPie" : "tarjetas.comisionPieComercio",
          )}
        />
        <TarjetaMetrica
          Icono={Wallet}
          titulo={t(interno ? "tarjetas.neto" : "tarjetas.netoComercio")}
          valor={formatearPrecio(entradas.netoCentavos, idioma, "USD")}
          pie={t(interno ? "tarjetas.netoPie" : "tarjetas.netoPieComercio")}
        />
        {/* «Comercios activos: 1» no le dice nada a un comercio. */}
        {interno ? (
          <TarjetaMetrica
            Icono={Store}
            titulo={t("tarjetas.sellers")}
            valor={String(resumen.sellers)}
            pie={t("tarjetas.sellersPie")}
          />
        ) : null}
        <TarjetaMetrica
          tono={entradas.pendientes > 0 ? "alerta" : "neutro"}
          Icono={Clock}
          titulo={t("tarjetas.pendientes")}
          valor={String(entradas.pendientes)}
          pie={t(
            interno
              ? "tarjetas.pendientesPie"
              : "tarjetas.pendientesPieComercio",
            {
              monto: formatearPrecio(
                entradas.montoPendienteCentavos,
                idioma,
                "USD",
              ),
            },
          )}
        />
        <TarjetaMetrica
          Icono={Ban}
          titulo={t("tarjetas.rechazados")}
          valor={String(entradas.rechazados)}
          pie={t(
            interno
              ? "tarjetas.rechazadosPie"
              : "tarjetas.rechazadosPieComercio",
          )}
        />
        {interno ? (
          <TarjetaMetrica
            Icono={Landmark}
            titulo={t("tarjetas.bancos")}
            valor={String(resumen.bancos)}
            pie={t("tarjetas.bancosPie")}
          />
        ) : null}
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
        interno={interno}
      />

      {/* La cuenta que recibió es NUESTRA, no suya: filtrar por ella es
          trabajo de conciliación del equipo. */}
      <Controles
        cuentasReceptoras={interno ? opciones.cuentasReceptoras : []}
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
                  "USD",
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
