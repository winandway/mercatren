"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2, MailCheck, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  buscarPorImagen,
  dejarCorreoDeBusqueda,
  type ResultadoBusquedaPorFoto,
} from "@/lib/busqueda-imagen/acciones";
import { comprimirImagen } from "@/lib/imagenes/comprimir";
import { Link } from "@/i18n/navigation";

/**
 * El subidor de la búsqueda por foto.
 *
 * La foto SE COMPRIME EN EL NAVEGADOR antes de subir — la misma regla de las
 * fotos de producto: una foto de teléfono pesa 3–8 MB y con una conexión
 * lenta eso es un minuto y un corte a mitad de camino. Si comprimir falla,
 * se sube la original.
 */
export function BuscadorPorFoto({ disponible }: { disponible: boolean }) {
  const t = useTranslations("buscarConFoto");
  const idioma = useLocale();
  const entrada = useRef<HTMLInputElement>(null);
  const [pendiente, iniciar] = useTransition();
  const [resultado, setResultado] = useState<ResultadoBusquedaPorFoto | null>(
    null,
  );
  const [correo, setCorreo] = useState("");
  const [avisoCorreo, setAvisoCorreo] = useState<string | null>(null);
  const [correoListo, setCorreoListo] = useState(false);

  if (!disponible) {
    return (
      <p className="rounded-lg border border-borde bg-white p-4 text-sm text-tinta-suave">
        {t("noDisponible")}
      </p>
    );
  }

  function elegir(archivo: File | undefined) {
    if (!archivo) return;
    setResultado(null);
    setAvisoCorreo(null);
    setCorreoListo(false);
    iniciar(async () => {
      let listo: File = archivo;
      try {
        const comprimida = await comprimirImagen(archivo);
        listo = comprimida.archivo;
      } catch {
        /* Un navegador que no puede dibujar el formato sube el original. */
      }
      const datos = new FormData();
      datos.set("foto", listo);
      const r = await buscarPorImagen(datos);
      setResultado(r);
    });
  }

  function dejarCorreo() {
    if (!resultado?.ok) return;
    const id = resultado.busquedaId;
    iniciar(async () => {
      const r = await dejarCorreoDeBusqueda(id, correo, idioma);
      setAvisoCorreo(r.mensaje);
      if (r.ok) setCorreoListo(true);
    });
  }

  return (
    <div className="space-y-4">
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => elegir(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        disabled={pendiente}
        className="boton-principal flex w-full items-center justify-center gap-2 py-3"
      >
        {pendiente ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            {t("buscando")}
          </>
        ) : (
          <>
            <Camera className="h-5 w-5" aria-hidden />
            {resultado ? t("otraFoto") : t("subir")}
          </>
        )}
      </button>

      {resultado && !resultado.ok ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {resultado.mensaje}
        </p>
      ) : null}

      {resultado?.ok ? (
        <div className="rounded-lg border border-borde bg-white p-4">
          {resultado.descripcion ? (
            <p className="text-sm text-tinta-suave">
              {t("vimos")}{" "}
              <span className="font-medium text-tinta">
                {resultado.descripcion}
              </span>
            </p>
          ) : null}

          {resultado.total > 0 && resultado.mejorTermino ? (
            <div className="mt-3 space-y-3">
              <Link
                href={`/catalogo?q=${encodeURIComponent(resultado.mejorTermino)}`}
                className="boton-principal flex items-center justify-center gap-2"
              >
                <Search className="h-4 w-4" aria-hidden />
                {t("resultados", {
                  n: resultado.total,
                  termino: resultado.mejorTermino,
                })}
              </Link>
              {resultado.terminos.length > 1 ? (
                <p className="text-xs text-tinta-suave">
                  {t("otrosTerminos")}{" "}
                  {resultado.terminos
                    .filter((x) => x !== resultado.mejorTermino)
                    .slice(0, 4)
                    .map((termino, i) => (
                      <Link
                        key={i}
                        href={`/catalogo?q=${encodeURIComponent(termino)}`}
                        className="mr-2 underline"
                      >
                        {termino}
                      </Link>
                    ))}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="mt-3">
              <p className="font-bold">{t("sinNada")}</p>
              <p className="mt-1 text-sm text-tinta-suave">
                {t("sinNadaTexto")}
              </p>
              {correoListo ? (
                <p className="mt-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
                  <MailCheck className="h-4 w-4 shrink-0" aria-hidden />
                  {avisoCorreo}
                </p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder={t("correo")}
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-carga-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={dejarCorreo}
                    disabled={pendiente || !correo.trim()}
                    className="boton-principal shrink-0"
                  >
                    {t("avisenme")}
                  </button>
                </div>
              )}
              {avisoCorreo && !correoListo ? (
                <p className="mt-2 text-sm text-red-700">{avisoCorreo}</p>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
