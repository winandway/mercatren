"use client";

import { Loader2, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { aplicarAjusteAlCatalogo } from "@/lib/productos/acciones";

/**
 * El botón que pasa el catálogo viejo al modelo del ajuste incorporado.
 *
 * Toca los precios de TODA la plataforma, así que no corre solo: lo pulsa
 * alguien del equipo, una vez. Es idempotente — solo ajusta productos que
 * aún no tienen su precio base guardado, así que repetirlo no sube nada dos
 * veces. Los productos nuevos ya nacen ajustados por el robotito y no
 * necesitan este botón.
 */
export function AplicarAjuste() {
  const t = useTranslations("panel.configuracion.ajuste");
  const [pendiente, iniciar] = useTransition();
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pendiente}
        onClick={() =>
          iniciar(async () => {
            const r = await aplicarAjusteAlCatalogo();
            setAviso({ ok: r.ok, texto: r.mensaje });
          })
        }
        className="boton-principal gap-2 disabled:opacity-60"
      >
        {pendiente ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Wand2 className="h-4 w-4" aria-hidden />
        )}
        {pendiente ? t("aplicando") : t("boton")}
      </button>

      {aviso ? (
        <p
          role="status"
          className={
            aviso.ok
              ? "rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
              : "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          }
        >
          {aviso.texto}
        </p>
      ) : null}
    </div>
  );
}
