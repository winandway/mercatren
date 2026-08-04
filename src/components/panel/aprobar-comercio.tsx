"use client";

import { BadgeCheck, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { aprobarComercio } from "@/lib/tiendas/acciones";
import { useRouter } from "@/i18n/navigation";

/**
 * El botón con el que el equipo deja vender a un comercio nuevo.
 *
 * Aquí se decide si alguien puede empezar a cobrar en nombre de Mercatren, así
 * que solo sale para el equipo y solo cuando la tienda está pendiente. El
 * servidor lo vuelve a comprobar: el botón es la comodidad, no la barrera.
 */
export function AprobarComercio({ tiendaId }: { tiendaId: string }) {
  const t = useTranslations("panel.usuarios");
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );

  if (aviso?.ok) {
    return (
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
        {aviso.texto}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pendiente}
        onClick={() =>
          iniciar(async () => {
            const r = await aprobarComercio(tiendaId);
            setAviso({ ok: r.ok, texto: r.mensaje });
            if (r.ok) router.refresh();
          })
        }
        className="boton-principal gap-2 disabled:opacity-60"
      >
        {pendiente ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <BadgeCheck className="h-4 w-4" aria-hidden />
        )}
        {t("aprobarComercio")}
      </button>

      {aviso && !aviso.ok ? (
        <p role="alert" className="text-sm text-red-700">
          {aviso.texto}
        </p>
      ) : null}
    </div>
  );
}
