"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  HelpCircle,
  ImageIcon,
  Landmark,
  User,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { AccionesValidacion } from "@/components/panel/zelle/acciones-validacion";
import { AlertasDelComprobante } from "@/components/panel/zelle/alertas-comprobante";
import type { Alerta } from "@/lib/zelle/alertas";
import { VisorComprobante } from "@/components/panel/zelle/visor-comprobante";
import type { LineaDeVenta } from "@/lib/zelle/lineas";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaHora } from "@/lib/fechas";
import { cn } from "@/lib/utils";
import type { PagoVista } from "@/lib/zelle/vista";

const ICONO_PAGADOR = {
  persona: User,
  empresa: Building2,
  cuenta_bancaria: Landmark,
  desconocido: HelpCircle,
} as const;

const ESTILO_ESTADO = {
  aprobado: {
    chip: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    barra: "bg-emerald-500",
    ancho: "w-full",
    Icono: CheckCircle2,
  },
  pendiente: {
    chip: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    barra: "bg-amber-500",
    ancho: "w-1/2",
    Icono: Clock,
  },
  rechazado: {
    chip: "bg-red-50 text-red-700 ring-1 ring-red-200",
    barra: "bg-red-500",
    ancho: "w-full",
    Icono: XCircle,
  },
} as const;

export function ListaPagos({
  pagos,
  conAcciones = false,
  lineasPorPago = {},
  alertasPorPago = {},
}: {
  pagos: PagoVista[];
  /** Qué se vendió en cada pago, por id. Vacío en el histórico importado. */
  lineasPorPago?: Record<string, LineaDeVenta[]>;
  /** Lo que hay que mirar dos veces antes de aprobar, por id de pago. */
  alertasPorPago?: Record<string, Alerta[]>;
  /** Muestra los botones de aprobar y rechazar (solo en la cola de validacion). */
  conAcciones?: boolean;
}) {
  const [abierto, setAbierto] = useState<PagoVista | null>(null);
  const t = useTranslations("panel.zelle");

  if (pagos.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-tinta-suave">
        {t("buscador.sinResultados")}
      </p>
    );
  }

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {pagos.map((pago) => (
          <li key={pago.id}>
            <TarjetaPago
              pago={pago}
              conAcciones={conAcciones}
              alertas={alertasPorPago[pago.id] ?? []}
              onVerRecibo={() => setAbierto(pago)}
            />
          </li>
        ))}
      </ul>

      {abierto ? (
        <VisorComprobante
          pago={abierto}
          lineas={lineasPorPago[abierto.id] ?? []}
          onCerrar={() => setAbierto(null)}
        />
      ) : null}
    </>
  );
}

function TarjetaPago({
  pago,
  conAcciones,
  alertas = [],
  onVerRecibo,
}: {
  pago: PagoVista;
  conAcciones?: boolean;
  alertas?: Alerta[];
  onVerRecibo: () => void;
}) {
  const t = useTranslations("panel.zelle");
  const idioma = useLocale() as Idioma;

  const estilo = ESTILO_ESTADO[pago.estado];
  const IconoEstado = estilo.Icono;
  const IconoPagador = ICONO_PAGADOR[pago.pagadorTipo];
  const esRetiro = pago.tipo === "retiro";

  const etapa =
    pago.estado === "aprobado"
      ? t("pago.progresoAprobado")
      : pago.estado === "rechazado"
        ? t("pago.progresoRechazado")
        : t("pago.progresoRevision");

  const filas = [
    { etiqueta: t("pago.subido"), valor: fechaHora(pago.subidoEn, idioma) },
    {
      etiqueta: t("pago.aprobado"),
      valor: pago.aprobadoEn ? fechaHora(pago.aprobadoEn, idioma) : null,
    },
    {
      etiqueta: t("pago.fechaPago"),
      valor: pago.fechaTransaccion
        ? fechaHora(pago.fechaTransaccion, idioma)
        : null,
    },
    {
      etiqueta: t("pago.codigo"),
      valor: pago.codigoConfirmacion ?? t("pago.sinCodigo"),
      apagado: !pago.codigoConfirmacion,
    },
    {
      etiqueta: t("pago.recibio"),
      valor: pago.cuentaReceptora ?? t("pago.sinCuentaReceptora"),
      apagado: !pago.cuentaReceptora,
    },
  ].filter((f) => f.valor);

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
        esRetiro ? "border-slate-200 bg-slate-50/60" : "border-slate-200",
      )}
    >
      {/* Monto y estado */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-2xl font-bold tracking-tight tabular-nums">
            {esRetiro ? (
              <ArrowUpRight
                className="h-5 w-5 shrink-0 text-tinta-suave"
                aria-hidden
              />
            ) : (
              <ArrowDownLeft
                className="h-5 w-5 shrink-0 text-emerald-600"
                aria-hidden
              />
            )}
            {formatearPrecio(pago.montoCentavos, idioma, pago.moneda)}
          </p>
          <p className="mt-0.5 text-xs text-tinta-suave">
            {t(`tipos.${pago.tipo}`)}
            {esRetiro ? ` · ${t("noContabiliza")}` : null}
          </p>
        </div>

        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[12px] font-semibold",
            estilo.chip,
          )}
        >
          <IconoEstado className="h-3.5 w-3.5" aria-hidden />
          {t(`estados.${pago.estado}`)}
        </span>
      </div>

      {/* Quien pago */}
      <div className="mt-3 flex items-start gap-2">
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-tinta-suave">
          <IconoPagador className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {pago.pagadorNombre ?? t(`pagador.${pago.pagadorTipo}`)}
          </p>
          <p className="truncate text-xs text-tinta-suave">
            {t(`pagador.${pago.pagadorTipo}`)}
            {pago.bancoOrigen ? ` · ${pago.bancoOrigen}` : ""}
            {pago.cuentaUltimos4 ? ` · …${pago.cuentaUltimos4}` : ""}
          </p>
          {pago.pagadorCorreo ? (
            <p className="truncate text-xs text-tinta-suave">
              {pago.pagadorCorreo}
            </p>
          ) : null}
        </div>
      </div>

      {/* Avance del pago */}
      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              estilo.barra,
              estilo.ancho,
            )}
          />
        </div>
        <p className="mt-1 text-[12px] font-medium text-tinta-suave">{etapa}</p>
      </div>

      {/* Datos */}
      <dl className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-xs">
        {filas.map((f) => (
          <div
            key={f.etiqueta}
            className="flex items-baseline justify-between gap-3"
          >
            <dt className="shrink-0 text-tinta-suave">{f.etiqueta}</dt>
            <dd
              className={cn(
                "truncate text-right font-medium",
                f.apagado && "text-tinta-suave italic",
              )}
            >
              {f.valor}
            </dd>
          </div>
        ))}
      </dl>

      {pago.motivoRechazo ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          <span className="font-semibold">{t("pago.motivoRechazo")}:</span>{" "}
          {pago.motivoRechazo}
        </p>
      ) : null}

      {pago.notas ? (
        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-tinta-suave">
          <span className="font-semibold">{t("pago.nota")}:</span> {pago.notas}
        </p>
      ) : null}

      {/* Pie */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <button
          type="button"
          onClick={onVerRecibo}
          disabled={!pago.reciboUrl}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
            pago.reciboUrl
              ? "bg-riel-900 text-white hover:bg-riel-800"
              : "cursor-not-allowed bg-slate-100 text-tinta-suave",
          )}
        >
          <ImageIcon className="h-3.5 w-3.5" aria-hidden />
          {pago.reciboUrl ? t("pago.recibo") : t("pago.sinRecibo")}
        </button>

        <span className="text-[12px] font-medium text-tinta-suave">
          {pago.origen === "import" ? t("pago.importado") : t("pago.enVivo")}
        </span>
      </div>

      {/* Las señales van ARRIBA de los botones, no debajo: debajo se leen
          después de haber decidido, que es tarde. */}
      <AlertasDelComprobante alertas={alertas} />

      {conAcciones && pago.estado === "pendiente" ? (
        <AccionesValidacion pagoId={pago.id} />
      ) : null}
    </article>
  );
}
