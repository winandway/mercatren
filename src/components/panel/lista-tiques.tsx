"use client";

import { Loader2, Receipt, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Tique } from "@/components/panel/tique";
import { useRouter } from "@/i18n/navigation";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaCorta } from "@/lib/fechas";
import { cn } from "@/lib/utils";
import type { LineaDeVenta } from "@/lib/zelle/lineas";
import type { PagoVista } from "@/lib/zelle/vista";

type Fila = {
  pago: PagoVista;
  comercio: string | null;
  /** Qué se vendió: va al comprobante. */
  lineas?: LineaDeVenta[];
};

/**
 * Las ventas ya cobradas y entregadas, como tiques.
 *
 * OJO: la pantalla le pasa `key={búsqueda}`. Al cambiar el filtro, React
 * monta el componente de nuevo y la lista arranca limpia. Antes se hacía con
 * un efecto que reescribía el estado, y eso encadena renders de más.
 *
 * REGLA DE NEGOCIO: cada pago aprobado es una venta cerrada. Ya se cobró y ya
 * se entregó — no se espera a que el cliente pase por el negocio —, así que
 * aquí no hay nada "por entregar": todo lo que sale en esta lista está hecho.
 *
 * CARGA INFINITA, no páginas. Son 28 páginas de ventas: nadie va a ir
 * pulsando "siguiente" 27 veces. Al llegar al final de lo que se ve, se traen
 * las siguientes solas y se van sumando.
 *
 * El buscador sí va por el servidor y reinicia la lista: filtrar solo lo que
 * está cargado daría la impresión de que algo no existe cuando en realidad
 * está más abajo, sin traer.
 */
export function ListaTiques({
  tiques: primeros,
  busqueda,
  paginas,
}: {
  tiques: Fila[];
  busqueda: string;
  paginas: number;
}) {
  const t = useTranslations("panel.tique");
  const idioma = useLocale() as Idioma;
  const router = useRouter();
  const parametros = useSearchParams();

  const [filas, setFilas] = useState<Fila[]>(primeros);
  const [pagina, setPagina] = useState(1);
  const [trayendo, setTrayendo] = useState(false);
  const [abierto, setAbierto] = useState<number | null>(null);
  const [texto, setTexto] = useState(busqueda);

  const centinela = useRef<HTMLDivElement>(null);

  const hayMas = pagina < paginas;

  const traerMas = useCallback(async () => {
    if (trayendo || !hayMas) return;
    setTrayendo(true);

    try {
      const consulta = new URLSearchParams();
      consulta.set("pagina", String(pagina + 1));
      if (busqueda) consulta.set("q", busqueda);
      const comercio = parametros.get("comercio");
      if (comercio) consulta.set("comercio", comercio);

      const respuesta = await fetch(`/datos/tiques?${consulta}`);
      const datos = (await respuesta.json()) as { tiques: Fila[] };

      if (datos.tiques.length > 0) {
        setFilas((previas) => [...previas, ...datos.tiques]);
        setPagina((p) => p + 1);
      }
    } catch {
      // Si falla la red no se rompe nada: lo que ya está sigue en pantalla y
      // el siguiente desplazamiento vuelve a intentarlo.
    } finally {
      setTrayendo(false);
    }
  }, [trayendo, hayMas, pagina, busqueda, parametros]);

  /**
   * Trae más cuando el final de la lista se acerca.
   *
   * Se mide la posición a mano en vez de usar IntersectionObserver. Es más
   * simple y, sobre todo, no falla: el observador depende de cuál sea el
   * "marco" de la página, y dentro de un panel con su propio desplazamiento —o
   * de una ventana embebida— llega a decir que no ve un elemento que está en
   * pantalla. Aquí no hay nada que interpretar: o el final está a menos de
   * media pantalla, o no lo está.
   *
   * Se adelanta 600px para que la siguiente tanda ya esté cargada cuando la
   * persona llegue abajo, y no vea el salto.
   */
  useEffect(() => {
    if (!hayMas) return;

    const mirar = () => {
      const nodo = centinela.current;
      if (!nodo) return;
      if (nodo.getBoundingClientRect().top < window.innerHeight + 600) {
        void traerMas();
      }
    };

    mirar();
    window.addEventListener("scroll", mirar, { passive: true });
    window.addEventListener("resize", mirar);
    return () => {
      window.removeEventListener("scroll", mirar);
      window.removeEventListener("resize", mirar);
    };
  }, [traerMas, hayMas]);

  function buscar(termino: string) {
    const destino = new URLSearchParams(parametros);
    if (termino) destino.set("q", termino);
    else destino.delete("q");
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

      {filas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-borde bg-white px-6 py-16 text-center">
          <Receipt className="mx-auto h-10 w-10 text-tinta-suave" aria-hidden />
          <p className="mt-4 text-sm text-tinta-suave">
            {busqueda ? t("sinResultados") : t("vacio")}
          </p>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {filas.map(({ pago, comercio }, i) => (
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
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[12px] font-bold text-emerald-900">
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

      {/**
       * El final de la lista. Al acercarse, trae la siguiente tanda sola.
       *
       * También es un botón: si alguien navega con el teclado, o si el
       * desplazamiento no llegara a dispararse, siempre queda la forma de
       * pedirlo a mano. Una lista que no puede avanzar es una lista rota.
       */}
      {hayMas ? (
        <div ref={centinela} className="flex justify-center py-6">
          <button
            type="button"
            onClick={() => void traerMas()}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-tinta-suave transition-colors hover:bg-white hover:text-tinta"
          >
            <Loader2
              className={cn("h-4 w-4", trayendo && "animate-spin")}
              aria-hidden
            />
            {trayendo ? t("trayendoMas") : t("verMas")}
          </button>
        </div>
      ) : filas.length > 0 ? (
        <p className="py-6 text-center text-sm text-tinta-suave">
          {t("esoEsTodo", { n: filas.length })}
        </p>
      ) : null}

      {abierto !== null && filas[abierto] ? (
        <Tique
          pago={filas[abierto].pago}
          comercio={filas[abierto].comercio}
          lineas={filas[abierto].lineas ?? []}
          onCerrar={() => setAbierto(null)}
        />
      ) : null}
    </>
  );
}
