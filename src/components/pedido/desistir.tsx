"use client";

import { CheckCircle2, Loader2, Undo2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { desistirDelPedido } from "@/lib/pedidos/acciones-desistimiento";

/**
 * «DESISTIR DEL CONTRATO AQUÍ» (directiva 2023/2673, art. 11 bis; España).
 *
 * Siempre a la vista durante el plazo. Dos pasos, como pide la directiva:
 * el botón, y después «Confirmar desistimiento». Al confirmar se guarda el
 * aviso y llega el acuse por correo con la fecha y la hora.
 */
export function Desistir({
  numero,
  vence,
  desistidoEn,
}: {
  numero: string;
  /** ISO; null si todavía no se recibió el pedido. */
  vence: string | null;
  /** ISO, si ya se desistió. */
  desistidoEn: string | null;
}) {
  const t = useTranslations("desistimiento");
  const idioma = useLocale() === "en" ? "en" : "es";
  const [paso, setPaso] = useState<"inicio" | "confirmar">("inicio");
  const [hecho, setHecho] = useState<string | null>(desistidoEn);
  const [error, setError] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  const fecha = (iso: string) =>
    new Intl.DateTimeFormat(idioma === "en" ? "en-US" : "es-ES", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Europe/Madrid",
    }).format(new Date(iso));

  if (hecho) {
    return (
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <p className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t("hecho", { fecha: fecha(hecho) })}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-borde bg-white p-4">
      <h2 className="text-base font-semibold">{t("titulo")}</h2>
      <p className="mt-1 text-sm text-tinta-suave">{t("explicacion")}</p>
      {vence ? (
        <p className="mt-1 text-sm text-tinta-suave">
          {t("hasta", { fecha: fecha(vence) })}
        </p>
      ) : null}

      {paso === "inicio" ? (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setPaso("confirmar");
          }}
          className="boton-secundario mt-3 inline-flex items-center gap-2"
        >
          <Undo2 className="h-4 w-4" aria-hidden />
          {t("boton")}
        </button>
      ) : (
        <div className="mt-3 rounded-lg bg-gray-50 p-3" role="group">
          <p className="text-sm font-semibold">{t("confirmarTitulo")}</p>
          <p className="mt-1 text-sm text-tinta-suave">{t("confirmarTexto")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={enviando}
              onClick={() =>
                iniciar(async () => {
                  const r = await desistirDelPedido(numero, { idioma });
                  if (r.ok) setHecho(r.recibidoEn);
                  else setError(r.mensaje);
                })
              }
              className="boton-principal inline-flex items-center gap-2 disabled:opacity-60"
            >
              {enviando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {t("enviando")}
                </>
              ) : (
                t("confirmar")
              )}
            </button>
            <button
              type="button"
              disabled={enviando}
              onClick={() => setPaso("inicio")}
              className="boton-secundario"
            >
              {t("cancelar")}
            </button>
          </div>
        </div>
      )}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
