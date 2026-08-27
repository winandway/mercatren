"use client";

import { Building2, Check, Copy, Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { subirComprobanteDeCobro } from "@/lib/cobros/acciones";
import type { DatosDeTransferencia } from "@/lib/cobros/transferencia";

/**
 * PAGAR POR TRANSFERENCIA ACH: los datos del banco, uno a uno y copiables.
 *
 * ══ POR QUÉ CADA DATO EN SU PROPIO BOTÓN DE COPIAR ══
 *
 * Porque así es como se llena el formulario del banco: una casilla cada vez.
 * Un bloque con los cuatro datos juntos obliga a seleccionar a mano trozo por
 * trozo, y ahí es donde se cuela un dígito de menos en un número de cuenta —
 * con siete mil dólares dentro.
 *
 * ══ Y POR QUÉ ES LA MISMA COLA QUE ZELLE ══
 *
 * Una transferencia a nuestro banco no pasa por Stripe: el sistema no se
 * entera solo. Quien paga sube el comprobante, una persona lo compara contra
 * el banco y al aprobarlo se acredita — el mismo camino, el mismo número de
 * conciliación y la misma pantalla de validación.
 */
export function PagarConTransferencia({
  enlace,
  datos,
  concepto,
  montoTexto,
}: {
  enlace: string;
  datos: DatosDeTransferencia;
  /** «Mercatren F-00123» — el número de conciliación, ya armado. */
  concepto: string;
  montoTexto: string;
}) {
  const t = useTranslations("cobro");
  const [captura, setCaptura] = useState<File | null>(null);
  const [referencia, setReferencia] = useState("");
  const [copiado, setCopiado] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();
  const [resultado, setResultado] = useState<{ ok: boolean } | null>(null);

  async function copiar(valor: string, cual: string) {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(cual);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      /* Sin portapapeles el dato se ve igual y se copia a mano. */
    }
  }

  if (resultado?.ok) {
    return (
      <p className="rounded-xl bg-emerald-50 px-4 py-5 text-sm font-medium text-emerald-900">
        {t("zEnRevision")}
      </p>
    );
  }

  const filas: { cual: string; etiqueta: string; valor: string }[] = [
    {
      cual: "beneficiario",
      etiqueta: t("achBeneficiario"),
      valor: datos.beneficiario,
    },
    { cual: "banco", etiqueta: t("achBanco"), valor: datos.banco },
    { cual: "ruta", etiqueta: t("achRuta"), valor: datos.rutaAch },
    { cual: "cuenta", etiqueta: t("achCuenta"), valor: datos.cuenta },
  ];

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        iniciar(async () => {
          const formulario = new FormData();
          formulario.set("enlace", enlace);
          if (captura) formulario.set("captura", captura);
          formulario.set("codigo", referencia);
          setResultado(await subirComprobanteDeCobro(formulario));
        });
      }}
      className="space-y-4"
    >
      <p className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-tinta-suave">
        <Building2
          className="mt-0.5 h-4 w-4 shrink-0 text-carga-600"
          aria-hidden
        />
        {t("achComoFunciona")}
      </p>

      {/* 1 · Los datos del banco, cada uno con su botón */}
      <div className="rounded-xl border border-borde p-4">
        <p className="text-sm font-bold text-riel-900">{t("achPaso1")}</p>
        <dl className="mt-3 space-y-2.5">
          {filas.map(({ cual, etiqueta, valor }) => (
            <div key={cual}>
              <dt className="text-xs text-tinta-suave">{etiqueta}</dt>
              <dd className="mt-0.5 flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold break-all text-riel-900">
                  {valor}
                </span>
                <button
                  type="button"
                  onClick={() => copiar(valor, cual)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md border border-borde px-2 py-1 text-xs font-semibold hover:bg-slate-50"
                >
                  {copiado === cual ? (
                    <Check className="h-3 w-3" aria-hidden />
                  ) : (
                    <Copy className="h-3 w-3" aria-hidden />
                  )}
                  {copiado === cual ? t("zCopiado") : t("zCopiar")}
                </button>
              </dd>
              {/* LA ADVERTENCIA VA PEGADA A LA RUTA, no en un pie de página.
                  Chase da un número para ACH y otro para wire; el que copia
                  está mirando ESTA línea, no el final de la pantalla. */}
              {cual === "ruta" ? (
                <p className="mt-1 text-xs leading-relaxed text-amber-800">
                  {t("achRutaAyuda")}
                </p>
              ) : null}
            </div>
          ))}
        </dl>
      </div>

      {/* 2 · El monto exacto */}
      <div className="rounded-xl border border-borde bg-riel-900 p-4 text-white">
        <p className="text-sm font-bold">{t("achPaso2")}</p>
        <p className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-2xl font-extrabold tabular-nums">
            {montoTexto}
          </span>
          <button
            type="button"
            onClick={() => copiar(montoTexto.replace(/[^0-9.]/g, ""), "monto")}
            className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-xs font-semibold hover:bg-white/25"
          >
            {copiado === "monto" ? (
              <Check className="h-3 w-3" aria-hidden />
            ) : (
              <Copy className="h-3 w-3" aria-hidden />
            )}
            {copiado === "monto" ? t("zCopiado") : t("zCopiar")}
          </button>
        </p>
        <p className="mt-1 text-xs text-white/70">{t("achMontoAyuda")}</p>
      </div>

      {/* 3 · El número de conciliación: el paso que más se olvida */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-bold text-red-800">{t("achPaso3")}</p>
        <p className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-white px-3 py-2 font-mono text-base font-bold break-all">
            {concepto}
          </span>
          <button
            type="button"
            onClick={() => copiar(concepto, "concepto")}
            className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-white px-2 py-1.5 text-xs font-semibold text-red-800"
          >
            {copiado === "concepto" ? (
              <Check className="h-3 w-3" aria-hidden />
            ) : (
              <Copy className="h-3 w-3" aria-hidden />
            )}
            {copiado === "concepto" ? t("zCopiado") : t("zCopiar")}
          </button>
        </p>
        <p className="mt-2 text-xs leading-relaxed text-red-800">
          {t("achConceptoAyuda")}
        </p>
      </div>

      {/* 4 · El comprobante */}
      <div className="rounded-xl border border-borde p-4">
        <p className="text-sm font-bold text-riel-900">{t("achPaso4")}</p>

        <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-borde bg-slate-50 px-4 py-6 text-center">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
            onChange={(e) => setCaptura(e.target.files?.[0] ?? null)}
            className="sr-only"
          />
          <Upload className="h-5 w-5 text-carga-500" aria-hidden />
          <span className="text-sm font-semibold">
            {captura ? captura.name : t("achSubirComprobante")}
          </span>
        </label>

        <label className="mt-3 block">
          <span className="text-sm text-tinta-suave">{t("achReferencia")}</span>
          <input
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            maxLength={60}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-carga-500"
          />
        </label>
      </div>

      {resultado && !resultado.ok ? (
        <p role="alert" className="text-sm font-medium text-red-700">
          {t("zErrores.generico")}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!captura || enviando}
        className="boton-principal w-full gap-2 py-3 disabled:opacity-50"
      >
        {enviando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : null}
        {t("achEnviar")}
      </button>
    </form>
  );
}
