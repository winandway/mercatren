"use client";

import { CloudDownload, Loader2, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { traerTandaDeFotos } from "@/lib/catalogo/traer-fotos";
import { cn } from "@/lib/utils";

/**
 * Trae las fotos del catalogo desde el servidor del comercio de origen.
 *
 * Va llamando tanda tras tanda hasta que no quede ninguna, y va pintando el
 * avance: son cientos de imagenes y sin barra uno no sabe si esta pasando
 * algo o se colgo.
 *
 * Se puede parar a mitad y retomar despues: cada tanda deja su trabajo hecho
 * en la base, no hay nada a medias.
 */
export function TraerFotos({
  pendientes,
  porHora,
  rotas,
}: {
  pendientes: number;
  /** Cuántas trae el reloj por hora, para decirlo. */
  porHora: number;
  /** Las que el origen ya no tiene: se nombran, no se esconden. */
  rotas: number;
}) {
  const t = useTranslations("panel.fotos");

  const [faltan, setFaltan] = useState(pendientes);
  const [corriendo, setCorriendo] = useState(false);
  const [parar, setParar] = useState(false);
  const [copiadas, setCopiadas] = useState(0);
  const [fallidas, setFallidas] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const total = pendientes || 1;
  const hechas = Math.max(0, pendientes - faltan);
  const porcentaje = Math.min(100, Math.round((hechas / total) * 100));

  async function arrancar() {
    setCorriendo(true);
    setParar(false);
    setError(null);

    let seguir = true;
    while (seguir) {
      const r = await traerTandaDeFotos();

      if (!r.ok) {
        setError(r.mensaje ?? null);
        break;
      }

      setCopiadas((n) => n + r.copiadas);
      setFallidas((n) => n + r.fallidas);
      setFaltan(r.faltan);

      // Se para cuando no queda nada, cuando la tanda no avanzo (todas
      // fallaron y se repetirian en bucle) o cuando lo piden.
      seguir = r.faltan > 0 && r.copiadas > 0;
      if (parar) seguir = false;
    }

    setCorriendo(false);
  }

  const avisoRotas =
    rotas > 0 ? (
      <p className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
        <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        {t("rotas", { n: rotas })}
      </p>
    ) : null;

  if (pendientes === 0) {
    return (
      <div>
        <p className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
          {t("todasNuestras")}
        </p>
        {avisoRotas}
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-tinta-suave">{t("texto")}</p>
      <p className="mt-1 text-sm text-tinta-suave">
        {t("automatico", { porHora })}
      </p>
      {avisoRotas}

      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-carga-500 transition-all"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums">
          {hechas} / {pendientes}
        </span>
      </div>

      {copiadas > 0 || fallidas > 0 ? (
        <p className="mt-2 text-xs text-tinta-suave">
          {t("copiadas", { n: copiadas })}
          {fallidas > 0 ? ` · ${t("fallidas", { n: fallidas })}` : ""}
        </p>
      ) : null}

      {error ? (
        <p className="mt-2 flex items-center gap-2 text-xs text-red-700">
          <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={arrancar}
          disabled={corriendo || faltan === 0}
          className={cn("boton-principal gap-2", corriendo && "opacity-70")}
        >
          {corriendo ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <CloudDownload className="h-4 w-4" aria-hidden />
          )}
          {corriendo ? t("copiando") : t("empezar")}
        </button>

        {corriendo ? (
          <button
            type="button"
            onClick={() => setParar(true)}
            className="rounded-lg border border-borde px-4 py-2 text-sm font-semibold hover:border-carga-500"
          >
            {t("parar")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
