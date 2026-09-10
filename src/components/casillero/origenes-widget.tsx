"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { crearOrigen } from "@/lib/casillero/origenes";

type Origen = {
  id: string;
  nombre: string;
  dominio: string;
  clavePublica: string;
  activo: boolean;
};

function Boton({ texto }: { texto: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-borde px-3 py-1.5 text-sm font-semibold disabled:opacity-60"
    >
      {texto}
    </button>
  );
}

/**
 * Dar de alta un sitio donde pegar el widget, y ver los que ya hay.
 *
 * La clave recién creada se enseña **con el fragmento ya armado**: pasarle
 * a alguien una clave suelta y que él arme las dos líneas es donde se
 * pierde media hora y se pega mal.
 */
export function OrigenesWidget({
  origenes,
  textos,
}: {
  origenes: Origen[];
  textos: Record<string, string>;
}) {
  const [estado, accion] = useActionState(crearOrigen, null);

  return (
    <div className="space-y-6">
      <form
        action={accion}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-borde bg-white p-4"
      >
        <label className="block">
          <span className="text-xs font-semibold">{textos.nombre}</span>
          <input
            name="nombre"
            required
            className="mt-1 block rounded-lg border border-borde px-2 py-1.5 text-sm"
            placeholder="Tienda X"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold">{textos.dominio}</span>
          <input
            name="dominio"
            required
            className="mt-1 block rounded-lg border border-borde px-2 py-1.5 text-sm"
            placeholder="ejemplo.com"
          />
        </label>
        <Boton texto={textos.crear} />
        {estado?.error ? (
          <p className="text-sm font-semibold text-red-700">
            {textos[`error_${estado.error}`] ?? textos.error_fallo}
          </p>
        ) : null}
      </form>

      {estado?.clave ? (
        <div className="rounded-xl border border-precio-600/40 bg-precio-600/10 p-4">
          <p className="text-sm font-bold">{textos.listo}</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-riel-950 p-3 text-xs text-white">
            {`<div id="mtr-casillero"></div>
<script src="https://mercatren.com/widget/casillero.js" data-clave="${estado.clave}" async></script>`}
          </pre>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-tinta-suave">
            <tr>
              <th className="py-1 pr-3">{textos.colNombre}</th>
              <th className="py-1 pr-3">{textos.colDominio}</th>
              <th className="py-1 pr-3">{textos.colClave}</th>
              <th className="py-1 pr-3">{textos.colEstado}</th>
            </tr>
          </thead>
          <tbody>
            {origenes.map((o) => (
              <tr key={o.id} className="border-t border-borde">
                <td className="py-1.5 pr-3 font-semibold">{o.nombre}</td>
                <td className="py-1.5 pr-3">{o.dominio}</td>
                <td className="py-1.5 pr-3 font-mono text-xs">
                  {o.clavePublica}
                </td>
                <td className="py-1.5 pr-3">
                  {o.activo ? textos.activo : textos.apagado}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {origenes.length === 0 ? (
          <p className="mt-3 text-sm text-tinta-suave">{textos.sinOrigenes}</p>
        ) : null}
      </div>
    </div>
  );
}
