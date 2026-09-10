"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { avisarCompra } from "@/lib/casillero/prealerta";

function Boton({ texto, enviando }: { texto: string; enviando: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="boton-principal w-full" disabled={pending}>
      {pending ? enviando : texto}
    </button>
  );
}

/**
 * El aviso de una compra. Pide poco a propósito: la guía es opcional
 * porque una prealerta sin guía todavía cruza por comercio y remitente, y
 * exigir un dato que el cliente no tiene a mano es una prealerta que no se
 * escribe — y sin prealerta, el paquete depende de que el lector saque el
 * código de una etiqueta que la tienda pudo recortar.
 */
export function FormularioPrealerta({
  textos,
}: {
  textos: Record<string, string>;
}) {
  const [estado, accion] = useActionState(avisarCompra, null);

  if (estado?.ok) {
    return (
      <p className="rounded-lg border border-precio-600/40 bg-precio-600/10 px-3 py-3 text-sm font-semibold">
        {textos.listo}
      </p>
    );
  }

  const error = estado?.error
    ? (textos[`error_${estado.error}`] ?? textos.error_fallo)
    : null;

  return (
    <form action={accion} className="space-y-4">
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800"
        >
          {error}
        </p>
      ) : null}

      <label className="block">
        <span className="text-sm font-semibold">{textos.descripcion}</span>
        <input
          name="descripcion"
          required
          className="mt-1 w-full rounded-lg border border-borde px-3 py-2"
          placeholder={textos.descripcionPlaceholder}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold">{textos.comercio}</span>
          <input
            name="comercio"
            className="mt-1 w-full rounded-lg border border-borde px-3 py-2"
            placeholder="Amazon"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">{textos.cantidad}</span>
          <input
            name="cantidad"
            type="number"
            min={1}
            defaultValue={1}
            className="mt-1 w-full rounded-lg border border-borde px-3 py-2"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-semibold">{textos.tracking}</span>
        <input
          name="tracking"
          className="mt-1 w-full rounded-lg border border-borde px-3 py-2 font-mono"
          placeholder="1Z999AA10123456784"
        />
        <span className="mt-1 block text-xs text-tinta-suave">
          {textos.trackingAyuda}
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-semibold">{textos.valor}</span>
        <input
          name="valor"
          required
          inputMode="decimal"
          className="mt-1 w-full rounded-lg border border-borde px-3 py-2"
          placeholder="49.99"
        />
        {/* SIN VALOR DECLARADO EL PAQUETE NO SALE DE LA BODEGA. Lo exige la
            aduana, no el sistema; y subdeclarar es una multa que pagamos
            nosotros. Se pide aquí, cuando el cliente tiene la factura
            delante, y no el día del despacho. */}
        <span className="mt-1 block text-xs text-tinta-suave">
          {textos.valorAyuda}
        </span>
      </label>

      <Boton texto={textos.enviar} enviando={textos.enviando} />
    </form>
  );
}
