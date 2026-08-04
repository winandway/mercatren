"use client";

import { Building2, Landmark, Loader2, Store, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";

import { pedirRetiro } from "@/lib/retiros/acciones";
import { cn } from "@/lib/utils";

/**
 * El comercio pide su dinero.
 *
 * TRES FORMAS, y cada una pide datos distintos:
 *
 *   - a otro comercio de Mercatren: solo hay que decir a cuál,
 *   - ACH y wire: hacen falta titular, banco, cuenta y ruta, porque alguien
 *     del equipo va a ir al banco con eso en la mano.
 *
 * Los campos que no aplican no se enseñan. Un formulario que pide el número de
 * ruta para una transferencia interna hace dudar de si se está usando bien.
 *
 * EL MÁXIMO LO PONE EL SERVIDOR. Aquí se avisa antes de enviar por comodidad,
 * pero el que manda es `pedirRetiro`, que vuelve a mirar el disponible contra
 * la base. Lo que se comprueba solo en el navegador no está comprobado.
 */

const FORMAS = [
  { valor: "comercio", Icono: Store },
  { valor: "ach", Icono: Landmark },
  { valor: "wire", Icono: Building2 },
] as const;

export function PedirRetiro({
  disponibleCentavos,
  disponibleTexto,
  comercios,
  tiendaId,
  puedeElegirTienda = false,
}: {
  disponibleCentavos: number;
  disponibleTexto: string;
  comercios: { id: string; nombre: string }[];
  tiendaId: string;
  /** El equipo pide en nombre de un comercio; un vendedor, solo el suyo. */
  puedeElegirTienda?: boolean;
}) {
  const t = useTranslations("panel.retiros");
  const [abierto, setAbierto] = useState(false);
  const [forma, setForma] = useState<"comercio" | "ach" | "wire">("ach");
  const [estado, accion, enviando] = useActionState(pedirRetiro, null);
  const monto = useRef<HTMLInputElement>(null);

  // Pedido y aceptado: se recarga la página entera para que los tres números
  // de arriba salgan con el monto ya apartado. Cerrar el formulario a mano
  // aquí sobra: la recarga se lleva por delante todo lo que había en pantalla.
  useEffect(() => {
    if (estado?.ok) window.location.reload();
  }, [estado?.ok]);

  if (disponibleCentavos <= 0) return null;

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="boton-principal gap-2"
      >
        <Wallet className="h-4 w-4" aria-hidden />
        {/* Al equipo no le decimos "mi dinero": no es suyo, lo registra por
            teléfono en nombre del comercio. */}
        {t(puedeElegirTienda ? "pedirPorElComercio" : "pedir")}
      </button>
    );
  }

  const esInterno = forma !== "comercio";

  return (
    <form
      action={accion}
      className="space-y-5 rounded-xl border border-carga-500/30 bg-white p-5 shadow-sm"
    >
      {puedeElegirTienda ? (
        <input type="hidden" name="tiendaId" value={tiendaId} />
      ) : null}

      {/* Cuánto */}
      <div>
        <label htmlFor="monto" className="block text-sm font-medium">
          {t("cuanto")}
        </label>
        <div className="mt-1 flex gap-2">
          <div className="relative flex-1">
            <span
              className="absolute top-1/2 left-3 -translate-y-1/2 text-tinta-suave"
              aria-hidden
            >
              $
            </span>
            <input
              ref={monto}
              id="monto"
              name="monto"
              type="text"
              inputMode="decimal"
              required
              autoComplete="off"
              placeholder="0.00"
              // 16px como mínimo: por debajo, el iPhone hace zoom al tocar.
              className="w-full rounded-lg border border-slate-300 py-3 pr-3 pl-7 text-base tabular-nums outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30 sm:py-2.5 sm:text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (monto.current) {
                monto.current.value = (disponibleCentavos / 100).toFixed(2);
              }
            }}
            className="shrink-0 rounded-lg border border-slate-300 px-3 text-sm font-medium whitespace-nowrap transition-colors hover:bg-slate-50"
          >
            {t("todo")}
          </button>
        </div>
        <p className="mt-1 text-xs text-tinta-suave">
          {t("cuantoAyuda", { monto: disponibleTexto })}
        </p>
      </div>

      {/* Cómo */}
      <fieldset>
        <legend className="text-sm font-medium">{t("comoLoQuieres")}</legend>
        <div className="mt-2 space-y-2">
          {FORMAS.map(({ valor, Icono }) => {
            // Sin otro comercio activo, mandar dinero "a otro comercio" no
            // lleva a ninguna parte: se esconde en vez de fallar al enviar.
            if (valor === "comercio" && comercios.length === 0) return null;

            return (
              <label
                key={valor}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                  forma === valor
                    ? "border-carga-500 bg-carga-500/5"
                    : "border-slate-200 hover:bg-slate-50",
                )}
              >
                <input
                  type="radio"
                  name="forma"
                  value={valor}
                  checked={forma === valor}
                  onChange={() => setForma(valor)}
                  className="mt-1 accent-carga-500"
                />
                <Icono
                  className="mt-0.5 h-4 w-4 shrink-0 text-tinta-suave"
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {t(`formas.${valor}`)}
                  </span>
                  <span className="block text-xs text-tinta-suave">
                    {t(`formas.${valor}Ayuda`)}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* A dónde */}
      {forma === "comercio" ? (
        <div>
          <label
            htmlFor="destinoTiendaId"
            className="block text-sm font-medium"
          >
            {t("aQuienComercio")}
          </label>
          <select
            id="destinoTiendaId"
            name="destinoTiendaId"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-base outline-none focus:border-carga-500 sm:py-2.5 sm:text-sm"
          >
            <option value="">{t("eligeComercio")}</option>
            {comercios.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {esInterno ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              { nombre: "titular", auto: "name" },
              { nombre: "banco", auto: "organization" },
              { nombre: "cuenta", auto: "off" },
              { nombre: "ruta", auto: "off" },
            ] as const
          ).map(({ nombre, auto }) => (
            <div key={nombre}>
              <label htmlFor={nombre} className="block text-sm font-medium">
                {t(nombre)}
              </label>
              <input
                id={nombre}
                name={nombre}
                type="text"
                required
                autoComplete={auto}
                inputMode={
                  nombre === "cuenta" || nombre === "ruta"
                    ? "numeric"
                    : undefined
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-base outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30 sm:py-2.5 sm:text-sm"
              />
            </div>
          ))}
          <p className="text-xs text-tinta-suave sm:col-span-2">
            {t("soloEstadosUnidos")}
          </p>
        </div>
      ) : null}

      <div>
        <label htmlFor="nota" className="block text-sm font-medium">
          {t("nota")}
          <span className="text-tinta-suave"> · {t("notaOpcional")}</span>
        </label>
        <textarea
          id="nota"
          name="nota"
          rows={2}
          maxLength={300}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-base outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30 sm:py-2.5 sm:text-sm"
        />
      </div>

      {estado && !estado.ok ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {estado.mensaje}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={enviando}
          className={cn("boton-principal gap-2", enviando && "opacity-60")}
        >
          {enviando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          {enviando ? t("enviando") : t("enviar")}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-tinta-suave transition-colors hover:bg-slate-100"
        >
          {t("cancelar")}
        </button>
      </div>

      <p className="text-xs text-tinta-suave">{t("avisoManual")}</p>
    </form>
  );
}
