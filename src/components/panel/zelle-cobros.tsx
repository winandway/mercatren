"use client";

import { Check, Landmark, Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import {
  guardarMaximoGlobalZelle,
  guardarMinimoGlobalZelle,
  guardarZelleDeTienda,
} from "@/lib/cobros/zelle-admin";
import { useRouter } from "@/i18n/navigation";
import { ZELLE_MAXIMO_CENTAVOS } from "@/lib/dinero";
import { cn } from "@/lib/utils";

/**
 * EL CONTROL DE ZELLE EN LOS ENLACES DE COBRO, tienda por tienda.
 *
 * El interruptor y el mínimo se guardan JUNTOS por tienda: dos botones de
 * guardar para la misma fila terminan con uno pisando al otro. Y los montos se
 * escriben en dólares, que es como piensa quien llena la casilla — la
 * conversión a centavos es del servidor.
 */
export function ZelleCobros({
  minimoGlobalCentavos,
  maximoGlobalCentavos,
  respaldoCentavos,
  tiendas,
}: {
  minimoGlobalCentavos: number | null;
  maximoGlobalCentavos: number | null;
  /** El mínimo del catálogo, que manda cuando no hay nada configurado. */
  respaldoCentavos: number;
  tiendas: Array<{
    tiendaId: string;
    nombre: string;
    habilitado: boolean;
    minimoCentavos: number | null;
  }>;
}) {
  const t = useTranslations("panel.configuracion.zelleCobros");

  return (
    <div className="space-y-4">
      <FormularioGlobal
        minimoGlobalCentavos={minimoGlobalCentavos}
        maximoGlobalCentavos={maximoGlobalCentavos}
        respaldoCentavos={respaldoCentavos}
      />

      {tiendas.length === 0 ? (
        <p className="text-sm text-tinta-suave">{t("sinTiendas")}</p>
      ) : (
        <ul className="space-y-2">
          {tiendas.map((tienda) => (
            <FilaTienda key={tienda.tiendaId} tienda={tienda} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FormularioGlobal({
  minimoGlobalCentavos,
  maximoGlobalCentavos,
  respaldoCentavos,
}: {
  minimoGlobalCentavos: number | null;
  maximoGlobalCentavos: number | null;
  respaldoCentavos: number;
}) {
  const t = useTranslations("panel.configuracion.zelleCobros");
  const router = useRouter();
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );
  const [guardando, iniciar] = useTransition();

  return (
    <>
      <form
        action={(datos) =>
          iniciar(async () => {
            const r = await guardarMinimoGlobalZelle(datos);
            setAviso({ ok: r.ok, texto: r.mensaje });
            router.refresh();
          })
        }
        className="flex flex-wrap items-end gap-3 rounded-lg bg-slate-50 p-3"
      >
        <label className="block">
          <span className="text-sm font-semibold">{t("minimoGlobal")}</span>
          <input
            type="text"
            name="minimo"
            inputMode="decimal"
            defaultValue={
              minimoGlobalCentavos !== null
                ? (minimoGlobalCentavos / 100).toFixed(2)
                : ""
            }
            placeholder={(respaldoCentavos / 100).toFixed(2)}
            className="mt-1 w-36 rounded-lg border border-borde px-3 py-2 text-sm outline-none focus:border-carga-500"
          />
        </label>

        <button
          type="submit"
          disabled={guardando}
          className="inline-flex items-center gap-2 rounded-lg border border-borde px-4 py-2 text-sm font-semibold hover:border-carga-500 disabled:opacity-60"
        >
          {guardando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          {t("guardar")}
        </button>

        <p className="w-full text-xs text-tinta-suave">
          {t("minimoGlobalAyuda", {
            respaldo: `$${(respaldoCentavos / 100).toFixed(2)}`,
          })}
        </p>

        {aviso ? (
          <p
            role="status"
            className={cn(
              "w-full text-sm font-medium",
              aviso.ok ? "text-precio-600" : "text-red-700",
            )}
          >
            {aviso.texto}
          </p>
        ) : null}
      </form>
      {/* ══ EL TOPE, EN SU PROPIO FORMULARIO (27 ago 2026) ══

          Va aparte del mínimo a propósito: guardar uno no puede pisar el otro,
          y son dos decisiones distintas. El mínimo es NUESTRO —por debajo de
          él, validar la captura cuesta más de lo que deja el margen—. El tope
          NO: es el que el banco de quien paga le pone a un destinatario nuevo,
          y sube solo con el tiempo. Por eso se edita aquí y no en el código. */}
      <FormularioTope
        maximoGlobalCentavos={maximoGlobalCentavos}
        respaldoCentavos={ZELLE_MAXIMO_CENTAVOS}
      />
    </>
  );
}

function FormularioTope({
  maximoGlobalCentavos,
  respaldoCentavos,
}: {
  maximoGlobalCentavos: number | null;
  respaldoCentavos: number;
}) {
  const t = useTranslations("panel.configuracion.zelleCobros");
  const router = useRouter();
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );
  const [guardando, iniciar] = useTransition();

  return (
    <form
      action={(datos) =>
        iniciar(async () => {
          const r = await guardarMaximoGlobalZelle(datos);
          setAviso({ ok: r.ok, texto: r.mensaje });
          router.refresh();
        })
      }
      className="mt-3 flex flex-wrap items-end gap-3 rounded-lg bg-amber-50 p-3"
    >
      <label className="block">
        <span className="text-sm font-semibold">{t("maximoGlobal")}</span>
        <input
          type="text"
          name="maximo"
          inputMode="decimal"
          defaultValue={
            maximoGlobalCentavos !== null
              ? (maximoGlobalCentavos / 100).toFixed(2)
              : ""
          }
          placeholder={(respaldoCentavos / 100).toFixed(2)}
          className="mt-1 w-36 rounded-lg border border-amber-300 px-3 py-2 text-sm outline-none focus:border-carga-500"
        />
      </label>

      <button
        type="submit"
        disabled={guardando}
        className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold hover:border-carga-500 disabled:opacity-60"
      >
        {guardando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Save className="h-4 w-4" aria-hidden />
        )}
        {t("guardar")}
      </button>

      <p className="w-full text-xs text-amber-900">
        {t("maximoGlobalAyuda", {
          respaldo: `$${(respaldoCentavos / 100).toFixed(2)}`,
        })}
      </p>

      {aviso ? (
        <p
          role="status"
          className={cn(
            "w-full text-sm font-medium",
            aviso.ok ? "text-precio-600" : "text-red-700",
          )}
        >
          {aviso.texto}
        </p>
      ) : null}
    </form>
  );
}

function FilaTienda({
  tienda,
}: {
  tienda: {
    tiendaId: string;
    nombre: string;
    habilitado: boolean;
    minimoCentavos: number | null;
  };
}) {
  const t = useTranslations("panel.configuracion.zelleCobros");
  const router = useRouter();
  const [habilitado, setHabilitado] = useState(tienda.habilitado);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );
  const [guardando, iniciar] = useTransition();

  return (
    <li className="rounded-lg border border-borde p-3">
      <form
        action={(datos) =>
          iniciar(async () => {
            const r = await guardarZelleDeTienda(datos);
            setAviso({ ok: r.ok, texto: r.mensaje });
            router.refresh();
          })
        }
        className="flex flex-wrap items-end gap-3"
      >
        <input type="hidden" name="tienda" value={tienda.tiendaId} />
        <input
          type="hidden"
          name="habilitado"
          value={habilitado ? "si" : "no"}
        />

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-bold">
            <Landmark className="h-4 w-4 shrink-0 text-carga-500" aria-hidden />
            {tienda.nombre}
          </p>

          {/* El interruptor: dice lo que hace en palabras, no solo un color. */}
          <button
            type="button"
            role="switch"
            aria-checked={habilitado}
            aria-label={t("interruptor")}
            onClick={() => setHabilitado((v) => !v)}
            className={cn(
              "mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              habilitado
                ? "border-precio-600/40 bg-emerald-50 text-precio-600"
                : "border-borde bg-slate-50 text-tinta-suave",
            )}
          >
            <span
              className={cn(
                "inline-block h-2.5 w-2.5 rounded-full",
                habilitado ? "bg-precio-600" : "bg-slate-300",
              )}
              aria-hidden
            />
            {habilitado ? t("encendido") : t("apagado")}
          </button>
        </div>

        <label className="block">
          <span className="text-xs text-tinta-suave">{t("minimoPropio")}</span>
          <input
            type="text"
            name="minimo"
            inputMode="decimal"
            defaultValue={
              tienda.minimoCentavos !== null
                ? (tienda.minimoCentavos / 100).toFixed(2)
                : ""
            }
            className="mt-1 w-32 rounded-lg border border-borde px-3 py-2 text-sm outline-none focus:border-carga-500"
          />
        </label>

        <button
          type="submit"
          disabled={guardando}
          className="inline-flex items-center gap-2 rounded-lg border border-borde px-4 py-2 text-sm font-semibold hover:border-carga-500 disabled:opacity-60"
        >
          {guardando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Check className="h-4 w-4" aria-hidden />
          )}
          {t("guardar")}
        </button>

        <p className="w-full text-xs text-tinta-suave">
          {t("minimoPropioAyuda")}
        </p>

        {aviso ? (
          <p
            role="status"
            className={cn(
              "w-full text-sm font-medium",
              aviso.ok ? "text-precio-600" : "text-red-700",
            )}
          >
            {aviso.texto}
          </p>
        ) : null}
      </form>
    </li>
  );
}
