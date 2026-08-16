"use client";

import { AlertTriangle, Check, Loader2, RefreshCw, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useRouter } from "@/i18n/navigation";
import type { SaludSincronizacion } from "@/lib/catalogo/salud-sincronizacion";
import { guardarFuente, sincronizarCatalogo } from "@/lib/catalogo/sincronizar";
import { cn } from "@/lib/utils";

/**
 * Configura la direccion del archivo del comercio y dispara la lectura.
 *
 * El comercio publica su catalogo en una direccion suya (el mismo archivo de
 * exportacion que se importo la primera vez) y desde aqui se relee cuando
 * quiera. Debajo se le dice, sin letra chica, que va a pasar con sus
 * productos: es lo que evita el susto de "y ahora que le hizo a mi tienda".
 */
export function SincronizarCatalogo({
  fuenteId,
  url,
  ultima,
  ultimoResultado,
  salud,
}: {
  fuenteId: string;
  url: string | null;
  ultima: string | null;
  ultimoResultado: string | null;
  salud: SaludSincronizacion;
}) {
  const t = useTranslations("panel.sincronizacion");
  const router = useRouter();

  const [direccion, setDireccion] = useState(url ?? "");
  const [guardando, setGuardando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );

  const reglas = t.raw("reglas") as string[];

  /**
   * «HACE 3 HORAS», NO «HACE 187 MINUTOS».
   *
   * El número exacto en minutos no le dice nada a nadie pasada la primera
   * hora: lo que la persona necesita saber es si esto lleva un rato o lleva
   * días. Y la unidad va traducida con plural de verdad — «1 días» delata
   * que el aviso lo escribió una máquina, justo cuando hay que creerle.
   */
  function haceCuanto(minutos: number) {
    if (minutos < 60) return t("haceMinutos", { n: minutos });
    if (minutos < 60 * 24)
      return t("haceHoras", { n: Math.floor(minutos / 60) });
    return t("haceDias", { n: Math.floor(minutos / (60 * 24)) });
  }

  return (
    <div>
      <p className="text-sm text-tinta-suave">{t("texto")}</p>

      {/* Que corre sola se dice ARRIBA del botón. Sin esta línea, el botón se
          lee como «esto solo pasa si lo pulsas», que es justo lo que hacía que
          nadie lo pulsara y los dos catálogos se separaran. */}
      <p className="mt-2 flex items-start gap-2 text-sm text-tinta-suave">
        <RefreshCw
          className="mt-0.5 h-4 w-4 shrink-0 text-precio-600"
          aria-hidden
        />
        {t("automatica")}
      </p>

      {/**
       * EL AVISO DE QUE LLEVA RATO SIN CORRER.
       *
       * Una fecha vieja se lee igual de bien que una nueva: sin esta franja,
       * el comercio sigue confiando en un stock que dejó de actualizarse y se
       * entera cuando le vende a alguien algo que ya no tiene.
       */}
      {salud.nivel === "atrasada" && salud.minutos !== null ? (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t("atrasada", { minutos: haceCuanto(salud.minutos) })}
        </p>
      ) : null}

      {aviso ? (
        <p
          role="status"
          className={cn(
            "mt-3 rounded-lg px-3 py-2 text-sm font-medium",
            aviso.ok
              ? "bg-emerald-50 text-emerald-900"
              : "bg-red-50 text-red-800",
          )}
        >
          {aviso.texto}
        </p>
      ) : null}

      <form
        action={async (datos) => {
          setGuardando(true);
          setAviso(null);
          const r = await guardarFuente(datos);
          setAviso({ ok: r.ok, texto: r.mensaje });
          setGuardando(false);
          router.refresh();
        }}
        className="mt-4"
      >
        <input type="hidden" name="id" value={fuenteId} />
        <label className="block">
          <span className="text-sm font-semibold">{t("direccion")}</span>
          <input
            type="url"
            name="url"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="https://"
            className="mt-1 w-full rounded-lg border border-borde px-3 py-2.5 text-sm outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30"
          />
          <span className="mt-1 block text-xs text-tinta-suave">
            {t("direccionAyuda")}
          </span>
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={guardando}
            className="inline-flex items-center gap-2 rounded-lg border border-borde px-4 py-2 text-sm font-semibold transition-colors hover:border-carga-500 disabled:opacity-60"
          >
            {guardando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="h-4 w-4" aria-hidden />
            )}
            {t("guardar")}
          </button>

          <button
            type="button"
            disabled={sincronizando || !direccion.trim()}
            onClick={async () => {
              setSincronizando(true);
              setAviso(null);
              const r = await sincronizarCatalogo(fuenteId);
              setAviso({ ok: r.ok, texto: r.mensaje });
              setSincronizando(false);
              router.refresh();
            }}
            className="boton-principal gap-2 disabled:opacity-60"
          >
            {sincronizando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
            {sincronizando ? t("sincronizando") : t("sincronizar")}
          </button>
        </div>

        {!direccion.trim() ? (
          <p className="mt-2 text-xs text-tinta-suave">{t("sinDireccion")}</p>
        ) : null}
      </form>

      <p className="mt-4 border-t border-borde pt-3 text-xs text-tinta-suave">
        {t("ultima")}:{" "}
        <span className="font-medium text-tinta">{ultima ?? t("nunca")}</span>
        {ultimoResultado ? ` · ${ultimoResultado}` : ""}
        {salud.nivel === "al_dia" ? (
          <span className="ml-1 font-semibold text-precio-600">
            · {t("alDia")}
          </span>
        ) : null}
      </p>

      {/* Lo que va a pasar con su catalogo, dicho antes de que lo pulse. */}
      <div className="mt-4 rounded-lg bg-slate-50 p-3">
        <p className="text-xs font-bold tracking-wide text-tinta-suave uppercase">
          {t("queHace")}
        </p>
        <ul className="mt-2 space-y-1.5">
          {reglas.map((regla) => (
            <li key={regla} className="flex gap-2 text-xs leading-snug">
              <Check
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-precio-600"
                aria-hidden
              />
              {regla}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
