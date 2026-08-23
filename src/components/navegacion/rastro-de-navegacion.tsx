"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { anotarRuta } from "@/lib/navegacion/rastro";

/** Anota cada cambio de ruta en el rastro de la pestaña. No dibuja nada. */
export function RastroDeNavegacion() {
  const ruta = usePathname();
  useEffect(() => {
    if (ruta) anotarRuta(window.sessionStorage, ruta);
  }, [ruta]);
  return null;
}
