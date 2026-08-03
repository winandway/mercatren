"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function Paginacion({
  pagina,
  paginas,
}: {
  pagina: number;
  paginas: number;
}) {
  const t = useTranslations("panel.zelle.paginacion");
  const parametros = useSearchParams();
  const pathname = usePathname();

  if (paginas <= 1) return null;

  function enlace(destino: number) {
    const siguientes = new URLSearchParams(parametros.toString());
    if (destino <= 1) siguientes.delete("pagina");
    else siguientes.set("pagina", String(destino));
    const consulta = siguientes.toString();
    return consulta ? `${pathname}?${consulta}` : pathname;
  }

  const estilo =
    "inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold transition-colors hover:border-carga-500";
  const apagado = "pointer-events-none opacity-40";

  return (
    <nav
      className="flex items-center justify-center gap-3"
      aria-label={t("posicion", { pagina, paginas })}
    >
      <Link
        href={enlace(pagina - 1)}
        aria-disabled={pagina <= 1}
        className={cn(estilo, pagina <= 1 && apagado)}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {t("anterior")}
      </Link>

      <span className="text-sm text-tinta-suave tabular-nums">
        {t("posicion", { pagina, paginas })}
      </span>

      <Link
        href={enlace(pagina + 1)}
        aria-disabled={pagina >= paginas}
        className={cn(estilo, pagina >= paginas && apagado)}
      >
        {t("siguiente")}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </nav>
  );
}
