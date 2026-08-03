"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";

type Opcion = { valor: string; cantidad: number };

/**
 * Buscador y filtros del listado. Todo va en la direccion de la pagina, asi el
 * usuario puede compartir el enlace de una busqueda y llega igual.
 */
export function Controles({
  cuentasReceptoras,
  bancos,
}: {
  cuentasReceptoras: Opcion[];
  bancos: Opcion[];
}) {
  const t = useTranslations("panel.zelle");
  const parametros = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [pendiente, iniciarTransicion] = useTransition();

  // Lo que se busca vive en la direccion, no en un estado aparte: asi el
  // cuadro siempre muestra lo mismo que se esta viendo, incluso si se llega
  // por un enlace compartido o se quitan los filtros.
  const busquedaActual = parametros.get("q") ?? "";

  function aplicar(cambios: Record<string, string | null>) {
    const siguientes = new URLSearchParams(parametros.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor === null || valor === "") siguientes.delete(clave);
      else siguientes.set(clave, valor);
    }
    // Cualquier cambio devuelve a la primera pagina.
    siguientes.delete("pagina");

    const consulta = siguientes.toString();
    iniciarTransicion(() => {
      router.replace(consulta ? `${pathname}?${consulta}` : pathname);
    });
  }

  const hayFiltros = ["q", "cuenta", "banco", "estado", "tipo"].some((c) =>
    parametros.get(c),
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const escrito = new FormData(e.currentTarget).get("q");
          aplicar({ q: String(escrito ?? "").trim() || null });
        }}
        className="flex gap-2"
      >
        <label htmlFor="buscar-pago" className="sr-only">
          {t("buscador.etiqueta")}
        </label>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-tinta-suave"
            aria-hidden
          />
          <input
            id="buscar-pago"
            name="q"
            type="search"
            // La clave hace que el cuadro se rearme cuando cambia la busqueda
            // desde afuera, sin necesidad de guardar el texto en un estado.
            key={busquedaActual}
            defaultValue={busquedaActual}
            placeholder={t("buscador.placeholder")}
            className="w-full rounded-lg border border-slate-300 py-2 pr-3 pl-9 text-sm outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30"
          />
        </div>
        <button
          type="submit"
          disabled={pendiente}
          className="rounded-lg bg-riel-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-riel-800 disabled:opacity-60"
        >
          {t("buscador.buscar")}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-tinta-suave">
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
          {t("filtros.titulo")}
        </span>

        <Selector
          etiqueta={t("filtros.cuentaReceptora")}
          valor={parametros.get("cuenta") ?? ""}
          alCambiar={(v) => aplicar({ cuenta: v })}
          opciones={cuentasReceptoras.map((c) => ({
            valor: c.valor,
            texto: `${c.valor} (${c.cantidad})`,
          }))}
          textoTodos={t("filtros.todas")}
        />

        <Selector
          etiqueta={t("filtros.banco")}
          valor={parametros.get("banco") ?? ""}
          alCambiar={(v) => aplicar({ banco: v })}
          opciones={bancos.map((b) => ({
            valor: b.valor,
            texto: `${b.valor} (${b.cantidad})`,
          }))}
          textoTodos={t("filtros.todos")}
        />

        <Selector
          etiqueta={t("filtros.estado")}
          valor={parametros.get("estado") ?? ""}
          alCambiar={(v) => aplicar({ estado: v })}
          opciones={[
            { valor: "aprobado", texto: t("estados.aprobado") },
            { valor: "pendiente", texto: t("estados.pendiente") },
            { valor: "rechazado", texto: t("estados.rechazado") },
          ]}
          textoTodos={t("filtros.todos")}
        />

        <Selector
          etiqueta={t("filtros.tipo")}
          valor={parametros.get("tipo") ?? ""}
          alCambiar={(v) => aplicar({ tipo: v })}
          opciones={[
            { valor: "entrada", texto: t("tipos.entrada") },
            { valor: "retiro", texto: t("tipos.retiro") },
          ]}
          textoTodos={t("filtros.todos")}
        />

        {hayFiltros ? (
          <button
            type="button"
            onClick={() =>
              aplicar({
                q: null,
                cuenta: null,
                banco: null,
                estado: null,
                tipo: null,
              })
            }
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            {t("filtros.limpiar")}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function Selector({
  etiqueta,
  valor,
  opciones,
  textoTodos,
  alCambiar,
}: {
  etiqueta: string;
  valor: string;
  opciones: { valor: string; texto: string }[];
  textoTodos: string;
  alCambiar: (valor: string) => void;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-xs">
      <span className="sr-only">{etiqueta}</span>
      <select
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        aria-label={etiqueta}
        className="max-w-[220px] rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30"
      >
        <option value="">
          {etiqueta}: {textoTodos}
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
