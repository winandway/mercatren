"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { declararPaquete } from "@/lib/casillero/declarar";

function Boton({ texto, enviando }: { texto: string; enviando: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-carga-500 px-3 py-1.5 text-sm font-semibold text-riel-950 disabled:opacity-60"
    >
      {pending ? enviando : texto}
    </button>
  );
}

/**
 * Declarar qué hay dentro y cuánto costó, desde la propia lista.
 *
 * Va aquí y no en otra pantalla porque es lo único que separa a la caja de
 * salir de Miami: mandarlo a un formulario aparte es una vuelta de más
 * justo donde el cliente ya está mirando su paquete.
 */
export function DeclararPaquete({
  paqueteId,
  textos,
}: {
  paqueteId: string;
  textos: Record<string, string>;
}) {
  const [estado, accion] = useActionState(declararPaquete, null);

  if (estado?.ok) {
    return (
      <p className="text-sm font-semibold text-precio-600">{textos.listo}</p>
    );
  }
  const error = estado?.error
    ? (textos[`error_${estado.error}`] ?? textos.error_fallo)
    : null;

  return (
    <form action={accion} className="space-y-2">
      <input type="hidden" name="paqueteId" value={paqueteId} />
      <p className="text-sm font-semibold">{textos.declarar}</p>
      {error ? (
        <p role="alert" className="text-xs font-semibold text-red-700">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <input
          name="descripcion"
          required
          placeholder={textos.descripcion}
          className="min-w-0 flex-1 rounded-lg border border-borde px-2 py-1.5 text-sm"
        />
        <input
          name="valor"
          required
          inputMode="decimal"
          placeholder="49.99"
          className="w-28 rounded-lg border border-borde px-2 py-1.5 text-sm"
        />
        <Boton texto={textos.enviar} enviando={textos.enviando} />
      </div>
      <p className="text-xs text-tinta-suave">{textos.valorAyuda}</p>
    </form>
  );
}
