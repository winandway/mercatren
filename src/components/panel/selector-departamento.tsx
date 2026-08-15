"use client";

import { Check, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { cambiarDepartamento } from "@/lib/productos/acciones";

/**
 * CAMBIAR EL DEPARTAMENTO DE UN PRODUCTO, DESDE LA PROPIA LISTA.
 *
 * ══ POR QUÉ AQUÍ Y NO DENTRO DE LA FICHA ══
 *
 * Porque el error se ve navegando: se entra a «Electrodomésticos» y ahí está un
 * kit de brochas de maquillaje. Si para corregirlo hay que abrir la ficha,
 * bajar, buscar el campo y guardar, nadie lo corrige — y el catálogo se queda
 * torcido para siempre. Un desplegable en la fila lo arregla en el segundo en
 * que se ve.
 *
 * ══ CAMBIAR EL DEPARTAMENTO NO MUEVE LA TIENDA ══
 *
 * La tienda dice **quién lo vende**; el departamento dice **dónde se busca**.
 * Una tienda que vende brochas puede tener una mal clasificada, y corregir la
 * clasificación no puede sacársela de su tienda ni cambiarle su dirección web:
 * eso rompería sus enlaces y lo que Google ya tenga guardado. La acción del
 * servidor solo toca `categoria_id`.
 */
export function SelectorDepartamento({
  id,
  departamento,
  opciones,
  etiqueta,
  sinDepartamento,
}: {
  id: string;
  /** El slug actual, sin el prefijo `dep-`. */
  departamento: string | null;
  opciones: Array<{ slug: string; nombre: string }>;
  etiqueta: string;
  sinDepartamento: string;
}) {
  const [valor, setValor] = useState(departamento ?? "");
  const [guardando, iniciar] = useTransition();
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cambiar(nuevo: string) {
    const antes = valor;
    setValor(nuevo);
    setError(null);
    setListo(false);

    iniciar(async () => {
      const r = await cambiarDepartamento(id, nuevo);
      if (r.ok) {
        setListo(true);
        /* La palomita se apaga sola: un aviso que se queda fijo deja de
           significar «acabo de guardar esto». */
        setTimeout(() => setListo(false), 2500);
      } else {
        /* Se devuelve el valor de antes: dejar en pantalla un departamento que
           no se guardó haría creer que el catálogo está corregido. */
        setValor(antes);
        setError(r.mensaje);
      }
    });
  }

  return (
    <span className="flex items-center gap-1.5">
      <label className="sr-only" htmlFor={`dep-${id}`}>
        {etiqueta}
      </label>
      <select
        id={`dep-${id}`}
        value={valor}
        disabled={guardando}
        onChange={(e) => cambiar(e.target.value)}
        className="max-w-[9.5rem] truncate rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs outline-none focus:border-carga-500 disabled:opacity-60"
      >
        <option value="">{sinDepartamento}</option>
        {opciones.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.nombre}
          </option>
        ))}
      </select>

      {guardando ? (
        <Loader2
          className="h-3.5 w-3.5 animate-spin text-tinta-suave"
          aria-hidden
        />
      ) : listo ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
      ) : null}

      {error ? (
        <span role="alert" className="text-[11px] text-red-700">
          {error}
        </span>
      ) : null}
    </span>
  );
}
