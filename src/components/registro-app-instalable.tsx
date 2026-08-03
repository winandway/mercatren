"use client";

import { useEffect } from "react";

/**
 * Prende el trabajador que hace de Mercatren una aplicacion instalable.
 *
 * Solo corre en el sitio publicado: en desarrollo estorba, porque serviria
 * archivos viejos mientras se programa.
 */
export function RegistroAppInstalable() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const registrar = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Si falla, el sitio sigue funcionando normal: no se le avisa al usuario.
      });
    };

    if (document.readyState === "complete") {
      registrar();
    } else {
      window.addEventListener("load", registrar, { once: true });
      return () => window.removeEventListener("load", registrar);
    }
  }, []);

  return null;
}
