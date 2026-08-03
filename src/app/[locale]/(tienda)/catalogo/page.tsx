import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ControlesCatalogo } from "@/components/catalogo/controles-catalogo";
import { TarjetaProducto } from "@/components/catalogo/tarjeta-producto";
import { Link } from "@/i18n/navigation";
import {
  listarCategoriasConProductos,
  listarComerciosDelCatalogo,
  listarProductos,
  type OrdenCatalogo,
} from "@/lib/catalogo/consultas";
import type { Idioma } from "@/lib/dinero";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalogo" });
  return { title: t("titulo"), description: t("subtitulo") };
}

type Parametros = {
  q?: string;
  categoria?: string;
  comercio?: string;
  orden?: string;
  pagina?: string;
};

export default async function PaginaCatalogo({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Parametros>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const filtros = await searchParams;
  const t = await getTranslations("catalogo");

  const [resultado, categorias, comercios] = await Promise.all([
    listarProductos({
      busqueda: filtros.q,
      categoria: filtros.categoria,
      comercio: filtros.comercio,
      orden: filtros.orden as OrdenCatalogo,
      pagina: Number(filtros.pagina) || 1,
    }),
    listarCategoriasConProductos(),
    listarComerciosDelCatalogo(),
  ]);

  const hayBusqueda = Boolean(
    filtros.q || filtros.categoria || filtros.comercio,
  );

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("titulo")}
        </h1>
        <p className="mt-1 text-sm text-tinta-suave">{t("subtitulo")}</p>
      </header>

      <ControlesCatalogo
        categorias={categorias.map((c) => ({
          valor: c.slug,
          texto: `${idioma === "en" ? (c.nombreEn ?? c.nombreEs) : c.nombreEs} (${c.cuantos})`,
        }))}
        comercios={comercios.map((c) => ({
          valor: c.slug,
          texto: `${c.nombre} (${c.cuantos})`,
        }))}
      />

      <p className="mt-5 mb-4 text-sm font-medium">
        {t("resultados", { n: resultado.total })}
      </p>

      {resultado.productos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-borde px-6 py-16 text-center text-sm text-tinta-suave">
          {hayBusqueda ? t("sinResultados") : t("vacio")}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {resultado.productos.map((producto) => (
            <li key={producto.id}>
              <TarjetaProducto producto={producto} idioma={idioma} />
            </li>
          ))}
        </ul>
      )}

      {resultado.paginas > 1 ? (
        <Paginacion
          pagina={resultado.pagina}
          paginas={resultado.paginas}
          filtros={filtros}
          textos={{
            anterior: t("paginacion.anterior"),
            siguiente: t("paginacion.siguiente"),
            posicion: t("paginacion.posicion", {
              pagina: resultado.pagina,
              paginas: resultado.paginas,
            }),
          }}
        />
      ) : null}
    </div>
  );
}

function Paginacion({
  pagina,
  paginas,
  filtros,
  textos,
}: {
  pagina: number;
  paginas: number;
  filtros: Parametros;
  textos: { anterior: string; siguiente: string; posicion: string };
}) {
  function enlace(destino: number) {
    const consulta = new URLSearchParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor && clave !== "pagina") consulta.set(clave, valor);
    }
    if (destino > 1) consulta.set("pagina", String(destino));
    const texto = consulta.toString();
    return texto ? `/catalogo?${texto}` : "/catalogo";
  }

  const estilo =
    "inline-flex items-center gap-1 rounded-lg border border-borde px-3 py-2 text-sm font-semibold transition-colors hover:border-carga-500";

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-3"
      aria-label={textos.posicion}
    >
      <Link
        href={enlace(pagina - 1)}
        aria-disabled={pagina <= 1}
        className={cn(estilo, pagina <= 1 && "pointer-events-none opacity-40")}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {textos.anterior}
      </Link>

      <span className="text-sm text-tinta-suave tabular-nums">
        {textos.posicion}
      </span>

      <Link
        href={enlace(pagina + 1)}
        aria-disabled={pagina >= paginas}
        className={cn(
          estilo,
          pagina >= paginas && "pointer-events-none opacity-40",
        )}
      >
        {textos.siguiente}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </nav>
  );
}
