"use client";

import {
  CheckCircle2,
  Loader2,
  PackageSearch,
  TriangleAlert,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { probarCj, type ResultadoCj } from "@/lib/cj/acciones";
import { cn } from "@/lib/utils";

/**
 * Botón para comprobar que la llave de CJ Dropshipping sirve.
 *
 * Mismo motivo que el del banco: la llave se pega en el panel de la plataforma,
 * donde guardar siempre «funciona». Lo que falla es la primera llamada de
 * verdad — y sin este botón, esa primera llamada sería la sincronización del
 * catálogo de madrugada, sin nadie mirando.
 *
 * Los textos van en `messages/*.json` como los del resto del panel: el equipo
 * puede tener el panel en inglés, y hay una prueba que se pone roja si alguien
 * escribe una frase suelta aquí.
 */
export function ProbarCj() {
  const t = useTranslations("panel.configuracion.cj");
  const [estado, setEstado] = useState<ResultadoCj | null>(null);
  const [probando, iniciar] = useTransition();

  return (
    <div className="mt-4 space-y-3">
      <button
        type="button"
        disabled={probando}
        onClick={() => iniciar(async () => setEstado(await probarCj()))}
        className="boton-principal gap-2 disabled:opacity-60"
      >
        {probando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <PackageSearch className="h-4 w-4" aria-hidden />
        )}
        {probando ? t("probando") : t("boton")}
      </button>

      {estado ? (
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            estado.ok
              ? "bg-emerald-50 text-emerald-900"
              : "bg-red-50 text-red-900",
          )}
        >
          <p className="flex items-start gap-2 font-semibold">
            {estado.ok ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            )}
            {estado.mensaje}
          </p>

          {estado.ok && estado.productos !== undefined ? (
            <p className="mt-1 pl-6 text-xs">
              {t("leyo", { n: estado.productos })}
            </p>
          ) : null}

          {/* Lo que contestó CJ, tal cual: sin esto, un fallo obliga a entrar a
              su panel a adivinar qué pasó. */}
          {estado.detalle ? (
            <p className="mt-1 pl-6 font-mono text-xs break-words">
              {estado.detalle}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
