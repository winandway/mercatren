import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const TONOS = {
  principal: "bg-riel-900 text-white",
  neutro: "bg-white text-tinta",
  alerta: "bg-white text-tinta ring-1 ring-carga-500/40",
  apagado: "bg-slate-100 text-tinta-suave",
} as const;

const TONOS_ICONO = {
  principal: "bg-white/10 text-carga-400",
  neutro: "bg-carga-500/10 text-carga-600",
  alerta: "bg-carga-500/15 text-carga-600",
  apagado: "bg-slate-200 text-tinta-suave",
} as const;

/** Cada dato importante de la operación, en su tarjeta. */
export function TarjetaMetrica({
  titulo,
  valor,
  pie,
  Icono,
  tono = "neutro",
  etiqueta,
}: {
  titulo: string;
  valor: string;
  pie?: string;
  Icono: LucideIcon;
  tono?: keyof typeof TONOS;
  etiqueta?: string;
}) {
  return (
    <article
      className={cn(
        "rounded-xl border border-slate-200/70 p-4 shadow-sm",
        TONOS[tono],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "text-xs font-medium",
            tono === "principal" ? "text-white/70" : "text-tinta-suave",
          )}
        >
          {titulo}
        </p>
        <span
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            TONOS_ICONO[tono],
          )}
        >
          <Icono className="h-4 w-4" aria-hidden />
        </span>
      </div>

      <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
        {valor}
      </p>

      {pie ? (
        <p
          className={cn(
            "mt-1 text-xs",
            tono === "principal" ? "text-white/60" : "text-tinta-suave",
          )}
        >
          {pie}
        </p>
      ) : null}

      {etiqueta ? (
        <p className="mt-3 inline-flex rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-semibold text-tinta-suave">
          {etiqueta}
        </p>
      ) : null}
    </article>
  );
}
