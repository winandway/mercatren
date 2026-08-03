import { Package } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Idioma } from "@/lib/dinero";

type Categoria = {
  slug: string;
  nombreEs: string;
  nombreEn: string | null;
  cuantos: number;
  imagenUrl: string | null;
};

/**
 * Las categorias en circulos, arriba del todo.
 *
 * Es lo primero que toca la gente cuando entra sin saber que busca: se ve de
 * un golpe que hay y en un clic esta dentro.
 */
export function CirculosCategorias({
  categorias,
  idioma,
}: {
  categorias: Categoria[];
  idioma: Idioma;
}) {
  if (categorias.length === 0) return null;

  return (
    <ul className="flex [scrollbar-width:none] gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] sm:gap-6 [&::-webkit-scrollbar]:hidden">
      {categorias.map((categoria) => {
        const nombre =
          idioma === "en"
            ? (categoria.nombreEn ?? categoria.nombreEs)
            : categoria.nombreEs;

        return (
          <li key={categoria.slug} className="shrink-0">
            <Link
              href={`/catalogo?categoria=${categoria.slug}`}
              className="group flex w-[88px] flex-col items-center gap-2 text-center sm:w-28"
            >
              <span className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-borde transition-all group-hover:ring-2 group-hover:ring-carga-500 sm:h-28 sm:w-28">
                {categoria.imagenUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={categoria.imagenUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <Package className="h-8 w-8 text-tinta-suave" aria-hidden />
                )}
              </span>
              <span className="text-xs leading-tight font-semibold group-hover:text-carga-600 sm:text-sm">
                {nombre}
              </span>
              <span className="-mt-1.5 text-[11px] text-tinta-suave">
                {categoria.cuantos}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
