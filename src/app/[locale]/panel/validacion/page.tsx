import { getTranslations, setRequestLocale } from "next-intl/server";

import { ListaPagos } from "@/components/panel/zelle/lista-pagos";
import { esEquipoInterno } from "@/lib/autorizacion";
import { listarPendientesDeValidacion } from "@/lib/zelle/consultas";
import { aPagoVista } from "@/lib/zelle/vista";

export const dynamic = "force-dynamic";

/**
 * Cola de validacion: las capturas que subio un comercio y todavia nadie
 * comprobo contra el banco. Los botones de aprobar y rechazar solo aparecen
 * para el equipo de Mercatren; un comercio ve su cola, pero no se aprueba solo.
 */
export default async function PaginaValidacion({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("panel.zelle.validacion");
  const [pendientes, interno] = await Promise.all([
    listarPendientesDeValidacion(),
    esEquipoInterno(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-tinta-suave">
          {t("subtitulo")}
        </p>
      </header>

      {interno ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("aviso")}
        </p>
      ) : null}

      {pendientes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-tinta-suave">
          {t("vacio")}
        </p>
      ) : (
        <ListaPagos pagos={pendientes.map(aPagoVista)} conAcciones={interno} />
      )}
    </div>
  );
}
