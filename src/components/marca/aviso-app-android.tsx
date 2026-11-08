"use client";

import { X } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { ofrecerLaApp } from "@/lib/app-android/google-play";

const LLAVE = "mercatren-aviso-app-cerrado";

/* El entorno no cambia mientras la página está abierta. */
function sinCambios(): () => void {
  return () => {};
}

function decidir(): boolean {
  let cerradoAntes = false;
  try {
    cerradoAntes = window.localStorage.getItem(LLAVE) === "1";
  } catch {
    /* Navegación privada: se ofrece, y la X lo cierra en esta visita. */
  }
  return ofrecerLaApp({
    agente: navigator.userAgent,
    referente: document.referrer,
    pantallaCompleta: window.matchMedia("(display-mode: standalone)").matches,
    cerradoAntes,
  });
}

/**
 * EL AVISO DISCRETO EN ANDROID (8 nov 2026). Una franja abajo, solo en
 * celulares Android, con el distintivo de Google Play y una X. No tapa nada
 * importante, no reaparece después de cerrarla y no sale dentro de la app.
 * Lo de «ya lo cerró» se recuerda en este navegador: es una comodidad de
 * quien mira, no un dato que haga falta guardar.
 */
export function AvisoAppAndroid({
  ficha,
  insignia,
  textos,
}: {
  ficha: string;
  insignia: { src: string; ancho: number; alto: number };
  textos: { titulo: string; texto: string; alt: string; cerrar: string };
}) {
  /* Se decide en el navegador: en el servidor no hay celular que mirar. */
  const ofrecer = useSyncExternalStore(sinCambios, decidir, () => false);
  const [cerrado, setCerrado] = useState(false);

  if (!ofrecer || cerrado) return null;

  function cerrar() {
    setCerrado(true);
    try {
      window.localStorage.setItem(LLAVE, "1");
    } catch {
      /* Sin almacenamiento: queda cerrado hasta recargar. */
    }
  }

  return (
    <>
      {/* El hueco que ocupa la franja: así no tapa el final del pie. */}
      <div aria-hidden className="h-16" />
      <div
        role="region"
        aria-label={textos.titulo}
        data-aviso-app
        data-solo-pantalla
        className="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-white/95 shadow-[0_-4px_16px_rgba(16,38,58,0.12)] backdrop-blur"
      >
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{textos.titulo}</p>
            <p className="truncate text-xs text-tinta-suave">{textos.texto}</p>
          </div>
          <a href={ficha} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element -- el distintivo oficial, tal cual */}
            <img
              src={insignia.src}
              alt={textos.alt}
              width={insignia.ancho}
              height={insignia.alto}
              className="h-10 w-auto"
            />
          </a>
          <button
            type="button"
            onClick={cerrar}
            aria-label={textos.cerrar}
            className="rounded-full p-1.5 text-tinta-suave hover:bg-slate-100"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </>
  );
}
