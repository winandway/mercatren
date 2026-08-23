"use client";

import {
  Eye,
  EyeOff,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Campo } from "@/components/ui/campo";
import { borrarVideo, editarVideo } from "@/lib/videos/acciones";
import { cn } from "@/lib/utils";

/**
 * EL MENÚ DE TRES PUNTOS DE UN VIDEO: editar, ocultar y borrar.
 *
 * ══ EDITAR EXISTÍA POR DENTRO Y NO TENÍA BOTÓN (24 ago 2026) ══
 *
 * El dueño lo pidió con el motivo exacto: *«a lo mejor van a cometer errores
 * ortográficos y veo que eso no se puede editar»*. Un título mal escrito es lo
 * que lee el comprador y lo que indexa Google — y volver a subir el video para
 * corregir una tilde es tirar la subida entera, las vistas y el enlace que ya
 * circulaba.
 *
 * **El archivo NO se toca al editar.** Cambia el texto; el video, su dirección
 * y sus vistas se quedan como están.
 *
 * Borrar sigue dentro de este menú y con confirmación aparte: es regla de la
 * casa, y aquí se borra algo que la persona grabó y subió — no hay deshacer.
 */
export function AccionesVideo({
  id,
  titulo,
  tituloEn,
  descripcion,
  oculto,
}: {
  id: string;
  titulo: string;
  tituloEn: string | null;
  descripcion: string | null;
  oculto: boolean;
}) {
  const t = useTranslations("panel.videos");
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );

  useEffect(() => {
    if (!editando) return;
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditando(false);
    };
    window.addEventListener("keydown", escape);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", escape);
      document.body.style.overflow = antes;
    };
  }, [editando]);

  async function cambiarVisibilidad() {
    setTrabajando(true);
    const datos = new FormData();
    datos.set("id", id);
    datos.set("tituloEs", titulo);
    if (tituloEn) datos.set("tituloEn", tituloEn);
    if (descripcion) datos.set("descripcionEs", descripcion);
    datos.set("estado", oculto ? "publicado" : "oculto");
    await editarVideo(datos);
    setTrabajando(false);
    setAbierto(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-label={t("masOpciones")}
        aria-expanded={abierto}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-tinta-suave hover:bg-slate-100 hover:text-riel-900"
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
      </button>

      {abierto ? (
        <div className="absolute right-0 z-20 mt-1 w-60 overflow-hidden rounded-xl border border-borde bg-white shadow-lg">
          <button
            type="button"
            onClick={() => {
              setEditando(true);
              setAbierto(false);
              setAviso(null);
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-riel-900 hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            {t("editar")}
          </button>
          <button
            type="button"
            disabled={trabajando}
            onClick={cambiarVisibilidad}
            className="flex w-full items-center gap-2 border-t border-borde px-4 py-2.5 text-left text-sm font-medium text-riel-900 hover:bg-slate-50 disabled:opacity-50"
          >
            {trabajando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : oculto ? (
              <Eye className="h-4 w-4" aria-hidden />
            ) : (
              <EyeOff className="h-4 w-4" aria-hidden />
            )}
            {oculto ? t("mostrar") : t("ocultar")}
          </button>
          <button
            type="button"
            disabled={trabajando}
            onClick={async () => {
              if (!window.confirm(t("seguroBorrar", { titulo }))) return;
              setTrabajando(true);
              await borrarVideo(id);
              setTrabajando(false);
              setAbierto(false);
              router.refresh();
            }}
            className="flex w-full items-center gap-2 border-t border-borde px-4 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {trabajando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden />
            )}
            {t("borrar")}
          </button>
        </div>
      ) : null}

      {editando ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("editarTitulo")}
          onClick={() => setEditando(false)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            action={async (datos) => {
              setTrabajando(true);
              setAviso(null);
              datos.set("id", id);
              const r = await editarVideo(datos);
              setTrabajando(false);
              setAviso({ ok: r.ok, texto: r.mensaje });
              if (r.ok) {
                router.refresh();
                setTimeout(() => setEditando(false), 900);
              }
            }}
            className="max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 text-left shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-riel-900">
                {t("editarTitulo")}
              </h2>
              <button
                type="button"
                onClick={() => setEditando(false)}
                aria-label={t("cerrar")}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-tinta-suave hover:bg-slate-100"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <p className="mt-1 text-sm text-tinta-suave">{t("editarAyuda")}</p>

            <div className="mt-4 space-y-4">
              <Campo
                tipo="textoCorto"
                nombre="tituloEs"
                etiqueta={t("tituloEs")}
                valorInicial={titulo}
                requerido
              />
              <Campo
                tipo="textoCorto"
                nombre="tituloEn"
                etiqueta={t("tituloEn")}
                valorInicial={tituloEn ?? ""}
              />
              <Campo
                tipo="textoLargo"
                nombre="descripcionEs"
                etiqueta={t("descripcionEs")}
                valorInicial={descripcion ?? ""}
                area
                filas={3}
              />
              {/* El estado viaja tal cual está: editar el texto no publica ni
                  esconde nada por su cuenta. */}
              <input
                type="hidden"
                name="estado"
                value={oculto ? "oculto" : "publicado"}
              />
            </div>

            {aviso ? (
              <p
                role="status"
                className={cn(
                  "mt-4 rounded-lg px-4 py-3 text-sm font-medium",
                  aviso.ok
                    ? "bg-emerald-50 text-emerald-900"
                    : "bg-red-50 text-red-800",
                )}
              >
                {aviso.texto}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={trabajando}
                className="boton-principal gap-2 disabled:opacity-50"
              >
                {trabajando ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Pencil className="h-4 w-4" aria-hidden />
                )}
                {t("guardarCambios")}
              </button>
              <button
                type="button"
                onClick={() => setEditando(false)}
                className="rounded-lg border border-borde px-4 py-2 text-sm font-semibold text-riel-900 hover:bg-slate-50"
              >
                {t("cancelar")}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
