"use client";

import { Printer } from "lucide-react";

/**
 * "Descargar" es imprimir.
 *
 * El botón abre el diálogo de impresión del navegador, donde la opción
 * "Guardar como PDF" está en todos: Chrome, Safari, Firefox, Edge, y también
 * en el celular. Se llama "Descargar" y no "Imprimir" porque es lo que la
 * persona quiere hacer — quedarse con el archivo, no gastar papel.
 *
 * Es un componente de cliente por una sola línea, y no puede ser de otra
 * forma: `window.print()` no existe en el servidor.
 */
export function BotonImprimir({ etiqueta }: { etiqueta: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="boton-principal inline-flex items-center gap-2 text-sm"
    >
      <Printer className="h-4 w-4" aria-hidden />
      {etiqueta}
    </button>
  );
}
