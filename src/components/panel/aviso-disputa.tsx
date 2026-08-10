import { ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { formatearPrecio, type Idioma } from "@/lib/dinero";
import {
  diasParaResponder,
  esUrgente,
  sigueAbierta,
  type EstadoDisputa,
} from "@/lib/pagos/disputa";
import { cn } from "@/lib/utils";

export type DisputaVista = {
  id: string;
  estado: EstadoDisputa;
  montoCentavos: number;
  moneda: string;
  motivo: string | null;
  respondeHasta: Date | null;
};

/**
 * EL CONTRACARGO, ARRIBA DE TODO Y EN ROJO.
 *
 * Va antes que la dirección y que la mercancía porque cambia qué hay que hacer
 * con este pedido: si el dinero se fue, despacharlo es regalarlo.
 *
 * ══ SE DICE LO QUE PASÓ Y LO QUE NO PASÓ ══
 *
 * «El dinero ya salió de la cuenta» y «la venta no se deshizo sola». Lo
 * segundo es tan importante como lo primero: sin decirlo, quien lo lee asume
 * que el sistema ya arregló algo, y nadie hace nada hasta que aparece el
 * descuadre semanas después.
 */
export async function AvisoDisputa({
  disputa,
  idioma,
  ahora,
}: {
  disputa: DisputaVista;
  idioma: Idioma;
  /** Se recibe de fuera para que el componente sea previsible al probarlo. */
  ahora: Date;
}) {
  const t = await getTranslations("panel.disputa");
  const dias = diasParaResponder(disputa.respondeHasta, ahora);
  const abierta = sigueAbierta(disputa.estado);
  const urgente = esUrgente(disputa.estado, dias);

  return (
    <section
      className={cn(
        "rounded-xl border p-5 shadow-sm",
        urgente
          ? "border-red-300 bg-red-50"
          : abierta
            ? "border-amber-300 bg-amber-50"
            : "border-slate-200 bg-white",
      )}
    >
      <h2
        className={cn(
          "flex items-center gap-2 font-bold",
          urgente ? "text-red-800" : abierta ? "text-amber-900" : "",
        )}
      >
        <ShieldAlert className="h-4 w-4" aria-hidden />
        {t("titulo")}
      </h2>

      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-tinta-suave">{t("monto")}</dt>
          <dd className="mt-0.5 text-sm font-bold tabular-nums">
            {formatearPrecio(disputa.montoCentavos, idioma, disputa.moneda)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-tinta-suave">{t("estado")}</dt>
          <dd className="mt-0.5 text-sm font-medium">
            {t(`estados.${disputa.estado}`)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-tinta-suave">{t("plazo")}</dt>
          <dd className="mt-0.5 text-sm font-medium">
            {!abierta
              ? t("plazoCerrado")
              : dias === null
                ? t("plazoDesconocido")
                : t("plazoDias", { dias })}
          </dd>
        </div>
      </dl>

      {disputa.motivo ? (
        <p className="mt-3 text-sm">
          <span className="text-tinta-suave">{t("motivo")}: </span>
          <span className="font-mono">{disputa.motivo}</span>
        </p>
      ) : null}

      {abierta ? (
        <p className="mt-3 text-sm font-medium">{t("queHacer")}</p>
      ) : null}
    </section>
  );
}
