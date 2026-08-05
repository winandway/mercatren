"use client";

import { Check, ChevronDown, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { ZONAS } from "@/lib/entrega/zonas";
import { cn } from "@/lib/utils";

/**
 * Dónde está quien compra.
 *
 * Antes aquí decía "Entregar en 🇺🇸 Estados Unidos", escrito a fuego en el
 * código. No detectaba nada: le decía Estados Unidos a alguien parado en
 * Caracas. Y encima era mentira — la mercancía está en El Vigía y en Caracas.
 *
 * SE PREGUNTA, NO SE ADIVINA. Nada de IP ni de GPS: la IP se equivoca (un
 * celular en El Vigía puede salir con IP de Bogotá) y el GPS pide un permiso
 * que la mayoría niega. Amazon pregunta el código postal; aquí se pregunta la
 * ciudad.
 *
 * SE GUARDA EN UNA COOKIE para que el servidor pueda leerla y calcular, en
 * cada producto, si le queda cerca o lejos. Un año de vida: nadie quiere
 * decir dónde vive dos veces.
 *
 * Al elegir se RECARGA la página entera. Los avisos de retiro los arma el
 * servidor producto por producto; con una navegación de cliente seguirían
 * mostrando la ciudad anterior.
 */
/**
 * Guarda la ciudad y recarga.
 *
 * Va fuera del componente porque escribir `document.cookie` desde dentro es
 * tocar algo de afuera, y el compilador de React lo marca — con razón: si
 * mañana esa línea se colara en el render, se ejecutaría en cada dibujo.
 */
function guardarYRecargar(slug: string) {
  // Un año, y en toda la ruta del sitio: nadie quiere decir dónde vive dos
  // veces. `lax` alcanza de sobra — esto no es una credencial.
  document.cookie = `mercatren_zona=${slug}; path=/; max-age=31536000; samesite=lax`;
  window.location.reload();
}

export function SelectorCiudad({
  zonaActual,
  enLinea = false,
}: {
  zonaActual: string | null;
  /**
   * De una sola línea, para la barra del celular.
   *
   * En pantalla chica esto vive en su propia franja bajo el buscador y ahí
   * dos renglones se comen media pantalla. En el encabezado grande hay sitio
   * de sobra y se ve mejor apilado, igual que "Hola, identifícate".
   */
  enLinea?: boolean;
}) {
  const t = useTranslations("entrega");
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  const elegida = ZONAS.find((z) => z.slug === zonaActual);

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

  function elegir(slug: string) {
    guardarYRecargar(slug);
  }

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-label={t("ayuda")}
        className="flex items-center gap-1 rounded-lg px-1 py-0.5 text-left text-xs transition-colors hover:bg-white/10"
      >
        <MapPin className="h-4 w-4 shrink-0 text-carga-500" aria-hidden />
        {enLinea ? (
          <span className="min-w-0 truncate">
            <span className="text-white/70">
              {elegida ? t("retirasEn") : t("dondeEstas")}{" "}
            </span>
            <span className="font-bold">
              {elegida ? elegida.nombre : t("eligeCiudad")}
            </span>
          </span>
        ) : (
          <span>
            <span className="block text-white/70">
              {elegida ? t("retirasEn") : t("dondeEstas")}
            </span>
            <span className="block text-sm font-bold">
              {elegida ? elegida.nombre : t("eligeCiudad")}
            </span>
          </span>
        )}
        <ChevronDown className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
      </button>

      {abierto ? (
        <div className="absolute top-full left-0 z-50 mt-1 max-h-[70vh] w-64 overflow-y-auto rounded-lg bg-white py-1 text-tinta shadow-xl ring-1 ring-black/10">
          <p className="px-3 py-2 text-xs text-tinta-suave">{t("ayuda")}</p>

          <ul>
            {ZONAS.map((z) => (
              <li key={z.slug}>
                <button
                  type="button"
                  onClick={() => elegir(z.slug)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50",
                    z.slug === zonaActual && "font-semibold",
                  )}
                >
                  {z.slug === zonaActual ? (
                    <Check
                      className="h-4 w-4 shrink-0 text-precio-600"
                      aria-hidden
                    />
                  ) : (
                    <span className="w-4 shrink-0" aria-hidden />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate">{z.nombre}</span>
                    <span className="block text-xs text-tinta-suave">
                      {z.region}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
