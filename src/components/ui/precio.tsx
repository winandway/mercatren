import { useLocale } from "next-intl";

import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { cn } from "@/lib/utils";

/**
 * Muestra un precio guardado en centavos.
 * Nunca se le pasan decimales: el dinero viaja en enteros de punta a punta.
 */
export function Precio({
  centavos,
  moneda = "USD",
  className,
}: {
  centavos: number;
  moneda?: string;
  className?: string;
}) {
  const idioma = useLocale() as Idioma;

  return (
    <span className={cn("font-semibold tabular-nums", className)}>
      {formatearPrecio(centavos, idioma, moneda)}
    </span>
  );
}
