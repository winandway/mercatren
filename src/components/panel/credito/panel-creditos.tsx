"use client";

import { CreditCard, Loader2, ShieldAlert, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { Campo } from "@/components/ui/campo";
import { guardarCredito } from "@/lib/credito/acciones";
import type { CreditoDeCliente } from "@/lib/credito/consultas";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { cn } from "@/lib/utils";

import { MenuCredito } from "./menu-credito";

type ClientePosible = { id: string; nombre: string; correo: string };

/**
 * LA PANTALLA DE CRÉDITOS DEL COMERCIO.
 *
 * Es lo que hoy MEGAYES lleva en un cuaderno: a quién le fió, cuánto le debe
 * cada uno y desde cuándo. La diferencia es que aquí los números se calculan
 * solos de los abonos que entran, así que no hay nada que cuadrar a mano.
 */
export function PanelCreditos({
  creditos,
  clientes,
  idioma,
  esEquipo,
  tiendaId,
}: {
  creditos: CreditoDeCliente[];
  clientes: ClientePosible[];
  idioma: Idioma;
  esEquipo: boolean;
  tiendaId?: string;
}) {
  const t = useTranslations("panel.creditos");
  const [formulario, setFormulario] = useState<{
    abierto: boolean;
    credito?: CreditoDeCliente;
  }>({ abierto: false });
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );

  const [estado, enviar, enviando] = useActionState(guardarCredito, null);

  /**
   * CERRAR EL FORMULARIO CUANDO EL SERVIDOR DICE QUE SÍ.
   *
   * Se ajusta durante el render comparando con el último resultado ya visto,
   * que es el patrón que React documenta para esto. En un `useEffect` no vale:
   * llamar a `setState` de forma síncrona dentro de un efecto encadena renders,
   * y desde React 19 el lint lo marca como error — con razón.
   */
  const [ultimoVisto, setUltimoVisto] = useState<typeof estado>(null);
  if (estado && estado !== ultimoVisto) {
    setUltimoVisto(estado);
    setAviso({ ok: estado.ok, texto: estado.mensaje });
    if (estado.ok) setFormulario({ abierto: false });
  }

  const dinero = (c: number) => formatearPrecio(c, idioma, "USD");

  return (
    <div className="space-y-5">
      {aviso ? (
        <p
          role="status"
          className={cn(
            "rounded-lg px-4 py-3 text-sm font-medium",
            aviso.ok
              ? "bg-emerald-50 text-emerald-900"
              : "bg-red-50 text-red-800",
          )}
        >
          {aviso.texto}
        </p>
      ) : null}

      {!formulario.abierto ? (
        <button
          type="button"
          onClick={() => setFormulario({ abierto: true })}
          disabled={clientes.length === 0}
          className="boton-principal inline-flex items-center gap-2 disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" aria-hidden />
          {t("darCredito")}
        </button>
      ) : null}

      {clientes.length === 0 && !formulario.abierto ? (
        <p className="text-sm text-tinta-suave">{t("sinClientes")}</p>
      ) : null}

      {/* ── El formulario ─────────────────────────────────────────────── */}
      {formulario.abierto ? (
        <form
          action={enviar}
          className="space-y-4 rounded-xl border border-borde bg-white p-5"
        >
          <h2 className="font-bold">{t("formTitulo")}</h2>

          {esEquipo && tiendaId ? (
            <input type="hidden" name="tiendaId" value={tiendaId} />
          ) : null}

          <div>
            <label htmlFor="clienteId" className="block text-xs font-medium">
              {t("cliente")}
            </label>
            <select
              id="clienteId"
              name="clienteId"
              required
              defaultValue={formulario.credito?.clienteId ?? ""}
              /* Al editar no se cambia de cliente: sería otro crédito. */
              disabled={Boolean(formulario.credito)}
              className="mt-1 w-full rounded-lg border border-borde px-3 py-2 text-sm outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30 disabled:bg-slate-50"
            >
              <option value="" disabled>
                —
              </option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} · {c.correo}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-tinta-suave">{t("clienteAyuda")}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              tipo="soloNumeros"
              nombre="tope"
              etiqueta={t("topeLabel")}
              ayuda={t("topeAyuda")}
              marcador="2000"
              valor={undefined}
              requerido
            />
            <Campo
              tipo="soloNumeros"
              nombre="diasPlazo"
              etiqueta={t("plazoLabel")}
              marcador="30"
              requerido
            />
          </div>

          <Campo
            tipo="textoCorto"
            nombre="notaInterna"
            etiqueta={t("notaLabel")}
            ayuda={t("notaAyuda")}
            area
            filas={2}
          />

          {/**
           * EL AVISO LEGAL, DELANTE Y ANTES DE GUARDAR.
           *
           * Lo pidió el abogado: que quede por escrito y a la vista que el
           * crédito lo da el comercio y que Mercatren no presta ni responde por
           * el pago. Si esto estuviera escondido en unos términos, no serviría.
           */}
          <div className="flex items-start gap-2.5 rounded-lg bg-slate-50 p-3.5">
            <ShieldAlert
              className="mt-0.5 h-4 w-4 shrink-0 text-carga-600"
              aria-hidden
            />
            <p className="text-xs text-tinta-suave">{t("avisoLegal")}</p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={enviando}
              className="boton-principal disabled:opacity-60"
            >
              {enviando ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                t("guardar")
              )}
            </button>
            <button
              type="button"
              onClick={() => setFormulario({ abierto: false })}
              className="rounded-lg border border-borde px-4 py-2.5 text-sm font-semibold hover:border-carga-500"
            >
              {t("cancelar")}
            </button>
          </div>
        </form>
      ) : null}

      {/* ── La lista ──────────────────────────────────────────────────── */}
      {creditos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-borde bg-white px-6 py-14 text-center">
          <CreditCard
            className="mx-auto h-10 w-10 text-tinta-suave"
            aria-hidden
          />
          <p className="mt-3 font-semibold">{t("vacio")}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-tinta-suave">
            {t("vacioTexto")}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {creditos.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-borde bg-white p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{c.clienteNombre}</p>
                  <p className="truncate text-xs text-tinta-suave">
                    {c.clienteCorreo}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-semibold",
                      c.estado === "activo"
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {c.estado === "activo" ? t("activo") : t("suspendido")}
                  </span>

                  <MenuCredito
                    creditoId={c.id}
                    estado={c.estado}
                    onEditar={() =>
                      setFormulario({ abierto: true, credito: c })
                    }
                    onHecho={(texto, ok) => setAviso({ ok, texto })}
                  />
                </div>
              </div>

              {/* Los tres números que de verdad importan. */}
              <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-borde pt-3">
                <div>
                  <dt className="text-xs text-tinta-suave">{t("cupo")}</dt>
                  <dd className="font-semibold tabular-nums">
                    {dinero(c.cupo.topeCentavos)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-tinta-suave">{t("usado")}</dt>
                  <dd
                    className={cn(
                      "font-semibold tabular-nums",
                      c.cupo.usadoCentavos > 0 ? "text-carga-700" : "",
                    )}
                  >
                    {dinero(c.cupo.usadoCentavos)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-tinta-suave">
                    {t("disponible")}
                  </dt>
                  <dd className="font-semibold text-emerald-700 tabular-nums">
                    {dinero(c.cupo.disponibleCentavos)}
                  </dd>
                </div>
              </dl>

              <p className="mt-3 text-xs text-tinta-suave">
                {t("dias", { n: c.diasPlazo })}
                {c.pedidosAbiertos > 0 ? (
                  <>
                    {" · "}
                    {c.pedidosAbiertos === 1
                      ? t("pedidosAbiertos", { n: 1 })
                      : t("pedidosAbiertosVarios", { n: c.pedidosAbiertos })}
                  </>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
