"use client";

import { Check, Copy, Landmark } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { paisBancario } from "@/lib/retiros/paises";
import { cn } from "@/lib/utils";

/**
 * LOS DATOS CON LOS QUE SE HACE LA TRANSFERENCIA.
 *
 * ══ EL AGUJERO QUE TAPA (12 ago 2026) ══
 *
 * La cola de retiros decía «haz la transferencia en el banco y márcala aquí» y
 * **no enseñaba con qué**: de todo lo que el comercio había escrito —titular,
 * banco, tipo de cuenta, número completo, documento, SWIFT— solo se pintaban
 * los últimos cuatro dígitos.
 *
 * Lo destapó el dueño con un retiro de $29 a un comercio de Colombia: *«dice
 * "Ya lo pagué", pero si le doy y no lo he pagado… si no tengo ni los datos del
 * cliente»*. Tenía toda la razón. Los datos estaban guardados desde el primer
 * día; la pantalla no los mostraba.
 *
 * ══ UN BOTÓN DE COPIAR POR DATO, NO UNO PARA TODO ══
 *
 * Regla del proyecto, y aquí es literal: cada uno de estos valores se pega en
 * una casilla distinta del formulario del banco. Un bloque con todo junto
 * obliga a seleccionar a mano trozo por trozo, que es exactamente donde se
 * cuela un dígito de menos. Y un wire mal dirigido no rebota al día siguiente:
 * se queda dando vueltas entre bancos y puede tardar semanas.
 *
 * ══ SOLO PARA EL EQUIPO ══
 *
 * Son los datos bancarios de una persona. Quien los ve es quien va a ir al
 * banco, nadie más.
 */

export function DatosParaTransferir({
  destino,
  direccionFicha,
  ciudadFicha,
}: {
  destino: Record<string, unknown> | null;
  /** Respaldo para los retiros pedidos antes de que se pidiera la dirección. */
  direccionFicha?: string | null;
  ciudadFicha?: string | null;
}) {
  const t = useTranslations("panel.retiros");
  const tc = useTranslations("panel.retiros.campos");

  if (!destino) return null;

  const codigo = typeof destino.pais === "string" ? destino.pais : null;
  const pais = codigo ? paisBancario(codigo) : null;

  /**
   * El orden lo manda el PAÍS, no el objeto guardado.
   *
   * Así se lee en el mismo orden en que se llenó el formulario y en que se va a
   * llenar el del banco. Si el país no se reconoce —un retiro viejo, un código
   * que ya no está— se enseña lo que haya, en crudo: es mejor un dato sin
   * etiqueta bonita que un renglón vacío cuando alguien está esperando su
   * dinero.
   */
  const filas = pais
    ? pais.campos
        .map((c) => ({
          etiqueta: tc(c.etiqueta as never),
          valor: String(destino[c.nombre] ?? "").trim(),
        }))
        .filter((f) => f.valor)
    : Object.entries(destino)
        .filter(([k, v]) => k !== "pais" && String(v ?? "").trim())
        .map(([k, v]) => ({ etiqueta: k, valor: String(v).trim() }));

  if (filas.length === 0) return null;

  /**
   * SI FALTA LA DIRECCIÓN, SE DICE Y SE OFRECE LA DE SU FICHA.
   *
   * Los retiros pedidos antes del 12 ago 2026 no la traen: el formulario no la
   * preguntaba. Sin ella Mercury no deja crear el destinatario internacional, y
   * quien está delante del banco se queda sin saber qué le falta. Se avisa, y
   * se enseña la que el comercio puso en su ficha de empresa — marcada como lo
   * que es, un respaldo, no el dato que él declaró para cobrar.
   */
  const pideDireccion = pais?.via === "wire";
  const faltaDireccion =
    pideDireccion && !String(destino.direccion ?? "").trim();
  const respaldo = [direccionFicha, ciudadFicha]
    .map((x) => (x ?? "").trim())
    .filter(Boolean)
    .join(", ");

  return (
    <section className="mt-3 rounded-xl border border-riel-800 bg-riel-900 p-4 text-white">
      <h3 className="flex flex-wrap items-center gap-2 font-bold">
        <Landmark className="h-4 w-4 shrink-0" aria-hidden />
        {t("datosParaTransferir")}
        {pais ? (
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold">
            {pais.bandera} {t(`via.${pais.via}` as never)}
          </span>
        ) : null}
      </h3>

      <dl className="mt-3 space-y-2">
        {filas.map((f) => (
          <div
            key={f.etiqueta}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/10 px-3 py-2"
          >
            <div className="min-w-0">
              <dt className="text-xs tracking-wide text-white/60 uppercase">
                {f.etiqueta}
              </dt>
              <dd className="font-mono text-sm font-semibold break-words">
                {f.valor}
              </dd>
            </div>
            <Copiar valor={f.valor} />
          </div>
        ))}
      </dl>

      {faltaDireccion ? (
        <div className="mt-3 rounded-lg bg-amber-400/20 px-3 py-2.5">
          <p className="text-sm font-semibold text-amber-100">
            {t("faltaDireccion")}
          </p>
          {respaldo ? (
            <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-white/10 px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs tracking-wide text-white/60 uppercase">
                  {t("direccionDeLaFicha")}
                </p>
                <p className="font-mono text-sm font-semibold break-words">
                  {respaldo}
                </p>
              </div>
              <Copiar valor={respaldo} />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Lo que hay que mirar ANTES de ir al banco, no después. */}
      <p className="mt-3 text-xs text-white/70">
        {t("avisoAntesDeTransferir")}
      </p>
    </section>
  );
}

function Copiar({ valor }: { valor: string }) {
  const t = useTranslations("datosPago");
  const [copiado, setCopiado] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(valor);
          setCopiado(true);
          window.setTimeout(() => setCopiado(false), 1800);
        } catch {
          /* Si el navegador no deja copiar, el dato sigue a la vista. */
        }
      }}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors",
        "bg-white/15 hover:bg-white/25",
      )}
    >
      {copiado ? (
        <>
          <Check className="h-3.5 w-3.5" aria-hidden />
          {t("copiado")}
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" aria-hidden />
          {t("copiar")}
        </>
      )}
    </button>
  );
}
