"use client";

import { Check, Copy, KeyRound, Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { cambiarPinDeSeccion, crearSeccion } from "@/lib/secciones/acciones";

export type SeccionDelPanel = {
  id: string;
  slug: string;
  nombre: string;
  llaveSubida: string;
  cuantosVideos: number;
};

/**
 * CREAR SECCIONES Y REPARTIR SUS ENLACES.
 *
 * El enlace ES la herramienta: se copia de aquí y se manda por WhatsApp al
 * teléfono con el que se va a grabar. Por eso el botón de copiar es lo más
 * visible de cada fila, y el enlace se enseña COMPLETO —con su dominio— para
 * poder pegarlo tal cual, sin que nadie tenga que armar la dirección.
 */
export function PanelSecciones({
  secciones,
  base,
}: {
  secciones: SeccionDelPanel[];
  base: string;
}) {
  const t = useTranslations("panel.secciones");
  const router = useRouter();
  const [creando, setCreando] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );
  const [copiado, setCopiado] = useState<string | null>(null);

  async function copiar(enlace: string) {
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(enlace);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      /* Sin portapapeles el enlace se ve igual y se selecciona a mano. */
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-tinta-suave">{t("entradilla")}</p>
        <button
          type="button"
          onClick={() => setCreando((x) => !x)}
          className="boton-principal gap-2"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t("nueva")}
        </button>
      </div>

      {/**
       * ══ UN ERROR NO PUEDE BORRAR LO ESCRITO (24 ago 2026) ══
       *
       * El formulario va con `onSubmit` y no con `action={fn}` a propósito.
       * React 19 **resetea el formulario** después de cada acción, también
       * cuando falla: con `action`, equivocarse en el PIN vaciaba el nombre y
       * las dos descripciones, y había que escribirlo todo otra vez. Es
       * exactamente la queja que dio origen a `FormularioPersistente` en este
       * proyecto. Con `preventDefault` y `new FormData(...)` a mano, lo
       * escrito se queda donde estaba; se limpia solo al guardar bien.
       */}
      {creando ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formulario = e.currentTarget;
            const datos = new FormData(formulario);
            setTrabajando(true);
            setAviso(null);
            const r = await crearSeccion(datos);
            setTrabajando(false);
            setAviso({ ok: r.ok, texto: r.mensaje });
            if (r.ok) {
              formulario.reset();
              setCreando(false);
              router.refresh();
            }
          }}
          className="space-y-4 rounded-xl border border-borde bg-white p-4 sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">{t("nombreEs")}</span>
              <input
                name="nombreEs"
                required
                maxLength={80}
                placeholder={t("nombreEjemplo")}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-carga-500 sm:text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">{t("nombreEn")}</span>
              <input
                name="nombreEn"
                maxLength={80}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-carga-500 sm:text-sm"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium">{t("descripcionEs")}</span>
            <textarea
              name="descripcionEs"
              rows={2}
              maxLength={400}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-carga-500 sm:text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">{t("descripcionEn")}</span>
            <textarea
              name="descripcionEn"
              rows={2}
              maxLength={400}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-carga-500 sm:text-sm"
            />
          </label>
          <label className="block max-w-[12rem]">
            <span className="text-sm font-medium">{t("pin")}</span>
            <input
              name="pin"
              required
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-center text-lg tracking-[0.4em] tabular-nums outline-none focus:border-carga-500"
            />
            <span className="mt-1 block text-xs text-tinta-suave">
              {t("pinAyuda")}
            </span>
          </label>
          <button
            type="submit"
            disabled={trabajando}
            className="boton-principal gap-2 disabled:opacity-60"
          >
            {trabajando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {t("crear")}
          </button>
        </form>
      ) : null}

      {aviso ? (
        <p
          role="status"
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            aviso.ok
              ? "bg-emerald-50 text-emerald-900"
              : "bg-red-50 text-red-800"
          }`}
        >
          {aviso.texto}
        </p>
      ) : null}

      {secciones.length === 0 ? (
        <p className="text-sm text-tinta-suave">{t("ninguna")}</p>
      ) : (
        <ul className="space-y-4">
          {secciones.map((s) => {
            const enlace = `${base}/es/subir/${s.llaveSubida}`;
            return (
              <li
                key={s.id}
                className="rounded-xl border border-borde bg-white p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-base font-bold text-riel-900">
                    {s.nombre}
                  </h2>
                  <span className="text-sm text-tinta-suave tabular-nums">
                    {t("cuantos", { n: s.cuantosVideos })}
                  </span>
                </div>

                <p className="mt-1 text-sm text-tinta-suave">
                  {t("direccionPublica")}{" "}
                  <a
                    href={`/es/seccion/${s.slug}`}
                    className="font-medium text-carga-600 underline"
                  >
                    /seccion/{s.slug}
                  </a>
                </p>

                <div className="mt-4 rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-riel-900">
                    {t("enlaceParaSubir")}
                  </p>
                  <p className="mt-1 text-xs break-all text-tinta-suave">
                    {enlace}
                  </p>
                  <button
                    type="button"
                    onClick={() => copiar(enlace)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-riel-900 px-3 py-2 text-xs font-bold text-white"
                  >
                    {copiado === enlace ? (
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Copy className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {copiado === enlace ? t("copiado") : t("copiar")}
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formulario = e.currentTarget;
                    const datos = new FormData(formulario);
                    setAviso(null);
                    const r = await cambiarPinDeSeccion(
                      s.id,
                      String(datos.get("pin") ?? ""),
                    );
                    setAviso({ ok: r.ok, texto: r.mensaje });
                    if (r.ok) formulario.reset();
                  }}
                  className="mt-3 flex items-end gap-2"
                >
                  <label className="block">
                    <span className="text-xs font-medium">{t("pinNuevo")}</span>
                    <input
                      name="pin"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="••••"
                      className="mt-1 w-24 rounded-lg border border-slate-300 px-2 py-2 text-center text-base tracking-[0.3em] tabular-nums outline-none focus:border-carga-500"
                    />
                  </label>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-borde px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                  >
                    <KeyRound className="h-3.5 w-3.5" aria-hidden />
                    {t("cambiarPin")}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
