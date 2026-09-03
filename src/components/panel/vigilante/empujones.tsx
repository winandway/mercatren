"use client";

import {
  CloudDownload,
  DownloadCloud,
  Languages,
  Loader2,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  afinarAhora,
  importarAhora,
  traducirAhora,
  traerFotosAhora,
  type ResultadoEmpujon,
} from "@/lib/vigilante/acciones";
import { recargarSiEsVersionVieja } from "@/lib/version-vieja";

/**
 * LOS BOTONES CORTOS DEL TABLERO (3 sep 2026).
 *
 * «Un botón corto desde ese mismo lugar donde uno le pueda dar un clic para
 * continuar agregando productos, terminando una traducción o cualquier
 * cosa». Hacen lo mismo que el reloj, aquí y ahora, y dicen qué pasó — un
 * botón que no contesta se pulsa cinco veces.
 */
const TRABAJOS = [
  { id: "importar", correr: importarAhora, Icono: DownloadCloud },
  { id: "afinar", correr: afinarAhora, Icono: Wrench },
  { id: "traducir", correr: traducirAhora, Icono: Languages },
  { id: "fotos", correr: traerFotosAhora, Icono: CloudDownload },
] as const;

export function EmpujonesDelTablero() {
  const t = useTranslations("panel.vigilante.empujones");
  const router = useRouter();
  const [corriendo, setCorriendo] = useState<string | null>(null);
  const [salida, setSalida] = useState<{ id: string; texto: string } | null>(
    null,
  );

  async function correr(id: string, fn: () => Promise<ResultadoEmpujon>) {
    setCorriendo(id);
    setSalida(null);
    try {
      const r = await fn();
      setSalida({ id, texto: r.ok ? r.texto : r.motivo });
      router.refresh();
    } catch (fallo) {
      if (recargarSiEsVersionVieja(fallo)) return;
      setSalida({ id, texto: String(fallo) });
    } finally {
      setCorriendo(null);
    }
  }

  return (
    <div className="rounded-xl border border-borde bg-white p-4">
      <h2 className="text-sm font-semibold">{t("titulo")}</h2>
      <p className="mt-1 text-xs text-tinta-suave">{t("texto")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {TRABAJOS.map(({ id, correr: fn, Icono }) => (
          <button
            key={id}
            type="button"
            onClick={() => correr(id, fn)}
            disabled={corriendo !== null}
            className="inline-flex items-center gap-2 rounded-lg border border-borde px-3 py-2 text-sm font-semibold hover:border-carga-500 disabled:opacity-60"
          >
            {corriendo === id ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Icono className="h-4 w-4" aria-hidden />
            )}
            {t(id)}
          </button>
        ))}
      </div>
      {salida ? (
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-tinta-suave">
          <span className="font-semibold">{t(salida.id)}:</span> {salida.texto}
        </p>
      ) : null}
    </div>
  );
}
