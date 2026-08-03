"use client";

import { Loader2, Send } from "lucide-react";
import { useActionState } from "react";

import { enviarCorreoDePrueba } from "@/lib/correo/acciones";
import { cn } from "@/lib/utils";

/**
 * Botón para comprobar que los correos salen de verdad.
 *
 * El correo es la única pieza que no se puede verificar mirando la pantalla:
 * sale del servidor y llega a otro lado. Sin esto, la forma de enterarse de
 * que dejó de funcionar es que un cliente se queje de que nunca le llegó nada.
 */
export function ProbarCorreo() {
  const [estado, accion, enviando] = useActionState(enviarCorreoDePrueba, null);

  return (
    <form action={accion} className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          name="correo"
          required
          placeholder="Dirección donde quieres recibir la prueba"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30"
        />
        <button
          type="submit"
          disabled={enviando}
          className="boton-principal shrink-0 gap-2 disabled:opacity-60"
        >
          {enviando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Send className="h-4 w-4" aria-hidden />
          )}
          {enviando ? "Enviando…" : "Enviar prueba"}
        </button>
      </div>

      {estado ? (
        <p
          role="status"
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium",
            estado.ok
              ? "bg-emerald-50 text-emerald-900"
              : "bg-red-50 text-red-800",
          )}
        >
          {estado.mensaje}
        </p>
      ) : null}
    </form>
  );
}
