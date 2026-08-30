"use client";

import { useState, useTransition } from "react";
import { Loader2, ScanSearch } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  indexarUnaTanda,
  type AvanceDelIndice,
} from "@/lib/busqueda-imagen/indexador";

/**
 * El botón que construye el índice del buscador visual, por tandas: se puede
 * parar y retomar, y una foto que falle no detiene a las demás. El mismo
 * patrón de «traer las fotos del catálogo».
 */
export function IndexarBusquedaVisual({
  indexados,
  publicados,
  conError,
}: {
  indexados: number;
  publicados: number;
  conError: number;
}) {
  const t = useTranslations("panel.busquedaVisual");
  const [pendiente, iniciar] = useTransition();
  const [avance, setAvance] = useState<{ hechos: number; fallidos: number }>({
    hechos: 0,
    fallidos: 0,
  });
  const [corriendo, setCorriendo] = useState(false);
  const [quedan, setQuedan] = useState<number | null>(null);

  function arrancar() {
    setCorriendo(true);
    iniciar(async () => {
      /* Tandas encadenadas hasta vaciar la cola o hasta que el usuario pare
         (cerrar la página para y no pierde nada: es idempotente). */
      let seguir = true;
      let hechos = 0;
      let fallidos = 0;
      while (seguir) {
        let r: AvanceDelIndice;
        try {
          r = await indexarUnaTanda();
        } catch {
          break;
        }
        hechos += r.hechos;
        fallidos += r.fallidos;
        setAvance({ hechos, fallidos });
        setQuedan(r.pendientes);
        seguir = r.pendientes > 0 && r.hechos + r.fallidos > 0;
      }
      setCorriendo(false);
    });
  }

  const total = indexados + avance.hechos;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-bold">
        <ScanSearch className="h-5 w-5 text-carga-600" aria-hidden />
        {t("titulo")}
      </h2>
      <p className="mt-1 text-sm text-tinta-suave">{t("texto")}</p>
      <p className="mt-2 text-sm">
        {t("estado", { indexados: total, publicados })}
        {conError > 0 ? (
          <span className="text-amber-700">
            {" "}
            · {t("conError", { n: conError })}
          </span>
        ) : null}
      </p>
      <button
        type="button"
        onClick={arrancar}
        disabled={pendiente || corriendo}
        className="boton-principal mt-3 flex items-center gap-2"
      >
        {corriendo ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {t("indexando", {
              hechos: avance.hechos,
              quedan: quedan ?? "…",
            })}
          </>
        ) : (
          t("boton")
        )}
      </button>
    </div>
  );
}
