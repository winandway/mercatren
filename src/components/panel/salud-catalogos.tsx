import { AlertTriangle, CheckCircle2, Link2Off, Radio } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { SaludDeComercio } from "@/lib/socios/salud";
import { cn } from "@/lib/utils";

/**
 * LOS CATÁLOGOS DE LOS COMERCIOS, Y SI SIGUEN LLEGANDO.
 *
 * Lo atrasado sale arriba y en ámbar; lo que está al día, en una línea gris
 * que no pide atención. Es el mismo criterio de toda pantalla de este panel:
 * si todo se pintara igual, habría que leer las veinte filas para encontrar la
 * que importa.
 */
export async function SaludCatalogos({ filas }: { filas: SaludDeComercio[] }) {
  const t = await getTranslations("panel.configuracion.saludCatalogos");
  /* La unidad sale de los textos y no escrita aquí: el panel se ve en los dos
     idiomas, y «1 días» delata que el aviso lo escribió una máquina. */
  const tu = await getTranslations("panel.sincronizacion");

  /* «hace 3 horas», no «hace 187 minutos»: pasada la primera hora, el número
     exacto no le dice nada a nadie. */
  function haceCuanto(minutos: number) {
    if (minutos < 60) return tu("haceMinutos", { n: minutos });
    if (minutos < 60 * 24)
      return tu("haceHoras", { n: Math.floor(minutos / 60) });
    return tu("haceDias", { n: Math.floor(minutos / (60 * 24)) });
  }

  if (filas.length === 0) {
    return <p className="mt-3 text-sm text-tinta-suave">{t("sinComercios")}</p>;
  }

  return (
    <ul className="mt-3 space-y-2">
      {filas.map((f) => {
        const mal = f.salud.nivel === "atrasada" || f.salud.nivel === "nunca";
        const sinConexion = f.salud.nivel === "sin_direccion";

        return (
          <li
            key={f.tiendaId}
            className={cn(
              "flex flex-wrap items-start gap-x-3 gap-y-1 rounded-lg border px-3 py-2.5",
              mal
                ? "border-amber-300 bg-amber-50"
                : sinConexion
                  ? "border-borde bg-slate-50"
                  : "border-borde bg-white",
            )}
          >
            <span className="mt-0.5 shrink-0">
              {mal ? (
                <AlertTriangle className="h-4 w-4 text-amber-700" aria-hidden />
              ) : sinConexion ? (
                <Link2Off className="h-4 w-4 text-tinta-suave" aria-hidden />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-precio-600" aria-hidden />
              )}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{f.tienda}</span>

              <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-tinta-suave">
                <span className="inline-flex items-center gap-1">
                  <Radio className="h-3 w-3" aria-hidden />
                  {t(`via.${f.via}`)}
                  {f.plataforma ? ` · ${f.plataforma}` : ""}
                </span>
              </span>

              {f.ultimoResultado ? (
                <span className="mt-0.5 block text-xs text-tinta-suave">
                  {f.ultimoResultado}
                </span>
              ) : null}
            </span>

            <span
              className={cn(
                "shrink-0 text-xs font-semibold",
                mal ? "text-amber-800" : "text-tinta-suave",
              )}
            >
              {f.salud.nivel === "atrasada" && f.salud.minutos !== null
                ? t("estado.atrasada", { cuanto: haceCuanto(f.salud.minutos) })
                : t(`estado.${f.salud.nivel}`)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
