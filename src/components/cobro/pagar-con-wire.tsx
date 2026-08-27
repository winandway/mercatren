"use client";

import { Building2, Check, Copy, Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { subirComprobanteDeCobro } from "@/lib/cobros/acciones";
import type { DatosDeWire } from "@/lib/cobros/wire";

/**
 * PAGAR POR CABLE (WIRE): los datos del banco y el costo, a la vista.
 *
 * ══ ES CASI IGUAL AL ACH, Y AUN ASÍ VA APARTE ══
 *
 * Porque las dos cosas que cambian son justo las que cuestan dinero si se
 * confunden: **la ruta es otra** —Chase lo dice en su pantalla: la de ACH solo
 * sirve para depósitos directos y ACH— y **el monto es otro**, porque recibir
 * un cable nos cuesta y ese costo se le suma a quien elige esa vía.
 *
 * Reutilizar el componente del ACH con dos `if` dentro habría dejado un solo
 * archivo donde un descuido manda el dinero a dar vueltas entre bancos.
 *
 * ══ EL COSTO SE DESGLOSA ANTES DEL MONTO ══
 *
 * «La factura son $2.774,04 · recibir el cable cuesta $30,00 · transfiere
 * $2.804,04». Enseñar solo el total hace que alguien mande el monto de la
 * factura, se quede corto por treinta dólares, y haya que corregir el pago a
 * mano — que es el problema que ya tuvimos.
 *
 * ══ Y ES LA MISMA COLA QUE ZELLE Y ACH ══
 *
 * Un cable no pasa por Stripe: el sistema no se entera solo. Quien paga sube el
 * comprobante, una persona lo compara contra el banco, y al aprobarlo se
 * acredita.
 */
export function PagarConWire({
  enlace,
  datos,
  concepto,
  montoTexto,
  facturaTexto,
  costoTexto,
}: {
  enlace: string;
  datos: DatosDeWire;
  /** «Mercatren F-00123» — el número de conciliación, ya armado. */
  concepto: string;
  /** Lo que hay que transferir: la factura MÁS el costo de recibir el cable. */
  montoTexto: string;
  /** Lo que dice la factura, para el desglose. */
  facturaTexto: string;
  /** Lo que cuesta recibirlo. */
  costoTexto: string;
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
      etiqueta: t("wireBeneficiario"),
      valor: datos.beneficiario,
    },
    { cual: "banco", etiqueta: t("wireBanco"), valor: datos.banco },
    { cual: "ruta", etiqueta: t("wireRuta"), valor: datos.rutaWire },
    { cual: "cuenta", etiqueta: t("wireCuenta"), valor: datos.cuenta },
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
        {t("wireComoFunciona")}
      </p>

      {/* 1 · Los datos del banco, cada uno con su botón */}
      <div className="rounded-xl border border-borde p-4">
        <p className="text-sm font-bold text-riel-900">{t("wirePaso1")}</p>
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
            </div>
          ))}
        </dl>
      </div>

      {/* 2 · El monto: la factura, el costo, y lo que hay que transferir */}
      <div className="rounded-xl border border-borde bg-riel-900 p-4 text-white">
        <p className="text-sm font-bold">{t("wirePaso2")}</p>
        <dl className="mt-2 space-y-1 text-sm text-white/85">
          <div className="flex justify-between gap-3">
            <dt>{t("wireLaFactura")}</dt>
            <dd className="tabular-nums">{facturaTexto}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>{t("wireElCosto")}</dt>
            <dd className="tabular-nums">{costoTexto}</dd>
          </div>
        </dl>
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
        <p className="mt-1 text-xs text-white/70">{t("wireMontoAyuda")}</p>
      </div>

      {/* 3 · El número de conciliación: el paso que más se olvida */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-bold text-red-800">{t("wirePaso3")}</p>
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
          {t("wireConceptoAyuda")}
        </p>
      </div>

      {/* 4 · El comprobante */}
      <div className="rounded-xl border border-borde p-4">
        <p className="text-sm font-bold text-riel-900">{t("wirePaso4")}</p>

        <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-borde bg-slate-50 px-4 py-6 text-center">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
            onChange={(e) => setCaptura(e.target.files?.[0] ?? null)}
            className="sr-only"
          />
          <Upload className="h-5 w-5 text-carga-500" aria-hidden />
          <span className="text-sm font-semibold">
            {captura ? captura.name : t("wireSubirComprobante")}
          </span>
        </label>

        <label className="mt-3 block">
          <span className="text-sm text-tinta-suave">
            {t("wireReferencia")}
          </span>
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
        {t("wireEnviar")}
      </button>
    </form>
  );
}
