"use client";

import { CircleCheck, Loader2, Store } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";

import { CORREO_CONTACTO } from "@/lib/correo/direcciones";
import { pedirCierreDeMiCuenta } from "@/lib/cuenta/borrar-acciones";
import { PALABRA_DE_CONFIRMACION } from "@/lib/cuenta/borrar-puro";
import { DIAS_TIPICOS_DEL_CIERRE } from "@/lib/cuenta/cierre-puro";

type Paso = "pedidos" | "pagos" | "saldo";

/**
 * CERRAR LA TIENDA Y BORRAR LA CUENTA (5 nov 2026, Apple 5.1.1(v)). Una
 * cuenta con tienda ya no se manda a «escribir a soporte»: la persona pide el
 * cierre aquí (o en la app, con la MISMA acción), con los pasos y los días a
 * la vista. Como el borrado, pide escribir la palabra y no guarda borrador.
 */
export function CerrarTienda({
  correo,
  pedido,
  pasos,
}: {
  correo: string;
  pedido: boolean;
  pasos: Paso[];
}) {
  const t = useTranslations("borrarCuenta");
  const idioma = useLocale();
  const id = useId();
  const [palabra, setPalabra] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [estado, setEstado] = useState<{ pedido: boolean; pasos: Paso[] }>({
    pedido,
    pasos,
  });
  const [enCurso, empezar] = useTransition();

  const esperada =
    idioma === "en" ? PALABRA_DE_CONFIRMACION.en : PALABRA_DE_CONFIRMACION.es;
  const lista = palabra.trim().toUpperCase() === esperada;

  function pedir() {
    setError(null);
    empezar(async () => {
      const r = await pedirCierreDeMiCuenta({ palabra, origen: "web" }).catch(
        () => ({
          ok: false as const,
          motivo: "fallo" as const,
        }),
      );
      if (!r.ok) {
        setError(
          r.motivo === "sin_tienda"
            ? t("errores.fallo", { correo: CORREO_CONTACTO })
            : t(`errores.${r.motivo}`, { correo: CORREO_CONTACTO }),
        );
        return;
      }
      if (r.borrada) {
        window.location.assign(`/${idioma}/delete-account?listo=1`);
        return;
      }
      setEstado({ pedido: true, pasos: r.pasos });
    });
  }

  if (estado.pedido) {
    return (
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 sm:p-6">
        <p className="flex items-center gap-2 font-bold text-amber-900">
          <Store className="h-5 w-5" aria-hidden />
          {t("cierre.enCurso")}
        </p>
        <p className="mt-2 text-sm text-tinta">{t("cierre.enCursoTexto")}</p>
        {estado.pasos.length ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-tinta">
            {estado.pasos.map((p) => (
              <li key={p}>{t(`cierre.${p}`)}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <CircleCheck className="h-4 w-4" aria-hidden />
            {t("cierre.nadaPendiente")}
          </p>
        )}
        <p className="mt-3 text-xs text-tinta-suave">{t("cierre.legal")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-red-200 bg-red-50/60 p-5 sm:p-6">
      <p className="flex items-center gap-2 font-bold text-red-800">
        <Store className="h-5 w-5" aria-hidden />
        {t("cierre.titulo")}
      </p>
      <p className="mt-2 text-sm text-tinta">
        {t("formulario.cuenta", { correo })}
      </p>
      <p className="mt-3 text-sm font-semibold">{t("cierre.texto")}</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-tinta">
        <li>{t("cierre.paso1")}</li>
        <li>{t("cierre.paso2")}</li>
        <li>{t("cierre.paso3")}</li>
        <li>{t("cierre.paso4", { dias: DIAS_TIPICOS_DEL_CIERRE })}</li>
      </ol>
      <p className="mt-3 text-xs text-tinta-suave">{t("cierre.legal")}</p>
      <label htmlFor={id} className="mt-4 block text-sm font-semibold">
        {t("cierre.escribe", { palabra: esperada })}
      </label>
      <input
        id={id}
        type="text"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        value={palabra}
        onChange={(e) => setPalabra(e.target.value)}
        placeholder={esperada}
        className="mt-1 w-full rounded-lg border border-borde bg-white px-3 py-2.5 font-mono tracking-widest"
      />
      {error ? (
        <p role="alert" className="mt-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={pedir}
        disabled={!lista || enCurso}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
      >
        {enCurso ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : null}
        {enCurso ? t("cierre.pidiendo") : t("cierre.boton")}
      </button>
      {!lista ? (
        <p className="mt-2 text-xs text-tinta-suave">
          {t("formulario.apagado", { palabra: esperada })}
        </p>
      ) : null}
    </div>
  );
}
