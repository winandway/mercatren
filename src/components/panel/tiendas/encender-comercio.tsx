"use client";

import { Loader2, Power, PowerOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { useRouter } from "@/i18n/navigation";
import { cambiarEstadoDeComercio } from "@/lib/tiendas/acciones";

/**
 * ══ EL INTERRUPTOR DE UN COMERCIO (21 sep 2026) ══
 *
 * Richard lo buscó para activar un seller de Venezuela y no existía: solo
 * estaba «Aprobar», que sirve una vez y únicamente si la tienda está sin
 * publicar. Este enciende y apaga, las veces que haga falta.
 *
 * **Apagar pide confirmación; encender, no.** Apagar saca la tienda del
 * catálogo y sus productos dejan de venderse — eso se pregunta. Encender solo
 * devuelve las cosas a como deberían estar, y preguntar ahí es estorbar.
 *
 * El servidor vuelve a comprobar el rol y el país: el botón es la comodidad,
 * no la barrera.
 */
export function EncenderComercio({
  tiendaId,
  nombre,
  encendida,
}: {
  tiendaId: string;
  nombre: string;
  encendida: boolean;
}) {
  const t = useTranslations("panel.comercios.interruptor");
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambiar = (a: boolean) =>
    iniciar(async () => {
      const r = await cambiarEstadoDeComercio(tiendaId, a);
      setConfirmando(false);
      setError(r.ok ? null : r.mensaje);
      if (r.ok) router.refresh();
    });

  if (confirmando) {
    return (
      <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
        <p className="text-sm font-semibold text-amber-900">
          {t("confirmarTitulo", { nombre })}
        </p>
        <p className="mt-0.5 text-xs text-amber-900">{t("confirmarAyuda")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pendiente}
            onClick={() => cambiar(false)}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {pendiente ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <PowerOff className="h-4 w-4" aria-hidden />
            )}
            {t("confirmarApagar")}
          </button>
          <button
            type="button"
            disabled={pendiente}
            onClick={() => setConfirmando(false)}
            className="rounded-lg border border-borde px-3 py-2 text-sm font-semibold hover:bg-white"
          >
            {t("cancelar")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        disabled={pendiente}
        onClick={() => (encendida ? setConfirmando(true) : cambiar(true))}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-60 ${
          encendida
            ? "border-borde text-tinta-suave hover:bg-slate-50"
            : "border-precio-300 bg-precio-50 text-precio-800 hover:bg-precio-100"
        }`}
      >
        {pendiente ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : encendida ? (
          <PowerOff className="h-4 w-4" aria-hidden />
        ) : (
          <Power className="h-4 w-4" aria-hidden />
        )}
        {encendida ? t("apagar") : t("encender")}
      </button>

      {error ? (
        <p role="alert" className="mt-1 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
