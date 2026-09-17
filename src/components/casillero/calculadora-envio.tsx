"use client";

import { Calculator, Plane, Ship } from "lucide-react";
import { useActionState, useState } from "react";
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

export type PaisDeCalculadora = {
  codigo: string;
  nombre: string;
  aereo: boolean;
  maritimo: boolean;
  seguroPorciento: number;
  salida?: string;
};

/**
 * La calculadora de envío. Avión o barco (el barco cobra por pie cúbico, sin
 * peso), libras o kilos, y el seguro como casilla opcional. El desglose sale
 * entero y dice si los impuestos del destino van incluidos.
 */
export function CalculadoraEnvio({
  paises,
  idioma,
  textos,
}: {
  paises: PaisDeCalculadora[];
  idioma: Idioma;
  textos: Record<string, string>;
}) {
  const [r, accion] = useActionState<ResultadoCalculadora | null, FormData>(
    cotizarPublico,
    null,
  );
  const [pais, setPais] = useState(paises[0]?.codigo ?? "");
  const [modo, setModo] = useState<"aereo" | "maritimo">("aereo");
  const elegidoAhora = paises.find((p) => p.codigo === pais);
  const modoReal =
    modo === "maritimo" && elegidoAhora?.maritimo
      ? "maritimo"
      : modo === "aereo" && elegidoAhora?.aereo
        ? "aereo"
        : elegidoAhora?.aereo
          ? "aereo"
          : "maritimo";
  const elegido = r?.ok ? paises.find((p) => p.codigo === r.pais) : undefined;
  const campo = "mt-1 w-full rounded-lg border border-borde px-3 py-2 text-sm";

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
            value={pais}
            onChange={(e) => setPais(e.target.value)}
            className={campo}
          >
            {paises.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>

        {/* AVIÓN O BARCO (Richard, 16 sep 2026). Solo se ofrece el barco donde
            hay tarifa marítima; y en barco el peso no aplica. */}
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-semibold">{textos.modo}</legend>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {(["aereo", "maritimo"] as const).map((m) => {
              const disponible =
                m === "aereo" ? elegidoAhora?.aereo : elegidoAhora?.maritimo;
              const activo = modoReal === m;
              return (
                <label
                  key={m}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                    activo
                      ? "text-carga-700 border-carga-500 bg-carga-500/10"
                      : "border-borde"
                  } ${disponible ? "" : "cursor-not-allowed opacity-40"}`}
                >
                  <input
                    type="radio"
                    name="modo"
                    value={m}
                    checked={activo}
                    disabled={!disponible}
                    onChange={() => setModo(m)}
                    className="sr-only"
                  />
                  {m === "aereo" ? (
                    <Plane className="h-4 w-4" aria-hidden />
                  ) : (
                    <Ship className="h-4 w-4" aria-hidden />
                  )}
                  {m === "aereo" ? textos.aereo : textos.maritimo}
                </label>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-tinta-suave">
            {modoReal === "maritimo" ? textos.maritimoAyuda : textos.aereoAyuda}
          </p>
        </fieldset>

        {modoReal === "aereo" ? (
          <label className="block">
            <span className="text-sm font-semibold">{textos.peso}</span>
            <span className="mt-1 flex gap-2">
              <input
                name="peso"
                inputMode="decimal"
                required
                placeholder="3"
                className="w-full rounded-lg border border-borde px-3 py-2 text-sm"
              />
              {/* LIBRAS O KILOS: la tienda dice «2 kg» y la etiqueta «4.4 lb». */}
              <select
                name="unidad"
                defaultValue="lb"
                aria-label={textos.unidad}
                className="rounded-lg border border-borde px-2 py-2 text-sm"
              >
                <option value="lb">{textos.libras}</option>
                <option value="kg">{textos.kilos}</option>
              </select>
            </span>
            <span className="mt-1 block text-xs text-tinta-suave">
              {textos.pesoAyuda}
            </span>
          </label>
        ) : (
          <input type="hidden" name="peso" value="0" />
        )}

        <label
          className={`block ${modoReal === "maritimo" ? "sm:col-span-2" : ""}`}
        >
          <span className="text-sm font-semibold">{textos.valor}</span>
          <input
            name="valorUsd"
            inputMode="decimal"
            placeholder="0"
            className={campo}
          />
          <span className="mt-1 block text-xs text-tinta-suave">
            {textos.valorAyuda}
          </span>
        </label>

        <div className="sm:col-span-2">
          <span className="text-sm font-semibold">
            {modoReal === "maritimo" ? textos.medidasBarco : textos.medidas}
          </span>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {(["largoIn", "anchoIn", "altoIn"] as const).map((n) => (
              <input
                key={n}
                name={n}
                inputMode="decimal"
                required={modoReal === "maritimo"}
                placeholder={textos[n]}
                aria-label={textos[n]}
                className="w-full rounded-lg border border-borde px-3 py-2 text-sm"
              />
            ))}
          </div>
          <span className="mt-1 block text-xs text-tinta-suave">
            {modoReal === "maritimo"
              ? textos.medidasBarcoAyuda
              : textos.medidasAyuda}
          </span>
        </div>

        {/* EL SEGURO ES OPCIONAL (el agente: «no es obligatorio»). Se ofrece
            solo si el país tiene seguro configurado. */}
        {elegidoAhora && elegidoAhora.seguroPorciento > 0 ? (
          <label className="flex items-start gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="conSeguro" className="mt-1" />
            <span>
              <strong>
                {textos.seguroCasilla.replace(
                  "{porciento}",
                  String(elegidoAhora.seguroPorciento),
                )}
              </strong>{" "}
              <span className="text-tinta-suave">{textos.seguroAyuda}</span>
            </span>
          </label>
        ) : null}

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
            <span className="font-semibold">
              {r.modo === "maritimo" ? textos.totalBarco : textos.total}
            </span>
            <span className="text-2xl font-bold tabular-nums">
              {formatearPrecio(r.cotizacion.totalCentavos, idioma, "USD")}
            </span>
          </div>
          <ul className="mt-2 space-y-0.5 text-sm text-tinta-suave">
            <li className="flex justify-between gap-3">
              <span>
                {r.modo === "maritimo"
                  ? textos.piesFacturables
                  : textos.pesoFacturable}
              </span>
              <span className="tabular-nums">
                {r.modo === "maritimo"
                  ? `${r.cotizacion.piesFacturables} ft³`
                  : `${r.cotizacion.pesoFacturableLb} lb`}
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
            {r.modo === "aereo" && elegido?.salida ? ` ${elegido.salida}` : ""}
          </p>
          <p className="mt-1 text-xs text-tinta-suave">{textos.estimado}</p>
        </div>
      ) : null}
    </div>
  );
}
