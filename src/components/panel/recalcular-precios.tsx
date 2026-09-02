"use client";

import { DollarSign, Loader2, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { recalcularPreciosUs } from "@/lib/destino/recalcular-us";

/**
 * Vuelve a calcular el precio de los productos publicados sin envío.
 *
 * Calcado del botón que trae las fotos, y a propósito: quien usa el panel ya
 * sabe cómo se comporta esto —arranca, pinta el avance, se puede parar— y no
 * tiene que aprender un botón nuevo.
 *
 * Se puede cerrar el navegador a mitad y volver mañana: lo recalculado se
 * queda recalculado. Lo que decide qué falta es el propio dato —tener o no
 * fila de envío— y no un contador guardado en ningún lado.
 */
export function RecalcularPrecios({ pendientes }: { pendientes: number }) {
  const t = useTranslations("panel.preciosUs");

  const [faltan, setFaltan] = useState(pendientes);
  const [corriendo, setCorriendo] = useState(false);
  const [hechas, setHechas] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /* El total es lo hecho más lo que falta: con «volver a cotizar TODOS» la
     cuenta inicial es cero y la pantalla decía «712 de 0». */
  const total = Math.max(pendientes, hechas + faltan, 1);
  const porcentaje = Math.min(100, Math.round((hechas / total) * 100));

  async function arrancar(todos = false) {
    setCorriendo(true);
    setError(null);
    /* Recotizar TODO: se fija el instante de arranque y cada tanda toma lo
       cotizado antes de él, así la corrida avanza y termina sola. */
    const antesDe = todos ? Date.now() : undefined;
    if (todos) setFaltan(1);

    let seguir = true;
    /* ══ EL VIGÍA DEL BUCLE (2 sep 2026) ══
       «712 de 0 recalculados» en Colombia: cada tanda decía que hizo ocho y
       los pendientes no bajaban nunca. Si tres tandas seguidas no reducen lo
       que falta, se para y se dice, en vez de girar toda la noche. */
    let menorRestante = Number.POSITIVE_INFINITY;
    let sinAvance = 0;
    while (seguir) {
      const r = await recalcularPreciosUs(antesDe ? { antesDe } : undefined);

      if (!r.ok) {
        setError(r.motivo ?? null);
        break;
      }

      setHechas((n) => n + r.recalculados);
      setFaltan(r.restantes);

      if (r.restantes < menorRestante) {
        menorRestante = r.restantes;
        sinAvance = 0;
      } else {
        sinAvance += 1;
      }
      if (sinAvance >= 3) {
        setError(t("noAvanza", { restantes: r.restantes }));
        break;
      }

      /* Se para cuando no queda nada Y TAMBIÉN cuando la tanda no avanzó: si
         el modelo devolviera basura para todos, `restantes` no bajaría nunca y
         esto giraría en un bucle infinito gastando llamadas. */
      seguir = r.restantes > 0 && r.recalculados > 0;
    }

    setCorriendo(false);
  }

  if (pendientes === 0 && !corriendo && hechas === 0) {
    return (
      <div>
        <p className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
          {t("todoTraducido")}
        </p>
        {/* ══ EL BOTÓN QUE FALTABA (2 sep 2026) ══ «¿Dónde se actualizan
            los envíos de Estados Unidos?» — aquí, siempre, aunque la tarjeta
            diga que no falta ninguno. Vuelve a pedirle a CJ el flete de
            TODOS los productos y rearma el precio con el transporte que de
            verdad sale. */}
        <p className="mt-3 text-sm text-riel-700">{t("recotizarTexto")}</p>
        <button
          type="button"
          onClick={() => arrancar(true)}
          className="boton-principal mt-2 flex items-center gap-2"
        >
          <DollarSign className="h-4 w-4" aria-hidden />
          {t("recotizarTodos")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-riel-700">
        {t("pendientes", { cantidad: faltan })}
      </p>

      {corriendo || hechas > 0 ? (
        <div className="mt-2">
          <div
            className="bg-riel-100 h-2 w-full overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={porcentaje}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-carga-500 transition-all"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <p className="text-riel-600 mt-1 text-xs">
            {t("avance", { hechas, total: pendientes })}
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {/* El motivo entero: esta pantalla es solo del equipo, y un «no se
              pudo» obliga a adivinar entre una llave mal pegada, una cuota
              agotada y un modelo que no existe. */}
          <span>{error}</span>
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => arrancar()}
        disabled={corriendo}
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-riel-800 px-3.5 py-2 text-sm font-semibold text-white hover:bg-riel-700 disabled:opacity-60"
      >
        {corriendo ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <DollarSign className="size-4" aria-hidden />
        )}
        {corriendo ? t("traduciendo") : t("boton")}
      </button>
    </div>
  );
}
