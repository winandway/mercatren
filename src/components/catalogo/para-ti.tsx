"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { FilaProductos } from "@/components/catalogo/fila-productos";
import { TarjetaProducto } from "@/components/catalogo/tarjeta-producto";
import { Link } from "@/i18n/navigation";
import {
  categoriaDominante,
  sinLoYaVisto,
  type Afinidad,
} from "@/lib/catalogo/afinidad";
import type { ProductoLista } from "@/lib/catalogo/consultas";
import { useHistorial } from "@/lib/catalogo/historial-store";
import type { Idioma } from "@/lib/dinero";

/**
 * «MÁS DE LO QUE ESTABAS MIRANDO» — la banda que sigue el interés de la persona.
 *
 * Si abrió dos pintalabios, al volver a la portada encuentra más pintalabios;
 * si después abrió dos pares de zapatos, encuentra zapatos. La regla de cuál
 * categoría manda está en `afinidad.ts` (pura, con pruebas); aquí solo se
 * lee el historial, se pide esa categoría y se dibuja.
 *
 * ══ TRES COSAS A PROPÓSITO ══
 *
 *  - **No dibuja nada hasta que hay señal.** Una visita suelta no es una
 *    intención. Sin dos fichas de la misma categoría, la portada se queda
 *    como siempre: mejor nada que una banda al azar con un título que promete.
 *  - **Quita lo que ya abrió.** Enseñarle el mismo producto otra vez no vende.
 *  - **Pide por `/datos/catalogo`, como la parrilla infinita**, con la misma
 *    lógica de mercado y de zona que todo el catálogo: no hay un camino
 *    aparte que se pueda quedar atrás.
 */
export function ParaTi({ idioma }: { idioma: Idioma }) {
  const t = useTranslations("afinidad");
  const vistas = useHistorial((s) => s.vistas);

  /* La afinidad se DERIVA del historial durante el renderizado, no se copia a
     un estado en un efecto (el lint lo rechaza, y con razón: sería un segundo
     renderizado en cascada). En el servidor el historial está vacío y no hay
     banda; en el navegador se decide al momento. */
  const afinidad: Afinidad | null = useMemo(
    () => categoriaDominante(vistas),
    [vistas],
  );
  const slugAfin = afinidad?.slug ?? null;

  /* Lo cargado va ATADO a la categoría que lo pidió: si la afinidad cambia,
     lo viejo deja de coincidir y no se dibuja, sin tener que «limpiar» nada. */
  const [cargado, setCargado] = useState<{
    slug: string;
    lista: ProductoLista[];
  } | null>(null);

  useEffect(() => {
    if (!slugAfin) return;
    let vivo = true;
    const semilla = (Date.now() % 100_000) | 0;
    fetch(
      `/datos/catalogo?categoria=${encodeURIComponent(slugAfin)}&todas=1&limite=14&semilla=${semilla}`,
    )
      .then((r): Promise<{ productos?: ProductoLista[] }> =>
        r.ok ? r.json() : Promise.resolve({ productos: [] }),
      )
      .then((d) => {
        if (!vivo) return;
        setCargado({ slug: slugAfin, lista: d.productos ?? [] });
      })
      .catch(() => {
        if (vivo) setCargado({ slug: slugAfin, lista: [] });
      });
    return () => {
      vivo = false;
    };
  }, [slugAfin]);

  if (!afinidad || !cargado || cargado.slug !== afinidad.slug) return null;

  /* Quitar lo que ya abrió se calcula aquí, con el historial de ahora. Con
     menos de tres no vale la pena una banda: parece un error. */
  const productos = sinLoYaVisto(cargado.lista, vistas).slice(0, 12);
  if (productos.length < 3) return null;

  const nombre = afinidad.nombre ?? afinidad.slug;

  return (
    <section
      aria-label={t("titulo", { categoria: nombre })}
      className="mx-auto max-w-[1500px] px-4 py-6 sm:py-8"
    >
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wider text-carga-600 uppercase">
            {t("porque")}
          </p>
          <h2 className="text-lg font-bold sm:text-xl">
            {t("titulo", { categoria: nombre })}
          </h2>
        </div>
        <Link
          href={`/catalogo?categoria=${encodeURIComponent(afinidad.slug)}`}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-riel-900 hover:text-carga-600"
        >
          {t("verTodo")}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <FilaProductos
        etiquetaAnterior={t("anterior")}
        etiquetaSiguiente={t("siguiente")}
      >
        {productos.map((p) => (
          <div key={p.id} className="w-44 shrink-0 snap-start sm:w-52">
            <TarjetaProducto producto={p} idioma={idioma} />
          </div>
        ))}
      </FilaProductos>
    </section>
  );
}
