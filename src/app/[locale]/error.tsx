"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Link } from "@/i18n/navigation";
import { CORREO_CONTACTO } from "@/lib/correo/direcciones";

/**
 * LA RED DE SEGURIDAD DEL SITIO.
 *
 * Antes de esto, cualquier fallo del servidor dejaba al cliente delante de la
 * pantalla en blanco de Next: **"This page couldn't load. A server error
 * occurred."** En inglés, sin decir qué pasó, sin decir qué hacer, y sin ni
 * siquiera nuestro logo.
 *
 * No es un detalle de estilo. Un comercio real —MEGAYES, repuestos de moto en
 * Venezuela— pasó una tarde entera chocándose contra esa pantalla al intentar
 * cargar sus productos: probaba, se caía, volvía a probar, se volvía a caer. Y
 * como la página moría entera, **perdía todo lo que llevaba escrito**. Lo único
 * que sabía era que "daba error".
 *
 * Esta pantalla no arregla la causa de un fallo: arregla lo que le pasa a la
 * persona cuando ocurre. Le dice qué pasó en su idioma, le dice que lo suyo
 * está a salvo, le da un botón para reintentar sin recargar y un código para
 * que podamos encontrar el fallo si escribe.
 *
 * `reset()` reintenta solo el trozo que falló, sin recargar la página: lo que
 * el navegador tuviera en memoria sigue ahí.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errores");

  useEffect(() => {
    /* Queda en los registros del servidor con su código. Sin esto, un fallo
       que solo le pasa a un cliente no deja rastro en ningún sitio y no hay
       forma de saber qué pasó. */
    console.error("[error de página]", error.digest ?? "", error.message);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-carga-500/10">
        <AlertTriangle className="h-7 w-7 text-carga-600" aria-hidden />
      </div>

      <h1 className="mt-5 text-2xl font-bold tracking-tight">{t("titulo")}</h1>
      <p className="mt-2 text-sm text-tinta-suave">{t("texto")}</p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button onClick={reset} className="boton-principal">
          <RefreshCw className="mr-2 inline h-4 w-4" aria-hidden />
          {t("reintentar")}
        </button>
        <Link
          href="/"
          className="rounded-lg border border-borde px-4 py-2.5 text-sm font-semibold hover:border-carga-500"
        >
          {t("inicio")}
        </Link>
      </div>

      {/* El código es lo que nos deja encontrar ESE fallo entre todos los del
          día. Sin él, "me dio error" no se puede investigar. */}
      {error.digest ? (
        <p className="mt-8 text-xs text-tinta-suave">
          {t("codigo")}{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">
            {error.digest}
          </code>
        </p>
      ) : null}

      <a
        href={`mailto:${CORREO_CONTACTO}`}
        className="mt-3 text-xs font-semibold text-riel-700 underline underline-offset-2 hover:text-carga-600"
      >
        {t("escribenos")}
      </a>
    </main>
  );
}
