import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import {
  FormularioTarifa,
  type TarifaFila,
} from "@/components/casillero/formulario-tarifa";
import {
  FormularioTarifaMaritima,
  type TarifaMaritimaFila,
} from "@/components/casillero/formulario-tarifa-maritima";
import { Link } from "@/i18n/navigation";
import { esEquipoInterno } from "@/lib/autorizacion";
import { listarTarifas, listarTarifasMaritimas } from "@/lib/casillero/tarifas";

export const dynamic = "force-dynamic";

/**
 * Las tarifas de envío, por país.
 *
 * Vive en el panel y no en el código porque cambian con el combustible, con
 * la aduana y con lo que cobre el agente de carga. **Mientras un país no
 * tenga su tarifa encendida, la calculadora no cotiza a ese país**: se le
 * dice al cliente que todavía no hay precio, en vez de darle uno inventado.
 */
export default async function PaginaTarifas({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pais?: string; mar?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await esEquipoInterno())) notFound();
  const t = await getTranslations("panel.tarifasCasillero");

  const { pais, mar } = await searchParams;
  const [tarifas, maritimas] = await Promise.all([
    listarTarifas(),
    listarTarifasMaritimas(),
  ]);
  const editandoMar = mar
    ? maritimas.find((x) => x.pais === mar.toUpperCase())
    : undefined;
  const editando = pais
    ? tarifas.find((x) => x.pais === pais.toUpperCase())
    : undefined;

  const textos: Record<string, string> = {
    pais: t("pais"),
    paisAyuda: t("paisAyuda"),
    tarifaLibra: t("tarifaLibra"),
    tarifaLibraAyuda: t("tarifaLibraAyuda"),
    minimoLb: t("minimoLb"),
    minimoLbAyuda: t("minimoLbAyuda"),
    minimoCobro: t("minimoCobro"),
    minimoCobroAyuda: t("minimoCobroAyuda"),
    despacho: t("despacho"),
    despachoAyuda: t("despachoAyuda"),
    seguro: t("seguro"),
    seguroAyuda: t("seguroAyuda"),
    seguroDesde: t("seguroDesde"),
    seguroDesdeAyuda: t("seguroDesdeAyuda"),
    divisor: t("divisor"),
    divisorAyuda: t("divisorAyuda"),
    diasGratis: t("diasGratis"),
    diasGratisAyuda: t("diasGratisAyuda"),
    almacenajeDia: t("almacenajeDia"),
    almacenajeDiaAyuda: t("almacenajeDiaAyuda"),
    nota: t("nota"),
    notaAyuda: t("notaAyuda"),
    notaPlaceholder: t("notaPlaceholder"),
    impuesto: t("impuesto"),
    impuestoAyuda: t("impuestoAyuda"),
    activa: t("activa"),
    activaAyuda: t("activaAyuda"),
    guardar: t("guardar"),
    guardando: t("guardando"),
    guardado: t("guardado"),
    error_pais: t("errorPais"),
    "error_sin-precio": t("errorSinPrecio"),
    error_permiso: t("errorPermiso"),
    error_fallo: t("errorFallo"),
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">{t("titulo")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-tinta-suave">{t("bajada")}</p>
      </header>

      <section>
        <h2 className="font-bold">
          {editando ? t("editando", { pais: editando.pais }) : t("nueva")}
        </h2>
        <div className="mt-3">
          <FormularioTarifa
            tarifa={editando as TarifaFila | undefined}
            textos={textos}
          />
        </div>
      </section>

      <section>
        <h2 className="font-bold">{t("cargadas")}</h2>
        {tarifas.length === 0 ? (
          <p className="mt-2 text-sm text-tinta-suave">{t("sinTarifas")}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-tinta-suave">
                <tr>
                  <th className="py-1 pr-3">{t("pais")}</th>
                  <th className="py-1 pr-3">{t("tarifaLibra")}</th>
                  <th className="py-1 pr-3">{t("minimoLb")}</th>
                  <th className="py-1 pr-3">{t("despacho")}</th>
                  <th className="py-1 pr-3">{t("seguro")}</th>
                  <th className="py-1 pr-3">{t("estado")}</th>
                  <th className="py-1 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {tarifas.map((x) => (
                  <tr key={x.pais} className="border-t border-borde">
                    <td className="py-1.5 pr-3 font-semibold">{x.pais}</td>
                    <td className="py-1.5 pr-3 tabular-nums">
                      ${(x.tarifaLibraCentavos / 100).toFixed(2)}
                    </td>
                    <td className="py-1.5 pr-3 tabular-nums">
                      {x.minimoLb} lb
                    </td>
                    <td className="py-1.5 pr-3 tabular-nums">
                      ${(x.despachoCentavos / 100).toFixed(2)}
                    </td>
                    <td className="py-1.5 pr-3 tabular-nums">
                      {(x.seguroPuntosBase / 100).toFixed(2)} %
                    </td>
                    <td className="py-1.5 pr-3">
                      {x.activa ? t("siCotiza") : t("noCotiza")}
                    </td>
                    <td className="py-1.5 pr-3">
                      <Link
                        href={`/panel/casilleros/tarifas?pais=${x.pais}`}
                        className="font-semibold text-carga-600 hover:underline"
                      >
                        {t("editar")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ══ MARÍTIMO ══ Por pie cúbico: el peso no aplica (Richard, 16 sep
          2026). Misma pantalla, otro modo. */}
      <section className="border-t border-borde pt-8">
        <h2 className="text-xl font-bold">{t("maritimo.titulo")}</h2>
        <p className="mt-1 max-w-3xl text-sm text-tinta-suave">
          {t("maritimo.bajada")}
        </p>
        <h3 className="mt-4 font-bold">
          {editandoMar
            ? t("editando", { pais: editandoMar.pais })
            : t("maritimo.nueva")}
        </h3>
        <div className="mt-3">
          <FormularioTarifaMaritima
            tarifa={editandoMar as TarifaMaritimaFila | undefined}
            textos={{
              pais: t("pais"),
              paisAyuda: t("paisAyuda"),
              tarifaPie: t("maritimo.tarifaPie"),
              tarifaPieAyuda: t("maritimo.tarifaPieAyuda"),
              minimoPies: t("maritimo.minimoPies"),
              minimoPiesAyuda: t("maritimo.minimoPiesAyuda"),
              minimoCobro: t("minimoCobro"),
              minimoCobroAyuda: t("minimoCobroAyuda"),
              seguro: t("seguro"),
              seguroAyuda: t("seguroAyuda"),
              seguroDesde: t("seguroDesde"),
              seguroDesdeAyuda: t("seguroDesdeAyuda"),
              nota: t("nota"),
              notaPlaceholder: t("notaPlaceholder"),
              impuesto: t("impuesto"),
              impuestoAyuda: t("impuestoAyuda"),
              activa: t("activa"),
              activaAyuda: t("activaAyuda"),
              guardar: t("guardar"),
              guardando: t("guardando"),
              guardado: t("guardado"),
              error_pais: t("errorPais"),
              "error_sin-precio": t("errorSinPrecio"),
              error_permiso: t("errorPermiso"),
              error_fallo: t("errorFallo"),
            }}
          />
        </div>
        {maritimas.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-tinta-suave">
                <tr>
                  <th className="py-1 pr-3">{t("pais")}</th>
                  <th className="py-1 pr-3">{t("maritimo.tarifaPie")}</th>
                  <th className="py-1 pr-3">{t("maritimo.minimoPies")}</th>
                  <th className="py-1 pr-3">{t("estado")}</th>
                  <th className="py-1 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {maritimas.map((x) => (
                  <tr key={x.pais} className="border-t border-borde">
                    <td className="py-1.5 pr-3 font-semibold">{x.pais}</td>
                    <td className="py-1.5 pr-3 tabular-nums">
                      ${(x.tarifaPieCentavos / 100).toFixed(2)}
                    </td>
                    <td className="py-1.5 pr-3 tabular-nums">
                      {x.minimoPies} ft³
                    </td>
                    <td className="py-1.5 pr-3">
                      {x.activa ? t("siCotiza") : t("noCotiza")}
                    </td>
                    <td className="py-1.5 pr-3">
                      <Link
                        href={`/panel/casilleros/tarifas?mar=${x.pais}`}
                        className="font-semibold text-carga-600 hover:underline"
                      >
                        {t("editar")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
