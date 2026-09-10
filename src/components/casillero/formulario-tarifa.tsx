"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { guardarTarifa } from "@/lib/casillero/tarifas";

export type TarifaFila = {
  pais: string;
  tarifaLibraCentavos: number;
  minimoLb: number;
  minimoCobroCentavos: number;
  despachoCentavos: number;
  seguroPuntosBase: number;
  seguroDesdeCentavos: number;
  divisorVolumetrico: number;
  diasAlmacenajeGratis: number;
  almacenajeDiaCentavos: number;
  impuestoIncluido: boolean;
  activa: boolean;
  nota: string | null;
};

const dolares = (centavos: number) => (centavos / 100).toFixed(2);

function Boton({ texto, enviando }: { texto: string; enviando: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="boton-principal" disabled={pending}>
      {pending ? enviando : texto}
    </button>
  );
}

/**
 * ══ LOS CAMPOS QUE LLENA RICHARD ══
 *
 * Cada uno lleva escrito **de dónde sale ese número**, porque hay que
 * preguntárselo al agente de carga y no inventarlo. La estructura es la que
 * usa de verdad la industria de casilleros de Miami: peso facturable,
 * tarifa por libra, mínimo, despacho, seguro y almacenaje.
 *
 * Se escribe en dólares y por ciento, que es como los da un agente; por
 * dentro se guarda en centavos y puntos base enteros, que es como este
 * proyecto guarda el dinero.
 */
export function FormularioTarifa({
  tarifa,
  textos,
}: {
  tarifa?: TarifaFila;
  textos: Record<string, string>;
}) {
  const [estado, accion] = useActionState(guardarTarifa, null);

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
          "tarifaLibra",
          textos.tarifaLibra,
          textos.tarifaLibraAyuda,
          tarifa ? dolares(tarifa.tarifaLibraCentavos) : "",
          { prefijo: "$", sufijo: "/lb" },
        )}
        {campo(
          "minimoLb",
          textos.minimoLb,
          textos.minimoLbAyuda,
          tarifa?.minimoLb ?? 1,
          { sufijo: "lb" },
        )}
        {campo(
          "minimoCobro",
          textos.minimoCobro,
          textos.minimoCobroAyuda,
          tarifa ? dolares(tarifa.minimoCobroCentavos) : "",
          { prefijo: "$" },
        )}
        {campo(
          "despacho",
          textos.despacho,
          textos.despachoAyuda,
          tarifa ? dolares(tarifa.despachoCentavos) : "",
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
        {campo(
          "divisor",
          textos.divisor,
          textos.divisorAyuda,
          tarifa?.divisorVolumetrico ?? 166,
        )}
        {campo(
          "diasGratis",
          textos.diasGratis,
          textos.diasGratisAyuda,
          tarifa?.diasAlmacenajeGratis ?? 30,
        )}
        {campo(
          "almacenajeDia",
          textos.almacenajeDia,
          textos.almacenajeDiaAyuda,
          tarifa ? dolares(tarifa.almacenajeDiaCentavos) : "",
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
        <span className="mt-1 block text-xs text-tinta-suave">
          {textos.notaAyuda}
        </span>
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

      {/* LA LLAVE. Mientras esté apagada, la calculadora no cotiza a ese
          país y el cliente ve «todavía no tenemos tarifa» en vez de un
          precio inventado. */}
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
