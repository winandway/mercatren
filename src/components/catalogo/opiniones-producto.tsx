"use client";

import { Loader2, Star } from "lucide-react";
import { useState, useTransition } from "react";

import { valorarProducto } from "@/lib/valoraciones/acciones";
import type { OpinionPublica } from "@/lib/valoraciones/consultas";

/**
 * LAS OPINIONES DE UN PRODUCTO, Y EL FORMULARIO DE QUIEN COMPRÓ.
 *
 * ══ EL FORMULARIO SOLO SALE PARA QUIEN COMPRÓ ══
 *
 * Y no por cortesía: una estrella de alguien que no compró no vale nada, y una
 * tienda que las admite se llena de opiniones falsas —propias y de la
 * competencia— en cuanto alguien se da cuenta. La comprobación de verdad está
 * en el servidor; esto solo evita enseñar un formulario que iba a ser
 * rechazado.
 *
 * ══ SE PUEDE CORREGIR LA PROPIA ══
 *
 * Sale rellena con lo que esa persona ya puso. Alguien que probó el producto
 * una semana después tiene derecho a cambiar de opinión, y bloquearlo hace que
 * escriba la queja en otro sitio.
 */
export function OpinionesProducto({
  productoId,
  opiniones,
  puede,
  suya,
  textos,
}: {
  productoId: string;
  opiniones: OpinionPublica[];
  puede: boolean;
  suya: { estrellas: number; comentario: string | null } | null;
  textos: {
    titulo: string;
    sinOpiniones: string;
    tuOpinion: string;
    enviar: string;
    comentario: string;
    soloCompradores: string;
  };
}) {
  const [estrellas, setEstrellas] = useState(suya?.estrellas ?? 0);
  const [comentario, setComentario] = useState(suya?.comentario ?? "");
  const [aviso, setAviso] = useState<string | null>(null);
  const [bien, setBien] = useState(false);
  const [enviando, iniciar] = useTransition();

  function enviar() {
    if (estrellas < 1) return;
    setAviso(null);

    iniciar(async () => {
      const datos = new FormData();
      datos.set("producto", productoId);
      datos.set("estrellas", String(estrellas));
      datos.set("comentario", comentario);
      const r = await valorarProducto(datos);
      setBien(r.ok);
      setAviso(r.mensaje);
    });
  }

  return (
    <section className="mt-8 border-t border-borde pt-6">
      <h2 className="text-lg font-bold">{textos.titulo}</h2>

      {puede ? (
        <div className="mt-3 rounded-xl border border-borde bg-slate-50/60 p-4">
          <p className="text-sm font-semibold">{textos.tuOpinion}</p>

          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setEstrellas(n)}
                aria-label={`${n}`}
                aria-pressed={estrellas === n}
                className="rounded p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={
                    n <= estrellas
                      ? "h-7 w-7 fill-carga-500 text-carga-500"
                      : "h-7 w-7 text-slate-300"
                  }
                />
              </button>
            ))}
          </div>

          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder={textos.comentario}
            rows={3}
            maxLength={1000}
            className="mt-3 w-full resize-none rounded-lg border border-borde px-3 py-2 text-sm outline-none focus:border-carga-500"
          />

          <button
            type="button"
            onClick={enviar}
            disabled={enviando || estrellas < 1}
            className="boton-principal mt-2 gap-2 text-sm disabled:opacity-50"
          >
            {enviando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {textos.enviar}
          </button>

          {aviso ? (
            <p
              role="status"
              className={
                bien
                  ? "mt-2 text-sm font-semibold text-precio-600"
                  : "mt-2 text-sm text-red-700"
              }
            >
              {aviso}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-xs text-tinta-suave">
          {textos.soloCompradores}
        </p>
      )}

      {opiniones.length === 0 ? (
        <p className="mt-4 text-sm text-tinta-suave">{textos.sinOpiniones}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {opiniones.map((o) => (
            <li
              key={o.id}
              className="border-t border-borde pt-3 first:border-0 first:pt-0"
            >
              <span className="flex items-center gap-2">
                <span className="inline-flex" aria-hidden>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={
                        n <= o.estrellas
                          ? "h-3.5 w-3.5 fill-carga-500 text-carga-500"
                          : "h-3.5 w-3.5 text-slate-300"
                      }
                    />
                  ))}
                </span>
                <span className="text-sm font-semibold">{o.nombre}</span>
              </span>
              {o.comentario ? (
                <p className="mt-1 text-sm leading-relaxed">{o.comentario}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
