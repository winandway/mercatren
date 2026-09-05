import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Boxes } from "lucide-react";

import type { PlazaVista } from "@/lib/vigilante/reglas";

/**
 * EL CATÁLOGO DE UN VISTAZO, EN EL TABLERO (3 sep 2026).
 *
 * Palabras del dueño, después de que esto se pusiera solo en la pantalla del
 * vigilante: «la información que yo quería tener directamente desde el
 * tablero no existe». Tenía razón: el tablero es lo primero que abre, y
 * enseñaba dinero pero no catálogo — con cincuenta mil fichas entrando, no
 * saber cuántas están a la venta es no poder operar.
 *
 * Aquí va lo justo —a la venta, en revisión, lo que le falta— y el enlace al
 * vigilante, que tiene el detalle. Repetir el detalle en dos pantallas es
 * como una de las dos se queda vieja.
 */
export async function CatalogoDeUnVistazo({
  plazas,
  haceMinutos,
}: {
  /**
   * ES `PlazaVista`, LO QUE EL VIGILANTE GUARDA DE VERDAD (4 sep 2026).
   *
   * Decía `PlazaInventario` —el inventario largo del panel— sobre un JSON que
   * nunca tuvo esos campos, porque `inventarioDelUltimoLatido` mentía en su
   * tipo. Resultado: «sin traducir» y «por resolver» salían en CERO desde que
   * existe esta tarjeta, y el dueño la miraba creyendo el número.
   *
   * El compilador no podía verlo: un `JSON.parse` devuelve `any` y ahí se
   * puede prometer cualquier forma.
   */
  plazas: PlazaVista[];
  /** De cuándo es la medición del vigilante. Un dato sin fecha se lee como
   *  «ahora mismo», y este puede tener veinte minutos. */
  haceMinutos: number;
}) {
  const t = await getTranslations("panel.resumen.catalogo");
  const conAlgo = plazas.filter((p) => p.publicados + p.enRevision > 0);
  if (conAlgo.length === 0) return null;

  const nombre: Record<string, string> = {
    US: t("us"),
    CL: t("cl"),
    CO: t("co"),
  };

  return (
    <section className="rounded-xl border border-borde bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Boxes className="h-4 w-4 text-carga-500" aria-hidden />
          {t("titulo")}
        </h2>
        <Link
          href="/panel/vigilante"
          className="inline-flex items-center gap-1 text-xs font-semibold text-carga-600 hover:underline"
        >
          {t("medido", { n: haceMinutos })} · {t("verDetalle")}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {conAlgo.map((p) => {
          /* `porAfinar` YA cuenta lo que va con envío estimado, sin fila de
             envío y con transporte regional: son los tres casos que el
             afinado tiene que resolver preguntándole el flete a CJ. */
          const faltan = p.enRevision + p.porAfinar + p.sinCostoBase;
          return (
            <div key={p.mercado} className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-semibold text-tinta-suave">
                {nombre[p.mercado] ?? p.mercado}
              </p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums">
                {p.publicados.toLocaleString()}
              </p>
              <p className="text-xs text-tinta-suave">{t("aLaVenta")}</p>
              <dl className="mt-2 space-y-0.5 text-xs text-tinta-suave">
                <div className="flex justify-between gap-2">
                  <dt>{t("enRevision")}</dt>
                  <dd className="tabular-nums">
                    {p.enRevision.toLocaleString()}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>{t("sinTraducir")}</dt>
                  <dd className="tabular-nums">
                    {p.sinTraducir.toLocaleString()}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>{t("porResolver")}</dt>
                  <dd className="tabular-nums">{faltan.toLocaleString()}</dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </section>
  );
}
