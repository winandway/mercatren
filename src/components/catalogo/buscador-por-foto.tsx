"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2, MailCheck, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  buscarPorImagen,
  dejarCorreoDeBusqueda,
  type ResultadoBusquedaPorFoto,
} from "@/lib/busqueda-imagen/acciones";
import { formatearPrecio } from "@/lib/dinero";
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
  const [nombre, setNombre] = useState("");
  const [avisoCorreo, setAvisoCorreo] = useState<string | null>(null);
  const [correoListo, setCorreoListo] = useState(false);
  /* La miniatura de SU foto para el aviso: se dibuja del archivo local
     (objectURL), sin pedirle nada al servidor — la subida es privada. */
  const [fotoLocal, setFotoLocal] = useState<string | null>(null);

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
    setFotoLocal((previa) => {
      if (previa) URL.revokeObjectURL(previa);
      return URL.createObjectURL(archivo);
    });
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
      const r = await dejarCorreoDeBusqueda(id, correo, idioma, nombre);
      setAvisoCorreo(r.mensaje);
      if (r.ok) setCorreoListo(true);
    });
  }

  /* El mismo formulario en los dos sitios: el modal del cero y el bloque
     que SIEMPRE acompaña los resultados parecidos. */
  const formularioContacto = correoListo ? (
    <p className="mt-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
      <MailCheck className="h-4 w-4 shrink-0" aria-hidden />
      {avisoCorreo}
    </p>
  ) : (
    <div className="mt-3 space-y-2">
      <input
        type="text"
        autoComplete="name"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder={t("nombre")}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-carga-500 sm:text-sm"
      />
      <input
        type="email"
        inputMode="email"
        autoComplete="email"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        placeholder={t("correo")}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-carga-500 sm:text-sm"
      />
      <button
        type="button"
        onClick={dejarCorreo}
        disabled={pendiente || !correo.trim()}
        className="boton-principal w-full"
      >
        {t("avisenme")}
      </button>
      {avisoCorreo ? (
        <p className="text-sm text-red-700">{avisoCorreo}</p>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-4">
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => elegir(e.target.files?.[0])}
      />
      {/* ══ EL ORDEN LO DICTÓ EL DUEÑO (30 ago 2026) ══ Con resultado en
          pantalla, arriba va EL FORMULARIO, no otro botón de buscar: «el
          cliente buscó, no lo hay y continuó — tiene que estar de primero».
          El botón de otra foto baja al final. */}
      {!resultado || !resultado.ok ? (
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
              {t("subir")}
            </>
          )}
        </button>
      ) : null}

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

          {/* ══ EL FORMULARIO VA DE PRIMERO (30 ago 2026) ══ «El cliente
              buscó, no lo hay y continuó — no va a hacer scroll»: el aviso
              con su foto, nombre y correo arriba; los parecidos, debajo. */}
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-3">
              {fotoLocal ? (
                /* eslint-disable-next-line @next/next/no-img-element -- el
                   archivo local del cliente, un objectURL. */
                <img
                  src={fotoLocal}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-lg border border-amber-200 object-cover"
                />
              ) : null}
              <div className="min-w-0">
                <p className="text-sm font-bold">
                  {resultado.productos.length > 0
                    ? t("ningunoEs")
                    : t("sinNada")}
                </p>
                <p className="mt-0.5 text-sm text-tinta-suave">
                  {t("ningunoEsTexto")}
                </p>
              </div>
            </div>
            {formularioContacto}
          </div>

          {resultado.productos.length > 0 && resultado.mejorTermino ? (
            <div className="mt-3 space-y-3">
              {/* LAS FOTOS DE LO ENCONTRADO, AHÍ MISMO (30 ago 2026). El
                  dueño probó con la captura de un producto nuestro y la
                  página solo daba un botón: «debería de aparecer imágenes
                  allí». Como Google Lens: se ve lo hallado sin salir. */}
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {resultado.productos.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/producto/${p.slug}`}
                      className="block overflow-hidden rounded-lg border border-borde bg-white transition-shadow hover:shadow-md"
                    >
                      {p.imagenUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element --
                           fotos de comercios en dominios que no se conocen
                           de antemano; la parrilla del catálogo hace igual. */
                        <img
                          src={p.imagenUrl}
                          alt={
                            idioma === "en"
                              ? (p.tituloEn ?? p.tituloEs)
                              : p.tituloEs
                          }
                          className="aspect-square w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="aspect-square w-full bg-slate-100" />
                      )}
                      <div className="p-2">
                        <p className="line-clamp-2 text-xs font-medium">
                          {idioma === "en"
                            ? (p.tituloEn ?? p.tituloEs)
                            : p.tituloEs}
                        </p>
                        <p className="mt-0.5 text-sm font-bold tabular-nums">
                          {formatearPrecio(
                            p.precioCentavos,
                            idioma as "es" | "en",
                            p.moneda,
                          )}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
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
            <p className="mt-3 text-sm text-tinta-suave">
              {t("sinResultadosExtra")}
            </p>
          )}
        </div>
      ) : null}

      {resultado?.ok ? (
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
              {t("otraFoto")}
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}
