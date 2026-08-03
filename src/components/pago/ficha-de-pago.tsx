"use client";

import {
  AlertTriangle,
  Building2,
  Check,
  Copy,
  Mail,
  Phone,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { cn } from "@/lib/utils";

export type DatosDePago = {
  beneficiario: string | null;
  banco: string | null;
  cuenta: string | null;
  rutaAch: string | null;
  rutaWire: string | null;
  zelleCorreo: string | null;
  zelleNombre: string | null;
  soporteTelefono: string | null;
  soporteCorreo: string | null;
};

/**
 * Los datos para pagar un pedido.
 *
 * Esto NO es una pagina publica: se muestra solo al cliente que tiene un
 * pedido por pagar. Los valores llegan desde el servidor, que los lee de las
 * variables de entorno; en el codigo no hay ningun numero de cuenta escrito.
 *
 * Cada dato lleva su propio boton de copiar, uno por uno: el cliente los pega
 * en casillas distintas de su banco y equivocarse en un digito es un pago
 * perdido.
 */
export function FichaDePago({
  datos,
  monto,
  numeroPedido,
}: {
  datos: DatosDePago;
  monto: string;
  numeroPedido: string;
}) {
  const t = useTranslations("datosPago");

  const hayZelle = Boolean(datos.zelleCorreo);
  const hayTransferencia = Boolean(datos.cuenta && datos.rutaAch);

  if (!hayZelle && !hayTransferencia) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {t("sinConfigurar")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* El monto, que es lo que mas se equivoca la gente */}
      <div className="rounded-xl border border-riel-800 bg-riel-900 p-4 text-white">
        <p className="text-xs text-white/70">{t("monto.titulo")}</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <p className="text-3xl font-bold tracking-tight tabular-nums">
            {monto}
          </p>
          <BotonCopiar valor={monto.replace(/[^0-9.]/g, "")} claro />
        </div>
        <p className="mt-2 text-xs text-white/70">{t("monto.aviso")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {hayZelle ? (
          <section className="rounded-xl border-2 border-carga-500 bg-white p-5">
            <header className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-carga-500/15 text-carga-600">
                  <Zap className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <h3 className="font-bold">{t("zelle.titulo")}</h3>
                  <p className="text-xs text-tinta-suave">
                    {t("zelle.subtitulo")}
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-carga-500 px-2 py-0.5 text-[11px] font-bold text-riel-950">
                {t("recomendado")}
              </span>
            </header>

            <dl className="mt-4 space-y-3">
              <Dato
                etiqueta={t("zelle.enviarA")}
                valor={datos.zelleCorreo}
                destacado
              />
              <Dato
                etiqueta={t("zelle.aNombreDe")}
                valor={datos.zelleNombre}
                sinCopiar
              />
            </dl>
          </section>
        ) : null}

        {hayTransferencia ? (
          <section className="rounded-xl border border-borde bg-white p-5">
            <header className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-riel-900/10 text-riel-800">
                <Building2 className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h3 className="font-bold">{t("transferencia.titulo")}</h3>
                <p className="text-xs text-tinta-suave">
                  {t("transferencia.subtitulo")}
                </p>
              </div>
            </header>

            <dl className="mt-4 space-y-3">
              <Dato
                etiqueta={t("transferencia.beneficiario")}
                valor={datos.beneficiario}
                sinCopiar
              />
              <Dato
                etiqueta={t("transferencia.banco")}
                valor={datos.banco}
                sinCopiar
              />
              <Dato
                etiqueta={t("transferencia.cuenta")}
                valor={datos.cuenta}
                destacado
              />
              <Dato
                etiqueta={t("transferencia.rutaAch")}
                detalle={t("transferencia.rutaAchDetalle")}
                valor={datos.rutaAch}
              />
              <Dato
                etiqueta={t("transferencia.rutaWire")}
                detalle={t("transferencia.rutaWireDetalle")}
                valor={datos.rutaWire}
              />
            </dl>
          </section>
        ) : null}
      </div>

      {/* Regla del negocio: solo desde Estados Unidos */}
      <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
          aria-hidden
        />
        <p className="text-sm text-amber-900">
          <span className="font-semibold">{t("soloEstadosUnidos")}</span>{" "}
          {t("soloEstadosUnidosDetalle")}
        </p>
      </div>

      <p className="text-xs text-tinta-suave">
        {t("ponerReferencia", { numero: numeroPedido })}
      </p>

      {datos.soporteTelefono || datos.soporteCorreo ? (
        <section className="rounded-lg border border-borde px-4 py-3">
          <h3 className="text-xs font-semibold">{t("soporte.titulo")}</h3>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            {datos.soporteTelefono ? (
              <a
                href={`tel:${datos.soporteTelefono.replace(/[^+\d]/g, "")}`}
                className="inline-flex items-center gap-1.5 font-medium hover:text-carga-600"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden />
                {datos.soporteTelefono}
              </a>
            ) : null}
            {datos.soporteCorreo ? (
              <a
                href={`mailto:${datos.soporteCorreo}`}
                className="inline-flex items-center gap-1.5 font-medium hover:text-carga-600"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden />
                {datos.soporteCorreo}
              </a>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

/** Un dato con su etiqueta y, si se puede copiar, su propio boton. */
function Dato({
  etiqueta,
  detalle,
  valor,
  destacado = false,
  sinCopiar = false,
}: {
  etiqueta: string;
  detalle?: string;
  valor: string | null;
  destacado?: boolean;
  sinCopiar?: boolean;
}) {
  if (!valor) return null;

  return (
    <div
      className={cn(
        "rounded-lg px-3 py-2",
        destacado ? "bg-slate-100" : "bg-slate-50",
      )}
    >
      <dt className="text-[11px] tracking-wide text-tinta-suave uppercase">
        {etiqueta}
      </dt>
      <dd className="mt-0.5 flex items-center justify-between gap-2">
        <span
          className={cn(
            "min-w-0 font-mono break-all",
            destacado ? "text-base font-bold" : "text-sm font-medium",
          )}
        >
          {valor}
        </span>
        {sinCopiar ? null : <BotonCopiar valor={valor} />}
      </dd>
      {detalle ? (
        <p className="mt-0.5 text-[11px] text-tinta-suave">{detalle}</p>
      ) : null}
    </div>
  );
}

function BotonCopiar({
  valor,
  claro = false,
}: {
  valor: string;
  claro?: boolean;
}) {
  const t = useTranslations("datosPago");
  const [copiado, setCopiado] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(valor);
          setCopiado(true);
          window.setTimeout(() => setCopiado(false), 1800);
        } catch {
          // Si el navegador no deja copiar, el dato igual esta a la vista.
        }
      }}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors",
        claro
          ? "bg-white/15 text-white hover:bg-white/25"
          : "bg-white text-tinta ring-1 ring-borde hover:bg-slate-100",
      )}
    >
      {copiado ? (
        <>
          <Check className="h-3.5 w-3.5" aria-hidden />
          {t("copiado")}
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" aria-hidden />
          {t("copiar")}
        </>
      )}
    </button>
  );
}
