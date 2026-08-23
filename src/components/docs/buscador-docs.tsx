"use client";

import { ArrowRight, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";

import { Link } from "@/i18n/navigation";
import { buscarEnDocs, type EntradaDocs } from "@/lib/docs/indice";
import { cn } from "@/lib/utils";

/**
 * EL BUSCADOR DE DOCS. Filtra mientras se escribe sobre TODAS las entradas
 * (guías, páginas fijas y recursos para máquinas) y enseña los resultados
 * debajo, cada uno con su enlace fijo. ⌘K / Ctrl+K lo enfoca desde cualquier
 * punto de la página. No consulta al servidor: la lista entera viaja con la
 * página (son decenas de entradas, no miles).
 */
export function BuscadorDocs({
  entradas,
  grande = false,
  autofoco = false,
}: {
  entradas: EntradaDocs[];
  /** La versión de la portada de Docs: alta, con el atajo visible. */
  grande?: boolean;
  autofoco?: boolean;
}) {
  const t = useTranslations("docs.buscador");
  const [consulta, setConsulta] = useState("");
  const entrada = useRef<HTMLInputElement>(null);
  const id = useId();
  const resultados = buscarEnDocs(entradas, consulta);
  const hayConsulta = consulta.trim().length >= 2;

  useEffect(() => {
    if (!grande) return;
    const atajo = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        entrada.current?.focus();
        entrada.current?.select();
      }
    };
    window.addEventListener("keydown", atajo);
    return () => window.removeEventListener("keydown", atajo);
  }, [grande]);

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {t("etiqueta")}
      </label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-white transition-colors focus-within:border-carga-500 focus-within:ring-2 focus-within:ring-carga-500/20",
          grande
            ? "border-riel-900/20 px-4 py-3 shadow-sm"
            : "border-borde px-3 py-2",
        )}
      >
        <Search
          className={cn(
            "shrink-0 text-riel-700",
            grande ? "h-5 w-5" : "h-4 w-4",
          )}
          aria-hidden
        />
        <input
          ref={entrada}
          id={id}
          type="search"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder={t("placeholder")}
          autoComplete="off"
          autoFocus={autofoco}
          className={cn(
            /* Sin la equis nativa de Chrome: salían dos, y la del navegador solo vacía la casilla. */
            "w-full min-w-0 bg-transparent outline-none placeholder:text-tinta-suave [&::-webkit-search-cancel-button]:appearance-none",
            grande ? "text-base sm:text-lg" : "text-sm",
          )}
        />
        {consulta ? (
          <button
            type="button"
            onClick={() => setConsulta("")}
            aria-label={t("limpiar")}
            className="rounded p-1 text-tinta-suave hover:text-riel-900"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : grande ? (
          <kbd className="hidden rounded-md border border-borde bg-slate-50 px-2 py-0.5 text-xs font-medium text-tinta-suave sm:inline-block">
            ⌘K
          </kbd>
        ) : null}
      </div>

      {hayConsulta ? (
        <ul
          role="listbox"
          aria-label={t("resultados")}
          className={cn(
            "z-20 mt-2 divide-y divide-borde overflow-hidden rounded-xl border border-borde bg-white shadow-lg",
            grande ? "" : "absolute right-0 left-0",
          )}
        >
          {resultados.length === 0 ? (
            <li className="px-4 py-3 text-sm text-tinta-suave">
              {t("sinResultados", { consulta })}
            </li>
          ) : (
            resultados.map((r) => (
              <li key={r.href}>
                {r.externo ? (
                  <a
                    href={r.href}
                    className="group flex items-start gap-3 px-4 py-3 hover:bg-slate-50"
                  >
                    <Resultado r={r} />
                  </a>
                ) : (
                  <Link
                    href={r.href}
                    className="group flex items-start gap-3 px-4 py-3 hover:bg-slate-50"
                  >
                    <Resultado r={r} />
                  </Link>
                )}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

function Resultado({ r }: { r: EntradaDocs }) {
  return (
    <>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-riel-900 group-hover:text-carga-600">
          {r.titulo}
        </span>
        <span className="mt-0.5 block truncate text-xs text-tinta-suave">
          {r.resumen}
        </span>
      </span>
      <ArrowRight
        className="mt-1 h-4 w-4 shrink-0 text-tinta-suave group-hover:text-carga-600"
        aria-hidden
      />
    </>
  );
}
