"use client";

import { Check, Loader2, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { useRouter } from "@/i18n/navigation";
import { avanzarPedido } from "@/lib/pedidos/acciones";

/**
 * Los botones que cierran la venta.
 *
 * "Entregado" va a la vista y en color: es lo que se pulsa el 90% de las
 * veces, porque en este negocio el comercio entrega en mano el mismo día.
 * "Enviado" queda al lado, más discreto, para quien sí manda por transporte.
 *
 * No se ofrece volver atrás. Un pedido entregado que de pronto vuelve a
 * "pagado" es la clase de cosa que nadie sabe explicar después; si hubo un
 * error, se arregla hablando.
 */
export function CerrarPedido({
  numero,
  estado,
  compacto = false,
}: {
  numero: string;
  estado: string;
  /**
   * En la LISTA de órdenes, no dentro de la ficha.
   *
   * Ahí solo va «Entregado» y en pequeño: es lo que se pulsa el 90% de las
   * veces y lo que evita entrar y salir de cinco pedidos para cerrar cinco
   * entregas. «Enviado» se queda para la ficha, donde hay sitio para pensarlo.
   */
  compacto?: boolean;
}) {
  const t = useTranslations("panel.pedido");
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const puedeEnviar = estado === "pagado" || estado === "preparando";
  const puedeEntregar =
    estado === "pagado" || estado === "preparando" || estado === "enviado";

  if (!puedeEntregar) return null;

  function mover(a: "enviado" | "entregado") {
    setError(null);
    iniciar(async () => {
      const r = await avanzarPedido(numero, a);
      if (r.ok) router.refresh();
      else setError(r.mensaje);
    });
  }

  if (compacto) {
    return (
      <div className="mt-2">
        <button
          type="button"
          disabled={pendiente}
          onClick={() => mover("entregado")}
          className="hover:bg-precio-700 inline-flex items-center gap-1.5 rounded-lg bg-precio-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-60"
        >
          {pendiente ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Check className="h-3.5 w-3.5" aria-hidden />
          )}
          {t("marcarEntregado")}
        </button>
        {error ? (
          <p role="alert" className="mt-1 text-xs text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pendiente}
          onClick={() => mover("entregado")}
          className="boton-principal gap-2 disabled:opacity-60"
        >
          {pendiente ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Check className="h-4 w-4" aria-hidden />
          )}
          {t("marcarEntregado")}
        </button>

        {puedeEnviar ? (
          <button
            type="button"
            disabled={pendiente}
            onClick={() => mover("enviado")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            <Truck className="h-4 w-4" aria-hidden />
            {t("marcarEnviado")}
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
