"use client";

import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

import { Link } from "@/i18n/navigation";
import { contarUnidades, useCarrito } from "@/lib/carrito/store";

/**
 * El carrito del encabezado con su numerito.
 *
 * El contador solo se muestra cuando el navegador ya cargo lo que habia
 * guardado; si no, el servidor pintaria 0 y el navegador otra cosa, y React
 * avisaria de la diferencia.
 */
export function ContadorCarrito() {
  const t = useTranslations("encabezado");
  const lineas = useCarrito((estado) => estado.lineas);

  // En el servidor devuelve false y en el navegador true, sin efectos de por
  // medio: asi el primer dibujo coincide en los dos lados y React no protesta.
  const enElNavegador = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const unidades = enElNavegador ? contarUnidades(lineas) : 0;

  return (
    <Link
      href="/carrito"
      className="celda-encabezado flex items-end gap-1"
      aria-label={t("carrito")}
    >
      <span className="relative">
        <ShoppingCart className="h-7 w-7" aria-hidden />
        <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-sm font-bold text-carga-500 tabular-nums">
          {unidades}
        </span>
      </span>
      <span className="hidden text-sm font-bold sm:block">{t("carrito")}</span>
    </Link>
  );
}
