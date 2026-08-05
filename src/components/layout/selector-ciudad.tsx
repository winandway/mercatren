"use client";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { ESTADOS, type EstadoVE } from "@/lib/entrega/zonas";
import { cn } from "@/lib/utils";

/**
 * Dónde está quien compra: ESTADO → CIUDAD, como el mapa real de Venezuela.
 *
 * La primera versión era una lista plana de pueblos escrita a mano y el dueño
 * la mandó a rehacer ("una chapuza"): Caños Zancudo al lado de Caracas, sin
 * jerarquía. Ahora el cliente toca su estado y adentro están sus ciudades —
 * las 481 oficiales del país, así que la de un vendedor nuevo ya existe.
 *
 * EL BOMBILLO VERDE dice dónde Mercatren ya está: un punto en cada estado y
 * ciudad con mercancía que retirar. El que abre la lista ve de un golpe la
 * cobertura — y un vendedor ve dónde falta un negocio por abrir.
 *
 * SE PREGUNTA, NO SE ADIVINA. Nada de IP (un celular en El Vigía puede salir
 * con IP de Bogotá) ni de GPS (pide un permiso que la mayoría niega). Amazon
 * pregunta el código postal; aquí se pregunta la ciudad.
 *
 * Al elegir se RECARGA la página entera: el filtro del catálogo y los avisos
 * de retiro los arma el servidor, y con una navegación de cliente seguirían
 * enseñando la ciudad anterior.
 */
function guardarYRecargar(slug: string | null) {
  // Un año de vida: nadie quiere decir dónde vive dos veces. `lax` alcanza —
  // esto no es una credencial. Con null se borra: "toda Venezuela".
  document.cookie = slug
    ? `mercatren_zona=${slug}; path=/; max-age=31536000; samesite=lax`
    : "mercatren_zona=; path=/; max-age=0; samesite=lax";
  window.location.reload();
}

/** El bombillo verde: aquí ya hay mercancía. */
function Bombillo() {
  return (
    <span
      className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
      aria-hidden
    />
  );
}

export function SelectorCiudad({
  zonaActual,
  cobertura,
  enLinea = false,
}: {
  zonaActual: string | null;
  /** productos por ciudad (slug → cuántos), para encender los bombillos. */
  cobertura: Record<string, number>;
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
  const [estadoAbierto, setEstadoAbierto] = useState<EstadoVE | null>(null);
  const caja = useRef<HTMLDivElement>(null);

  const elegida = (() => {
    for (const e of ESTADOS)
      for (const c of e.ciudades) if (c.slug === zonaActual) return c;
    return null;
  })();

  const estadoTieneCobertura = (e: EstadoVE) =>
    e.ciudades.some((c) => cobertura[c.slug]);

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

  function abrir() {
    // Siempre arranca en los estados; si ya eligió, con el suyo abierto para
    // que cambiar de ciudad dentro del mismo estado sea un solo toque.
    setEstadoAbierto(
      elegida
        ? (ESTADOS.find((e) => e.ciudades.some((c) => c.slug === zonaActual)) ??
            null)
        : null,
    );
    setAbierto((v) => !v);
  }

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={abrir}
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
        <div className="absolute top-full left-0 z-50 mt-1 max-h-[70vh] w-72 overflow-y-auto rounded-lg bg-white py-1 text-tinta shadow-xl ring-1 ring-black/10">
          {estadoAbierto === null ? (
            <>
              <p className="px-3 py-2 text-xs text-tinta-suave">{t("ayuda")}</p>

              {/* Volver a ver todo, sin ciudad. */}
              {zonaActual ? (
                <button
                  type="button"
                  onClick={() => guardarYRecargar(null)}
                  className="flex w-full items-center gap-2 border-b border-borde px-3 py-2 text-left text-sm font-semibold hover:bg-slate-50"
                >
                  <span className="w-4 shrink-0" aria-hidden />
                  {t("todaVenezuela")}
                </button>
              ) : null}

              <ul>
                {ESTADOS.map((estado) => {
                  const activo = estado.ciudades.some(
                    (c) => c.slug === zonaActual,
                  );
                  return (
                    <li key={estado.slug}>
                      <button
                        type="button"
                        onClick={() => setEstadoAbierto(estado)}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50",
                          activo && "font-semibold",
                        )}
                      >
                        {estadoTieneCobertura(estado) ? (
                          <Bombillo />
                        ) : (
                          <span className="w-2 shrink-0" aria-hidden />
                        )}
                        <span className="min-w-0 flex-1 truncate">
                          {estado.nombre}
                        </span>
                        {estadoTieneCobertura(estado) ? (
                          <span className="shrink-0 text-[11px] font-medium text-emerald-700">
                            {t("mercatrenAqui")}
                          </span>
                        ) : null}
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-tinta-suave"
                          aria-hidden
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEstadoAbierto(null)}
                className="flex w-full items-center gap-2 border-b border-borde px-3 py-2 text-left text-sm font-semibold hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                {estadoAbierto.nombre}
              </button>

              <ul>
                {estadoAbierto.ciudades.map((ciudad) => {
                  const cuantos = cobertura[ciudad.slug];
                  return (
                    <li key={ciudad.slug}>
                      <button
                        type="button"
                        onClick={() => guardarYRecargar(ciudad.slug)}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50",
                          ciudad.slug === zonaActual && "font-semibold",
                        )}
                      >
                        {ciudad.slug === zonaActual ? (
                          <Check
                            className="h-4 w-4 shrink-0 text-precio-600"
                            aria-hidden
                          />
                        ) : (
                          <span className="w-4 shrink-0" aria-hidden />
                        )}
                        <span className="min-w-0 flex-1 truncate">
                          {ciudad.nombre}
                        </span>
                        {cuantos ? (
                          <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                            <Bombillo />
                            {t("productosAqui", { n: cuantos })}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
