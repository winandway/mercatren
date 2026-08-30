"use client";

import { useState, useTransition } from "react";
import { Loader2, MailCheck, Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { avisarProductoEncontrado } from "@/lib/busqueda-imagen/acciones";

type Busqueda = {
  id: string;
  mercado: string;
  imagenClave: string;
  mirada: string | null;
  resultados: number;
  correo: string | null;
  estado: string;
  enlaceAvisado: string | null;
  fecha: string;
};

/**
 * Una búsqueda por foto en el historial del equipo: la miniatura (privada,
 * por /media), lo que el ojo entendió, y — si el cliente dejó correo — el
 * botón de avisar con el campo del enlace a mano.
 */
export function FilaBusquedaImagen({ busqueda }: { busqueda: Busqueda }) {
  const t = useTranslations("panel.busquedasImagen");
  const [enlace, setEnlace] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [avisado, setAvisado] = useState(busqueda.estado === "avisado");
  const [pendiente, iniciar] = useTransition();

  const mirada = (() => {
    try {
      return JSON.parse(busqueda.mirada ?? "{}") as {
        descripcion?: string;
        es?: string[];
        mejorTermino?: string | null;
        error?: string;
      };
    } catch {
      return {};
    }
  })();

  function avisar() {
    iniciar(async () => {
      const r = await avisarProductoEncontrado(busqueda.id, enlace);
      setAviso(r.mensaje);
      if (r.ok) setAvisado(true);
    });
  }

  return (
    <li className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element -- la foto es
          privada y se sirve por /media con sesión; next/image no aporta. */}
      <img
        src={`/media/${busqueda.imagenClave}`}
        alt={mirada.descripcion ?? t("fotoDeBusqueda")}
        className="h-24 w-24 shrink-0 rounded-lg border border-slate-100 object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-tinta-suave">
          {busqueda.fecha} · {busqueda.mercado}
        </p>
        {mirada.descripcion ? (
          <p className="mt-0.5 text-sm font-medium">{mirada.descripcion}</p>
        ) : null}
        {mirada.error ? (
          <p className="mt-0.5 text-sm text-red-700">{mirada.error}</p>
        ) : null}
        <p className="mt-1 text-xs text-tinta-suave">
          {t("resultados", { n: busqueda.resultados })}
          {mirada.es?.length ? ` · ${mirada.es.join(" · ")}` : ""}
        </p>

        {busqueda.correo ? (
          avisado ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-green-700">
              <MailCheck className="h-4 w-4 shrink-0" aria-hidden />
              {t("yaAvisado", { correo: busqueda.correo })}
              {busqueda.enlaceAvisado ? (
                <a
                  href={busqueda.enlaceAvisado}
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("verEnlace")}
                </a>
              ) : null}
            </p>
          ) : (
            <div className="mt-2">
              <p className="text-sm font-semibold text-amber-800">
                {t("esperaAviso", { correo: busqueda.correo })}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <input
                  type="url"
                  value={enlace}
                  onChange={(e) => setEnlace(e.target.value)}
                  placeholder="https://mercatren.com/es/producto/…"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-carga-500"
                />
                <button
                  type="button"
                  onClick={avisar}
                  disabled={pendiente || !enlace.trim()}
                  className="boton-principal flex shrink-0 items-center gap-1.5 text-sm"
                >
                  {pendiente ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden />
                  )}
                  {t("avisar")}
                </button>
              </div>
              {aviso ? (
                <p className="mt-1.5 text-sm text-tinta-suave">{aviso}</p>
              ) : null}
            </div>
          )
        ) : null}
      </div>
    </li>
  );
}
