import {
  ArrowRight,
  CalendarDays,
  Clock,
  PiggyBank,
  Store,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PrimerosPasos } from "@/components/panel/primeros-pasos";
import { TarjetaMetrica } from "@/components/panel/tarjeta-metrica";
import { Link } from "@/i18n/navigation";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaCorta } from "@/lib/fechas";
import { esEquipoInterno } from "@/lib/autorizacion";
import { resumenDeHoy } from "@/lib/panel/hoy";
import { primerosPasos } from "@/lib/tiendas/consultas";
import { cn } from "@/lib/utils";
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
  const [resumen, hoy, interno] = await Promise.all([
    obtenerResumen(),
    resumenDeHoy(),
    esEquipoInterno(),
  ]);
  const esComercio = !interno;

  /**
   * Un comercio recién dado de alta entra a un panel con todo en cero y sin
   * saber por qué. No está roto: está esperando que Mercatren lo apruebe. Si
   * no se le dice, lo primero que hace es escribir preguntando qué pasó.
   */
  const guia = await primerosPasos().catch(() => null);
  const miTienda = guia?.tienda ?? null;
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

      {/* Los cuatro pasos para estar vendiendo. Desaparece al completarlos. */}
      {guia ? <PrimerosPasos pasos={guia.pasos} /> : null}
      <header>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("resumen.titulo")}
        </h1>
        <p className="mt-1 text-sm text-tinta-suave">
          {t(esComercio ? "resumen.subtituloComercio" : "resumen.subtitulo")}
        </p>
      </header>

      {/**
       * LO DE HOY, PRIMERO Y CONTANDO LAS DOS FORMAS DE PAGO.
       *
       * Esta pantalla salía entera de `pagos_zelle`: el número grande era el
       * histórico ya liquidado en el sistema anterior y **no contaba ni una
       * venta con tarjeta**. Quien abría el panel el día de una venta con
       * tarjeta no la veía por ninguna parte.
       */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaMetrica
          tono="principal"
          Icono={TrendingUp}
          titulo={t("resumen.hoy")}
          valor={formatearPrecio(hoy.hoyCentavos, idioma, hoy.moneda)}
          pie={t("resumen.hoyPie", { n: hoy.hoyCantidad })}
        />
        <TarjetaMetrica
          Icono={CalendarDays}
          titulo={t("resumen.mes")}
          valor={formatearPrecio(hoy.mesCentavos, idioma, hoy.moneda)}
          pie={t("resumen.mesPie", { n: hoy.mesCantidad })}
        />
        {/* LO QUE COBRA MERCATREN. Al comercio se le dice tal cual —es lo que
            se le descontó, y esconderlo es lo que hace desconfiar—, pero desde
            su lado: para él no es «nuestro margen», es su comisión. */}
        <TarjetaMetrica
          Icono={PiggyBank}
          titulo={t(esComercio ? "resumen.comision" : "resumen.margen")}
          valor={formatearPrecio(hoy.mesMargenCentavos, idioma, hoy.moneda)}
          pie={t(esComercio ? "resumen.comisionPie" : "resumen.margenPie")}
        />

        {/**
         * LA CUARTA TARJETA NO ES LA MISMA PARA LOS DOS.
         *
         * Al equipo le sirve saber cuántos comercios hay operando. A un
         * comercio, «Comercios activos: 1» no le dice nada — y en cambio lo
         * que sí quiere saber al entrar es cuánto tiene para sacar.
         */}
        {esComercio ? (
          <TarjetaMetrica
            Icono={Wallet}
            titulo={t("resumen.disponible")}
            valor={formatearPrecio(
              hoy.disponibleCentavos ?? 0,
              idioma,
              hoy.moneda,
            )}
            pie={t("resumen.disponiblePie")}
          />
        ) : (
          <TarjetaMetrica
            Icono={Store}
            titulo={tz("tarjetas.sellers")}
            valor={String(resumen.sellers)}
            pie={tz("tarjetas.sellersPie")}
          />
        )}
      </section>

      {/* LO QUE ESPERA A UNA PERSONA. Es la lista de tareas del día, y cada
          renglón lleva a donde se resuelve. Un pendiente que no se ve no se
          hace. */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold">{t("resumen.porHacer")}</h2>

        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            {
              clave: esComercio ? "misComprobantes" : "validar",
              n: hoy.porValidar,
              href: "/panel/validacion",
              alerta: true,
            },
            {
              clave: esComercio ? "misEntregas" : "entregar",
              n: hoy.porEntregar,
              href: "/panel/ordenes?estado=pagado",
              alerta: false,
            },
            {
              clave: esComercio ? "misRetiros" : "retiros",
              n: hoy.retirosPendientes,
              href: "/panel/retiros",
              alerta: true,
            },
            {
              clave: "contracargos",
              n: hoy.contracargos,
              href: "/panel/cobros",
              alerta: true,
            },
          ].map(({ clave, n, href, alerta }) => (
            <li key={clave}>
              <Link
                href={href}
                className="flex items-center justify-between gap-3 rounded-lg border border-borde px-3 py-2 text-sm transition-colors hover:border-carga-500"
              >
                <span className={n === 0 ? "text-tinta-suave" : ""}>
                  {t(`resumen.tareas.${clave}`)}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
                    n === 0
                      ? "bg-slate-100 text-tinta-suave"
                      : alerta
                        ? "bg-carga-500 text-riel-950"
                        : "bg-riel-900 text-white",
                  )}
                >
                  {n}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/panel/ordenes"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-riel-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-riel-800"
        >
          {t("resumen.verOrdenes")}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>

      {/* EL HISTÓRICO, ABAJO Y COMO LO QUE ES: un archivo ya liquidado en el
          sistema anterior. Estaba arriba y como si fuera la operación de hoy. */}
      {resumen.entradas.aprobados > 0 ? (
        <section className="rounded-xl border border-borde bg-white p-5">
          <h2 className="text-sm font-bold">{t("resumen.archivo")}</h2>
          <p className="mt-1 max-w-2xl text-sm text-tinta-suave">
            {t(
              esComercio
                ? "resumen.archivoTextoComercio"
                : "resumen.archivoTexto",
              {
                n: resumen.entradas.aprobados,
                monto: formatearPrecio(
                  resumen.entradas.montoAprobadoCentavos,
                  idioma,
                ),
              },
            )}
          </p>
          {resumen.primerPago && resumen.ultimoPago ? (
            <p className="mt-1 text-xs text-tinta-suave">
              {tz("periodoDatos", {
                desde: fechaCorta(resumen.primerPago * 1000, idioma) ?? "",
                hasta: fechaCorta(resumen.ultimoPago * 1000, idioma) ?? "",
              })}
            </p>
          ) : null}
          <Link
            href="/panel/cobros/zelle"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-carga-600 hover:underline"
          >
            {t("resumen.verPagos")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
      ) : null}
    </div>
  );
}
