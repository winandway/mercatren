"use client";

import { Check, Copy, Loader2, Send, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { subirComprobanteDeCobro } from "@/lib/cobros/acciones";

/**
 * PAGAR UN COBRO POR ZELLE: tres pasos, y el del medio es el que importa.
 *
 * ══ EL CONCEPTO ES EL PROTAGONISTA, NO LA LETRA CHICA ══
 *
 * Zelle no manda un cobro: manda una transferencia suelta con una nota. La
 * conciliación bancaria de Mercatren LLC es estricta — cada transferencia del
 * extracto tiene que cuadrar con su cobro — y lo ÚNICO que hace ese cuadre
 * posible es que el pagador escriba el concepto en la nota. Por eso va en
 * rojo, en grande, con su botón de copiar, ANTES de la captura: el orden en
 * que se lee es el orden en que se hace.
 *
 * ══ LA CAPTURA VA ENTERA ══
 *
 * El comprobante NO se comprime: un validador tiene que leer el monto y la
 * referencia del banco, y comprimir texto es justo donde se pierde
 * legibilidad. Eso es dinero.
 */
export function PagarConZelle({
  enlace,
  receptor,
  concepto,
  montoTexto,
}: {
  enlace: string;
  /** El correo Zelle que recibe. Sale de la variable, jamás se inventa. */
  receptor: string;
  /** «Mercatren F-00123» — el número de conciliación, ya armado. */
  concepto: string;
  montoTexto: string;
}) {
  const t = useTranslations("cobro");
  const [captura, setCaptura] = useState<File | null>(null);
  const [codigo, setCodigo] = useState("");
  const [copiado, setCopiado] = useState<"receptor" | "concepto" | null>(null);
  const [resultado, setResultado] = useState<
    { ok: true } | { ok: false; motivo: string } | null
  >(null);
  const [enviando, iniciar] = useTransition();

  function copiar(texto: string, cual: "receptor" | "concepto") {
    void navigator.clipboard?.writeText(texto).then(() => {
      setCopiado(cual);
      window.setTimeout(() => setCopiado(null), 2000);
    });
  }

  if (resultado?.ok) {
    return (
      <p
        role="status"
        className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900"
      >
        {t("zEnRevision")}
      </p>
    );
  }

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        iniciar(async () => {
          const datos = new FormData();
          datos.set("enlace", enlace);
          if (captura) datos.set("captura", captura);
          datos.set("codigo", codigo);
          setResultado(await subirComprobanteDeCobro(datos));
        });
      }}
      className="space-y-4"
    >
      {/* Paso 1: a dónde se manda. */}
      <div>
        <p className="text-sm font-semibold">
          1 · {t("zPaso1", { monto: montoTexto })}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-slate-100 px-3 py-2.5 text-sm font-semibold break-all">
            {receptor}
          </code>
          <button
            type="button"
            onClick={() => copiar(receptor, "receptor")}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-borde px-3 py-2.5 text-xs font-semibold hover:border-carga-500"
          >
            {copiado === "receptor" ? (
              <Check className="h-3.5 w-3.5 text-precio-600" aria-hidden />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden />
            )}
            {copiado === "receptor" ? t("zCopiado") : t("zCopiar")}
          </button>
        </div>
      </div>

      {/**
       * Paso 2: EL NÚMERO DE CONCILIACIÓN. En rojo y con la explicación de por
       * qué, no como una orden seca: quien entiende que sin la nota su pago se
       * pierde semanas, la escribe.
       */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-3">
        <p className="text-sm font-bold text-red-900">2 · {t("zPaso2")}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-white px-3 py-2.5 text-base font-extrabold tracking-wide text-red-900">
            {concepto}
          </code>
          <button
            type="button"
            onClick={() => copiar(concepto, "concepto")}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-2.5 text-xs font-semibold text-red-900 hover:border-red-500"
          >
            {copiado === "concepto" ? (
              <Check className="h-3.5 w-3.5 text-precio-600" aria-hidden />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden />
            )}
            {copiado === "concepto" ? t("zCopiado") : t("zCopiar")}
          </button>
        </div>
        <p className="mt-1.5 text-xs leading-snug font-semibold text-red-900">
          {t("zPaso2Detalle")}
        </p>
        {/**
         * POR QUÉ HACE FALTA, DICHO EN SU BENEFICIO Y NO COMO AMENAZA.
         *
         * Se pensó en advertir «sin este número te devolvemos el dinero», y se
         * descartó: eso le abre la puerta a quien deje la nota en blanco a
         * propósito para reclamar la mercancía Y el reembolso.
         *
         * Lo que sí es cierto —y le sirve a quien paga— es que ese número
         * documenta las dos puntas del movimiento. Quien entiende que le
         * protege su propia cuenta lo escribe; a quien se le amenaza,
         * discute.
         */}
        <p className="mt-1.5 text-xs leading-snug text-red-800">
          {t("zPorQueConcepto")}
        </p>
      </div>

      {/* Solo bancos de Estados Unidos: por eso no se ofrece SWIFT ni
          transferencia internacional. Decirlo aquí evita que alguien mande
          desde fuera un dinero que va a rebotar. */}
      <p className="text-xs text-tinta-suave">{t("zSoloDesdeEeuu")}</p>

      {/* Paso 3: la captura. */}
      <div>
        <p className="text-sm font-semibold">3 · {t("zPaso3")}</p>
        <label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-borde px-3 py-3 text-sm text-tinta-suave hover:border-carga-500">
          <Upload className="h-4 w-4 shrink-0" aria-hidden />
          <span className="min-w-0 truncate">
            {captura ? captura.name : t("zPaso3")}
          </span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => setCaptura(e.target.files?.[0] ?? null)}
          />
        </label>

        <label className="mt-2 block">
          <span className="text-xs text-tinta-suave">{t("zCodigo")}</span>
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            maxLength={60}
            className="mt-1 w-full rounded-lg border border-borde px-3 py-2 text-sm outline-none focus:border-carga-500"
          />
        </label>
      </div>

      {resultado && !resultado.ok ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {t(`zErrores.${resultado.motivo}`)}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enviando || !captura}
        className="boton-principal w-full gap-2 disabled:opacity-60"
      >
        {enviando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Send className="h-4 w-4" aria-hidden />
        )}
        {enviando ? t("zEnviando") : t("zEnviar")}
      </button>
    </form>
  );
}
