"use client";

import { useEffect, useId, useRef } from "react";

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
 *
 * POR QUÉ EL GUION SE CARGA A MANO Y NO CON `<Script>` DE NEXT (6 ago 2026)
 *
 * La primera versión usaba `<Script onReady={...}>`. Funcionaba al entrar
 * directo a la dirección, y NO funcionaba al llegar desde otra página del
 * sitio: en una navegación de cliente, Next no vuelve a insertar el guion y
 * `onReady` no dispara nunca. El recuadro no se dibujaba, el formulario se
 * quedaba sin pase, y con el escudo exigido del lado del servidor eso es la
 * entrada cerrada para todo el mundo.
 *
 * No se había visto porque el escudo nunca había corrido con claves cargadas.
 * Se descubrió al probarlo con las claves de prueba de Cloudflare.
 *
 * Ahora se carga el guion a mano y se dibuja en cuanto la API está disponible,
 * venga de donde venga la persona. El reloj de respaldo cubre el caso de que
 * el guion ya estuviera en la página de una visita anterior, cuando ni `load`
 * ni `onReady` van a volver a dispararse.
 */

const GUION =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

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
  const dibujado = useRef(false);
  const id = useId();

  /* El aviso se guarda en una ref para que el efecto no se vuelva a lanzar si
     el formulario pasa una función nueva en cada render. Si se relanzara,
     dibujaría el recuadro dos veces.

     Se actualiza en su propio efecto, no durante el render: tocar una ref
     mientras React está pintando es de las cosas que funcionan hasta que un
     día dejan de hacerlo. */
  const avisar = useRef(onPase);
  useEffect(() => {
    avisar.current = onPase;
  }, [onPase]);

  useEffect(() => {
    if (!claveSitio) return;

    let cancelado = false;

    function dibujar() {
      if (cancelado || dibujado.current) return;
      if (!caja.current || !window.turnstile) return;

      dibujado.current = true;
      window.turnstile.render(caja.current, {
        sitekey: claveSitio!,
        language: idioma,
        callback: (pase) => avisar.current(pase),
        // Si el pase caduca o falla, se borra: el formulario vuelve a pedirlo.
        "expired-callback": () => avisar.current(null),
        "error-callback": () => avisar.current(null),
      });
    }

    // Si ya está cargada (se volvió a esta pantalla), se dibuja y listo.
    if (window.turnstile) {
      dibujar();
      return;
    }

    const puesto = document.querySelector<HTMLScriptElement>(
      `script[src="${GUION}"]`,
    );

    if (!puesto) {
      const guion = document.createElement("script");
      guion.src = GUION;
      guion.async = true;
      guion.addEventListener("load", dibujar);
      document.head.appendChild(guion);
    } else {
      puesto.addEventListener("load", dibujar);
    }

    /* RESPALDO. Si el guion ya estaba en la página de una visita anterior, su
       evento `load` ya pasó y no vuelve: sin esto el recuadro no aparecería
       nunca. Se mira cada poco durante diez segundos y se deja de mirar en
       cuanto dibuja. */
    const reloj = setInterval(() => {
      if (window.turnstile) {
        clearInterval(reloj);
        dibujar();
      }
    }, 150);
    const corte = setTimeout(() => clearInterval(reloj), 10_000);

    return () => {
      cancelado = true;
      clearInterval(reloj);
      clearTimeout(corte);
    };
  }, [claveSitio, idioma]);

  if (!claveSitio) return null;

  /* `data-escudo` no es decoración: es lo que permite comprobar desde fuera
     —una prueba, la consola del navegador— que el recuadro está puesto y si
     llegó a dibujarse. Sin él hay que adivinar buscando por clase de estilo. */
  return <div ref={caja} id={id} data-escudo className="min-h-[65px]" />;
}
