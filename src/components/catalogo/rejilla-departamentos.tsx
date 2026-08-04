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
  Package,
  Laptop,
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
 * Los departamentos de Mercatren, en el centro de la portada.
 *
 * SALEN TODOS, tengan productos o no. Un departamento vacío no es un hueco:
 * es el cartel que le dice a quien llega "aquí se pueden vender motos". Si
 * solo enseñáramos los que ya tienen productos, la portada le contaría al
 * vendedor nuevo que esto es una ferretería y se iría.
 *
 * SIEMPRE EL ICONO, NUNCA UNA FOTO DE PRODUCTO. Se probó sacando una foto
 * real del departamento y quedaba mal: entre veintiún círculos iguales, uno
 * con la foto de una lámina de zinc de un comercio rompía la fila entera. Y
 * peor que feo: la imagen de un departamento de Mercatren acababa dependiendo
 * de qué producto hubiera subido un cliente ese día. Esta parte del sitio es
 * nuestra y la controlamos nosotros.
 *
 * Lo que sí cambia es el pie: el que tiene productos enseña cuántos, el que
 * no dice "Próximamente".
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

export function RejillaDepartamentos({
  departamentos,
  textoVacio,
}: {
  departamentos: DepartamentoDePortada[];
  /** Lo que se dice de un departamento que todavía no tiene nada. */
  textoVacio: string;
}) {
  return (
    <ul className="mx-auto grid max-w-5xl grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
      {departamentos.map((d) => {
        const Icono = ICONOS[d.icono as keyof typeof ICONOS] ?? Hammer;
        const tiene = d.cuantos > 0;

        return (
          <li key={d.slug}>
            <Link
              href={`/catalogo?categoria=${d.slug}`}
              className="group flex flex-col items-center gap-2 text-center"
            >
              <span className="relative flex aspect-square w-full max-w-[104px] items-center justify-center rounded-full bg-riel-900 ring-1 ring-riel-900/10 transition-all group-hover:ring-2 group-hover:ring-carga-500">
                <Icono
                  className="h-8 w-8 text-carga-400 transition-transform duration-300 group-hover:scale-110"
                  aria-hidden
                />
              </span>

              <span className="min-w-0">
                <span className="block text-xs leading-tight font-semibold text-balance group-hover:text-carga-600 sm:text-sm">
                  {d.nombre}
                </span>
                <span className="mt-0.5 block text-[11px] text-tinta-suave tabular-nums">
                  {tiene ? d.cuantos : textoVacio}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
