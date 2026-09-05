"use client";

import {
  Check,
  Loader2,
  PackageSearch,
  Pause,
  Play,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import {
  afinarDesdePanel,
  arrancarImportacionMasiva,
  avanzarImportacionMasiva,
  pausarImportacionMasiva,
  reanudarImportacionMasiva,
  type EstadoMasivo,
} from "@/lib/cj/masivo-acciones";
import { STOCK_MINIMO_POR_DEFECTO, porcentajeDe } from "@/lib/cj/masivo";
import { productosPorDia } from "@/lib/cj/reparto-de-puntos";
import type { EstadoImportacion } from "@/lib/cj/masivo-servidor";
import { recargarSiEsVersionVieja } from "@/lib/version-vieja";

/**
 * TRAER EL ALMACÉN COMPLETO DE CJ, DESDE EL PANEL.
 *
 * Un botón, unos filtros, y una barra que avanza mientras la pantalla esté
 * abierta. Si se cierra, no pasa nada: el reloj de la casa sigue solo cada
 * 15 minutos, porque lo que decide por dónde va es el dato, no esta pantalla.
 *
 * Calcado del comportamiento de «Recalcular los precios»: arranca, pinta el
 * avance, se puede pausar y retomar. Quien usa el panel no aprende nada nuevo.
 */
export function ImportarMasivo({
  inicial,
  almacen,
}: {
  inicial: EstadoMasivo;
  almacen: "US" | "CN";
}) {
  const t = useTranslations("panel.catalogoUsa.masivo");

  const [importacion, setImportacion] = useState<EstadoImportacion | null>(
    inicial.importacion,
  );
  const [arrancando, setArrancando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [porAfinar, setPorAfinar] = useState(inicial.porAfinar);
  const [afinados, setAfinados] = useState(inicial.afinados);
  const [afinando, setAfinando] = useState(false);
  const [ultimoAfinado, setUltimoAfinado] = useState<string | null>(null);

  /* El bucle vive en una referencia: un segundo bucle sobre la misma
     importación gastaría el doble de llamadas a CJ por nada. */
  const bucleVivo = useRef(false);

  /* EL RITMO LO MARCA CJ, NO NUESTRO RELOJ (5 sep 2026). Antes decía
     40 × 96 vueltas = 3.840 al día, y eso es lo que aguanta nuestro reloj —
     que va sobrado. El techo real son los puntos que CJ da: 50.000 al día
     entre los 20 que cuesta afinar un producto. Prometer 3.840 hizo que el
     dueño mirara el conteo cuatro días seguidos creyendo que algo se rompió. */
  const porDia = productosPorDia();

  async function bucle(id: string) {
    if (bucleVivo.current) return;
    bucleVivo.current = true;
    try {
      while (bucleVivo.current) {
        const e = await avanzarImportacionMasiva(id);
        if (!e) break;
        setImportacion(e);
        if (e.estado !== "en_curso") break;
      }
    } catch (fallo) {
      if (recargarSiEsVersionVieja(fallo)) return;
      console.error("[cj-masivo] el bucle falló:", fallo);
      setError(String(fallo));
    } finally {
      bucleVivo.current = false;
    }
  }

  /* Al abrir la pantalla con una importación en marcha, se sigue sola. El
     arranque va en un temporizador y no directo en el efecto: el bucle
     escribe estado después de cada vuelta, y hacerlo en el propio cuerpo
     del efecto dispararía un segundo renderizado en cascada. */
  useEffect(() => {
    const id =
      inicial.importacion?.estado === "en_curso"
        ? inicial.importacion.id
        : null;
    const temporizador = id ? setTimeout(() => void bucle(id), 0) : null;
    return () => {
      if (temporizador) clearTimeout(temporizador);
      bucleVivo.current = false;
    };
    // Solo al montar: el id de arranque no cambia mientras dura la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function empezar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget);
    setArrancando(true);
    setError(null);
    try {
      const r = await arrancarImportacionMasiva(formulario);
      if (!r.ok) {
        setError(r.motivo);
        return;
      }
      setImportacion(r.estado);
      void bucle(r.estado.id);
    } catch (fallo) {
      if (recargarSiEsVersionVieja(fallo)) return;
      setError(String(fallo));
    } finally {
      setArrancando(false);
    }
  }

  async function pausar() {
    if (!importacion) return;
    bucleVivo.current = false;
    const e = await pausarImportacionMasiva(importacion.id);
    if (e) setImportacion(e);
  }

  async function reanudar() {
    if (!importacion) return;
    const e = await reanudarImportacionMasiva(importacion.id);
    if (e) {
      setImportacion(e);
      void bucle(e.id);
    }
  }

  async function afinar() {
    setAfinando(true);
    setUltimoAfinado(null);
    try {
      let seguir = true;
      let hechos = 0;
      while (seguir) {
        const r = await afinarDesdePanel();
        if (r.motivo) {
          setError(r.motivo);
          break;
        }
        hechos += r.afinados;
        setAfinados((n) => n + r.afinados);
        setPorAfinar(r.restantes);
        setUltimoAfinado(
          t("afinadoResultado", {
            afinados: hechos,
            agotados: r.agotados,
            fallidos: r.fallidos,
            restantes: r.restantes,
          }),
        );
        /* Se para cuando no queda nada Y cuando una vuelta no avanzó: si CJ
           no contesta, esto giraría gastando llamadas para nada. */
        seguir = r.restantes > 0 && r.afinados > 0;
      }
    } catch (fallo) {
      if (recargarSiEsVersionVieja(fallo)) return;
      setError(String(fallo));
    } finally {
      setAfinando(false);
    }
  }

  const viva = importacion && importacion.estado !== "terminada";
  const porcentaje = importacion
    ? porcentajeDe(importacion.tandasHechas, importacion.tandasTotal)
    : 0;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-borde bg-white p-3.5">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <PackageSearch className="h-4 w-4 text-carga-500" aria-hidden />
          {t("titulo", {
            almacen: t(almacen === "US" ? "almacenUS" : "almacenCN"),
          })}
        </p>
        <p className="mt-1 text-xs text-tinta-suave">
          {t("texto", {
            almacen: t(almacen === "US" ? "almacenUS" : "almacenCN"),
            muestras: inicial.muestrasDeEnvio,
            porDia,
          })}
        </p>

        {!viva ? (
          <form onSubmit={empezar} className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="text-xs">
              <span className="block font-semibold">{t("stockMinimo")}</span>
              <input
                name="stockMinimo"
                type="number"
                inputMode="numeric"
                min={0}
                max={10000}
                defaultValue={STOCK_MINIMO_POR_DEFECTO}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
              />
            </label>
            <label className="text-xs">
              <span className="block font-semibold">{t("tope")}</span>
              <input
                name="tope"
                type="number"
                inputMode="numeric"
                min={0}
                max={1000000}
                defaultValue={0}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
              />
            </label>
            <label className="flex items-end gap-2 pb-1.5 text-xs">
              <input
                name="soloVerificado"
                type="checkbox"
                value="si"
                defaultChecked
                className="h-4 w-4"
              />
              <span className="font-semibold">{t("soloVerificado")}</span>
            </label>
            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={arrancando}
                className="boton-principal inline-flex items-center gap-2 text-xs"
              >
                {arrancando ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <PackageSearch className="h-3.5 w-3.5" aria-hidden />
                )}
                {arrancando ? t("empezando") : t("empezar")}
              </button>
            </div>
          </form>
        ) : null}

        {importacion ? (
          <div className="mt-3 rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold">
              {importacion.estado === "en_curso"
                ? t("enCurso")
                : importacion.estado === "pausada"
                  ? t("pausada")
                  : t("terminada")}
              {" · "}
              {t("progreso", {
                hechas: importacion.tandasHechas,
                total: importacion.tandasTotal,
              })}
            </p>
            <div
              className="bg-riel-100 mt-2 h-2 w-full overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={porcentaje}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-carga-500 transition-all"
                style={{ width: `${porcentaje}%` }}
              />
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
              <div>
                <dt className="text-tinta-suave">{t("agregados")}</dt>
                <dd className="font-semibold tabular-nums">
                  {importacion.agregados}
                </dd>
              </div>
              <div>
                <dt className="text-tinta-suave">{t("actualizados")}</dt>
                <dd className="font-semibold tabular-nums">
                  {importacion.actualizados}
                </dd>
              </div>
              <div>
                <dt className="text-tinta-suave">{t("saltados")}</dt>
                <dd className="font-semibold tabular-nums">
                  {importacion.saltados}
                </dd>
              </div>
              <div>
                <dt className="text-tinta-suave">{t("fallidos")}</dt>
                <dd className="font-semibold tabular-nums">
                  {importacion.fallidos}
                </dd>
              </div>
            </dl>
            <p className="mt-1 text-[11px] text-tinta-suave">
              {t("saltadosAyuda")}
            </p>
            {importacion.ultimoError ? (
              <p className="mt-2 text-xs text-amber-900">
                {t("ultimoError")}: {importacion.ultimoError}
              </p>
            ) : null}
            {viva ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {importacion.estado === "en_curso" ? (
                  <button
                    type="button"
                    onClick={pausar}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                  >
                    <Pause className="h-3.5 w-3.5" aria-hidden />
                    {t("pausar")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={reanudar}
                    className="boton-principal inline-flex items-center gap-1.5 text-xs"
                  >
                    <Play className="h-3.5 w-3.5" aria-hidden />
                    {t("reanudar")}
                  </button>
                )}
                <span className="text-[11px] text-tinta-suave">
                  {t("seguir")}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-900">
            <TriangleAlert
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              aria-hidden
            />
            <span>{error}</span>
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-borde bg-white p-3.5">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-carga-500" aria-hidden />
          {t("afinarTitulo")}
        </p>
        <p className="mt-1 text-xs text-tinta-suave">
          {porAfinar === 0
            ? t("todoAfinado")
            : t("afinarTexto", { porAfinar, afinados })}
        </p>
        {porAfinar > 0 ? (
          <button
            type="button"
            onClick={afinar}
            disabled={afinando}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            {afinando ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
            )}
            {afinando ? t("afinando") : t("afinar")}
          </button>
        ) : null}
        {ultimoAfinado ? (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-2 text-xs text-emerald-900">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {ultimoAfinado}
          </p>
        ) : null}
      </div>
    </div>
  );
}
