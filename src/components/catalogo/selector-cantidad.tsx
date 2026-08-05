"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * EL SELECTOR DE CANTIDAD, con el patrón de Amazon: 1 al 9 y "10+".
 *
 * Antes el desplegable llegaba hasta 10 y ahí moría. Con 766 codos en el
 * depósito, un constructor que quería cien no tenía forma de pedirlos — y
 * esto es ferretería: comprar al mayor es lo NORMAL, no la excepción.
 *
 * Un desplegable con 766 opciones tampoco es la respuesta: nadie baja una
 * lista de setecientas filas. Lo que hace Amazon, y por algo: el desplegable
 * enseña 1–9 y una opción "10+"; al tocarla se convierte en una casilla
 * donde se ESCRIBE la cantidad. Poca fricción para el que lleva dos, y
 * libertad total para el que lleva cien.
 *
 * EL TECHO ES LA EXISTENCIA REAL. Si hay 766 y escriben 800, la casilla
 * avisa "Máx. 766" y al salir se acomoda sola. Y esto es solo la primera
 * barrera: `crearPedido()` vuelve a comprobar contra la base al confirmar,
 * así que manipular el navegador no consigue nada.
 *
 * Es UNA pieza para la ficha y para el carrito (`compacto`): si mañana el
 * tope cambia, cambia en un solo lugar.
 */
export function SelectorCantidad({
  valor,
  maximo,
  onCambiar,
  etiqueta,
  compacto = false,
}: {
  valor: number;
  /** Existencias disponibles; null = no se controlan (tope de cortesía). */
  maximo: number | null;
  onCambiar: (cantidad: number) => void;
  /** Nombre accesible del control ("Cantidad"). */
  etiqueta: string;
  /** Versión chica para las filas del carrito. */
  compacto?: boolean;
}) {
  const t = useTranslations("catalogo.cantidad");

  // Sin control de existencias no hay tope real; 999 es cortesía para que
  // nadie escriba un millón por jugar. Fraccionadas (13.5 kg) se bajan al
  // entero: por ahora se compran unidades enteras.
  const max = Math.max(1, Math.floor(maximo ?? 999));

  /**
   * Quien ya pidió 10 o más sigue viendo la casilla, no el desplegable:
   * volver a la lista sería perder lo que escribió.
   */
  const [escribiendo, setEscribiendo] = useState(valor >= 10);
  const [texto, setTexto] = useState(String(valor));
  const casilla = useRef<HTMLInputElement>(null);

  // Al pasar a la casilla, el foco va directo y con el número seleccionado:
  // se teclea la cantidad encima, sin borrar primero.
  useEffect(() => {
    if (escribiendo) casilla.current?.select();
  }, [escribiendo]);

  const escrito = Math.floor(Number(texto));
  const seExcedio = Number.isFinite(escrito) && escrito > max;

  function alEscribir(nuevo: string) {
    setTexto(nuevo);
    // Se avisa al carrito en caliente (acotado al tope), para que el botón
    // de agregar use lo escrito aunque no haya salido de la casilla.
    const n = Math.floor(Number(nuevo));
    if (Number.isFinite(n) && n >= 1) onCambiar(Math.min(n, max));
  }

  function alSalir() {
    const n = Math.floor(Number(texto));
    const final = !Number.isFinite(n) || n < 1 ? 1 : Math.min(n, max);
    setTexto(String(final));
    onCambiar(final);
  }

  const estiloCaja = cn(
    "rounded-lg border border-borde bg-white outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30",
    compacto ? "px-2 py-1 text-xs" : "h-11 px-3 text-sm",
  );

  if (escribiendo) {
    return (
      <span
        className={cn(
          "inline-flex items-center",
          compacto ? "gap-1.5" : "gap-2",
        )}
      >
        <input
          ref={casilla}
          type="number"
          inputMode="numeric"
          min={1}
          max={max}
          step={1}
          value={texto}
          onChange={(e) => alEscribir(e.target.value)}
          onBlur={alSalir}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          aria-label={etiqueta}
          className={cn(estiloCaja, compacto ? "w-16" : "w-24")}
        />
        {/* El aviso del tope solo cuando hace falta: escribir 800 con 766 en
            el depósito no puede fallar en silencio. */}
        {seExcedio ? (
          <span
            role="status"
            className={cn(
              "font-medium text-amber-700",
              compacto ? "text-[11px]" : "text-xs",
            )}
          >
            {t("maximo", { n: max })}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <select
      value={valor}
      onChange={(e) => {
        if (e.target.value === "mas") {
          setTexto(String(valor));
          setEscribiendo(true);
          return;
        }
        onCambiar(Number(e.target.value));
      }}
      aria-label={etiqueta}
      className={estiloCaja}
    >
      {Array.from({ length: Math.min(9, max) }, (_, i) => i + 1).map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
      {max >= 10 ? <option value="mas">{t("masDeNueve")}</option> : null}
    </select>
  );
}
