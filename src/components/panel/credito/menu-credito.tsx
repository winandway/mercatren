"use client";

import { MoreVertical, Pause, Pencil, Play, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";

import {
  quitarCredito,
  reactivarCredito,
  suspenderCredito,
} from "@/lib/credito/acciones";

/**
 * EL MENÚ DE TRES PUNTOS DE UN CRÉDITO.
 *
 * POR QUÉ AQUÍ Y NO EN BOTONES A LA VISTA. Suspenderle el crédito a un cliente
 * es dejarlo sin poder comprar; quitárselo, borrar el acuerdo. Son decisiones
 * de dinero, y un botón suelto se toca sin querer — sobre todo en el celular,
 * que es donde un comercio revisa esto.
 *
 * Es también la regla del proyecto: lo destructivo va escondido un paso, nunca
 * a la vista, y siempre con confirmación aparte.
 */
export function MenuCredito({
  creditoId,
  estado,
  onEditar,
  onHecho,
}: {
  creditoId: string;
  estado: "activo" | "suspendido";
  onEditar: () => void;
  onHecho: (mensaje: string, ok: boolean) => void;
}) {
  const t = useTranslations("panel.creditos");
  const [abierto, setAbierto] = useState(false);
  const [enviando, empezar] = useTransition();
  const caja = useRef<HTMLDivElement>(null);

  /* Se cierra al tocar fuera o con Escape. Un menú que se queda abierto tapa
     la fila de abajo, y en el celular es justo la del siguiente cliente. */
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

  function correr(accion: () => Promise<{ ok: boolean; mensaje: string }>) {
    setAbierto(false);
    empezar(async () => {
      try {
        const r = await accion();
        onHecho(r.mensaje, r.ok);
      } catch (fallo) {
        /* Sin este `try` la excepción se llevaría por delante la pantalla
           entera del comercio. */
        console.error("[credito] la acción falló:", fallo);
        onHecho(t("acciones"), false);
      }
    });
  }

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        disabled={enviando}
        aria-label={t("acciones")}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-tinta-suave transition-colors hover:bg-slate-100 hover:text-tinta disabled:opacity-50"
      >
        <MoreVertical className="h-5 w-5" aria-hidden />
      </button>

      {abierto ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-60 overflow-hidden rounded-xl border border-borde bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setAbierto(false);
              onEditar();
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4 text-tinta-suave" aria-hidden />
            {t("editar")}
          </button>

          {estado === "activo" ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                if (!confirm(t("confirmarSuspender"))) return;
                correr(() => suspenderCredito(creditoId));
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-slate-50"
            >
              <Pause className="h-4 w-4 text-tinta-suave" aria-hidden />
              {t("suspender")}
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => correr(() => reactivarCredito(creditoId))}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-slate-50"
            >
              <Play className="h-4 w-4 text-tinta-suave" aria-hidden />
              {t("reactivar")}
            </button>
          )}

          {/* Lo destructivo va abajo del todo, separado y en rojo: para que no
              se toque por inercia al buscar otra opción. */}
          <div className="my-1 border-t border-borde" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              if (!confirm(t("confirmarQuitar"))) return;
              correr(() => quitarCredito(creditoId));
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {t("quitar")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
