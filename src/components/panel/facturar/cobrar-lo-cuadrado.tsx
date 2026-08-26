"use client";

import { Check, Copy, Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { crearCobroDesdePanel } from "@/lib/cobros/pedir";
import type { MetodoDeCobro } from "@/lib/cobros/reparto";

/**
 * COBRAR LO QUE ACABA DE CUADRAR (26 ago 2026).
 *
 * ══ POR QUÉ EXISTE ══
 *
 * La calculadora terminaba con un texto que decía «puedes crear un enlace de
 * cobro en Cobros → Enlaces de cobro»: o sea, mandaba a otra pantalla a
 * escribir otra vez el monto que acababa de calcular. Palabras del dueño:
 * «yo esperaba que abajo hubiese un botón donde le dijera cobrar, me pidiera
 * el correo del cliente y me generara el link para enviárselo por WhatsApp».
 * Tenía razón — el cálculo sin el cobro es media herramienta.
 *
 * ══ TRES COSAS QUE NO SE TOCAN ══
 *
 * 1. **El monto NO se puede editar aquí.** Es el que acaba de cuadrar; una
 *    casilla editable invita a corregirlo a mano y a romper el cuadre que se
 *    acaba de hacer. Si quiere otro, cambia el objetivo arriba.
 * 2. **El método viaja tal cual se eligió arriba.** Si calculó para cobrar
 *    por transferencia, el enlace no ofrece tarjeta — dejarla abierta le
 *    regala el 2,9% + $0.30 al procesador.
 * 3. **El enlace se VE y se copia, aunque el correo salga.** La mayoría de
 *    estos enlaces se mandan por WhatsApp: obligar a entrar al buzón del
 *    cliente para copiarlo no tiene sentido.
 */
export function CobrarLoCuadrado({
  totalCentavos,
  montoTexto,
  metodo,
  tiendaId,
}: {
  totalCentavos: number;
  /** Ya formateado, para el botón: «Cobrar $2,860.71». */
  montoTexto: string;
  metodo: MetodoDeCobro;
  /** De qué comercio es el cobro. `crearCobroDesdePanel` espera el ID. */
  tiendaId: string | null;
}) {
  const t = useTranslations("panel.calculadora");
  const [abierto, setAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<{
    url: string;
    referencia: string;
  } | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* Sin portapapeles el enlace se ve igual y se selecciona a mano. */
    }
  }

  if (hecho) {
    const paraWhatsApp = encodeURIComponent(
      t("mensajeWhatsApp", { referencia: hecho.referencia, url: hecho.url }),
    );
    return (
      <div className="border-precio-300 mt-5 rounded-xl border bg-white p-4">
        <p className="text-precio-800 flex items-center gap-2 text-sm font-bold">
          <Check className="h-4 w-4" aria-hidden />
          {t("enlaceListo")}
        </p>
        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs break-all">
          {hecho.url}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => copiar(hecho.url)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-riel-900 px-3 py-2 text-xs font-bold text-white"
          >
            {copiado ? (
              <Check className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden />
            )}
            {copiado ? t("copiado") : t("copiarEnlace")}
          </button>
          <a
            href={`https://wa.me/?text=${paraWhatsApp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-borde px-3 py-2 text-xs font-semibold hover:bg-slate-50"
          >
            <Send className="h-3.5 w-3.5" aria-hidden />
            {t("porWhatsApp")}
          </a>
        </div>
        <p className="mt-3 text-xs text-tinta-suave">{t("tambienPorCorreo")}</p>
      </div>
    );
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="boton-principal mt-5 w-full py-3 text-base"
      >
        {t("cobrarEsto", { monto: montoTexto })}
      </button>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formulario = e.currentTarget;
        const datos = new FormData(formulario);
        /* El monto va en dólares con dos decimales, que es lo que espera
           `crearCobroDesdePanel`; el método, tal cual se eligió arriba. */
        datos.set("monto", (totalCentavos / 100).toFixed(2));
        datos.set("metodos", metodo);
        if (tiendaId) datos.set("tiendaId", tiendaId);
        setEnviando(true);
        setError(null);
        const r = await crearCobroDesdePanel(null, datos);
        setEnviando(false);
        if (r.ok) setHecho({ url: r.url, referencia: r.referencia });
        else setError(r.mensaje);
      }}
      className="mt-5 rounded-xl border border-borde bg-white p-4"
    >
      <p className="text-sm font-bold text-riel-900">
        {t("cobrarTitulo", { monto: montoTexto })}
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm text-tinta-suave">{t("correoCliente")}</span>
          <input
            name="correo"
            type="email"
            required
            placeholder="correo@ejemplo.com"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-carga-500 sm:text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm text-tinta-suave">{t("numeroFactura")}</span>
          <input
            name="referencia"
            required
            maxLength={40}
            placeholder="F-00123"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-carga-500 sm:text-sm"
          />
        </label>
      </div>

      <label className="mt-3 block">
        <span className="text-sm text-tinta-suave">{t("nombreCliente")}</span>
        <input
          name="nombre"
          maxLength={80}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-carga-500 sm:text-sm"
        />
      </label>

      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enviando}
        className="boton-principal mt-4 w-full gap-2 py-3 disabled:opacity-60"
      >
        {enviando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : null}
        {t("generarEnlace")}
      </button>
    </form>
  );
}
