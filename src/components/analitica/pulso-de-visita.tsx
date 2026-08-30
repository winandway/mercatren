"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * EL PULSO: cada página vista y cuánto se estuvo en ella (30 ago 2026).
 *
 * Vive en el layout de la tienda — el panel no se mide. Manda el aviso al
 * cambiar de ruta y, al esconderse la página, el tiempo que estuvo
 * (sendBeacon: es lo único que sobrevive al cierre de la pestaña). Los
 * robots no ejecutan esto, que es justo el primer filtro.
 */
export function PulsoDeVisita() {
  const ruta = usePathname();
  /* Sin Date.now() en el render (regla del compilador de React): el reloj
     arranca dentro del efecto, que es donde de verdad empieza la visita. */
  const visita = useRef<{ id: string | null; desde: number }>({
    id: null,
    desde: 0,
  });

  useEffect(() => {
    let vivo = true;

    function cerrar() {
      const { id, desde } = visita.current;
      if (!id) return;
      const segundos = Math.round((Date.now() - desde) / 1000);
      try {
        navigator.sendBeacon(
          "/datos/visita",
          new Blob([JSON.stringify({ visitaId: id, segundos })], {
            type: "application/json",
          }),
        );
      } catch {
        /* Medir jamás estorba la visita. */
      }
    }

    /* La página anterior se cierra al navegar a la nueva. */
    cerrar();
    visita.current = { id: null, desde: Date.now() };

    void fetch("/datos/visita", {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ruta,
        referido: document.referrer || undefined,
      }),
    })
      .then((r) => r.json() as Promise<{ id?: string }>)
      .then((r) => {
        if (vivo && r?.id) visita.current.id = r.id;
      })
      .catch(() => null);

    const alEsconder = () => {
      if (document.visibilityState === "hidden") cerrar();
    };
    document.addEventListener("visibilitychange", alEsconder);
    window.addEventListener("pagehide", cerrar);
    return () => {
      vivo = false;
      document.removeEventListener("visibilitychange", alEsconder);
      window.removeEventListener("pagehide", cerrar);
    };
  }, [ruta]);

  return null;
}
