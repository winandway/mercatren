"use client";

import { useEffect, useRef } from "react";

import { misVendedoresBloqueados } from "@/lib/moderacion/acciones";
import {
  estiloParaBloqueados,
  LLAVE_BLOQUEADOS,
} from "@/lib/moderacion/estilo-bloqueados";

/**
 * Esconde en toda la tienda las tarjetas de los vendedores que esta persona
 * bloqueó (8 nov 2026, dictamen de Google Play). Solo se monta con sesión.
 * La lista se pide UNA vez por pestaña y se guarda en sessionStorage con la
 * cuenta en la llave; bloquear o desbloquear la borra.
 */
export function EsconderBloqueados({ cuenta }: { cuenta: string }) {
  /* Se escribe directo en la hoja: sin estado, sin repintar la página. */
  const hoja = useRef<HTMLStyleElement>(null);
  const poner = (css: string) => {
    if (hoja.current) hoja.current.textContent = css;
  };

  useEffect(() => {
    const llave = `${LLAVE_BLOQUEADOS}:${cuenta}`;
    let guardado: string | null = null;
    try {
      guardado = sessionStorage.getItem(llave);
    } catch {
      guardado = null;
    }
    if (guardado !== null) {
      try {
        poner(estiloParaBloqueados(JSON.parse(guardado) as string[]));
        return;
      } catch {
        /* Lo guardado no sirve: se vuelve a pedir. */
      }
    }
    let vivo = true;
    misVendedoresBloqueados()
      .then((slugs) => {
        if (!vivo) return;
        try {
          sessionStorage.setItem(llave, JSON.stringify(slugs));
        } catch {
          /* Sin almacenamiento se pide en cada página; funciona igual. */
        }
        poner(estiloParaBloqueados(slugs));
      })
      .catch((fallo: unknown) =>
        console.error("[moderacion] no se pudo leer los bloqueados:", fallo),
      );
    return () => {
      vivo = false;
    };
  }, [cuenta]);

  return <style ref={hoja} data-bloqueados />;
}
