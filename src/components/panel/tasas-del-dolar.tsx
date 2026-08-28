"use client";

import { Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { guardarAjustesDeTasa } from "@/lib/mercado/tasas";
import { cn } from "@/lib/utils";

export type TasaParaPantalla = {
  pais: "CL" | "CO";
  /** null = ni la API ni la guardada sirven: el catálogo está cerrado. */
  centesimas: number | null;
  apiCentesimas: number | null;
  ajustePb: number;
  ajusteFijoCentesimas: number;
  origen: "en_vivo" | "guardada" | null;
  leidaEn: string | null;
};

/**
 * LA TASA AUTOMÁTICA DE CADA PAÍS, CON SUS DOS AJUSTES.
 *
 * ══ POR QUÉ YA NO HAY CASILLA DE TASA (28 ago 2026) ══
 *
 * La primera versión pedía escribirla a mano cada día y el dueño la tumbó con
 * razón: «pasará una semana sin hacerlo y nos hará perder dinero». Ahora la
 * tasa la trae DolarApi sola; lo único que se edita son los DOS AJUSTES del
 * dueño — el porcentaje y el monto fijo que se le suman— y eso se toca una
 * vez, no cada día.
 *
 * El desglose (API + % + fijo = final) va a la vista: una tasa que no se
 * puede auditar de un vistazo es una tasa en la que nadie confía.
 */
export function TasasDelDolar({ tasas }: { tasas: TasaParaPantalla[] }) {
  const t = useTranslations("panel.tasas");
  const router = useRouter();
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );
  const [guardando, iniciar] = useTransition();

  const pesos = (centesimas: number) =>
    (centesimas / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="space-y-4">
      {tasas.map((tasa) => (
        <div key={tasa.pais} className="rounded-lg bg-slate-50 p-4">
          <p className="text-sm font-bold">{t(`pais.${tasa.pais}`)}</p>

          {tasa.centesimas === null || tasa.apiCentesimas === null ? (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
              {t("sinTasa")}
            </p>
          ) : (
            <dl className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
              <div className="flex items-baseline gap-1.5">
                <dt className="text-xs text-tinta-suave">{t("deLaApi")}</dt>
                <dd className="tabular-nums">{pesos(tasa.apiCentesimas)}</dd>
              </div>
              {tasa.ajustePb !== 0 ? (
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-xs text-tinta-suave">%</dt>
                  <dd className="tabular-nums">
                    {(tasa.ajustePb / 100).toFixed(2)}%
                  </dd>
                </div>
              ) : null}
              {tasa.ajusteFijoCentesimas !== 0 ? (
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-xs text-tinta-suave">+</dt>
                  <dd className="tabular-nums">
                    {pesos(tasa.ajusteFijoCentesimas)}
                  </dd>
                </div>
              ) : null}
              <div className="flex items-baseline gap-1.5">
                <dt className="text-xs font-bold">{t("seUsa")}</dt>
                <dd className="text-base font-extrabold tabular-nums">
                  {pesos(tasa.centesimas)}
                </dd>
              </div>
              <div className="w-full text-xs text-tinta-suave">
                {tasa.origen === "en_vivo"
                  ? t("enVivo")
                  : t("guardadaDe", {
                      fecha: tasa.leidaEn
                        ? new Date(tasa.leidaEn).toLocaleString("es-US", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "",
                    })}
              </div>
            </dl>
          )}

          {/* Los DOS ajustes del dueño. Se tocan una vez, no cada día. */}
          <form
            action={(datos) =>
              iniciar(async () => {
                const r = await guardarAjustesDeTasa(datos);
                setAviso({ ok: r.ok, texto: r.mensaje });
                router.refresh();
              })
            }
            className="mt-3 flex flex-wrap items-end gap-3 border-t border-slate-200 pt-3"
          >
            <input type="hidden" name="pais" value={tasa.pais} />
            <label className="block">
              <span className="text-xs font-semibold">
                {t("ajustePorciento")}
              </span>
              <input
                type="text"
                name="porcentaje"
                inputMode="decimal"
                defaultValue={(tasa.ajustePb / 100).toFixed(2)}
                placeholder="0.00"
                className="mt-1 w-24 rounded-lg border border-borde px-3 py-2 text-sm tabular-nums outline-none focus:border-carga-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold">{t("ajusteFijo")}</span>
              <input
                type="text"
                name="fijo"
                inputMode="decimal"
                defaultValue={(tasa.ajusteFijoCentesimas / 100).toFixed(2)}
                placeholder="0.00"
                className="mt-1 w-24 rounded-lg border border-borde px-3 py-2 text-sm tabular-nums outline-none focus:border-carga-500"
              />
            </label>
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center gap-2 rounded-lg border border-borde px-4 py-2 text-sm font-semibold hover:border-carga-500 disabled:opacity-60"
            >
              {guardando ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Save className="h-4 w-4" aria-hidden />
              )}
              {t("guardar")}
            </button>
            <p className="w-full text-xs text-tinta-suave">
              {t("ajusteAyuda")}
            </p>
          </form>
        </div>
      ))}
      {aviso ? (
        <p
          role="status"
          className={cn(
            "text-sm font-medium",
            aviso.ok ? "text-precio-600" : "text-red-700",
          )}
        >
          {aviso.texto}
        </p>
      ) : null}
    </div>
  );
}
