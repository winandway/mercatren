"use client";

import { MoreVertical, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Link } from "@/i18n/navigation";

/**
 * Los tres puntos de «Mi cuenta» (27 oct 2026).
 *
 * Aquí vive «Borrar mi cuenta», y SOLO aquí: la regla del proyecto es que
 * nada que destruya va a la vista. El menú lleva a la página de borrado, que
 * explica qué se va y qué se queda y pide escribir una palabra.
 */
export function MenuCuenta() {
  const t = useTranslations("borrarCuenta");
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function fuera(e: MouseEvent) {
      if (caja.current && !caja.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        aria-label={t("menu.abrir")}
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-borde hover:bg-slate-50"
      >
        <MoreVertical className="h-5 w-5" aria-hidden />
      </button>
      {abierto ? (
        <div
          role="menu"
          className="absolute left-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-borde bg-white py-1 shadow-lg sm:right-0 sm:left-auto"
        >
          <Link
            role="menuitem"
            href="/delete-account"
            onClick={() => setAbierto(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {t("menu.borrar")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
