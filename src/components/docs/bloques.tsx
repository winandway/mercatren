import { Check, X } from "lucide-react";

import {
  FiguraCiclo,
  FiguraFrontera,
  FiguraResumen,
} from "@/components/docs/figuras";
import type { Bloque, Documento, Panel } from "@/contenido/docs/tipos";
import { cn } from "@/lib/utils";

/** Los colores de los recuadros con aviso. El tono dice como leerlo. */
const TONOS = {
  neutro: "border-l-slate-300 bg-slate-50",
  acento: "border-l-carga-500 bg-carga-500/5",
  bien: "border-l-precio-600 bg-emerald-50/60",
  ojo: "border-l-red-500 bg-red-50/50",
} as const;

const TITULO_TONO = {
  neutro: "text-tinta-suave",
  acento: "text-carga-600",
  bien: "text-precio-600",
  ojo: "text-red-700",
} as const;

function PanelSiNo({ panel }: { panel: Panel }) {
  const Icono = panel.tono === "bien" ? Check : X;

  return (
    <div
      className={cn(
        "rounded-xl border border-t-2 p-4 sm:p-5",
        panel.tono === "bien"
          ? "border-borde border-t-precio-600 bg-white"
          : "border-borde border-t-red-500 bg-white",
      )}
    >
      <h3 className="text-sm font-bold">{panel.titulo}</h3>
      <ul className="mt-3 space-y-2">
        {panel.puntos.map((punto) => (
          <li key={punto} className="flex gap-2 text-sm leading-snug">
            <Icono
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                panel.tono === "bien" ? "text-precio-600" : "text-red-500",
              )}
              aria-hidden
            />
            <span className="text-tinta-suave">{punto}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Dibuja un bloque del documento.
 *
 * Cada tipo de bloque tiene su forma; el contenido llega del archivo de
 * contenido, ya en el idioma que toca.
 */
export function Bloques({
  bloques,
  figuras,
}: {
  bloques: Bloque[];
  figuras: Documento["figuras"];
}) {
  return (
    <>
      {bloques.map((bloque, i) => {
        switch (bloque.tipo) {
          case "parrafo":
            return (
              <p key={i} className="mt-4 leading-relaxed text-tinta-suave">
                {bloque.texto}
              </p>
            );

          case "subtitulo":
            return (
              <h3 key={i} className="mt-8 text-lg font-bold">
                {bloque.texto}
              </h3>
            );

          case "lista":
            return (
              <ul key={i} className="mt-4 space-y-3">
                {bloque.puntos.map((punto) => (
                  <li key={punto.texto} className="flex gap-3">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-carga-500"
                      aria-hidden
                    />
                    <p className="leading-relaxed text-tinta-suave">
                      {punto.titulo ? (
                        <strong className="font-semibold text-tinta">
                          {punto.titulo}:{" "}
                        </strong>
                      ) : null}
                      {punto.texto}
                    </p>
                  </li>
                ))}
              </ul>
            );

          case "aviso":
            return (
              <aside
                key={i}
                className={cn(
                  "my-6 rounded-r-xl border-l-4 px-4 py-4 sm:px-5",
                  TONOS[bloque.tono],
                )}
              >
                <p
                  className={cn(
                    "text-xs font-bold tracking-[0.08em] uppercase",
                    TITULO_TONO[bloque.tono],
                  )}
                >
                  {bloque.titulo}
                </p>
                {bloque.parrafos.map((p) => (
                  <p key={p} className="mt-2 text-sm leading-relaxed">
                    {p}
                  </p>
                ))}
              </aside>
            );

          case "dosColumnas":
            return (
              <div key={i} className="my-6 grid gap-4 md:grid-cols-2">
                <PanelSiNo panel={bloque.izquierda} />
                <PanelSiNo panel={bloque.derecha} />
              </div>
            );

          case "tabla":
            return (
              <figure key={i} className="my-6">
                {/* La tabla se desliza sola en el telefono; la pagina no. */}
                <div className="overflow-x-auto rounded-xl border border-borde">
                  <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-riel-900 text-white">
                        {bloque.encabezados.map((titulo) => (
                          <th
                            key={titulo}
                            scope="col"
                            className="px-4 py-3 text-xs font-bold tracking-[0.06em] uppercase"
                          >
                            {titulo}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bloque.filas.map((fila) => (
                        <tr
                          key={fila[0]}
                          className="border-t border-borde align-top even:bg-slate-50/60"
                        >
                          {fila.map((celda, c) => (
                            <td
                              key={c}
                              className={cn(
                                "px-4 py-3 leading-snug",
                                c === 0
                                  ? "font-semibold whitespace-pre-line"
                                  : "text-tinta-suave",
                              )}
                            >
                              {celda}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {bloque.nota ? (
                  <figcaption className="mt-2 text-xs leading-relaxed text-tinta-suave">
                    {bloque.nota}
                  </figcaption>
                ) : null}
              </figure>
            );

          case "pasos":
            return (
              <ol key={i} className="my-6 space-y-6">
                {bloque.pasos.map((paso) => (
                  <li
                    key={paso.numero}
                    className="border-l-2 border-borde pl-4 sm:pl-5"
                  >
                    <p className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-lg font-extrabold text-carga-500">
                        {paso.numero}
                      </span>
                      <span className="text-[11px] font-semibold tracking-[0.06em] text-tinta-suave uppercase">
                        {paso.etiqueta}
                      </span>
                    </p>
                    <h3 className="mt-1 font-bold">{paso.titulo}</h3>
                    {paso.parrafos.map((p) => (
                      <p
                        key={p}
                        className="mt-2 text-sm leading-relaxed text-tinta-suave"
                      >
                        {p}
                      </p>
                    ))}
                  </li>
                ))}
              </ol>
            );

          case "fases":
            return (
              <ol
                key={i}
                className="my-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4"
              >
                {bloque.fases.map((fase) => (
                  <li
                    key={fase.titulo}
                    className="rounded-xl border border-borde bg-white p-4"
                  >
                    <h3 className="text-xs font-bold tracking-[0.06em] text-carga-600 uppercase">
                      {fase.titulo}
                    </h3>
                    <p className="mt-2 text-sm leading-snug text-tinta-suave">
                      {fase.ocurre}
                    </p>
                    <ul className="mt-3 space-y-1 border-t border-borde pt-3">
                      {fase.evidencia.map((e) => (
                        <li
                          key={e}
                          className="flex gap-2 text-xs leading-snug text-tinta-suave"
                        >
                          <span
                            className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-carga-500"
                            aria-hidden
                          />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            );

          case "figuraCiclo":
            return <FiguraCiclo key={i} t={figuras.ciclo} />;

          case "figuraFrontera":
            return <FiguraFrontera key={i} t={figuras.frontera} />;

          case "figuraResumen":
            return <FiguraResumen key={i} t={figuras.resumen} />;

          case "cifras":
            return (
              <dl
                key={i}
                className="my-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              >
                {bloque.items.map((item) => (
                  <div
                    key={item.texto}
                    className="border-l-2 border-carga-500 pl-3"
                  >
                    <dt className="text-2xl font-extrabold">{item.valor}</dt>
                    <dd className="mt-1 text-xs leading-snug text-tinta-suave">
                      {item.texto}
                    </dd>
                  </div>
                ))}
              </dl>
            );
        }
      })}
    </>
  );
}
