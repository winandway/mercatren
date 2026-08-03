"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";

/**
 * Escudo anti-robots de la entrada (Cloudflare Turnstile).
 *
 * POR QUE: sin esto, cualquiera puede lanzar un programa que pruebe miles de
 * contrasenas por minuto contra /entrar hasta acertar una. Y las cuentas que
 * hay detras no son de un foro: son las que ven el dinero de los comercios y
 * los datos de quienes pagaron.
 *
 * Turnstile no le pide nada al usuario en el caso normal —ni fotos de
 * semaforos ni letras torcidas—: mira como se comporta el navegador y suelta
 * un pase. Solo pone un reto cuando algo huele raro.
 *
 * SE APAGA SOLO SI NO ESTA CONFIGURADO. Sin la clave publica, este componente
 * no dibuja nada y la entrada funciona como siempre. Preferimos eso a dejar a
 * la gente afuera por una variable sin cargar; el servidor tampoco exige el
 * pase si no tiene con que comprobarlo.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (
        elemento: HTMLElement,
        opciones: {
          sitekey: string;
          callback: (pase: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          language?: string;
        },
      ) => string;
      reset: (id?: string) => void;
    };
  }
}

export function Escudo({
  claveSitio,
  idioma,
  onPase,
}: {
  claveSitio?: string;
  idioma: string;
  onPase: (pase: string | null) => void;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const [listo, setListo] = useState(false);
  const dibujado = useRef(false);
  const id = useId();

  useEffect(() => {
    if (!claveSitio || !listo || dibujado.current || !caja.current) return;
    if (!window.turnstile) return;

    dibujado.current = true;
    window.turnstile.render(caja.current, {
      sitekey: claveSitio,
      language: idioma,
      callback: (pase) => onPase(pase),
      // Si el pase caduca o falla, se borra: el formulario vuelve a pedirlo.
      "expired-callback": () => onPase(null),
      "error-callback": () => onPase(null),
    });
  }, [claveSitio, listo, idioma, onPase]);

  if (!claveSitio) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={() => setListo(true)}
      />
      <div ref={caja} id={id} className="min-h-[65px]" />
    </>
  );
}
