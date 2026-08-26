"use client";

import { Search, Store, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

type Comercio = { id: string; slug: string; nombre: string };

/**
 * ELEGIR EL COMERCIO BUSCÁNDOLO, NO BAJANDO POR UNA LISTA (26 ago 2026).
 *
 * Empezó siendo un `<select>` con todos los comercios. Lo vio el dueño y tenía
 * razón: _«imagínate, no tiene tres mil clientes… ¿dónde lo voy a buscar? O
 * haciendo el scroll a esos tres mil usuarios. Es mejor un buscador»_. Con
 * veinte comercios da igual; con tres mil, un desplegable es una pantalla
 * inservible que además hay que cargar entera.
 *
 * ══ CÓMO SE COMPORTA ══
 *
 * - Se escribe y se filtra **mientras se escribe**, sin ir al servidor: la
 *   lista ya está aquí y son nombres cortos.
 * - Se enseñan **como mucho ocho** resultados. Más no se leen de un vistazo, y
 *   si hay más es que hay que escribir otra letra.
 * - Una vez elegido, **se convierte en una etiqueta con su equis**, como pidió
 *   el dueño: ocupa una línea y se quita de un toque.
 * - Sin acentos ni mayúsculas: «maxium», «MAXIUM» y «Maxiúm» encuentran lo
 *   mismo, porque nadie escribe el nombre de un comercio como está guardado.
 */
export function BuscadorDeComercio({
  comercios,
  elegido,
}: {
  comercios: Comercio[];
  elegido: Comercio | null;
}) {
  const t = useTranslations("panel.calculadora");
  const [texto, setTexto] = useState("");

  const encontrados = useMemo(() => {
    const buscado = normalizar(texto);
    if (!buscado) return [];
    return comercios
      .filter((c) => normalizar(c.nombre).includes(buscado))
      .slice(0, 8);
  }, [texto, comercios]);

  function ir(slug: string | null) {
    window.location.assign(
      slug ? `?comercio=${encodeURIComponent(slug)}` : "?",
    );
  }

  if (elegido) {
    return (
      <div className="rounded-xl border border-carga-500/30 bg-carga-500/5 p-4">
        <p className="text-sm font-bold text-riel-900">{t("porQueComercio")}</p>
        <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-riel-900 py-1.5 pr-1.5 pl-3 text-sm font-semibold text-white">
          <Store className="h-3.5 w-3.5" aria-hidden />
          {elegido.nombre}
          <button
            type="button"
            onClick={() => ir(null)}
            aria-label={t("quitarComercio")}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 hover:bg-white/35"
          >
            <X className="h-3 w-3" aria-hidden />
          </button>
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-carga-500/30 bg-carga-500/5 p-4">
      <label className="block">
        <span className="text-sm font-bold text-riel-900">
          {t("porQueComercio")}
        </span>
        <span className="relative mt-2 block sm:max-w-md">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-tinta-suave"
            aria-hidden
          />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={t("buscaComercio")}
            /* La equis nativa de Chrome vaciaría la casilla sin quitar el
               filtro: se apaga, como en el resto del panel. */
            className="w-full rounded-lg border border-slate-300 py-2.5 pr-3 pl-9 text-base outline-none focus:border-carga-500 sm:text-sm [&::-webkit-search-cancel-button]:hidden"
          />
        </span>
      </label>

      {texto.trim() && encontrados.length === 0 ? (
        <p className="mt-2 text-sm text-tinta-suave">{t("ningunComercio")}</p>
      ) : null}

      {encontrados.length > 0 ? (
        <ul className="mt-2 space-y-1 sm:max-w-md">
          {encontrados.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => ir(c.slug)}
                className="flex w-full items-center gap-2 rounded-lg bg-white px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <Store
                  className="h-3.5 w-3.5 shrink-0 text-tinta-suave"
                  aria-hidden
                />
                <span className="min-w-0 truncate">{c.nombre}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Sin acentos ni mayúsculas: nadie escribe el nombre como está guardado. */
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}
