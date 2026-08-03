"use client";

import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { subirComprobante } from "@/lib/pedidos/comprobante";

/**
 * Subida de la captura del pago.
 *
 * Solo sube el archivo y avisa: quien decide si el pago vale es una persona
 * del equipo, revisandolo contra el banco.
 */
export function FormularioComprobante({ numero }: { numero: string }) {
  const t = useTranslations("pedido.subida");
  const router = useRouter();
  const [pendiente, iniciarTransicion] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const entradaArchivo = useRef<HTMLInputElement>(null);

  if (listo) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="flex items-center gap-2 font-bold text-emerald-900">
          <CheckCircle2 className="h-5 w-5" aria-hidden />
          {t("estado.pendiente")}
        </p>
        <p className="mt-1 text-sm text-emerald-800">{listo}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        setError(null);
        const datos = new FormData(evento.currentTarget);
        datos.set("numero", numero);

        iniciarTransicion(async () => {
          const resultado = await subirComprobante(datos);
          if (!resultado.ok) {
            setError(resultado.mensaje);
            return;
          }
          setListo(resultado.mensaje);
          router.refresh();
        });
      }}
      className="rounded-xl border border-borde p-5"
    >
      <h3 className="text-lg font-bold">{t("titulo")}</h3>
      <p className="mt-1 text-sm text-tinta-suave">{t("texto")}</p>

      <div className="mt-4 space-y-4">
        <div>
          <span className="text-xs font-medium">{t("archivo")}</span>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => entradaArchivo.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-borde px-4 py-2 text-sm font-semibold transition-colors hover:border-carga-500"
            >
              <Upload className="h-4 w-4" aria-hidden />
              {t("elegirArchivo")}
            </button>
            <span className="min-w-0 flex-1 truncate text-xs text-tinta-suave">
              {nombreArchivo ?? t("sinArchivo")}
            </span>
          </div>
          <input
            ref={entradaArchivo}
            type="file"
            name="captura"
            required
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={(e) =>
              setNombreArchivo(e.target.files?.[0]?.name ?? null)
            }
            className="sr-only"
          />
          <p className="mt-1 text-[11px] text-tinta-suave">
            {t("archivoAyuda")}
          </p>
        </div>

        <label className="block">
          <span className="text-xs font-medium">
            {t("codigo")} · {t("codigoOpcional")}
          </span>
          <input
            type="text"
            name="codigo"
            maxLength={40}
            placeholder={t("codigoPlaceholder")}
            className="mt-1 w-full rounded-lg border border-borde px-3 py-2 text-sm outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30"
          />
        </label>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pendiente}
        className="boton-principal mt-4 w-full disabled:opacity-60"
      >
        {pendiente ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            {t("enviando")}
          </>
        ) : (
          t("enviar")
        )}
      </button>
    </form>
  );
}
