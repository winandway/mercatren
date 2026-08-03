"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const BANDERAS = {
  es: { emoji: "🇪🇸", codigo: "ES" },
  en: { emoji: "🇺🇸", codigo: "EN" },
} as const;

/**
 * Selector de idioma con las dos banderitas, siempre visible arriba.
 * Cambia de /es/... a /en/... conservando la pagina donde esta el usuario.
 */
export function SelectorIdioma() {
  const t = useTranslations("encabezado");
  const idiomaActual = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pendiente, iniciarTransicion] = useTransition();

  function cambiar(idioma: (typeof routing.locales)[number]) {
    if (idioma === idiomaActual) return;
    iniciarTransicion(() => {
      // Se queda en la misma pagina y solo cambia el idioma de la direccion.
      router.replace(pathname, { locale: idioma });
    });
  }

  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label={t("idioma")}
    >
      {routing.locales.map((idioma) => {
        const activo = idioma === idiomaActual;
        return (
          <button
            key={idioma}
            type="button"
            onClick={() => cambiar(idioma)}
            disabled={pendiente}
            aria-current={activo ? "true" : undefined}
            aria-label={idioma === "es" ? t("espanol") : t("ingles")}
            className={cn(
              "flex items-center gap-1 rounded-sm border px-1.5 py-1 text-xs font-semibold transition-colors",
              activo
                ? "border-carga-500 text-white"
                : "border-transparent text-white/70 hover:border-white/60 hover:text-white",
            )}
          >
            <span aria-hidden className="text-base leading-none">
              {BANDERAS[idioma].emoji}
            </span>
            <span>{BANDERAS[idioma].codigo}</span>
          </button>
        );
      })}
    </div>
  );
}
