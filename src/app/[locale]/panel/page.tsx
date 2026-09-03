import {
  ArrowRight,
  CalendarDays,
  Clock,
  PackageCheck,
  PiggyBank,
  ShoppingBag,
  Store,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PrimerosPasos } from "@/components/panel/primeros-pasos";
import { CatalogoDeUnVistazo } from "@/components/panel/catalogo-de-un-vistazo";
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

  /* EL CATÁLOGO EN EL TABLERO (3 sep 2026): solo para el equipo, y **leído
     del último latido del vigilante**, nunca calculado aquí. Contar las
     55.000 fichas en esta pantalla agotaba la petición, y con la petición
     agotada la comprobación de sesión falla y el panel devuelve a la
     persona a «entrar»: el dueño no pudo entrar a su propio panel. */
  const inventario = interno
    ? await (async () => {
        const { inventarioDelUltimoLatido } =
          await import("@/lib/vigilante/inventario");
        return inventarioDelUltimoLatido().catch(() => null);
      })()
    : null;

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

      {/**
       * LA SEGUNDA FILA: EL CICLO COMPLETO DEL MES.
       *
       * Lo pidió el dueño, y tiene razón en el fondo: con solo lo vendido y el
       * margen no se ve el negocio. El modelo entero se apoya en una resta
       * —bruto − costo de mercancía = margen— y sin el renglón del medio los
       * otros dos no se pueden comprobar.
       *
       * Y a lo vendido le faltaba lo que de verdad SALIÓ: un mes puede cerrar
       * con muchas ventas y poca mercancía entregada, y eso es un problema que
       * hay que ver el día que pasa, no a fin de mes.
       */}
      {inventario ? (
        <CatalogoDeUnVistazo
          plazas={inventario.plazas}
          haceMinutos={inventario.haceMinutos}
        />
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <TarjetaMetrica
          Icono={ShoppingBag}
          titulo={t(
            esComercio ? "resumen.compradoComercio" : "resumen.comprado",
          )}
          valor={formatearPrecio(hoy.mesCompradoCentavos, idioma, hoy.moneda)}
          pie={t("resumen.esteMes")}
        />
        <TarjetaMetrica
          Icono={PackageCheck}
          titulo={t("resumen.entregadas")}
          valor={String(hoy.mesEntregadas)}
          pie={t("resumen.esteMes")}
        />
        {/**
         * Los compradores son de Mercatren, no de un comercio: enseñárselos a
         * uno le haría creer que son los suyos.
         *
         * ══ Y AL COMERCIO NO SE LE REPITE «DISPONIBLE PARA RETIRAR» ══
         *
         * Aquí caía otra vez la misma tarjeta que ya sale arriba, con el mismo
         * número. Dos veces el mismo dato en la misma pantalla hace dudar de si
         * son dos cosas distintas —¿tengo $24.676 o $49.352?— y en una pantalla
         * de dinero esa duda se paga cara.
         *
         * Estaba así desde antes; se vio al mirar el panel con los ojos del
         * comercio, que es exactamente para lo que existe ese modo.
         *
         * Con dos tarjetas la rejilla se reacomoda sola. Un hueco es mejor que
         * un número repetido.
         */}
        {hoy.mesClientesNuevos !== null ? (
          <TarjetaMetrica
            Icono={UserPlus}
            titulo={t("resumen.clientesNuevos")}
            valor={String(hoy.mesClientesNuevos)}
            pie={t("resumen.esteMes")}
          />
        ) : null}
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
                  "USD",
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
