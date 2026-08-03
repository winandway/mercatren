import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Logo oficial de Mercatren.
 *
 * Los archivos viven en public/logo_mercatren. Las versiones "-oscuro" son las
 * que se usan SOBRE fondo azul (el texto va en blanco); las normales van sobre
 * fondo claro.
 */

const ARCHIVOS = {
  horizontal: "/logo_mercatren/mercatren-isologotipo-horizontal.svg",
  horizontalOscuro:
    "/logo_mercatren/mercatren-isologotipo-horizontal-oscuro.svg",
  horizontalCom: "/logo_mercatren/mercatren-isologotipo-horizontal-com.svg",
  horizontalComOscuro:
    "/logo_mercatren/mercatren-isologotipo-horizontal-com-oscuro.svg",
  isotipo: "/logo_mercatren/mercatren-isotipo.svg",
  isotipoOscuro: "/logo_mercatren/mercatren-isotipo-oscuro.svg",
} as const;

export function Logo({
  className,
  variante = "horizontalOscuro",
  ancho = 168,
  alto = 38,
  prioridad = false,
}: {
  className?: string;
  variante?: keyof typeof ARCHIVOS;
  ancho?: number;
  alto?: number;
  prioridad?: boolean;
}) {
  return (
    <Image
      src={ARCHIVOS[variante]}
      alt="Mercatren"
      width={ancho}
      height={alto}
      priority={prioridad}
      unoptimized
      // La altura manda y el ancho se acomoda solo: asi el logo nunca se
      // deforma ni se come el encabezado en celular.
      className={cn("h-8 w-auto", className)}
    />
  );
}
