"use client";

import { AlertTriangle, RefreshCw, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Link } from "@/i18n/navigation";
import { CORREO_CONTACTO } from "@/lib/correo/direcciones";

/**
 * LA RED DE SEGURIDAD DEL PANEL.
 *
 * Aparte de la del sitio porque aquí el fallo más probable tiene nombre y
 * apellido: **una cuenta que todavía no tiene comercio asignado**.
 * `obtenerAlcance()` corta la operación en ese caso, y sin esta pantalla eso
 * llegaba al cliente como el 500 en blanco de Next.
 *
 * Es exactamente lo que le pasó a MEGAYES: se registró, entró al panel, intentó
 * cargar productos y subir fotos, y todo se caía. Nadie le dijo nunca que lo
 * que faltaba era dar de alta su comercio.
 *
 * Por eso esta pantalla ofrece la SALIDA, no solo el aviso: el botón para dar
 * de alta el comercio está aquí mismo.
 */
export default function ErrorDelPanel({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errores");

  useEffect(() => {
    console.error("[error del panel]", error.digest ?? "", error.message);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-carga-500/10">
        <AlertTriangle className="h-7 w-7 text-carga-600" aria-hidden />
      </div>

      <h1 className="mt-5 text-xl font-bold tracking-tight">
        {t("panelTitulo")}
      </h1>
      <p className="mt-2 text-sm text-tinta-suave">{t("panelTexto")}</p>

      {/**
       * LA SALIDA MÁS PROBABLE, A UN CLIC.
       *
       * Si la cuenta no tiene comercio, no hay nada que reintentar: por muchas
       * veces que le dé al botón, va a fallar igual. Lo que necesita es dar de
       * alta su tienda, así que el camino se le pone delante.
       */}
      <div className="mt-6 w-full rounded-xl border border-borde bg-slate-50 p-5 text-left">
        <div className="flex items-start gap-3">
          <Store
            className="mt-0.5 h-5 w-5 shrink-0 text-riel-700"
            aria-hidden
          />
          <div>
            <p className="text-sm font-semibold">{t("sinComercioTitulo")}</p>
            <p className="mt-1 text-xs text-tinta-suave">
              {t("sinComercioTexto")}
            </p>
            <Link
              href="/vender/empezar"
              className="mt-3 inline-block rounded-lg bg-carga-500 px-4 py-2 text-sm font-semibold text-white hover:bg-carga-600"
            >
              {t("darDeAlta")}
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-lg border border-borde px-4 py-2.5 text-sm font-semibold hover:border-carga-500"
        >
          <RefreshCw className="mr-2 inline h-4 w-4" aria-hidden />
          {t("reintentar")}
        </button>
        <a
          href={`mailto:${CORREO_CONTACTO}`}
          className="rounded-lg border border-borde px-4 py-2.5 text-sm font-semibold hover:border-carga-500"
        >
          {t("escribenos")}
        </a>
      </div>

      {error.digest ? (
        <p className="mt-7 text-xs text-tinta-suave">
          {t("codigo")}{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">
            {error.digest}
          </code>
        </p>
      ) : null}
    </div>
  );
}
