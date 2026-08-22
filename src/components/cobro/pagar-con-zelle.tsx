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
  nombreReceptor,
  concepto,
  montoTexto,
}: {
  enlace: string;
  /** El correo Zelle que recibe. Sale de la variable, jamás se inventa. */
  receptor: string;
  /**
   * A NOMBRE DE QUIÉN ESTÁ ESA CUENTA.
   *
   * Al mandar un Zelle, el banco enseña el nombre del titular **antes** de
   * confirmar, y pregunta si es correcto. Quien no sabe qué nombre esperar
   * cancela ahí mismo — y hace bien. Que en pantalla diga «Mercatren LLC» es
   * lo que convierte esa pregunta en una confirmación.
   */
  nombreReceptor: string | null;
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
      {/**
       * LOS TRES PASOS VAN EN UN HILO: CÍRCULO NUMERADO Y LÍNEA QUE LOS UNE.
       *
       * Lo pidió el dueño viendo la pantalla: los pasos «no estaban presentes».
       * Un «1 ·» pegado al título se lee como parte del texto; un círculo con
       * el número y una línea que baja hasta el siguiente se lee como lo que
       * es — un camino de tres paradas. Quien paga por primera vez sabe en
       * qué parada va y cuántas le faltan.
       *
       * Cada círculo lleva el tono de su paso (verde, rojo, oscuro) para que
       * el hilo y las cajas cuenten la misma historia. La línea es decorativa
       * (`aria-hidden`); el número no: es el que lee el lector de pantalla.
       *
       * Y los latidos siguen donde estaban: en el botón de copiar del paso 1,
       * en el del 2, y en la caja de la captura.
       */}
      <ol className="space-y-0">
        {/**
         * Paso 1: A DÓNDE SE MANDA, Y A NOMBRE DE QUIÉN.
         *
         * ══ EN VERDE, Y NO POR GUSTO ══
         *
         * Este es el dato que se pega en la app del banco. En gris se lee como
         * información; en verde se lee como «esto es lo correcto, cópialo». En
         * una pantalla donde alguien está a punto de mandar dinero a un
         * desconocido, esa diferencia es confianza.
         *
         * ══ Y EL NOMBRE VA ARRIBA DEL CORREO ══
         *
         * Al mandar un Zelle, el banco enseña el nombre del titular ANTES de
         * confirmar y pregunta si es correcto. Sin saber qué nombre esperar,
         * quien paga cancela — y hace bien. Aquí se le dice de antemano.
         */}
        <li className="relative pb-5 pl-11">
          <span className="absolute top-0 left-0 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-extrabold text-white ring-4 ring-white">
            1
          </span>
          <span
            aria-hidden
            className="absolute top-8 bottom-0 left-[15px] w-0.5 bg-slate-300"
          />
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3">
            <p className="text-sm font-bold text-emerald-900">
              {t("zPaso1", { monto: montoTexto })}
            </p>

            {nombreReceptor ? (
              <p className="mt-1.5 text-xs text-emerald-900">
                {t.rich("zTitular", {
                  nombre: nombreReceptor,
                  fuerte: (texto) => <strong>{texto}</strong>,
                })}
              </p>
            ) : null}

            {/* `flex-wrap` + un ancho mínimo para el correo: en un celular
                estrecho el botón baja de línea en vez de partir
                «pagos@mercatren.c/om» por la mitad. Un correo partido se
                copia mal a mano. */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="min-w-[11rem] flex-1 rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-emerald-900">
                {receptor}
              </code>
              <button
                type="button"
                onClick={() => copiar(receptor, "receptor")}
                className="latido-guia inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-400 bg-white px-3 py-2.5 text-xs font-semibold text-emerald-900 hover:border-emerald-600"
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
        </li>

        {/**
         * Paso 2: EL NÚMERO DE CONCILIACIÓN. En rojo y con la explicación de
         * por qué, no como una orden seca: quien entiende que sin la nota su
         * pago se pierde semanas, la escribe.
         */}
        <li className="relative pb-5 pl-11">
          <span className="absolute top-0 left-0 flex h-8 w-8 items-center justify-center rounded-full bg-red-700 text-sm font-extrabold text-white ring-4 ring-white">
            2
          </span>
          <span
            aria-hidden
            className="absolute top-8 bottom-0 left-[15px] w-0.5 bg-slate-300"
          />
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-bold text-red-900">{t("zPaso2")}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <code className="min-w-[11rem] flex-1 rounded-lg bg-white px-3 py-2.5 text-base font-extrabold tracking-wide text-red-900">
                {concepto}
              </code>
              <button
                type="button"
                onClick={() => copiar(concepto, "concepto")}
                className="latido-guia-2 inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-2.5 text-xs font-semibold text-red-900 hover:border-red-500"
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
             * Se pensó en advertir «sin este número te devolvemos el dinero»,
             * y se descartó: eso le abre la puerta a quien deje la nota en
             * blanco a propósito para reclamar la mercancía Y el reembolso.
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
              transferencia internacional. Decirlo aquí evita que alguien
              mande desde fuera un dinero que va a rebotar. */}
          <p className="mt-2 text-xs text-tinta-suave">{t("zSoloDesdeEeuu")}</p>
        </li>

        {/* Paso 3: la captura y, si lo hay, el código del banco. Es la última
            parada: sin línea debajo. */}
        <li className="relative pl-11">
          <span className="absolute top-0 left-0 flex h-8 w-8 items-center justify-center rounded-full bg-riel-900 text-sm font-extrabold text-white ring-4 ring-white">
            3
          </span>
          <div>
            <p className="pt-1.5 text-sm font-bold">{t("zPaso3")}</p>
            <label className="latido-guia-3 mt-1.5 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-borde px-3 py-3 text-sm text-tinta-suave hover:border-carga-500">
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
        </li>
      </ol>

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
