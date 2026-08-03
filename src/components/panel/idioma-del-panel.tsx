"use client";

import { Check, Languages, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * El idioma del panel, elegido a mano.
 *
 * POR QUÉ AQUÍ Y NO EN EL NAVEGADOR: el panel no lleva el encabezado del
 * sitio, así que dentro no había NINGUNA forma de cambiar de idioma. Estaba
 * traducido entero y aun así no había cómo verlo en inglés sin editar la
 * dirección a mano — que no es algo que se le pida a nadie, y menos delante
 * de un banco.
 *
 * Se queda en la misma pantalla en la que estás: cambia el idioma, no el
 * sitio donde estabas trabajando. Y la elección se recuerda para la próxima
 * vez, porque next-intl la guarda en una cookie.
 */
export function IdiomaDelPanel() {
  const t = useTranslations("panel.configuracion.idioma");
  const actual = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [cambiando, iniciar] = useTransition();

  const NOMBRES: Record<string, string> = {
    es: "Español",
    en: "English",
  };

  function cambiar(idioma: (typeof routing.locales)[number]) {
    if (idioma === actual) return;
    iniciar(() => {
      router.replace(pathname, { locale: idioma });
    });
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {routing.locales.map((idioma) => {
        const activo = idioma === actual;
        return (
          <button
            key={idioma}
            type="button"
            onClick={() => cambiar(idioma)}
            disabled={cambiando}
            aria-pressed={activo}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors",
              activo
                ? "border-carga-500 bg-carga-500/10 text-tinta"
                : "border-borde bg-white text-tinta-suave hover:border-carga-500 hover:text-tinta",
              cambiando && "opacity-60",
            )}
          >
            {cambiando && !activo ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : activo ? (
              <Check className="h-4 w-4 text-carga-600" aria-hidden />
            ) : (
              <Languages className="h-4 w-4" aria-hidden />
            )}
            {NOMBRES[idioma] ?? idioma.toUpperCase()}
          </button>
        );
      })}

      <p className="w-full text-xs text-tinta-suave">{t("ayuda")}</p>
    </div>
  );
}
