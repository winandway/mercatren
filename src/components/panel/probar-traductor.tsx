"use client";

import { ArrowRight, Loader2, TriangleAlert, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  probarTraductor,
  type PruebaDeTraduccion,
} from "@/lib/traduccion/acciones";

/**
 * Comprueba el traductor con un título real, sin guardar nada.
 *
 * El botón de traducir escribe en el catálogo publicado. Antes de pulsarlo por
 * primera vez uno quiere ver dos cosas: que la llave está bien pegada, y que
 * lo que devuelve el modelo se lee como lo escribiría una tienda. Esto enseña
 * las dos, con el antes y el después uno debajo del otro.
 */
export function ProbarTraductor() {
  const t = useTranslations("panel.traduccion");
  const [estado, setEstado] = useState<PruebaDeTraduccion | null>(null);
  const [probando, setProbando] = useState(false);

  async function probar() {
    setProbando(true);
    setEstado(null);
    try {
      setEstado(await probarTraductor());
    } finally {
      setProbando(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={probar}
        disabled={probando}
        className="inline-flex items-center gap-2 rounded-lg border border-borde px-3.5 py-2 text-sm font-semibold text-riel-800 hover:bg-riel-50 disabled:opacity-60"
      >
        {probando ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Wand2 className="size-4" aria-hidden />
        )}
        {probando ? t("probando") : t("probar")}
      </button>

      {estado && !estado.ok ? (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {/* El motivo entero. Esta pantalla es solo del equipo, y un «no se
              pudo» obliga a adivinar entre una llave mal pegada, una cuota
              agotada, un modelo que no existe y un sitio sin republicar. */}
          <span>{estado.motivo}</span>
        </p>
      ) : null}

      {estado?.ok ? (
        <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm">
          <p className="font-semibold text-emerald-900">{t("pruebaOk")}</p>
          <p className="mt-2 text-riel-600">{estado.original}</p>
          <p className="mt-1 flex items-start gap-2 font-semibold text-riel-900">
            <ArrowRight className="mt-0.5 size-4 shrink-0" aria-hidden />
            {estado.traducido}
          </p>
          {estado.deMuestra ? (
            <p className="mt-2 text-xs text-riel-600">{t("eraMuestra")}</p>
          ) : null}
          <p className="mt-2 text-xs text-emerald-800">{t("noSeGuardo")}</p>
        </div>
      ) : null}
    </div>
  );
}
