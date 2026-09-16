"use client";

import { Calculator } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  cotizarPublico,
  type ResultadoCalculadora,
} from "@/lib/casillero/calculadora-publica";
import { formatearPrecio, type Idioma } from "@/lib/dinero";

function Boton({ texto, enviando }: { texto: string; enviando: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="boton-principal w-full" disabled={pending}>
      {pending ? enviando : texto}
    </button>
  );
}

/**
 * La calculadora de envío de la página del casillero. Solo enseña los
 * países con tarifa encendida; el desglose sale entero (flete, seguro,
 * ajuste al mínimo) y dice si los impuestos del destino van incluidos.
 */
export function CalculadoraEnvio({
  paises,
  idioma,
  textos,
}: {
  paises: Array<{ codigo: string; nombre: string; salida?: string }>;
  idioma: Idioma;
  textos: Record<string, string>;
}) {
  const [r, accion] = useActionState<ResultadoCalculadora | null, FormData>(
    cotizarPublico,
    null,
  );
  const elegido = r?.ok ? paises.find((p) => p.codigo === r.pais) : undefined;

  return (
    <div className="rounded-2xl border border-borde bg-white p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <Calculator className="h-5 w-5 text-carga-600" aria-hidden />
        {textos.titulo}
      </h2>
      <p className="mt-1 text-sm text-tinta-suave">{textos.bajada}</p>

      <form action={accion} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold">{textos.paisEtiqueta}</span>
          <select
            name="pais"
            defaultValue={paises[0]?.codigo}
            className="mt-1 w-full rounded-lg border border-borde px-3 py-2 text-sm"
          >
            {paises.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">{textos.peso}</span>
          <input
            name="pesoLb"
            inputMode="decimal"
            required
            placeholder="3"
            className="mt-1 w-full rounded-lg border border-borde px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-xs text-tinta-suave">
            {textos.pesoAyuda}
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">{textos.valor}</span>
          <input
            name="valorUsd"
            inputMode="decimal"
            placeholder="0"
            className="mt-1 w-full rounded-lg border border-borde px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-xs text-tinta-suave">
            {textos.valorAyuda}
          </span>
        </label>
        <div className="sm:col-span-2">
          <span className="text-sm font-semibold">{textos.medidas}</span>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {(["largoIn", "anchoIn", "altoIn"] as const).map((n) => (
              <input
                key={n}
                name={n}
                inputMode="decimal"
                placeholder={textos[n]}
                aria-label={textos[n]}
                className="w-full rounded-lg border border-borde px-3 py-2 text-sm"
              />
            ))}
          </div>
          <span className="mt-1 block text-xs text-tinta-suave">
            {textos.medidasAyuda}
          </span>
        </div>
        <div className="sm:col-span-2">
          <Boton texto={textos.calcular} enviando={textos.calculando} />
        </div>
      </form>

      {r && !r.ok ? (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800"
        >
          {textos[`error_${r.error}`] ?? textos.error_entrada}
        </p>
      ) : null}

      {r?.ok ? (
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-semibold">{textos.total}</span>
            <span className="text-2xl font-bold tabular-nums">
              {formatearPrecio(r.cotizacion.totalCentavos, idioma, "USD")}
            </span>
          </div>
          <ul className="mt-2 space-y-0.5 text-sm text-tinta-suave">
            <li className="flex justify-between gap-3">
              <span>{textos.pesoFacturable}</span>
              <span className="tabular-nums">
                {r.cotizacion.pesoFacturableLb} lb
              </span>
            </li>
            {r.cotizacion.renglones.map((x) => (
              <li key={x.concepto} className="flex justify-between gap-3">
                <span>{textos[`renglon_${x.concepto}`] ?? x.concepto}</span>
                <span className="tabular-nums">
                  {formatearPrecio(x.centavos, idioma, "USD")}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-tinta-suave">
            {r.cotizacion.impuestoIncluido
              ? textos.impuestoIncluido
              : textos.impuestoAparte}
            {elegido?.salida ? ` ${elegido.salida}` : ""}
          </p>
          <p className="mt-1 text-xs text-tinta-suave">{textos.estimado}</p>
        </div>
      ) : null}
    </div>
  );
}
