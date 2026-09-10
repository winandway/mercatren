"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { asignarPorCodigo } from "@/lib/casillero/bodega-acciones";

function Boton({ texto, enviando }: { texto: string; enviando: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="rounded-lg bg-carga-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
      disabled={pending}
    >
      {pending ? enviando : texto}
    </button>
  );
}

/**
 * ══ ASIGNAR UN HUÉRFANO A MANO ══
 *
 * Dos formas de usarlo, y las dos terminan en la misma acción:
 * - con `codigoFijo`, es el botón junto a un candidato que propuso el
 *   sistema: un clic y listo;
 * - sin él, es la casilla donde la persona escribe el código que leyó en
 *   la etiqueta o le dio el cliente por chat.
 *
 * Al asignar, la pantalla se refresca sola para que el paquete salga de la
 * cola: una cola que no baja cuando se trabaja es una cola que nadie cree.
 */
export function AsignarHuerfano({
  paqueteId,
  codigoFijo,
  motivo,
  textos,
}: {
  paqueteId: string;
  codigoFijo?: string;
  motivo?: string;
  textos: Record<string, string>;
}) {
  const [estado, accion] = useActionState(asignarPorCodigo, null);
  const router = useRouter();

  useEffect(() => {
    if (estado?.ok) router.refresh();
  }, [estado, router]);

  if (estado?.ok) {
    return (
      <span className="text-sm font-semibold text-precio-600">
        {textos.asignadoOk}
      </span>
    );
  }

  return (
    <form action={accion} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="paqueteId" value={paqueteId} />
      {motivo ? <input type="hidden" name="motivo" value={motivo} /> : null}
      {codigoFijo ? (
        <input type="hidden" name="codigo" value={codigoFijo} />
      ) : (
        <input
          name="codigo"
          required
          autoComplete="off"
          placeholder={textos.codigoPlaceholder}
          aria-label={textos.codigoCasillero}
          className="w-36 rounded-lg border border-borde px-2 py-1.5 font-mono text-sm uppercase"
        />
      )}
      <Boton
        texto={codigoFijo ? textos.asignarAqui : textos.asignar}
        enviando={textos.asignando}
      />
      {estado?.error ? (
        <span role="alert" className="text-xs font-semibold text-red-700">
          {textos[`error_${estado.error}`] ?? textos.error_fallo}
        </span>
      ) : null}
    </form>
  );
}
