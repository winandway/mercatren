"use client";

import { Check, Loader2, Plus, Search, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { recargarSiEsVersionVieja } from "@/lib/version-vieja";
import { useState, useTransition } from "react";

import {
  departamentoPorSlug,
  nombreDepartamento,
} from "@/lib/catalogo/departamentos";
import { agregarProductoDeCj } from "@/lib/cj/importar";
import { MINIMO_MAYORISTA } from "@/lib/cj/mayorista";
import { MARGEN_MINIMO_CENTAVOS } from "@/lib/destino/precio-us";
import { cn } from "@/lib/utils";

/**
 * ELEGIR LOS PRODUCTOS DEL CATÁLOGO DE ESTADOS UNIDOS.
 *
 * ══ POR QUÉ SE ELIGEN AQUÍ Y NO EN EL PANEL DE CJ ══
 *
 * Porque aquí se ve **lo que de verdad queda**. En el panel de CJ solo se ve su
 * precio; la decisión de si un producto conviene depende de lo que sobra
 * después de que CJ, el envío y Stripe cobren lo suyo — y eso solo lo sabe
 * nuestro sistema.
 *
 * ══ EL PRECIO QUE SE ENSEÑA ES EL MÍNIMO ══
 *
 * El envío todavía no está cotizado: CJ lo calcula por dirección de destino, no
 * por producto, y pedirlo para los 24 de una página serían 24 llamadas más
 * contra su límite por minuto. Se dice en pantalla en vez de dar por bueno un
 * número que va a subir.
 */

type ProductoVista = {
  id: string;
  nombre: string;
  imagen: string | null;
  sku: string | null;
  categoria: string | null;
  departamento: string | null;
  costoCentavos: number;
  existencias: number | null;
  precio: {
    publicadoCentavos: number;
    procesadorCentavos: number;
    margenCentavos: number;
  };
};

type Respuesta =
  | {
      ok: true;
      productos: ProductoVista[];
      pagina: number;
      hayMas: boolean;
      diagnostico: { trajoCj: number; descartados: number };
    }
  | { ok: false; motivo: string };

const usd = (c: number) => `$${(c / 100).toFixed(2)}`;

/** El nombre visible del departamento, en el idioma del panel. */
function nombreDeDepartamento(slug: string | null, idioma: string) {
  if (!slug) return null;
  const d = departamentoPorSlug(slug);
  return d ? nombreDepartamento(d, idioma) : null;
}

export function BuscadorCj({
  buscar,
  idioma,
  almacen = "US",
}: {
  buscar: (filtros: { texto?: string; pagina?: number }) => Promise<Respuesta>;
  idioma: string;
  /** De qué almacén vienen los resultados, para que los avisos digan la
      verdad: «almacén en Estados Unidos» debajo de una búsqueda que corre
      contra China es exactamente cómo se pierde quien está cargando. */
  almacen?: "US" | "CN";
}) {
  const t = useTranslations("panel.catalogoUsa");
  const [texto, setTexto] = useState("");
  const [pagina, setPagina] = useState(1);
  const [resultado, setResultado] = useState<Respuesta | null>(null);
  const [buscando, iniciarBusqueda] = useTransition();

  /** Qué se agregó ya, para no dejar el botón igual después de pulsarlo. */
  const [agregados, setAgregados] = useState<Record<string, string>>({});
  const [agregando, setAgregando] = useState<string | null>(null);

  function lanzar(nuevaPagina: number) {
    setPagina(nuevaPagina);
    iniciarBusqueda(async () => {
      setResultado(await buscar({ texto: texto.trim(), pagina: nuevaPagina }));
    });
  }

  async function agregar(p: ProductoVista) {
    setAgregando(p.id);
    const datos = new FormData();
    datos.set("id", p.id);
    datos.set("nombre", p.nombre);
    datos.set("imagen", p.imagen ?? "");
    datos.set("sku", p.sku ?? "");
    datos.set("costo", String(p.costoCentavos));
    datos.set("existencias", String(p.existencias ?? 0));
    datos.set("departamento", p.departamento ?? "");

    try {
      const r = await agregarProductoDeCj(datos);
      setAgregados((a) => ({ ...a, [p.id]: r.ok ? "ok" : r.mensaje }));
    } catch (fallo) {
      /* Si la pestaña se quedó en la versión anterior, se recarga sola: el
         texto de Next no le dice nada a nadie y parece un botón roto. */
      if (recargarSiEsVersionVieja(fallo)) return;
      console.error("[cj] no se pudo agregar:", fallo);
      setAgregados((a) => ({ ...a, [p.id]: String(fallo) }));
    } finally {
      setAgregando(null);
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          lanzar(1);
        }}
        className="flex flex-wrap gap-2"
      >
        <input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={t("marcador")}
          className="min-w-[220px] flex-1 rounded-lg border border-borde px-3 py-2.5 text-base outline-none focus:border-carga-500 sm:text-sm"
        />
        <button
          type="submit"
          disabled={buscando}
          className="boton-principal gap-2 disabled:opacity-60"
        >
          {buscando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Search className="h-4 w-4" aria-hidden />
          )}
          {t("buscar")}
        </button>
      </form>

      <p className="text-xs text-tinta-suave">
        {almacen === "CN" ? t("avisoCn") : t("aviso")}
      </p>

      {resultado && !resultado.ok ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">
          {resultado.motivo}
        </p>
      ) : null}

      {resultado?.ok && resultado.productos.length === 0 ? (
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-tinta-suave">
          <p>{almacen === "CN" ? t("nadaCn") : t("nada")}</p>
          {/* POR QUÉ está vacía. Sin esto, «CJ no devolvió nada» y «devolvió y
              se descartó todo» se ven idénticas, y la siguiente vez hay que
              adivinar dónde mirar. */}
          <p className="mt-1 text-xs">
            {t("diagnostico", {
              trajo: resultado.diagnostico.trajoCj,
              fuera: resultado.diagnostico.descartados,
            })}
          </p>
        </div>
      ) : null}

      {resultado?.ok && resultado.productos.length > 0 ? (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resultado.productos.map((p) => {
              const flaco = p.precio.margenCentavos < MARGEN_MINIMO_CENTAVOS;
              const puesto = agregados[p.id];

              return (
                <li
                  key={p.id}
                  className="flex flex-col rounded-xl border border-borde bg-white p-3"
                >
                  {p.imagen ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.imagen}
                      alt=""
                      className="mb-2 h-36 w-full rounded-lg object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="mb-2 h-36 w-full rounded-lg bg-slate-100" />
                  )}

                  <p className="line-clamp-2 text-sm font-semibold">
                    {p.nombre}
                  </p>
                  {p.categoria ? (
                    <p className="mt-0.5 truncate text-xs text-tinta-suave">
                      {p.categoria}
                    </p>
                  ) : null}

                  <dl className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between gap-2">
                      <dt className="text-tinta-suave">{t("cuesta")}</dt>
                      <dd className="tabular-nums">{usd(p.costoCentavos)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-tinta-suave">{t("publica")}</dt>
                      <dd className="font-bold tabular-nums">
                        {usd(p.precio.publicadoCentavos)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-tinta-suave">{t("queda")}</dt>
                      <dd
                        className={cn(
                          "font-bold tabular-nums",
                          flaco ? "text-red-700" : "text-precio-700",
                        )}
                      >
                        {usd(p.precio.margenCentavos)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-tinta-suave">{t("almacen")}</dt>
                      <dd className="tabular-nums">
                        {p.existencias === null ? "—" : p.existencias}
                      </dd>
                    </div>
                    {/* EN QUÉ DEPARTAMENTO VA A CAER, antes de agregarlo. Así
                        el que caiga mal se corrige en el momento y no en una
                        revisión de trescientos productos ya publicados. */}
                    <div className="flex justify-between gap-2">
                      <dt className="text-tinta-suave">{t("departamento")}</dt>
                      <dd
                        className={cn(
                          "text-right",
                          !p.departamento && "text-amber-700",
                        )}
                      >
                        {nombreDeDepartamento(p.departamento, idioma) ??
                          t("sinDepartamento")}
                      </dd>
                    </div>
                  </dl>

                  {/**
                   * SI DEJA POCO, SE DICE A DÓNDE VA — no solo que deja poco.
                   *
                   * Antes la tarjeta avisaba «una sola devolución lo convierte
                   * en pérdida» y ahí se quedaba: no se sabía si se podía
                   * agregar ni qué iba a pasar si se agregaba. Ahora dice la
                   * consecuencia entera —va a la mayorista, se vende de a
                   * diez— y **cuánto deja el lote**, que es el número con el
                   * que se decide.
                   */}
                  {flaco ? (
                    <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] leading-relaxed text-amber-900">
                      <TriangleAlert
                        className="mt-0.5 h-3 w-3 shrink-0"
                        aria-hidden
                      />
                      <span>
                        {t("vaAlMayorista", { minimo: MINIMO_MAYORISTA })}
                        <b className="ml-1 whitespace-nowrap">
                          {t("dejaElLote", {
                            monto: usd(
                              p.precio.margenCentavos * MINIMO_MAYORISTA,
                            ),
                          })}
                        </b>
                      </span>
                    </p>
                  ) : null}

                  <div className="mt-auto pt-3">
                    {puesto === "ok" ? (
                      <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-2 text-xs font-semibold text-emerald-900">
                        <Check className="h-3.5 w-3.5" aria-hidden />
                        {t("puesto")}
                      </p>
                    ) : puesto ? (
                      <p className="rounded-lg bg-red-50 px-2.5 py-2 text-xs text-red-900">
                        {puesto}
                      </p>
                    ) : (
                      <button
                        type="button"
                        disabled={agregando === p.id}
                        onClick={() => agregar(p)}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold transition-colors hover:bg-slate-50 disabled:opacity-60"
                      >
                        {agregando === p.id ? (
                          <Loader2
                            className="h-3.5 w-3.5 animate-spin"
                            aria-hidden
                          />
                        ) : (
                          <Plus className="h-3.5 w-3.5" aria-hidden />
                        )}
                        {t("agregar")}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={pagina <= 1 || buscando}
              onClick={() => lanzar(pagina - 1)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-40"
            >
              {t("anterior")}
            </button>
            <span className="text-xs text-tinta-suave">
              {t("pagina", { n: pagina })}
            </span>
            <button
              type="button"
              disabled={!resultado.hayMas || buscando}
              onClick={() => lanzar(pagina + 1)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-40"
            >
              {t("siguiente")}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
