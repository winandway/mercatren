"use client";

import { Check, Copy, Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { crearCobroDesdePanel } from "@/lib/cobros/pedir";
import type { MetodoDeCobro } from "@/lib/cobros/reparto";
import { cuantasPartes, MAXIMO_PARTES } from "@/lib/cobros/partes";
import type { ParteCreada } from "@/lib/cobros/pedir";

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
  referenciaSugerida,
}: {
  totalCentavos: number;
  /** Ya formateado, para el botón: «Cobrar $2,860.71». */
  montoTexto: string;
  metodo: MetodoDeCobro;
  /** De qué comercio es el cobro. `crearCobroDesdePanel` espera el ID. */
  tiendaId: string | null;
  /** El siguiente número de la numeración del comercio, ya calculado. */
  referenciaSugerida?: string;
}) {
  const t = useTranslations("panel.calculadora");
  const [abierto, setAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<ParteCreada[] | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  /**
   * EN CUÁNTAS PARTES.
   *
   * Nace en 1, que es el cobro de siempre. Se sube cuando el cliente no puede
   * pagar de una: una factura de $7.475 con un cupo de $2.500 al día en el
   * banco no se paga de un golpe, y sin esto se quedaba a medias.
   */
  const [partes, setPartes] = useState(1);

  async function copiar(texto: string, cual: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(cual);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      /* Sin portapapeles el enlace se ve igual y se selecciona a mano. */
    }
  }

  if (hecho) {
    return (
      <div className="border-precio-300 mt-5 rounded-xl border bg-white p-4">
        <p className="text-precio-800 flex items-center gap-2 text-sm font-bold">
          <Check className="h-4 w-4" aria-hidden />
          {hecho.length > 1
            ? t("enlacesListos", { n: hecho.length })
            : t("enlaceListo")}
        </p>

        {/* Una tarjeta por parte. Con una sola, es el cobro de siempre. */}
        <ul className="mt-3 space-y-3">
          {hecho.map((parte) => {
            const paraWhatsApp = encodeURIComponent(
              t("mensajeWhatsApp", {
                referencia: parte.referencia,
                url: parte.url,
              }),
            );
            return (
              <li
                key={parte.url}
                className="rounded-lg border border-borde bg-slate-50 p-3"
              >
                {parte.total > 1 ? (
                  <p className="text-carga-700 text-xs font-bold">
                    {t("parteDe", { n: parte.numero, total: parte.total })} ·{" "}
                    {parte.referencia}
                  </p>
                ) : null}
                <p className="mt-0.5 text-sm font-bold tabular-nums">
                  {(parte.montoCentavos / 100).toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </p>
                <p className="mt-1 text-xs break-all text-tinta-suave">
                  {parte.url}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copiar(parte.url, parte.url)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-riel-900 px-3 py-1.5 text-xs font-bold text-white"
                  >
                    {copiado === parte.url ? (
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Copy className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {copiado === parte.url ? t("copiado") : t("copiarEnlace")}
                  </button>
                  <a
                    href={`https://wa.me/?text=${paraWhatsApp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-borde bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-100"
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden />
                    {t("porWhatsApp")}
                  </a>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-3 text-xs leading-relaxed text-tinta-suave">
          {hecho.length > 1 ? t("comoMandarLasPartes") : t("tambienPorCorreo")}
        </p>
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
           `crearCobroDesdePanel`.

           ══ EL BOTÓN DICE «TRANSFERENCIA O ZELLE»: SON DOS ══

           Mandaba solo `transferencia`, así que un cobro calculado en ese
           botón le quitaba Zelle al cliente sin que nadie lo pidiera. Se
           mandan los dos, que es lo que dice el botón. */
        datos.set("monto", (totalCentavos / 100).toFixed(2));
        datos.set("partes", String(partes));
        for (const m of metodo === "tarjeta"
          ? ["tarjeta"]
          : ["transferencia", "zelle"]) {
          datos.append("metodos", m);
        }
        if (tiendaId) datos.set("tiendaId", tiendaId);
        setEnviando(true);
        setError(null);
        const r = await crearCobroDesdePanel(null, datos);
        setEnviando(false);
        if (r.ok) setHecho(r.partes);
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
            /* El siguiente de SU numeración, ya propuesto: copiar uno a mano
               es como se acaban repitiendo referencias. Se puede cambiar. */
            defaultValue={referenciaSugerida}
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

      {/* ══ ¿EN CUÁNTAS PARTES? ══

          El caso que lo pidió: una factura de $7.475 y un cliente cuyo banco
          le deja mandar $2.500 al día. Cada parte es un cobro normal con su
          propio enlace y su propio número, así que el cliente paga hoy la
          primera y mañana la siguiente — y cada una cuadra sola en el banco. */}
      <div className="mt-4 border-t border-borde pt-4">
        <p className="text-sm font-medium">{t("enCuantasPartes")}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPartes(n)}
              className={`h-10 w-10 rounded-lg text-sm font-bold ${
                partes === n
                  ? "bg-riel-900 text-white"
                  : "border border-borde text-tinta-suave hover:bg-slate-50"
              }`}
            >
              {n}
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={MAXIMO_PARTES}
            value={partes}
            onChange={(e) => setPartes(cuantasPartes(e.target.value))}
            aria-label={t("enCuantasPartes")}
            className="h-10 w-20 rounded-lg border border-slate-300 px-2 text-center text-sm tabular-nums outline-none focus:border-carga-500"
          />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-tinta-suave">
          {partes > 1
            ? t("avisoPartes", {
                n: partes,
                monto: (Math.ceil(totalCentavos / partes) / 100).toLocaleString(
                  "en-US",
                  { style: "currency", currency: "USD" },
                ),
              })
            : t("avisoUnaParte")}
        </p>
      </div>

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
