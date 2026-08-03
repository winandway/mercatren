"use client";

import { ExternalLink, Eye, EyeOff, MoreVertical, Pencil } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { Link, useRouter } from "@/i18n/navigation";
import { cambiarEstadoProducto } from "@/lib/productos/acciones";

/**
 * El menu de tres puntos de cada producto.
 *
 * Publicar y retirar es lo que se hace veinte veces al dia, asi que va aqui a
 * un toque. Las acciones que cambian de verdad la tienda, o que se pueden
 * lamentar, nunca van sueltas en la fila: se abren desde este menu (regla del
 * proyecto).
 */
export function AccionesProducto({
  id,
  slug,
  estado,
  textos,
}: {
  id: string;
  slug: string;
  estado: string;
  textos: {
    acciones: string;
    editar: string;
    publicar: string;
    despublicar: string;
    verEnTienda: string;
  };
}) {
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciarTransicion] = useTransition();
  const router = useRouter();
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const alTocar = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", alTocar);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("mousedown", alTocar);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto]);

  const publicado = estado === "publicado";

  function cambiar() {
    setAbierto(false);
    iniciarTransicion(async () => {
      await cambiarEstadoProducto(id, publicado ? "borrador" : "publicado");
      router.refresh();
    });
  }

  return (
    <div ref={caja} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        disabled={pendiente}
        aria-label={textos.acciones}
        aria-expanded={abierto}
        className="rounded-lg p-2 text-tinta-suave transition-colors hover:bg-slate-100 hover:text-tinta disabled:opacity-50"
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
      </button>

      {abierto ? (
        <div className="absolute top-full right-0 z-40 mt-1 w-52 overflow-hidden rounded-lg bg-white py-1 shadow-xl ring-1 ring-black/10">
          <Link
            href={`/panel/productos/${id}`}
            onClick={() => setAbierto(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4 text-tinta-suave" aria-hidden />
            {textos.editar}
          </Link>

          <button
            type="button"
            onClick={cambiar}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-slate-50"
          >
            {publicado ? (
              <EyeOff className="h-4 w-4 text-tinta-suave" aria-hidden />
            ) : (
              <Eye className="h-4 w-4 text-precio-600" aria-hidden />
            )}
            {publicado ? textos.despublicar : textos.publicar}
          </button>

          {publicado ? (
            <Link
              href={`/producto/${slug}`}
              onClick={() => setAbierto(false)}
              className="flex items-center gap-2.5 border-t border-borde px-3 py-2.5 text-sm hover:bg-slate-50"
            >
              <ExternalLink className="h-4 w-4 text-tinta-suave" aria-hidden />
              {textos.verEnTienda}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
