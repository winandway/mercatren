import { getTranslations } from "next-intl/server";

import { formatearPrecio, type Idioma } from "@/lib/dinero";
import {
  desglosarCobro,
  sumarDesgloses,
  type DesgloseDeCobro,
} from "@/lib/retiros/desglose";

/**
 * DE DÓNDE SALE CADA DÓLAR, ANTES DE PEDIR EL RETIRO.
 *
 * ══ POR QUÉ LOS DOS COSTOS VAN SEPARADOS ══
 *
 * Son de dos dueños distintos: lo que se lleva Stripe es de un tercero y no lo
 * vemos nunca; lo que se lleva Mercatren es nuestro. Un solo renglón que diga
 * «comisiones» hace que el comercio nos atribuya los dos y sienta que cobramos
 * el doble de lo que cobramos.
 *
 * ══ Y POR QUÉ SE ENSEÑA JUSTO AQUÍ ══
 *
 * Porque es el momento en que mira el número. Explicarlo en una página de
 * ayuda que nadie abre no sirve: la pregunta nace mirando el saldo.
 */
export async function DesgloseDelCobro({
  brutoTarjetaCentavos,
  brutoZelleCentavos,
  idioma,
}: {
  brutoTarjetaCentavos: number;
  brutoZelleCentavos: number;
  idioma: Idioma;
}) {
  const t = await getTranslations("panel.desglose");

  const total: DesgloseDeCobro = sumarDesgloses([
    desglosarCobro(brutoTarjetaCentavos, true),
    desglosarCobro(brutoZelleCentavos, false),
  ]);

  // Sin ventas no se dibuja: una tabla de ceros no explica nada.
  if (total.brutoCentavos <= 0) return null;

  const dinero = (c: number) => formatearPrecio(c, idioma);

  const renglones = [
    { clave: "procesador", valor: total.procesadorCentavos, resta: true },
    { clave: "mercatren", valor: total.mercatrenCentavos, resta: true },
  ].filter((r) => r.valor > 0);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold">{t("titulo")}</h2>
      <p className="mt-1 text-sm text-tinta-suave">{t("bajada")}</p>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt>{t("bruto")}</dt>
          <dd className="font-semibold tabular-nums">
            {dinero(total.brutoCentavos)}
          </dd>
        </div>

        {renglones.map((r) => (
          <div key={r.clave} className="flex justify-between gap-3">
            <dt className="text-tinta-suave">{t(r.clave)}</dt>
            <dd className="text-tinta-suave tabular-nums">
              − {dinero(r.valor)}
            </dd>
          </div>
        ))}

        <div className="flex justify-between gap-3 border-t border-borde pt-2">
          <dt className="font-bold">{t("tuyo")}</dt>
          <dd className="text-lg font-extrabold tabular-nums">
            {dinero(total.delComercioCentavos)}
          </dd>
        </div>
      </dl>

      {/* Si cobró por los dos métodos, se dice por qué el procesador no toca
          todo: por Zelle no interviene ninguno. */}
      {brutoZelleCentavos > 0 && brutoTarjetaCentavos > 0 ? (
        <p className="mt-3 text-xs text-tinta-suave">{t("porQueZelle")}</p>
      ) : null}
    </section>
  );
}
