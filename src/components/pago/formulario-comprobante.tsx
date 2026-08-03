"use client";

import {
  Camera,
  CheckCircle2,
  ImageIcon,
  ImagePlus,
  Loader2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { subirComprobante } from "@/lib/pedidos/comprobante";
import { cn } from "@/lib/utils";

/** 8 MB, igual que en el servidor. Aqui se avisa antes de subir en balde. */
const TAMANO_MAXIMO = 8 * 1024 * 1024;

/**
 * Subida de la captura del pago.
 *
 * Esta pantalla se usa CASI SIEMPRE DESDE EL TELEFONO: la persona acaba de
 * pagar en la aplicacion de su banco y va a mandar la captura. Por eso:
 *
 *   - Se ve la imagen elegida antes de enviarla. Mandar la captura que no era
 *     significa esperar a que la rechacen y volver a empezar.
 *   - Hay dos botones grandes y separados: tomar foto con la camara o elegir
 *     de la galeria. En el telefono son dos gestos distintos.
 *   - El tamano se comprueba aqui antes de subir, para no gastarle los datos
 *     a alguien y descubrir el problema al final.
 *
 * Solo sube el archivo y avisa: quien decide si el pago vale es una persona
 * del equipo, revisandolo contra el banco.
 */
export function FormularioComprobante({ numero }: { numero: string }) {
  const t = useTranslations("pedido.subida");
  const router = useRouter();
  const [pendiente, iniciarTransicion] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState<string | null>(null);
  const [elegida, setElegida] = useState<File | null>(null);
  const [vista, setVista] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);

  const galeria = useRef<HTMLInputElement>(null);
  const camara = useRef<HTMLInputElement>(null);

  // La vista previa se arma con la imagen elegida y ocupa memoria hasta que
  // se suelta. El efecto solo LIBERA; la direccion se calcula al elegir, para
  // no cambiar el estado dentro del efecto y disparar renders en cascada.
  useEffect(() => {
    if (!vista) return;
    return () => URL.revokeObjectURL(vista);
  }, [vista]);

  function tomar(archivo: File | undefined | null) {
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      setError(t("noEsImagen"));
      return;
    }
    if (archivo.size > TAMANO_MAXIMO) {
      setError(t("demasiadoGrande"));
      return;
    }
    setError(null);
    setElegida(archivo);
    setVista(URL.createObjectURL(archivo));
  }

  function quitar() {
    setElegida(null);
    setVista(null);
  }

  if (listo) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="flex items-center gap-2 font-bold text-emerald-900">
          <CheckCircle2 className="h-5 w-5" aria-hidden />
          {t("estado.pendiente")}
        </p>
        <p className="mt-1 text-sm text-emerald-800">{listo}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        setError(null);

        if (!elegida) {
          setError(t("noEsImagen"));
          return;
        }

        const datos = new FormData(evento.currentTarget);
        datos.set("numero", numero);
        // El archivo se manda desde el estado: puede venir de la camara o de
        // la galeria, que son dos campos distintos.
        datos.set("captura", elegida);

        iniciarTransicion(async () => {
          const resultado = await subirComprobante(datos);
          if (!resultado.ok) {
            setError(resultado.mensaje);
            return;
          }
          setListo(resultado.mensaje);
          router.refresh();
        });
      }}
      className="rounded-xl border border-borde p-4 sm:p-5"
    >
      <h3 className="text-lg font-bold">{t("titulo")}</h3>
      <p className="mt-1 text-sm text-tinta-suave">{t("texto")}</p>

      <div className="mt-4 space-y-4">
        <div>
          <span className="text-xs font-medium">{t("archivo")}</span>

          {vista ? (
            /* Lo elegido, a la vista. */
            <div className="mt-2 overflow-hidden rounded-xl border border-borde">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={vista}
                alt=""
                className="max-h-72 w-full bg-slate-50 object-contain"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-borde bg-white px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-xs text-tinta-suave">
                  {elegida?.name} ·{" "}
                  {Math.round((elegida?.size ?? 0) / 1024).toLocaleString()} KB
                </span>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => galeria.current?.click()}
                    className="rounded-lg border border-borde px-2.5 py-1 text-xs font-semibold hover:border-carga-500"
                  >
                    {t("cambiar")}
                  </button>
                  <button
                    type="button"
                    onClick={quitar}
                    aria-label={t("quitar")}
                    className="rounded-lg border border-borde px-2 py-1 text-tinta-suave hover:border-red-400 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Zona grande para tocar o soltar. En el telefono es todo el
               ancho, que es lo unico que se acierta con el pulgar. */
            <button
              type="button"
              onClick={() => galeria.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setArrastrando(true);
              }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={(e) => {
                e.preventDefault();
                setArrastrando(false);
                tomar(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                "mt-2 flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
                arrastrando
                  ? "border-carga-500 bg-carga-500/5"
                  : "border-borde hover:border-carga-500",
              )}
            >
              <ImageIcon className="h-8 w-8 text-tinta-suave" aria-hidden />
              <span className="text-sm font-medium">{t("arrastra")}</span>
              <span className="text-xs text-tinta-suave">
                {t("archivoAyuda")}
              </span>
            </button>
          )}

          {/* Dos caminos: la camara y la galeria. En el escritorio los dos
              abren el explorador, asi que no molesta tenerlos. */}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => camara.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-borde px-4 py-2.5 text-sm font-semibold transition-colors hover:border-carga-500"
            >
              <Camera className="h-4 w-4" aria-hidden />
              {t("tomarFoto")}
            </button>
            <button
              type="button"
              onClick={() => galeria.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-borde px-4 py-2.5 text-sm font-semibold transition-colors hover:border-carga-500"
            >
              <ImagePlus className="h-4 w-4" aria-hidden />
              {t("desdeGaleria")}
            </button>
          </div>

          <input
            ref={galeria}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={(e) => tomar(e.target.files?.[0])}
            className="sr-only"
          />
          {/* capture le dice al telefono que abra la camara directamente. */}
          <input
            ref={camara}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => tomar(e.target.files?.[0])}
            className="sr-only"
          />
        </div>

        <label className="block">
          <span className="text-xs font-medium">
            {t("codigo")} · {t("codigoOpcional")}
          </span>
          <input
            type="text"
            name="codigo"
            maxLength={40}
            placeholder={t("codigoPlaceholder")}
            className="mt-1 w-full rounded-lg border border-borde px-3 py-2.5 text-sm outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30"
          />
        </label>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pendiente || !elegida}
        className="boton-principal mt-4 w-full disabled:opacity-60"
      >
        {pendiente ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            {t("enviando")}
          </>
        ) : (
          t("enviar")
        )}
      </button>
    </form>
  );
}
