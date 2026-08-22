import { ArrowUpRight, Info } from "lucide-react";

import type { BloqueArticulo } from "@/contenido/articulos/tipos";
import { cn } from "@/lib/utils";

/**
 * Pinta el cuerpo de un artículo.
 *
 * Un solo sitio para todos: el blog y la documentación se ven igual porque son
 * lo mismo con distinta portada. Si mañana hay que cambiar cómo se ve una
 * tabla, se cambia aquí y cambia en las dos.
 */

const TONOS = {
  neutro: "border-slate-300 bg-slate-50",
  acento: "border-carga-500 bg-carga-500/5",
  bien: "border-emerald-500 bg-emerald-50",
  ojo: "border-amber-500 bg-amber-50",
} as const;

export function CuerpoArticulo({ bloques }: { bloques: BloqueArticulo[] }) {
  return (
    <div className="space-y-5">
      {bloques.map((b, i) => {
        switch (b.tipo) {
          case "parrafo":
            return (
              <p key={i} className="leading-relaxed text-tinta">
                {b.texto}
              </p>
            );

          case "subtitulo":
            return (
              <h2
                key={i}
                className="mt-9 border-b border-borde pb-2 text-xl font-bold tracking-tight"
              >
                {b.texto}
              </h2>
            );

          case "lista":
            return (
              <ul key={i} className="ml-1 space-y-2">
                {b.puntos.map((p, j) => (
                  <li key={j} className="flex gap-2.5 text-tinta">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-carga-500"
                      aria-hidden
                    />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            );

          case "pasos":
            return (
              <ol key={i} className="space-y-4">
                {b.pasos.map((p, j) => (
                  <li key={j} className="flex gap-3.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-carga-500 text-sm font-bold text-white">
                      {j + 1}
                    </span>
                    <div>
                      <p className="font-semibold">{p.titulo}</p>
                      <p className="mt-0.5 text-sm text-tinta-suave">
                        {p.texto}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            );

          case "aviso":
            return (
              <div
                key={i}
                className={cn(
                  "flex gap-3 rounded-r-lg border-l-4 p-4",
                  TONOS[b.tono],
                )}
              >
                <Info
                  className="mt-0.5 h-4 w-4 shrink-0 text-tinta-suave"
                  aria-hidden
                />
                <div>
                  <p className="font-semibold">{b.titulo}</p>
                  <p className="mt-1 text-sm text-tinta-suave">{b.texto}</p>
                </div>
              </div>
            );

          case "tabla":
            return (
              <figure key={i}>
                {/* Con scroll propio: una tabla ancha no puede hacer que se
                    mueva la página entera en el celular. */}
                <div className="overflow-x-auto rounded-xl border border-borde">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-riel-900 text-white">
                        {b.encabezados.map((h, j) => (
                          <th
                            key={j}
                            className="px-3 py-2.5 text-left font-semibold whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {b.filas.map((fila, j) => (
                        <tr key={j} className="border-t border-borde">
                          {fila.map((celda, k) => (
                            <td
                              key={k}
                              className="px-3 py-2.5 whitespace-nowrap"
                            >
                              {celda}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {b.nota ? (
                  <figcaption className="mt-2 text-xs text-tinta-suave">
                    {b.nota}
                  </figcaption>
                ) : null}
              </figure>
            );

          case "imagen":
            /* Una captura del propio software. Con borde y sombra suave para
               que se lea como «esto es una pantalla», no como una ilustración;
               y `loading="lazy"` porque un tutorial puede llevar varias y no
               todas están a la vista al abrir. */
            return (
              <figure key={i} className="my-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.src}
                  alt={b.alt}
                  loading="lazy"
                  className="mx-auto w-full max-w-md rounded-xl border border-borde shadow-sm"
                />
                {b.pie ? (
                  <figcaption className="mt-2 text-center text-xs text-tinta-suave">
                    {b.pie}
                  </figcaption>
                ) : null}
              </figure>
            );

          case "boton":
            /* Un botón de verdad, no un enlace disfrazado: es la acción
               principal del artículo («abrir la demostración»), y tiene que
               verse como tal a primera vista. `target` solo cuando es
               externo, con `noopener` por la regla de siempre. */
            return (
              <p key={i} className="my-6 text-center">
                <a
                  href={b.href}
                  {...(b.externo
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="boton-principal inline-flex gap-2"
                >
                  {b.texto}
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </a>
              </p>
            );
        }
      })}
    </div>
  );
}
