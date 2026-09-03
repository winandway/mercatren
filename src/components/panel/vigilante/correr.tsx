"use client";

import { Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { correrVigilanteDesdePanel } from "@/lib/vigilante/acciones";
import { recargarSiEsVersionVieja } from "@/lib/version-vieja";

/** «Correr ahora»: una corrida completa del vigilante, y la pantalla se
 *  refresca con el latido nuevo. */
export function CorrerVigilante() {
  const t = useTranslations("panel.vigilante");
  const router = useRouter();
  const [corriendo, setCorriendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function correr() {
    setCorriendo(true);
    setError(null);
    try {
      const r = await correrVigilanteDesdePanel();
      if (!r.ok) setError(r.motivo);
      router.refresh();
    } catch (fallo) {
      if (recargarSiEsVersionVieja(fallo)) return;
      setError(String(fallo));
    } finally {
      setCorriendo(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={correr}
        disabled={corriendo}
        className="boton-principal inline-flex items-center gap-2 text-sm"
      >
        {corriendo ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <ShieldCheck className="h-4 w-4" aria-hidden />
        )}
        {corriendo ? t("corriendo") : t("correr")}
      </button>
      {error ? (
        <p className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-900">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
