"use client";

import { PackageCheck, PackageX } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { recibirDesdeBodega } from "@/lib/casillero/bodega-acciones";

import { AsignarHuerfano } from "./asignar-huerfano";

function Boton({ texto, enviando }: { texto: string; enviando: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="boton-principal w-full" disabled={pending}>
      {pending ? enviando : texto}
    </button>
  );
}

/**
 * ══ LA PANTALLA DE RECEPCIÓN ══
 *
 * El operario tiene la caja en la mano y treinta segundos. Todo lo que se
 * pueda decidir solo, se decide solo; lo que no, se le enseña con los
 * candidatos y su motivo, para que elija sin salir de aquí.
 *
 * El campo de la guía se enfoca solo y el formulario se limpia al terminar:
 * la siguiente caja ya viene por la cinta.
 */
export function RecepcionBodega({
  textos,
}: {
  textos: Record<string, string>;
}) {
  const [estado, accion] = useActionState(recibirDesdeBodega, null);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <form action={accion} key={estado?.wr ?? "nuevo"} className="space-y-4">
        <label className="block">
          <span className="text-sm font-semibold">{textos.tracking}</span>
          <input
            name="tracking"
            autoFocus
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-borde px-3 py-2 font-mono text-lg"
            placeholder="1Z999AA10123456784"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">{textos.textoOcr}</span>
          <textarea
            name="textoOcr"
            rows={3}
            className="mt-1 w-full rounded-lg border border-borde px-3 py-2 font-mono text-sm"
            placeholder={textos.textoOcrPlaceholder}
          />
          <span className="mt-1 block text-xs text-tinta-suave">
            {textos.textoOcrAyuda}
          </span>
        </label>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="block">
            <span className="text-xs font-semibold">{textos.peso}</span>
            <input
              name="pesoLb"
              inputMode="decimal"
              className="mt-1 w-full rounded-lg border border-borde px-2 py-1.5"
            />
          </label>
          {(["largoIn", "anchoIn", "altoIn"] as const).map((campo) => (
            <label key={campo} className="block">
              <span className="text-xs font-semibold">{textos[campo]}</span>
              <input
                name={campo}
                inputMode="decimal"
                className="mt-1 w-full rounded-lg border border-borde px-2 py-1.5"
              />
            </label>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold">{textos.remitente}</span>
            <input
              name="remitente"
              className="mt-1 w-full rounded-lg border border-borde px-2 py-1.5"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold">{textos.ubicacion}</span>
            <input
              name="ubicacion"
              className="mt-1 w-full rounded-lg border border-borde px-2 py-1.5"
              placeholder="A-12"
            />
          </label>
        </div>

        <Boton texto={textos.recibir} enviando={textos.recibiendo} />
      </form>

      <aside className="h-fit rounded-xl border border-borde bg-white p-5">
        {!estado ? (
          <p className="text-sm text-tinta-suave">{textos.esperando}</p>
        ) : estado.error ? (
          <p className="text-sm font-semibold text-red-700">{textos.error}</p>
        ) : (
          <>
            <p className="font-mono text-lg font-bold">{estado.wr}</p>
            {estado.asignado ? (
              <p className="mt-2 flex items-center gap-2 rounded-lg bg-precio-600/10 p-3 text-sm font-semibold">
                <PackageCheck className="h-5 w-5 text-precio-600" aria-hidden />
                {textos.asignado} {estado.codigo}
              </p>
            ) : (
              <>
                {/* HUÉRFANO, y se dice claro: es la cola que hay que vaciar
                    todos los días. Con candidatos, se eligen aquí mismo. */}
                <p className="mt-2 flex items-center gap-2 rounded-lg bg-carga-500/10 p-3 text-sm font-semibold">
                  <PackageX className="h-5 w-5 text-carga-600" aria-hidden />
                  {textos.huerfano}
                </p>
                {estado.candidatos && estado.candidatos.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {estado.candidatos.map((c) => (
                      <li
                        key={c.casilleroId}
                        className="rounded-lg border border-borde p-2 text-sm"
                      >
                        <p className="font-mono font-semibold">{c.codigo}</p>
                        <p className="text-xs text-tinta-suave">{c.motivo}</p>
                        <p className="text-xs font-semibold">{c.score}</p>
                        {/* La persona confirma con un clic lo que el sistema
                            no se atrevió a hacer solo. */}
                        {c.codigo && estado.paqueteId ? (
                          <div className="mt-2">
                            <AsignarHuerfano
                              paqueteId={estado.paqueteId}
                              codigoFijo={c.codigo}
                              motivo={`candidato · ${c.motivo}`}
                              textos={textos}
                            />
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-tinta-suave">
                    {textos.sinCandidatos}
                  </p>
                )}
              </>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
