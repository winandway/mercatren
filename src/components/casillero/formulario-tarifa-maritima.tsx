"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { guardarTarifaMaritima } from "@/lib/casillero/tarifas";

export type TarifaMaritimaFila = {
  pais: string;
  tarifaPieCentavos: number;
  minimoPies: number;
  minimoCobroCentavos: number;
  seguroPuntosBase: number;
  seguroDesdeCentavos: number;
  impuestoIncluido: boolean;
  activa: boolean;
  nota: string | null;
};

const dolares = (c: number) => (c / 100).toFixed(2);

function Boton({ texto, enviando }: { texto: string; enviando: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="boton-principal" disabled={pending}>
      {pending ? enviando : texto}
    </button>
  );
}

/**
 * La tarifa MARÍTIMA de un país: por pie cúbico, el peso no aplica (Richard,
 * 16 sep 2026). Misma forma que la aérea: dólares y por ciento, guardado en
 * centavos y puntos base.
 */
export function FormularioTarifaMaritima({
  tarifa,
  textos,
}: {
  tarifa?: TarifaMaritimaFila;
  textos: Record<string, string>;
}) {
  const [estado, accion] = useActionState(guardarTarifaMaritima, null);
  const campo = (
    nombre: string,
    etiqueta: string,
    ayuda: string,
    valor: string | number,
    extra?: { prefijo?: string; sufijo?: string },
  ) => (
    <label className="block">
      <span className="text-sm font-semibold">{etiqueta}</span>
      <span className="mt-1 flex items-center gap-1">
        {extra?.prefijo ? (
          <span className="text-sm text-tinta-suave">{extra.prefijo}</span>
        ) : null}
        <input
          name={nombre}
          defaultValue={valor}
          inputMode="decimal"
          className="w-full rounded-lg border border-borde px-2 py-1.5 text-sm"
        />
        {extra?.sufijo ? (
          <span className="text-sm text-tinta-suave">{extra.sufijo}</span>
        ) : null}
      </span>
      <span className="mt-1 block text-xs text-tinta-suave">{ayuda}</span>
    </label>
  );

  return (
    <form
      action={accion}
      className="space-y-4 rounded-xl border border-borde bg-white p-5"
    >
      {estado?.ok ? (
        <p className="rounded-lg bg-precio-600/10 px-3 py-2 text-sm font-semibold">
          {textos.guardado}
        </p>
      ) : null}
      {estado?.error ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800"
        >
          {textos[`error_${estado.error}`] ?? textos.error_fallo}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campo("pais", textos.pais, textos.paisAyuda, tarifa?.pais ?? "")}
        {campo(
          "tarifaPie",
          textos.tarifaPie,
          textos.tarifaPieAyuda,
          tarifa ? dolares(tarifa.tarifaPieCentavos) : "",
          { prefijo: "$", sufijo: "/ft³" },
        )}
        {campo(
          "minimoPies",
          textos.minimoPies,
          textos.minimoPiesAyuda,
          tarifa?.minimoPies ?? 1,
          { sufijo: "ft³" },
        )}
        {campo(
          "minimoCobro",
          textos.minimoCobro,
          textos.minimoCobroAyuda,
          tarifa ? dolares(tarifa.minimoCobroCentavos) : "",
          { prefijo: "$" },
        )}
        {campo(
          "seguroPorciento",
          textos.seguro,
          textos.seguroAyuda,
          tarifa ? (tarifa.seguroPuntosBase / 100).toFixed(2) : "",
          { sufijo: "%" },
        )}
        {campo(
          "seguroDesde",
          textos.seguroDesde,
          textos.seguroDesdeAyuda,
          tarifa ? dolares(tarifa.seguroDesdeCentavos) : "",
          { prefijo: "$" },
        )}
      </div>
      <label className="block">
        <span className="text-sm font-semibold">{textos.nota}</span>
        <input
          name="nota"
          defaultValue={tarifa?.nota ?? ""}
          className="mt-1 w-full rounded-lg border border-borde px-2 py-1.5 text-sm"
          placeholder={textos.notaPlaceholder}
        />
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input
          name="impuestoIncluido"
          type="checkbox"
          defaultChecked={tarifa?.impuestoIncluido ?? false}
          className="mt-1"
        />
        <span>
          <strong>{textos.impuesto}</strong> {textos.impuestoAyuda}
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input
          name="activa"
          type="checkbox"
          defaultChecked={tarifa?.activa ?? false}
          className="mt-1"
        />
        <span>
          <strong>{textos.activa}</strong> {textos.activaAyuda}
        </span>
      </label>
      <Boton texto={textos.guardar} enviando={textos.guardando} />
    </form>
  );
}
