import {
  Baby,
  Bike,
  Briefcase,
  Car,
  Dog,
  Dumbbell,
  Factory,
  Flower2,
  Hammer,
  HeartPulse,
  Laptop,
  Package,
  PaintRoller,
  Refrigerator,
  Shirt,
  Smartphone,
  Sofa,
  Sparkles,
  ToyBrick,
  Tv,
  Utensils,
  Watch,
  Wheat,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { DepartamentoDePortada } from "@/lib/catalogo/consultas";

/**
 * Los departamentos, en UNA SOLA LÍNEA que se desliza al lado.
 *
 * Antes esto era una parrilla centrada de veintitrés círculos y se comía dos
 * pantallas de teléfono enteras: al entrar no se veía ni un producto. Los
 * primeros tres segundos deciden si alguien se queda, y lo que tiene que ver
 * en esos tres segundos es mercancía, no un índice.
 *
 * Así que la navegación se aplana a una tira de sesenta píxeles. Sigue estando
 * todo — nadie pierde un departamento — pero deja de tapar la tienda.
 *
 * EL ÚLTIMO CÍRCULO SE VE CORTADO a propósito. Una fila que termina justo en
 * el borde parece que se acabó; una que enseña medio círculo más dice "sigue
 * al lado" sin escribirlo.
 *
 * SIEMPRE EL ICONO, NUNCA UNA FOTO DE PRODUCTO: la imagen de un departamento
 * de Mercatren no puede depender de qué subió un comercio ese día.
 */

const ICONOS = {
  Hammer,
  PaintRoller,
  Car,
  Bike,
  Smartphone,
  Laptop,
  Tv,
  Refrigerator,
  Sofa,
  Utensils,
  Sparkles,
  HeartPulse,
  Baby,
  Shirt,
  Watch,
  Dumbbell,
  ToyBrick,
  Dog,
  Flower2,
  Briefcase,
  Wheat,
  Factory,
  Package,
} as const;

export function TiraDepartamentos({
  departamentos,
}: {
  departamentos: DepartamentoDePortada[];
}) {
  return (
    <nav
      className="-mx-4 [scrollbar-width:none] overflow-x-auto px-4 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      // El deslizamiento se queda dentro de la tira: sin esto, al llegar al
      // final el teléfono empieza a mover la página entera y marea.
      style={{ overscrollBehaviorX: "contain" }}
    >
      <ul className="flex w-max gap-3 pb-1">
        {departamentos.map((d) => {
          const Icono = ICONOS[d.icono as keyof typeof ICONOS] ?? Hammer;

          return (
            <li key={d.slug} className="w-[72px] shrink-0">
              <Link
                href={`/catalogo?categoria=${d.slug}`}
                className="group flex flex-col items-center gap-1.5 text-center"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-riel-900 ring-1 ring-riel-900/10 transition-all group-hover:ring-2 group-hover:ring-carga-500">
                  <Icono
                    className="h-5 w-5 text-carga-400 transition-transform group-hover:scale-110"
                    aria-hidden
                  />
                </span>
                <span className="line-clamp-2 text-[11px] leading-tight font-medium text-tinta-suave group-hover:text-carga-600">
                  {d.nombre}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
