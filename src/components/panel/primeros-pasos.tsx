import { ArrowRight, Check, Circle } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Los primeros pasos de un comercio nuevo.
 *
 * Un comercio recién aprobado entra a un panel con nueve secciones y no sabe
 * cuál toca. Esto le pone las cuatro cosas que hacen falta para estar
 * vendiendo, en orden, y le señala la siguiente.
 *
 * Desaparece solo cuando están todas. Una guía que se queda ahí para siempre
 * deja de leerse y estorba a quien ya sabe moverse.
 */
export async function PrimerosPasos({
  pasos,
}: {
  pasos: { clave: string; hecho: boolean; href: string }[];
}) {
  const t = await getTranslations("panel.primerosPasos");

  const hechos = pasos.filter((p) => p.hecho).length;
  if (hechos === pasos.length) return null;

  // El primero sin hacer: es al que se le pone el botón.
  const siguiente = pasos.find((p) => !p.hecho);

  return (
    <section className="rounded-xl border border-carga-500/30 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-bold">{t("titulo")}</h2>
        <p className="text-sm text-tinta-suave tabular-nums">
          {t("llevas", { hechos, total: pasos.length })}
        </p>
      </div>

      <ol className="mt-4 space-y-1">
        {pasos.map((paso) => {
          const esElSiguiente = paso.clave === siguiente?.clave;

          return (
            <li key={paso.clave}>
              <Link
                href={paso.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                  esElSiguiente
                    ? "bg-carga-500/10 font-semibold"
                    : "hover:bg-slate-50",
                  paso.hecho && "text-tinta-suave",
                )}
              >
                {paso.hecho ? (
                  <Check
                    className="h-4 w-4 shrink-0 text-precio-600"
                    aria-hidden
                  />
                ) : (
                  <Circle
                    className={cn(
                      "h-4 w-4 shrink-0",
                      esElSiguiente ? "text-carga-500" : "text-slate-300",
                    )}
                    aria-hidden
                  />
                )}

                <span
                  className={cn(
                    "min-w-0 flex-1 text-sm",
                    paso.hecho && "line-through",
                  )}
                >
                  {t(`pasos.${paso.clave}`)}
                </span>

                {esElSiguiente ? (
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-carga-600"
                    aria-hidden
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
