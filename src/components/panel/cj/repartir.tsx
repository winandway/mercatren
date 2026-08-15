"use client";

import { Check, Loader2, Split } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { repartirCatalogoUs } from "@/lib/cj/importar";

/**
 * REPARTIR EN SUS TIENDAS LO QUE YA ESTABA CARGADO.
 *
 * Los productos que entraron antes de que existieran las tiendas por rubro
 * cuelgan todos de la general. Este botón los mueve a la que les toca.
 *
 * **Se puede pulsar las veces que haga falta**: solo mira los que siguen en la
 * general. Un botón que hay que pulsar una sola vez y exactamente una es un
 * botón que alguien va a pulsar dos veces.
 */
export function RepartirCatalogo() {
  const t = useTranslations("panel.catalogoUsa");
  const [trabajando, setTrabajando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [bien, setBien] = useState(false);

  async function repartir() {
    setTrabajando(true);
    setResultado(null);
    try {
      const r = await repartirCatalogoUs();
      setBien(r.ok);
      setResultado(r.mensaje);
    } catch (fallo) {
      console.error("[cj] repartir falló:", fallo);
      setBien(false);
      setResultado(String(fallo));
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <div className="rounded-xl border border-borde bg-white p-3.5">
      <p className="text-sm font-semibold">{t("repartirTitulo")}</p>
      <p className="mt-1 text-xs text-tinta-suave">{t("repartirTexto")}</p>

      <button
        type="button"
        onClick={repartir}
        disabled={trabajando}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold transition-colors hover:bg-slate-50 disabled:opacity-60"
      >
        {trabajando ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Split className="h-3.5 w-3.5" aria-hidden />
        )}
        {t("repartirBoton")}
      </button>

      {resultado ? (
        <p
          className={
            bien
              ? "mt-2 flex items-start gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-2 text-xs text-emerald-900"
              : "mt-2 rounded-lg bg-red-50 px-2.5 py-2 text-xs text-red-900"
          }
        >
          {bien ? (
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : null}
          {resultado}
        </p>
      ) : null}
    </div>
  );
}
