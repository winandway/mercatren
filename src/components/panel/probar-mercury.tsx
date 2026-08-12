"use client";

import { CheckCircle2, Landmark, Loader2, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { probarMercury, type ResultadoSonda } from "@/lib/mercury/acciones";
import { cn } from "@/lib/utils";

/**
 * Botón para comprobar que el token del banco sirve.
 *
 * El token se pega en el panel de la plataforma, donde guardar siempre
 * «funciona». Lo que falla es la primera llamada de verdad — y sin este botón,
 * esa primera llamada sería el retiro de un comercio esperando su dinero.
 */
export function ProbarMercury() {
  const t = useTranslations("panel.configuracion.mercury");
  const [estado, setEstado] = useState<ResultadoSonda | null>(null);
  const [probando, iniciar] = useTransition();

  return (
    <div className="mt-4 space-y-3">
      <button
        type="button"
        disabled={probando}
        onClick={() => iniciar(async () => setEstado(await probarMercury()))}
        className="boton-principal gap-2 disabled:opacity-60"
      >
        {probando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Landmark className="h-4 w-4" aria-hidden />
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
          <p className="flex items-center gap-2 font-semibold">
            {estado.ok ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            ) : (
              <TriangleAlert className="h-4 w-4" aria-hidden />
            )}
            {estado.mensaje}
          </p>

          {/* Lo que contestó el banco, tal cual. Un «falló» a secas obliga a
              adivinar, y con dinero de por medio adivinar sale caro. */}
          {estado.detalle ? (
            <p className="mt-1 font-mono text-xs break-all opacity-80">
              {estado.detalle}
            </p>
          ) : null}

          {estado.cuentas?.length ? (
            <ul className="mt-2 space-y-1 text-xs">
              {estado.cuentas.map((c) => (
                <li key={`${c.nombre}-${c.tipo}`} className="flex gap-2">
                  <span className="font-semibold">{c.nombre}</span>
                  <span className="opacity-70">{c.tipo}</span>
                  <span className="ml-auto tabular-nums">
                    ${c.saldo.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
