import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AsignarHuerfano } from "@/components/casillero/asignar-huerfano";
import { RecepcionBodega } from "@/components/casillero/recepcion-bodega";
import { esEquipoInterno } from "@/lib/autorizacion";
import { huerfanos, recibidosHoy } from "@/lib/casillero/recepcion";

export const dynamic = "force-dynamic";

/**
 * La bodega de Miami: recibir cajas. Solo el equipo interno.
 */
export default async function PaginaBodega({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await esEquipoInterno())) notFound();
  const t = await getTranslations("panel.bodega");

  const [hoy, sinDuenio] = await Promise.all([recibidosHoy(), huerfanos(30)]);

  const textos: Record<string, string> = {
    tracking: t("tracking"),
    textoOcr: t("textoOcr"),
    textoOcrPlaceholder: t("textoOcrPlaceholder"),
    textoOcrAyuda: t("textoOcrAyuda"),
    peso: t("peso"),
    largoIn: t("largo"),
    anchoIn: t("ancho"),
    altoIn: t("alto"),
    remitente: t("remitente"),
    ubicacion: t("ubicacion"),
    recibir: t("recibir"),
    recibiendo: t("recibiendo"),
    esperando: t("esperando"),
    asignado: t("asignado"),
    huerfano: t("huerfano"),
    sinCandidatos: t("sinCandidatos"),
    error: t("error"),
    codigoCasillero: t("codigoCasillero"),
    codigoPlaceholder: t("codigoPlaceholder"),
    asignar: t("asignar"),
    asignarAqui: t("asignarAqui"),
    asignando: t("asignando"),
    asignadoOk: t("asignadoOk"),
    error_codigo: t("errorCodigo"),
    "error_no-existe": t("errorNoExiste"),
    error_suspendido: t("errorSuspendido"),
    "error_ya-asignado": t("errorYaAsignado"),
    error_permiso: t("errorPermiso"),
    error_fallo: t("errorFallo"),
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("titulo")}</h1>
          <p className="mt-1 text-sm text-tinta-suave">{t("bajada")}</p>
        </div>
        {/* EL PORCENTAJE DE AUTO-ASIGNACIÓN es la métrica que dice si el
            sistema funciona: si baja, alguien está haciendo a mano lo que
            debería resolverse solo. */}
        <dl className="flex gap-4 text-sm">
          <div>
            <dt className="text-xs text-tinta-suave">{t("hoy")}</dt>
            <dd className="text-xl font-bold tabular-nums">{hoy.total}</dd>
          </div>
          <div>
            <dt className="text-xs text-tinta-suave">{t("solos")}</dt>
            <dd className="text-xl font-bold tabular-nums">
              {hoy.porcentaje} %
            </dd>
          </div>
        </dl>
      </header>

      <RecepcionBodega textos={textos} />

      <section>
        <h2 className="font-bold">
          {t("colaHuerfanos")} ({sinDuenio.length})
        </h2>
        {sinDuenio.length === 0 ? (
          <p className="mt-2 text-sm text-tinta-suave">{t("sinHuerfanos")}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-tinta-suave">
                <tr>
                  <th className="py-1 pr-3">{t("colWr")}</th>
                  <th className="py-1 pr-3">{t("colTracking")}</th>
                  <th className="py-1 pr-3">{t("colRemitente")}</th>
                  <th className="py-1 pr-3">{t("colPeso")}</th>
                  <th className="py-1 pr-3">{t("colAsignar")}</th>
                </tr>
              </thead>
              <tbody>
                {sinDuenio.map((p) => (
                  <tr key={p.id} className="border-t border-borde">
                    <td className="py-1.5 pr-3 font-mono">{p.wr}</td>
                    <td className="py-1.5 pr-3 font-mono">
                      {p.tracking ?? "—"}
                    </td>
                    <td className="py-1.5 pr-3">{p.remitente ?? "—"}</td>
                    <td className="py-1.5 pr-3 tabular-nums">
                      {p.pesoLb ?? "—"}
                    </td>
                    <td className="py-1.5 pr-3">
                      <AsignarHuerfano paqueteId={p.id} textos={textos} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
