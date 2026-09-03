"use client";

import { Bug, Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ErrorVista } from "@/lib/errores/registro";
import { resolverError } from "@/lib/vigilante/acciones";
import { recargarSiEsVersionVieja } from "@/lib/version-vieja";

/** El historial de fallos, con su botón de «ya lo arreglé». */
export function HistorialDeErrores({
  errores,
  ahoraMs,
}: {
  errores: ErrorVista[];
  ahoraMs: number;
}) {
  const t = useTranslations("panel.vigilante.errores");
  const router = useRouter();
  const [resolviendo, setResolviendo] = useState<string | null>(null);

  async function resolver(clave: string) {
    setResolviendo(clave);
    try {
      await resolverError(clave);
      router.refresh();
    } catch (fallo) {
      if (recargarSiEsVersionVieja(fallo)) return;
    } finally {
      setResolviendo(null);
    }
  }

  return (
    <section className="rounded-xl border border-borde bg-white p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Bug className="h-4 w-4 text-carga-500" aria-hidden />
        {t("titulo")}
      </h2>
      <p className="mt-1 text-xs text-tinta-suave">{t("texto")}</p>

      {errores.length === 0 ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {t("sinErrores")}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {errores.map((e) => (
            <li
              key={e.clave}
              className="rounded-lg border border-borde px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{e.origen}</p>
                  <p className="break-words text-tinta-suave">{e.mensaje}</p>
                  <p className="mt-1 text-xs text-tinta-suave">
                    {t("veces", { n: e.veces })} ·{" "}
                    {t("ultima", {
                      min: Math.max(
                        0,
                        Math.round((ahoraMs - e.ultimaVezMs) / 60_000),
                      ),
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => resolver(e.clave)}
                  disabled={resolviendo !== null}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-borde px-2.5 py-1.5 text-xs font-semibold hover:border-carga-500 disabled:opacity-60"
                >
                  {resolviendo === e.clave ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {resolviendo === e.clave ? t("resolviendo") : t("resolver")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
