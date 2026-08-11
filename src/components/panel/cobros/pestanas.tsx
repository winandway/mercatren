"use client";

import { CreditCard, Landmark, Link2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Las pestañas de Cobros: de dónde vino el dinero.
 *
 * Son enlaces de verdad, no estado de React: cada pestaña es una dirección
 * propia que se puede compartir, guardar en marcadores y abrir en otra
 * ventana. Un panel de trabajo donde no se puede pasar un enlace obliga a
 * decir «entra y haz clic en la tercera pestaña».
 */
const PESTANAS = [
  { href: "/panel/cobros", clave: "tarjeta", Icono: CreditCard },
  { href: "/panel/cobros/zelle", clave: "zelle", Icono: Landmark },
  { href: "/panel/cobros/enlaces", clave: "enlaces", Icono: Link2 },
] as const;

export function PestanasCobros() {
  const t = useTranslations("panel.cobros.pestanas");
  const pathname = usePathname();

  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {PESTANAS.map(({ href, clave, Icono }) => {
        /* Coincidencia exacta: «/panel/cobros» es prefijo de todas las demás
           y con `startsWith` la primera pestaña se quedaría siempre activa. */
        const activa = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            aria-current={activa ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              activa
                ? "bg-riel-900 text-white"
                : "bg-white text-tinta-suave ring-1 ring-borde hover:ring-carga-500",
            )}
          >
            <Icono className="h-4 w-4" aria-hidden />
            {t(clave)}
          </Link>
        );
      })}
    </div>
  );
}
