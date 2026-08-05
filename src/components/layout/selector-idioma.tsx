"use client";

import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";

import { BanderaEEUU } from "@/components/marca/bandera-eeuu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Selector de idioma de una sola casilla, con panel desplegable.
 *
 * Antes eran dos banderitas siempre visibles, y ocupaban el espacio que
 * necesita el buscador. Ahora se ve solo el idioma activo y el resto se abre
 * al tocarlo, que es como lo resuelven las tiendas grandes.
 *
 * EL BOTON NO LLEVA BANDERA, y eso costó tres reclamos del dueño: una bandera
 * de Estados Unidos pegada a las letras "ES" se lee como PAIS, no como idioma
 * — parecía decir que el sitio entrega en Estados Unidos, cuando la mercancía
 * está en El Vigía y en Caracas. Aquí solo va el idioma; el país de quien
 * compra lo dice el selector de ciudad, que sí lo sabe.
 *
 * La bandera se queda abajo, en la nota, donde acompaña una frase que sí
 * habla de Estados Unidos: desde allá se paga.
 */
export function SelectorIdioma() {
  const t = useTranslations("encabezado");
  const idiomaActual = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pendiente, iniciarTransicion] = useTransition();
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const alTocar = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", alTocar);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("mousedown", alTocar);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto]);

  function cambiar(idioma: (typeof routing.locales)[number]) {
    setAbierto(false);
    if (idioma === idiomaActual) return;
    iniciarTransicion(() => {
      // Se queda en la misma pagina y solo cambia el idioma de la direccion.
      // La cookie que deja next-intl hace que la eleccion se recuerde.
      router.replace(pathname, { locale: idioma });
    });
  }

  return (
    <div ref={caja} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        disabled={pendiente}
        aria-expanded={abierto}
        aria-label={t("idioma")}
        className="celda-encabezado flex items-center gap-1 text-xs font-bold"
      >
        <span className="uppercase">{idiomaActual}</span>
        <ChevronDown className="h-3 w-3 opacity-70" aria-hidden />
      </button>

      {abierto ? (
        <div className="absolute top-full right-0 z-50 mt-2 w-60 rounded-lg bg-white p-4 text-tinta shadow-2xl ring-1 ring-black/10">
          <p className="text-sm font-bold">{t("cambiarIdioma")}</p>

          <ul className="mt-3 divide-y divide-borde">
            {routing.locales.map((idioma) => {
              const activo = idioma === idiomaActual;
              return (
                <li key={idioma}>
                  <button
                    type="button"
                    onClick={() => cambiar(idioma)}
                    className="flex w-full items-center gap-3 py-2.5 text-left text-sm"
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                        activo ? "border-carga-500" : "border-slate-300",
                      )}
                      aria-hidden
                    >
                      {activo ? (
                        <span className="h-2 w-2 rounded-full bg-carga-500" />
                      ) : null}
                    </span>
                    <span className={activo ? "font-semibold" : undefined}>
                      {idioma === "es" ? t("espanol") : t("ingles")} —{" "}
                      {idioma.toUpperCase()}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="mt-3 flex items-start gap-2 border-t border-borde pt-3 text-xs leading-snug text-tinta-suave">
            <BanderaEEUU className="mt-0.5 h-4 w-4" />
            {t("comprasEn")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
