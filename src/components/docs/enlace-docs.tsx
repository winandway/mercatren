"use client";

import { usePathname } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Un enlace de la barra de Docs que SABE si es la página actual y se resalta
 * (`aria-current="page"`). Como en cualquier menú de administración: tocas a
 * la izquierda, cambia la derecha, y el menú te sigue diciendo dónde estás.
 */
export function EnlaceDocs({
  href,
  externo,
  children,
}: {
  href: string;
  externo?: boolean;
  children: React.ReactNode;
}) {
  const ruta = usePathname() ?? "";
  /* El pathname trae el idioma delante (/es/como-funciona). */
  const sinIdioma = ruta.replace(/^\/(es|en)(?=\/|$)/, "") || "/";
  const activo = !externo && sinIdioma === href;
  const clases = cn(
    "block rounded-md px-2 py-1 text-sm leading-snug transition-colors",
    activo
      ? "bg-carga-500/10 font-semibold text-carga-600"
      : "text-tinta hover:bg-slate-50 hover:text-carga-600",
  );
  if (externo) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={clases}
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={clases}
    >
      {children}
    </Link>
  );
}
