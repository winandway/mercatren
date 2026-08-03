"use client";

import { Loader2, LogOut } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

/**
 * Salir de la sesion.
 *
 * FALTABA POR COMPLETO: se podia entrar pero no salir. En una computadora
 * compartida —o en una demostracion delante de un cliente— eso significa que
 * la siguiente persona que abra el navegador entra al panel con todo el dinero
 * de los comercios a la vista.
 *
 * Se hace bien:
 * 1. Se le avisa al servidor, que borra la sesion de la base. Asi no queda
 *    viva por si alguien copio la cookie.
 * 2. Se recarga la pagina entera desde el servidor, no una navegacion de
 *    cliente: el encabezado, el menu lateral y el panel se arman de nuevo sin
 *    sesion. Con una navegacion de cliente el boton de "Panel" seguiria
 *    ahi, como si nada hubiera pasado.
 *
 * Si el aviso al servidor falla, se sale igual: quedarse dentro por un error
 * de red es peor que salir.
 */
export function Salir({
  variante = "boton",
  className,
}: {
  /** "boton" para la pagina de cuenta; "enlace" para menus. */
  variante?: "boton" | "enlace";
  className?: string;
}) {
  const t = useTranslations("cuenta");
  const idioma = useLocale();
  const [saliendo, setSaliendo] = useState(false);

  async function salir() {
    setSaliendo(true);
    try {
      await authClient.signOut();
    } catch {
      // Se sale igual: ver el comentario de arriba.
    }
    window.location.assign(`/${idioma}`);
  }

  return (
    <button
      type="button"
      onClick={salir}
      disabled={saliendo}
      className={cn(
        variante === "boton"
          ? "inline-flex items-center gap-2 rounded-lg border border-borde bg-white px-4 py-2 text-sm font-semibold transition-colors hover:border-red-300 hover:text-red-700"
          : "inline-flex items-center gap-2 text-sm font-semibold",
        saliendo && "opacity-60",
        className,
      )}
    >
      {saliendo ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <LogOut className="h-4 w-4" aria-hidden />
      )}
      {saliendo ? t("saliendo") : t("salir")}
    </button>
  );
}
