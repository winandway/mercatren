"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/**
 * ══ SE COPIA LÍNEA POR LÍNEA, NUNCA EL BLOQUE ENTERO ══
 *
 * Copiar las cinco líneas juntas y pegarlas en Amazon es la causa número
 * uno de paquetes huérfanos: la tienda las mete todas en el campo «calle»,
 * la normalización de USPS corta el resto, y a la bodega llega una caja sin
 * código y sin forma de saber de quién es.
 *
 * Cada línea lleva encima el nombre del campo del formulario de la tienda,
 * para que no haya que adivinar dónde va.
 */
export function CopiarLinea({
  campo,
  valor,
  nota,
  copiado,
  copiar,
  /** Con la dirección tapada no hay nada que copiar: se ve la forma de la
   *  ficha, no el dato. La dirección es privada hasta crear el casillero. */
  tapado = false,
}: {
  campo: string;
  valor: string;
  nota?: string;
  copiado: string;
  copiar: string;
  tapado?: boolean;
}) {
  const [listo, setListo] = useState(false);

  return (
    <div className="rounded-lg border border-borde bg-white p-3">
      <p className="text-xs font-semibold text-tinta-suave uppercase">
        {campo}
      </p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <p
          className={`font-mono text-sm font-semibold break-all ${tapado ? "text-tinta-suave select-none" : ""}`}
        >
          {valor}
        </p>
        {tapado ? null : (
          <button
            type="button"
            onClick={() => {
              /* Sin `navigator.clipboard` (http, o un navegador viejo) no se
               rompe nada: el texto está a la vista y se selecciona a mano. */
              navigator.clipboard
                ?.writeText(valor)
                .then(() => {
                  setListo(true);
                  setTimeout(() => setListo(false), 1800);
                })
                .catch(() => undefined);
            }}
            className="flex shrink-0 items-center gap-1 rounded-md border border-borde px-2 py-1 text-xs font-semibold transition hover:bg-slate-50"
            aria-label={`${copiar}: ${campo}`}
          >
            {listo ? (
              <>
                <Check className="h-3.5 w-3.5 text-precio-600" aria-hidden />
                {copiado}
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden />
                {copiar}
              </>
            )}
          </button>
        )}
      </div>
      {nota ? <p className="mt-1 text-xs text-tinta-suave">{nota}</p> : null}
    </div>
  );
}
