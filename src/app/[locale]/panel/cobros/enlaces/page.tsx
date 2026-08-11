import { Link2 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { listarEnlacesDeCobro } from "@/lib/cobros/consultas";
import { estadoParaMostrar } from "@/lib/cobros/reglas";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaCorta } from "@/lib/fechas";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TONO: Record<string, string> = {
  abierto: "bg-amber-100 text-amber-900",
  pagado: "bg-emerald-100 text-emerald-900",
  vencido: "bg-slate-200 text-slate-700",
  cancelado: "bg-slate-200 text-slate-700",
};

/**
 * LOS COBROS QUE PIDE EL COMERCIO DESDE SU PROPIO SISTEMA.
 *
 * El comercio le vende a alguien en su mostrador, manda el enlace y el cliente
 * paga con tarjeta desde Estados Unidos. Hasta ahora esos cobros existían en la
 * base y no tenían pantalla: el comercio mandaba el enlace y se quedaba sin
 * saber si lo habían abierto, si vencía o si ya estaba pagado.
 */
export default async function PaginaEnlacesDeCobro({
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
  const t = await getTranslations("panel.cobros.enlaces");

  const enlaces = await listarEnlacesDeCobro(comercio);
  const ahora = new Date();

  return (
    <div className="space-y-4">
      <p className="text-sm text-tinta-suave">{t("queEs")}</p>

      {enlaces.length === 0 ? (
        <div className="rounded-xl border border-dashed border-borde bg-white px-6 py-16 text-center">
          <Link2 className="mx-auto h-10 w-10 text-tinta-suave" aria-hidden />
          <p className="mt-4 text-sm text-tinta-suave">{t("ninguno")}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {enlaces.map((e) => {
            /* El vencimiento se CALCULA, no se lee: un estado guardado
               depende de que algo lo escriba a tiempo, y si eso falla un
               enlace caducado seguiría diciendo que se puede pagar. */
            const estado = estadoParaMostrar(e.estado, e.venceEn, ahora);

            return (
              <li
                key={e.id}
                className="rounded-xl border border-borde bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold">
                        {e.referencia}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          TONO[estado],
                        )}
                      >
                        {t(`estado.${estado}`)}
                      </span>
                    </p>

                    <p className="mt-1 truncate text-sm">
                      {e.contactoNombre || e.contactoCorreo}
                    </p>
                    {e.concepto ? (
                      <p className="mt-0.5 truncate text-xs text-tinta-suave">
                        {e.concepto}
                      </p>
                    ) : null}

                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-tinta-suave">
                      <span>{fechaCorta(e.creadoEn, idioma)}</span>
                      {estado === "pagado" && e.pagadoEn ? (
                        <span>
                          {t("pagadoEl", {
                            fecha: fechaCorta(e.pagadoEn, idioma) ?? "",
                          })}
                        </span>
                      ) : estado === "abierto" && e.venceEn ? (
                        <span>
                          {t("venceEl", {
                            fecha: fechaCorta(e.venceEn, idioma) ?? "",
                          })}
                        </span>
                      ) : null}
                      {e.tiendaNombre ? <span>{e.tiendaNombre}</span> : null}
                    </p>
                  </div>

                  <p className="text-lg font-extrabold tabular-nums">
                    {formatearPrecio(e.montoCentavos, idioma, e.moneda)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
