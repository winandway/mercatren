"use client";

import { useEffect } from "react";

import { useHistorial } from "@/lib/catalogo/historial-store";

/**
 * Anota que la persona abrió esta ficha. No dibuja nada.
 *
 * Va como componente y no como efecto suelto en la página porque la ficha es
 * un componente de servidor: esto es lo único que corre en el navegador.
 */
export function RegistrarVisita({
  slug,
  categoriaSlug,
  categoriaNombre,
  tiendaSlug,
}: {
  slug: string;
  categoriaSlug: string | null;
  categoriaNombre: string | null;
  tiendaSlug: string;
}) {
  const registrar = useHistorial((s) => s.registrar);

  useEffect(() => {
    console.log("[DEPURAR historial] efecto registrar", slug);
    registrar({ slug, categoriaSlug, categoriaNombre, tiendaSlug });
  }, [registrar, slug, categoriaSlug, categoriaNombre, tiendaSlug]);

  return null;
}
