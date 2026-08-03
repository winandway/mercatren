"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";

type Opcion = { valor: string; texto: string };

/**
 * Buscador y filtros del catalogo. Todo viaja en la direccion de la pagina,
 * asi el cliente puede compartir el enlace de una busqueda tal cual.
 */
export function ControlesCatalogo({
  categorias,
  comercios,
}: {
  categorias: Opcion[];
  comercios: Opcion[];
}) {
  const t = useTranslations("catalogo");
  const parametros = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [pendiente, iniciarTransicion] = useTransition();

  const busquedaActual = parametros.get("q") ?? "";

  function aplicar(cambios: Record<string, string | null>) {
    const siguientes = new URLSearchParams(parametros.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (!valor) siguientes.delete(clave);
      else siguientes.set(clave, valor);
    }
    siguientes.delete("pagina");

    const consulta = siguientes.toString();
    iniciarTransicion(() => {
      router.replace(consulta ? `${pathname}?${consulta}` : pathname);
    });
  }

  const hayFiltros = ["q", "categoria", "comercio", "orden"].some((c) =>
    parametros.get(c),
  );

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const escrito = new FormData(e.currentTarget).get("q");
          aplicar({ q: String(escrito ?? "").trim() || null });
        }}
        className="flex gap-2"
      >
        <label htmlFor="buscar-catalogo" className="sr-only">
          {t("buscarEtiqueta")}
        </label>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-tinta-suave"
            aria-hidden
          />
          <input
            id="buscar-catalogo"
            name="q"
            type="search"
            key={busquedaActual}
            defaultValue={busquedaActual}
            placeholder={t("buscarPlaceholder")}
            className="w-full rounded-lg border border-borde py-2.5 pr-3 pl-9 text-sm outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30"
          />
        </div>
        <button
          type="submit"
          disabled={pendiente}
          className="rounded-lg bg-riel-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-riel-800 disabled:opacity-60"
        >
          {t("buscar")}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        {categorias.length > 0 ? (
          <Selector
            etiqueta={t("filtros.categoria")}
            todos={t("filtros.todas")}
            valor={parametros.get("categoria") ?? ""}
            opciones={categorias}
            alCambiar={(v) => aplicar({ categoria: v })}
          />
        ) : null}

        {comercios.length > 1 ? (
          <Selector
            etiqueta={t("filtros.comercio")}
            todos={t("filtros.todos")}
            valor={parametros.get("comercio") ?? ""}
            opciones={comercios}
            alCambiar={(v) => aplicar({ comercio: v })}
          />
        ) : null}

        <Selector
          etiqueta={t("filtros.orden")}
          todos={t("orden.recientes")}
          valor={parametros.get("orden") ?? ""}
          opciones={[
            { valor: "precio_asc", texto: t("orden.precioAsc") },
            { valor: "precio_desc", texto: t("orden.precioDesc") },
          ]}
          alCambiar={(v) => aplicar({ orden: v })}
        />

        {hayFiltros ? (
          <button
            type="button"
            onClick={() =>
              aplicar({ q: null, categoria: null, comercio: null, orden: null })
            }
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            {t("limpiar")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Selector({
  etiqueta,
  todos,
  valor,
  opciones,
  alCambiar,
}: {
  etiqueta: string;
  todos: string;
  valor: string;
  opciones: Opcion[];
  alCambiar: (valor: string) => void;
}) {
  return (
    <label className="inline-flex items-center text-xs">
      <span className="sr-only">{etiqueta}</span>
      <select
        value={valor}
        aria-label={etiqueta}
        onChange={(e) => alCambiar(e.target.value)}
        className="max-w-[240px] rounded-lg border border-borde bg-white px-2.5 py-2 text-xs outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30"
      >
        <option value="">
          {etiqueta}: {todos}
        </option>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
    </label>
  );
}
