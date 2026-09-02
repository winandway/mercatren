"use client";

import { Loader2, Scale } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { cerrarSaldoPorFuera } from "@/lib/retiros/acciones";
import { useRouter } from "@/i18n/navigation";

/**
 * «Cerrar saldo (pagado por fuera)» — solo lo ve el equipo. Pide la
 * referencia del pago real ANTES de tocar nada: un cierre sin referencia
 * es un hueco en la conciliación.
 */
export function CerrarSaldo({
  tiendaId,
  nombre,
  disponibleTexto,
}: {
  tiendaId: string;
  nombre: string;
  disponibleTexto: string;
}) {
  const t = useTranslations("panel.comercios.cerrarSaldo");
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [referencia, setReferencia] = useState("");
  const [nota, setNota] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-borde px-3 py-1.5 text-xs font-semibold hover:border-carga-500"
      >
        <Scale className="h-3.5 w-3.5" aria-hidden />
        {t("boton")}
      </button>
    );
  }

  return (
    <div className="mt-2 w-full rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
      <p className="font-semibold text-amber-900">
        {t("titulo", { nombre, monto: disponibleTexto })}
      </p>
      <p className="mt-1 text-xs text-amber-900/80">{t("texto")}</p>
      <input
        value={referencia}
        onChange={(e) => setReferencia(e.target.value)}
        placeholder={t("referencia")}
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-carga-500"
      />
      <input
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        placeholder={t("nota")}
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-carga-500"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pendiente || referencia.trim().length < 3}
          onClick={() =>
            iniciar(async () => {
              const datos = new FormData();
              datos.set("tienda", tiendaId);
              datos.set("referencia", referencia);
              datos.set("nota", nota);
              const r = await cerrarSaldoPorFuera(datos);
              setAviso(r.mensaje);
              if (r.ok) router.refresh();
            })
          }
          className="boton-principal flex items-center gap-2 text-sm"
        >
          {pendiente ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Scale className="h-4 w-4" aria-hidden />
          )}
          {t("confirmar")}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="rounded-lg border border-borde bg-white px-3 py-2 text-sm font-semibold"
        >
          {t("cancelar")}
        </button>
      </div>
      {aviso ? <p className="mt-2 text-xs">{aviso}</p> : null}
    </div>
  );
}
