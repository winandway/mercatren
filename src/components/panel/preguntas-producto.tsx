"use client";

import { HelpCircle, Loader2, MoreVertical, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useRouter } from "@/i18n/navigation";
import { borrarPregunta, guardarPregunta } from "@/lib/preguntas/acciones";
import { cn } from "@/lib/utils";

export type PreguntaDelPanel = {
  id: string;
  preguntaEs: string;
  preguntaEn: string | null;
  respuestaEs: string | null;
  respuestaEn: string | null;
  orden: number;
};

/**
 * Las preguntas frecuentes que el comercio escribe para su producto.
 *
 * ══ POR QUÉ ESTO VENDE, Y HAY QUE DECÍRSELO ══
 *
 * Quien duda no escribe: se va. «¿Sirve para 220?», «¿cuántos metros trae?»
 * son las preguntas que matan la venta en silencio, y la descripción de dos
 * líneas del catálogo importado no las responde.
 *
 * Por eso la bajada del bloque no dice «preguntas frecuentes» a secas: le
 * explica al comerciante para qué le sirve. Un formulario que no dice por qué
 * existe se queda vacío.
 */
export function PreguntasDelProducto({
  productoId,
  preguntas,
}: {
  productoId: string;
  preguntas: PreguntaDelPanel[];
}) {
  const t = useTranslations("panel.preguntas");
  const router = useRouter();
  const [editando, setEditando] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);

  async function quitar(id: string) {
    if (!confirm(t("confirmarQuitar"))) return;
    setTrabajando(true);
    setMenuAbierto(null);
    const r = await borrarPregunta(id, productoId);
    setTrabajando(false);
    setAviso(r.mensaje);
    if (r.ok) router.refresh();
  }

  return (
    <section className="rounded-xl border border-borde bg-white p-4 sm:p-6">
      <h2 className="flex items-center gap-2 font-bold">
        <HelpCircle className="h-4 w-4 text-tinta-suave" aria-hidden />
        {t("titulo")}
      </h2>
      <p className="mt-1 text-sm text-tinta-suave">{t("bajada")}</p>

      {aviso ? (
        <p role="status" className="mt-3 text-sm font-medium text-precio-600">
          {aviso}
        </p>
      ) : null}

      {preguntas.length > 0 && (
        <ul className="mt-4 divide-y divide-borde rounded-lg border border-borde">
          {preguntas.map((p) => (
            <li key={p.id} className="px-3 py-2.5">
              {editando === p.id ? (
                <Formulario
                  productoId={productoId}
                  pregunta={p}
                  alTerminar={() => {
                    setEditando(null);
                    router.refresh();
                  }}
                  alCancelar={() => setEditando(null)}
                />
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setEditando(p.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-semibold">
                      {p.preguntaEs}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-tinta-suave">
                      {p.respuestaEs}
                    </p>
                  </button>

                  {/* Borrar NUNCA a la vista: va dentro de los tres puntos, y
                      además pide confirmación. Regla del proyecto. */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      aria-label={t("masOpciones")}
                      onClick={() =>
                        setMenuAbierto(menuAbierto === p.id ? null : p.id)
                      }
                      className="rounded p-1 text-tinta-suave hover:bg-slate-100"
                    >
                      <MoreVertical className="h-4 w-4" aria-hidden />
                    </button>

                    {menuAbierto === p.id && (
                      <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-borde bg-white py-1 shadow-lg">
                        <button
                          type="button"
                          onClick={() => quitar(p.id)}
                          disabled={trabajando}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          {t("quitar")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {editando === "nueva" ? (
        <div className="mt-4 rounded-lg border border-borde p-3">
          <Formulario
            productoId={productoId}
            alTerminar={() => {
              setEditando(null);
              router.refresh();
            }}
            alCancelar={() => setEditando(null)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditando("nueva")}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-borde px-3 py-2 text-sm font-semibold transition-colors hover:border-carga-500"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t("agregar")}
        </button>
      )}
    </section>
  );
}

/** Alta y edición. Es el mismo formulario porque los campos son los mismos. */
function Formulario({
  productoId,
  pregunta,
  alTerminar,
  alCancelar,
}: {
  productoId: string;
  pregunta?: PreguntaDelPanel;
  alTerminar: () => void;
  alCancelar: () => void;
}) {
  const t = useTranslations("panel.preguntas");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clases =
    "mt-1 w-full rounded-lg border border-borde px-3 py-2 text-sm outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30";

  return (
    <form
      action={async (datos) => {
        setGuardando(true);
        setError(null);

        /* Igual que en el formulario de producto: NADA puede borrar lo
           escrito. Sin este `try`, una excepción del servidor desmonta el
           formulario y la persona pierde lo que llevaba. */
        let r: Awaited<ReturnType<typeof guardarPregunta>>;
        try {
          r = await guardarPregunta(datos);
        } catch (fallo) {
          console.error("[preguntas] no se pudo guardar:", fallo);
          setGuardando(false);
          setError(t("noSePudo"));
          return;
        }

        setGuardando(false);
        if (!r.ok) {
          setError(r.mensaje);
          return;
        }
        alTerminar();
      }}
      className="space-y-3"
    >
      <input type="hidden" name="productoId" value={productoId} />
      {pregunta ? <input type="hidden" name="id" value={pregunta.id} /> : null}

      {error ? (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <label className="block">
        <span className="text-sm font-semibold">{t("laPregunta")}</span>
        <input
          name="preguntaEs"
          required
          maxLength={200}
          defaultValue={pregunta?.preguntaEs ?? ""}
          placeholder={t("ejemploPregunta")}
          className={clases}
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold">{t("laRespuesta")}</span>
        <textarea
          name="respuestaEs"
          required
          rows={3}
          maxLength={1200}
          defaultValue={pregunta?.respuestaEs ?? ""}
          placeholder={t("ejemploRespuesta")}
          className={cn(clases, "resize-y")}
        />
      </label>

      {/* El inglés es opcional a propósito: exigirlo dejaría la ficha sin
          preguntas. Sin traducción se muestra el español, como en todo el
          catálogo — no se inventan traducciones. */}
      <details className="rounded-lg bg-slate-50 px-3 py-2">
        <summary className="cursor-pointer text-xs font-semibold text-tinta-suave">
          {t("enIngles")}
        </summary>
        <div className="mt-2 space-y-2">
          <input
            name="preguntaEn"
            maxLength={200}
            defaultValue={pregunta?.preguntaEn ?? ""}
            placeholder={t("ejemploPreguntaEn")}
            className={clases}
          />
          <textarea
            name="respuestaEn"
            rows={2}
            maxLength={1200}
            defaultValue={pregunta?.respuestaEn ?? ""}
            className={cn(clases, "resize-y")}
          />
        </div>
      </details>

      <label className="block">
        <span className="text-sm font-semibold">{t("orden")}</span>
        <input
          type="number"
          name="orden"
          min={0}
          max={99}
          inputMode="numeric"
          defaultValue={pregunta?.orden ?? 0}
          className={cn(clases, "max-w-24")}
        />
        <span className="mt-1 block text-xs text-tinta-suave">
          {t("ordenAyuda")}
        </span>
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={guardando}
          className="inline-flex items-center gap-2 rounded-lg bg-riel-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {guardando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          {t("guardar")}
        </button>
        <button
          type="button"
          onClick={alCancelar}
          className="rounded-lg border border-borde px-4 py-2 text-sm font-semibold"
        >
          {t("cancelar")}
        </button>
      </div>
    </form>
  );
}
