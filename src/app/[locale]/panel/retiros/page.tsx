import { Building2, Landmark, Store, Zap } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AccionesRetiro } from "@/components/panel/retiros/acciones-retiro";
import { PedirRetiro } from "@/components/panel/retiros/pedir-retiro";
import { esEquipoInterno } from "@/lib/autorizacion";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaCorta } from "@/lib/fechas";
import {
  comerciosDestino,
  listarRetiros,
  ultimosCuatro,
} from "@/lib/retiros/consultas";
import { cn } from "@/lib/utils";
import { obtenerPosicion } from "@/lib/zelle/billetera";

export const dynamic = "force-dynamic";

/**
 * Sacar el dinero de la billetera.
 *
 * La misma pantalla sirve para los dos lados, porque es la misma conversación
 * vista desde cada punta: el comercio pide y ve en qué va lo suyo; el equipo
 * ve lo que hay que transferir y lo marca cuando lo hace.
 *
 * TRES NÚMEROS, NO UNO. El saldo no es lo que se puede pedir: lo que ya está
 * pedido está apartado. Enseñar solo el saldo llevaría a pedir dos veces lo
 * mismo y a que el segundo intento fallara sin que se entienda por qué.
 */

const ICONO = {
  comercio: Store,
  zelle: Zap,
  ach: Landmark,
  wire: Building2,
} as const;

const TONO: Record<string, string> = {
  solicitado: "bg-carga-500/15 text-carga-700",
  pagado: "bg-emerald-50 text-emerald-800",
  rechazado: "bg-red-50 text-red-800",
  cancelado: "bg-slate-100 text-tinta-suave",
};

export default async function PaginaRetiros({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ comercio?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const { comercio } = await searchParams;
  const t = await getTranslations("panel.retiros");

  const [posicion, lista, interno] = await Promise.all([
    obtenerPosicion(comercio),
    listarRetiros(),
    esEquipoInterno(),
  ]);

  const moneda = posicion?.moneda ?? "USD";
  const dinero = (centavos: number) =>
    formatearPrecio(centavos, idioma, moneda);

  const otros = posicion ? await comerciosDestino(posicion.tiendaId) : [];

  // Al equipo le interesa primero lo que tiene que transferir hoy.
  const pendientes = lista.filter((r) => r.estado === "solicitado");
  const resueltos = lista.filter((r) => r.estado !== "solicitado");
  const enOrden = interno ? [...pendientes, ...resueltos] : lista;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-tinta-suave">
          {interno ? t("subtituloEquipo") : t("subtituloComercio")}
        </p>
      </header>

      {posicion ? (
        <section className="space-y-4">
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-carga-500/30 bg-white p-5 shadow-sm">
              <dt className="text-xs text-tinta-suave">{t("disponible")}</dt>
              <dd className="mt-1 text-3xl font-bold tabular-nums">
                {dinero(posicion.disponibleCentavos)}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <dt className="text-xs text-tinta-suave">{t("enTramite")}</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums">
                {dinero(posicion.enTramiteCentavos)}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <dt className="text-xs text-tinta-suave">{t("saldoTotal")}</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums">
                {dinero(posicion.saldoCentavos)}
              </dd>
            </div>
          </dl>

          <PedirRetiro
            disponibleCentavos={posicion.disponibleCentavos}
            disponibleTexto={dinero(posicion.disponibleCentavos)}
            comercios={otros}
            tiendaId={posicion.tiendaId}
            puedeElegirTienda={interno}
          />
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {enOrden.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-tinta-suave">
            {interno ? t("sinRetirosEquipo") : t("sinRetiros")}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {enOrden.map((r) => {
              const Icono = ICONO[r.forma];
              const cuatro = ultimosCuatro(r.destino?.cuenta);

              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-start gap-4 p-4 sm:flex-nowrap"
                >
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-tinta-suave">
                    <Icono className="h-4 w-4" aria-hidden />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-lg font-bold tabular-nums">
                        {dinero(r.montoCentavos)}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          TONO[r.estado],
                        )}
                      >
                        {t(`estados.${r.estado}`)}
                      </span>
                    </p>

                    <p className="mt-0.5 text-sm text-tinta-suave">
                      {t(`formas.${r.forma}`)}
                      {r.destinoTienda ? ` · ${r.destinoTienda}` : ""}
                      {cuatro ? ` · ${t("aCuenta", { cuatro })}` : ""}
                    </p>

                    <p className="mt-0.5 text-xs text-tinta-suave">
                      {fechaCorta(r.creadoEn, idioma)}
                      {interno ? ` · ${r.nombreTienda}` : ""}
                      {r.referencia ? ` · ${r.referencia}` : ""}
                    </p>

                    {r.notaComercio ? (
                      <p className="mt-1 text-sm">{r.notaComercio}</p>
                    ) : null}

                    {r.motivoRechazo ? (
                      <p className="mt-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                        {r.motivoRechazo}
                      </p>
                    ) : null}
                  </div>

                  {r.estado === "solicitado" ? (
                    <div className="w-full shrink-0 sm:w-auto">
                      <AccionesRetiro
                        id={r.id}
                        puedePagar={interno}
                        puedeCancelar={!interno}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
