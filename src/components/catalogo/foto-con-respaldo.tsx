"use client";

import { ImageOff } from "lucide-react";
import { useState } from "react";

/**
 * UNA FOTO QUE, SI NO CARGA, ENSEÑA «SIN FOTO» EN VEZ DEL TÍTULO DESPARRAMADO.
 *
 * Lo destapó el dueño con una captura de la portada (3 sep 2026): el servidor
 * de fotos del comercio piloto falla a ratos, y cuando falla el navegador
 * pinta el texto alternativo en el hueco de la imagen — tres tarjetas con el
 * título en grande donde iba la foto, y la portada entera con cara de rota.
 *
 * Las fotos se están copiando a nuestro bucket (ver `fotos-reglas.ts`), pero
 * cada comercio nuevo llega con las suyas en su servidor: esto vale para
 * siempre. Es un componente de cliente porque `onError` solo existe ahí.
 */
export function FotoConRespaldo({
  src,
  alt,
  className,
  textoSinFoto,
  loading = "lazy",
}: {
  src: string;
  alt: string;
  className?: string;
  textoSinFoto: string;
  loading?: "lazy" | "eager";
}) {
  const [rota, setRota] = useState(false);

  if (rota) {
    return (
      <span
        role="img"
        aria-label={alt}
        className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg bg-slate-50 text-tinta-suave"
      >
        <ImageOff className="h-7 w-7" aria-hidden />
        <span className="text-xs">{textoSinFoto}</span>
      </span>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => setRota(true)}
    />
  );
}
