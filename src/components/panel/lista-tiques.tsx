"use client";

import { Receipt, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Tique } from "@/components/panel/tique";
import { useRouter } from "@/i18n/navigation";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaCorta } from "@/lib/fechas";
import type { PagoVista } from "@/lib/zelle/vista";

/**
 * Las ventas ya cobradas y entregadas, como tiques.
 *
 * REGLA DE NEGOCIO: cada pago aprobado es una venta cerrada. Ya se cobró y ya
 * se entregó — no se espera a que el cliente pase por el negocio —, así que
 * aquí no hay nada "por entregar": todo lo que sale en esta lista está hecho.
 *
 * El buscador va por el servidor (no filtra solo lo que se ve en pantalla),
 * porque son cientos de movimientos y filtrar únicamente la página actual
 * daría la impresión de que algo no existe cuando en realidad está en la
 * página siguiente.
 */
export function ListaTiques({
  tiques,
  busqueda,
}: {
  tiques: { pago: PagoVista; comercio: string | null }[];
  busqueda: string;
}) {
  const t = useTranslations("panel.tique");
  const idioma = useLocale() as Idioma;
  const router = useRouter();
  const parametros = useSearchParams();
  const [abierto, setAbierto] = useState<number | null>(null);
  const [texto, setTexto] = useState(busqueda);

  function buscar(termino: string) {
    // Se conserva lo demás de la dirección (el comercio que mira el equipo) y
    // se vuelve a la primera página: buscar y quedarse en la página 7 deja la
    // sensación de que no hay resultados.
    const destino = new URLSearchParams(parametros);
    if (termino) destino.set("q", termino);
    else destino.delete("q");
    destino.delete("pagina");
    router.push(`/panel/ordenes${destino.size ? `?${destino}` : ""}`);
  }

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          buscar(texto.trim());
        }}
        className="relative"
      >
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-tinta-suave"
          aria-hidden
        />
        <input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={t("buscar")}
          aria-label={t("buscar")}
          className="w-full rounded-lg border border-borde bg-white py-2.5 pr-3 pl-9 text-sm outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30"
        />
      </form>

      {tiques.length === 0 ? (
        <div className="rounded-xl border border-dashed border-borde bg-white px-6 py-16 text-center">
          <Receipt className="mx-auto h-10 w-10 text-tinta-suave" aria-hidden />
          <p className="mt-4 text-sm text-tinta-suave">
            {busqueda ? t("sinResultados") : t("vacio")}
          </p>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {tiques.map(({ pago, comercio }, i) => (
            <li key={pago.id}>
              <button
                type="button"
                onClick={() => setAbierto(i)}
                className="w-full rounded-xl border border-borde bg-white p-4 text-left transition-colors hover:border-carga-500"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-mono text-xs text-tinta-suave">
                    {pago.codigoConfirmacion ?? "—"}
                  </span>
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-900">
                    {t("entregado")}
                  </span>
                </div>

                <p className="mt-2 text-xl font-extrabold tabular-nums">
                  {formatearPrecio(pago.montoCentavos, idioma, pago.moneda)}
                </p>

                <p className="mt-1 truncate text-xs text-tinta-suave">
                  {[
                    pago.bancoOrigen,
                    pago.cuentaUltimos4 ? `…${pago.cuentaUltimos4}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || t("sinBanco")}
                </p>

                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-tinta-suave">
                  {pago.fechaTransaccion ? (
                    <span>{fechaCorta(pago.fechaTransaccion, idioma)}</span>
                  ) : null}
                  {comercio ? (
                    <span className="truncate">{comercio}</span>
                  ) : null}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {abierto !== null && tiques[abierto] ? (
        <Tique
          pago={tiques[abierto].pago}
          comercio={tiques[abierto].comercio}
          onCerrar={() => setAbierto(null)}
        />
      ) : null}
    </>
  );
}
