"use client";

import { Languages, Loader2, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { traducirCatalogoUs } from "@/lib/traduccion/acciones";

/**
 * Traduce al español el catálogo de Estados Unidos, tanda tras tanda.
 *
 * Calcado del botón que trae las fotos, y a propósito: quien usa el panel ya
 * sabe cómo se comporta esto —arranca, pinta el avance, se puede parar— y no
 * tiene que aprender un botón nuevo.
 *
 * Se puede cerrar el navegador a mitad y volver mañana: lo traducido se queda
 * traducido, y al volver a pulsar sigue por donde iba. Lo que decide qué falta
 * es el propio dato, no un contador guardado en ningún lado.
 */
export function TraducirCatalogo({
  pendientes,
  configurado,
}: {
  pendientes: number;
  configurado: boolean;
}) {
  const t = useTranslations("panel.traduccion");

  const [faltan, setFaltan] = useState(pendientes);
  const [corriendo, setCorriendo] = useState(false);
  const [hechas, setHechas] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const total = pendientes || 1;
  const avance = Math.max(0, pendientes - faltan);
  const porcentaje = Math.min(100, Math.round((avance / total) * 100));

  async function arrancar() {
    setCorriendo(true);
    setError(null);

    let seguir = true;
    while (seguir) {
      const r = await traducirCatalogoUs();

      if (!r.ok) {
        setError(r.motivo ?? null);
        break;
      }

      setHechas((n) => n + r.traducidos);
      setFaltan(r.restantes);

      /* Se para cuando no queda nada Y TAMBIÉN cuando la tanda no avanzó: si
         el modelo devolviera basura para todos, `restantes` no bajaría nunca y
         esto giraría en un bucle infinito gastando llamadas. */
      seguir = r.restantes > 0 && r.traducidos > 0;
    }

    setCorriendo(false);
  }

  /* SIN LLAVE NO SE DIBUJA EL BOTÓN, Y SE DICE POR QUÉ.
     Un botón que al pulsarlo siempre falla es peor que no tenerlo: hace creer
     que el sistema está roto cuando lo que falta es pegar una variable. */
  if (!configurado) {
    return (
      <div className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
        <p className="flex items-start gap-2">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{t("sinLlave")}</span>
        </p>
      </div>
    );
  }

  if (pendientes === 0) {
    return (
      <p className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
        {t("todoTraducido")}
      </p>
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
            className="h-2 w-full overflow-hidden rounded-full bg-riel-100"
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
          <p className="mt-1 text-xs text-riel-600">
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
        onClick={arrancar}
        disabled={corriendo}
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-riel-800 px-3.5 py-2 text-sm font-semibold text-white hover:bg-riel-700 disabled:opacity-60"
      >
        {corriendo ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Languages className="size-4" aria-hidden />
        )}
        {corriendo ? t("traduciendo") : t("boton")}
      </button>
    </div>
  );
}
