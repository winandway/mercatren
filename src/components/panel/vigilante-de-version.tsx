"use client";

import { useEffect } from "react";

import { recargarSiEsVersionVieja } from "@/lib/version-vieja";

/**
 * EL QUE ATRAPA «la acción ya no existe» AUNQUE NADIE LA HAYA ATRAPADO.
 *
 * Los botones que llaman a una acción dentro de un `try` ya se recuperan solos.
 * Pero hay muchos que no la envuelven —los formularios, los que usan
 * `useTransition` a secas— y ahí el fallo sube hasta la ventana y termina en la
 * pantalla roja de Next, con un texto que no le dice nada a nadie.
 *
 * Esto escucha los dos caminos por los que puede llegar un fallo sin atrapar
 * —el error normal y la promesa rechazada— y, si es de versión vieja, recarga.
 * Una sola vez: la marca en `sessionStorage` impide el bucle.
 *
 * **Solo en el panel**, que es donde el equipo tiene pestañas abiertas durante
 * horas mientras se publica. En la tienda, un comprador no suele tener la
 * pestaña abierta cruzando un despliegue, y una recarga inesperada en medio de
 * un checkout asusta más de lo que arregla.
 */
export function VigilanteDeVersion() {
  useEffect(() => {
    function alFallar(e: ErrorEvent) {
      recargarSiEsVersionVieja(e.error ?? e.message);
    }

    function alRechazar(e: PromiseRejectionEvent) {
      recargarSiEsVersionVieja(e.reason);
    }

    window.addEventListener("error", alFallar);
    window.addEventListener("unhandledrejection", alRechazar);

    return () => {
      window.removeEventListener("error", alFallar);
      window.removeEventListener("unhandledrejection", alRechazar);
    };
  }, []);

  return null;
}
