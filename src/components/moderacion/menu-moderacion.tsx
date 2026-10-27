"use client";

import { Ban, Flag, MoreVertical, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";

import { Link } from "@/i18n/navigation";
import { bloquearAutor, denunciarContenido } from "@/lib/moderacion/acciones";
import {
  MOTIVOS_DE_DENUNCIA,
  type MotivoDeDenuncia,
  type TipoDenunciable,
} from "@/lib/moderacion/reglas";

/**
 * LOS TRES PUNTOS DE CADA COMENTARIO, OPINIÓN Y PREGUNTA (27 oct 2026).
 *
 * Google Play exige poder denunciar el contenido de otros usuarios y
 * bloquear a quien lo publicó, desde la app. Aquí viven las dos cosas, y
 * también «Borrar» cuando es de uno: la regla del proyecto es que nada que
 * destruya va a la vista.
 */
export function MenuModeracion({
  tipo,
  id,
  propio = false,
  conAutor = true,
  onBorrar,
  onOculto,
}: {
  tipo: TipoDenunciable;
  id: string;
  /** Lo escribió quien mira: no se denuncia ni se bloquea a uno mismo. */
  propio?: boolean;
  /** Si hay una persona detrás a la que bloquear. */
  conAutor?: boolean;
  /** Si quien mira puede borrarlo (suyo, del comercio dueño o del equipo). */
  onBorrar?: () => Promise<void>;
  /** Para quitarlo de la lista en cuanto se bloquea o se oculta. */
  onOculto?: () => void;
}) {
  const t = useTranslations("moderacion");
  const [abierto, setAbierto] = useState(false);
  const [paso, setPaso] = useState<"menu" | "motivo" | "listo">("menu");
  const [motivo, setMotivo] = useState<MotivoDeDenuncia>("ofensivo");
  const [aviso, setAviso] = useState<string | null>(null);
  const [sinSesion, setSinSesion] = useState(false);
  const [enCurso, empezar] = useTransition();
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function fuera(e: MouseEvent) {
      if (caja.current && !caja.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  function cerrarCon(texto: string) {
    setAviso(texto);
    setPaso("listo");
  }

  function denunciar() {
    empezar(async () => {
      const r = await denunciarContenido({ tipo, id, motivo }).catch(() => ({
        ok: false as const,
        motivo: "fallo" as const,
      }));
      if (r.ok) {
        cerrarCon(t("gracias"));
        if (r.oculto) onOculto?.();
        return;
      }
      if (r.motivo === "sesion") setSinSesion(true);
      cerrarCon(t(`errores.${r.motivo}`));
    });
  }

  function bloquear() {
    empezar(async () => {
      const r = await bloquearAutor({ tipo, id }).catch(() => ({
        ok: false as const,
        motivo: "fallo" as const,
      }));
      if (r.ok) {
        cerrarCon(t("bloqueado"));
        onOculto?.();
        return;
      }
      if (r.motivo === "sesion") setSinSesion(true);
      cerrarCon(t(`errores.${r.motivo}`));
    });
  }

  return (
    <div ref={caja} className="relative shrink-0">
      <button
        type="button"
        aria-label={t("abrir")}
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => {
          setAbierto((v) => !v);
          setPaso("menu");
          setAviso(null);
          setSinSesion(false);
        }}
        className="rounded p-1 text-tinta-suave hover:bg-slate-100 hover:text-tinta"
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
      </button>
      {abierto ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-64 overflow-hidden rounded-xl border border-borde bg-white py-1 text-sm text-tinta shadow-lg"
        >
          {paso === "menu" ? (
            <>
              {onBorrar ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={async () => {
                    setAbierto(false);
                    await onBorrar();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left font-semibold text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {t("borrar")}
                </button>
              ) : null}
              {!propio ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setPaso("motivo")}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-slate-50"
                >
                  <Flag className="h-4 w-4" aria-hidden />
                  {t("denunciar")}
                </button>
              ) : null}
              {!propio && conAutor ? (
                <button
                  type="button"
                  role="menuitem"
                  disabled={enCurso}
                  onClick={bloquear}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-slate-50"
                >
                  <Ban className="h-4 w-4" aria-hidden />
                  {t("bloquear")}
                </button>
              ) : null}
            </>
          ) : null}

          {paso === "motivo" ? (
            <div className="px-4 py-3">
              <p className="font-semibold">{t("porQue")}</p>
              <div className="mt-2 space-y-1.5">
                {MOTIVOS_DE_DENUNCIA.map((m) => (
                  <label key={m} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`motivo-${id}`}
                      checked={motivo === m}
                      onChange={() => setMotivo(m)}
                    />
                    {t(`motivos.${m}`)}
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={denunciar}
                disabled={enCurso}
                className="boton-principal mt-3 w-full"
              >
                {t("enviar")}
              </button>
            </div>
          ) : null}

          {paso === "listo" ? (
            <div className="px-4 py-3" role="status">
              <p>{aviso}</p>
              {sinSesion ? (
                <Link
                  href="/entrar"
                  className="mt-2 inline-block font-semibold text-carga-600"
                >
                  {t("entrar")}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
