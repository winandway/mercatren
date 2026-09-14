"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { cambiarEstadoCasillero } from "@/lib/casillero/estado-acciones";

function Boton({ texto, enviando }: { texto: string; enviando: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="rounded-lg border border-borde px-2 py-1 text-xs font-semibold hover:bg-slate-50 disabled:opacity-60"
      disabled={pending}
    >
      {pending ? enviando : texto}
    </button>
  );
}

/**
 * Los botones de estado de un casillero en la tabla del panel: verificar
 * (una vez), y suspender o reactivar. Al cambiar, la fila se refresca sola.
 */
export function EstadoCasillero({
  casilleroId,
  verificado,
  estado,
  textos,
}: {
  casilleroId: string;
  verificado: boolean;
  estado: string;
  textos: Record<string, string>;
}) {
  const [resultado, accion] = useActionState(cambiarEstadoCasillero, null);
  const router = useRouter();
  useEffect(() => {
    if (resultado?.ok) router.refresh();
  }, [resultado, router]);

  const suspendido = estado === "suspendido";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {!verificado ? (
        <form action={accion}>
          <input type="hidden" name="casilleroId" value={casilleroId} />
          <input type="hidden" name="accion" value="verificar" />
          <Boton texto={textos.verificar} enviando={textos.cambiando} />
        </form>
      ) : null}
      <form action={accion}>
        <input type="hidden" name="casilleroId" value={casilleroId} />
        <input
          type="hidden"
          name="accion"
          value={suspendido ? "reactivar" : "suspender"}
        />
        <Boton
          texto={suspendido ? textos.reactivar : textos.suspender}
          enviando={textos.cambiando}
        />
      </form>
      {resultado?.error ? (
        <span role="alert" className="text-xs font-semibold text-red-700">
          {textos[`error_${resultado.error}`] ?? textos.error_fallo}
        </span>
      ) : null}
    </div>
  );
}
