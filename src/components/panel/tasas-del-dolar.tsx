"use client";

import { Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { EstadoDeTasa } from "@/lib/mercado/tasas";
import { guardarTasa } from "@/lib/mercado/tasas";
import { cn } from "@/lib/utils";

/**
 * LA TASA DEL DÍA DE CADA PAÍS, EDITADA A MANO.
 *
 * La fecha de la última actualización va al lado del número a propósito: una
 * tasa de hace dos semanas multiplica el catálogo entero con un dólar que ya
 * no existe, y sin la fecha nadie se entera de que está vieja.
 */
export function TasasDelDolar({ tasas }: { tasas: EstadoDeTasa[] }) {
  const t = useTranslations("panel.tasas");
  const router = useRouter();
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );
  const [guardando, iniciar] = useTransition();

  return (
    <div className="space-y-3">
      {tasas.map((tasa) => (
        <form
          key={tasa.pais}
          action={(datos) =>
            iniciar(async () => {
              const r = await guardarTasa(datos);
              setAviso({ ok: r.ok, texto: r.mensaje });
              router.refresh();
            })
          }
          className="flex flex-wrap items-end gap-3 rounded-lg bg-slate-50 p-3"
        >
          <input type="hidden" name="pais" value={tasa.pais} />
          <label className="block">
            <span className="text-sm font-semibold">
              {t(`pais.${tasa.pais}`)}
            </span>
            <input
              type="text"
              name="tasa"
              inputMode="decimal"
              defaultValue={
                tasa.centesimas !== null
                  ? (tasa.centesimas / 100).toFixed(2)
                  : ""
              }
              placeholder="0.00"
              className="mt-1 w-36 rounded-lg border border-borde px-3 py-2 text-sm tabular-nums outline-none focus:border-carga-500"
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
            {tasa.centesimas === null
              ? t("sinCargar")
              : tasa.actualizadaEn
                ? t("actualizada", {
                    fecha: tasa.actualizadaEn.toLocaleDateString("es-US", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  })
                : ""}
          </p>
        </form>
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
