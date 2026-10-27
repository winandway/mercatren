"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";

import { authClient } from "@/lib/auth-client";
import { CORREO_CONTACTO } from "@/lib/correo/direcciones";
import { borrarMiCuenta } from "@/lib/cuenta/borrar-acciones";
import { PALABRA_DE_CONFIRMACION } from "@/lib/cuenta/borrar-puro";

/**
 * El formulario que borra la cuenta (27 oct 2026).
 *
 * No está a la vista en ningún lado: se llega desde el menú de tres puntos de
 * «Mi cuenta» o desde la página «Delete account» que Google Play pide, y aun
 * ahí hay que ESCRIBIR una palabra para que el botón se encienda.
 *
 * ══ ESTE FORMULARIO NO GUARDA BORRADOR, A PROPÓSITO ══
 *
 * La regla de los formularios dice que lo sensible no se guarda. Una palabra
 * que confirma algo irreversible es lo más sensible que hay: si se restituyera
 * sola, quien vuelva a la página encontraría el botón ya encendido.
 *
 * Al terminar se hace CARGA COMPLETA, como al salir: el encabezado se arma de
 * nuevo sin sesión.
 */
export function BorrarCuenta({ correo }: { correo: string }) {
  const t = useTranslations("borrarCuenta");
  const idioma = useLocale();
  const id = useId();
  const [palabra, setPalabra] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enCurso, empezar] = useTransition();

  const esperada =
    idioma === "en" ? PALABRA_DE_CONFIRMACION.en : PALABRA_DE_CONFIRMACION.es;
  const lista = palabra.trim().toUpperCase() === esperada;

  function borrar() {
    setError(null);
    empezar(async () => {
      const enLaApp =
        typeof window !== "undefined" &&
        window.matchMedia?.("(display-mode: standalone)").matches;
      const r = await borrarMiCuenta({
        palabra,
        origen: enLaApp ? "app" : "web",
      }).catch(() => ({ ok: false as const, motivo: "fallo" as const }));

      if (!r.ok) {
        setError(t(`errores.${r.motivo}`, { correo: CORREO_CONTACTO }));
        return;
      }
      try {
        await authClient.signOut();
      } catch {
        // La sesión ya no existe en la base: la cookie que quede no sirve.
      }
      window.location.assign(`/${idioma}/delete-account?listo=1`);
    });
  }

  return (
    <div className="rounded-2xl border-2 border-red-200 bg-red-50/60 p-5 sm:p-6">
      <p className="flex items-center gap-2 font-bold text-red-800">
        <TriangleAlert className="h-5 w-5" aria-hidden />
        {t("formulario.titulo")}
      </p>
      <p className="mt-2 text-sm text-tinta">
        {t("formulario.cuenta", { correo })}
      </p>
      <label htmlFor={id} className="mt-4 block text-sm font-semibold">
        {t("formulario.escribe", { palabra: esperada })}
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
        onClick={borrar}
        disabled={!lista || enCurso}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
      >
        {enCurso ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : null}
        {enCurso ? t("formulario.borrando") : t("formulario.boton")}
      </button>
      {!lista ? (
        <p className="mt-2 text-xs text-tinta-suave">
          {t("formulario.apagado", { palabra: esperada })}
        </p>
      ) : null}
    </div>
  );
}
