import { getTranslations, setRequestLocale } from "next-intl/server";

import { ListaPagos } from "@/components/panel/zelle/lista-pagos";
import { esEquipoInterno } from "@/lib/autorizacion";
import { listarPendientesDeValidacion } from "@/lib/zelle/consultas";
import { aPagoVista } from "@/lib/zelle/vista";

export const dynamic = "force-dynamic";

/**
 * Los pagos que todavia nadie comprobo contra el banco.
 *
 * LA MISMA PANTALLA SE LEE DISTINTO SEGUN QUIEN ENTRE, y eso importa:
 *
 * - El EQUIPO ve una cola de trabajo: "pagos por validar", con los botones de
 *   aprobar y rechazar.
 * - El COMERCIO ve el estado de LO SUYO: "tus pagos en revision", sin ningun
 *   boton. Se entera de que hay algo pendiente, pero no lo toca.
 *
 * Quien vende no puede acreditarse a si mismo: seria como cobrar en su propia
 * caja y darse el vuelto. Los botones nunca se le dibujan, y aunque llamara a
 * la accion directamente, `exigirEquipoInterno()` la corta en el servidor.
 *
 * Antes los dos veian el mismo texto —"capturas que subio un comercio y
 * todavia nadie reviso contra el banco"—, escrito para el equipo. Un comercio
 * que leia eso creia estar dentro de la consola del administrador.
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
        <h1 className="text-2xl font-bold tracking-tight">
          {interno ? t("titulo") : t("tituloComercio")}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-tinta-suave">
          {interno ? t("subtitulo") : t("subtituloComercio")}
        </p>
      </header>

      {interno ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("aviso")}
        </p>
      ) : (
        /* Al comercio se le explica QUIEN valida y por que no es el. */
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-tinta-suave">
          {t("avisoComercio")}
        </p>
      )}

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
