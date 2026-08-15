import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ControlesCatalogo } from "@/components/catalogo/controles-catalogo";
import { TarjetaProducto } from "@/components/catalogo/tarjeta-producto";
import { TiraDepartamentos } from "@/components/catalogo/tira-departamentos";
import { Link } from "@/i18n/navigation";
import {
  listarCategoriasConProductos,
  listarComerciosDelCatalogo,
  listarDepartamentosDePortada,
  listarProductos,
  type OrdenCatalogo,
} from "@/lib/catalogo/consultas";
import { zonaDelCliente } from "@/lib/entrega/zona-cliente";
import { ciudadesVisiblesDesde } from "@/lib/entrega/zonas";
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
  todas?: string;
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
  const tEntrega = await getTranslations("entrega");

  /**
   * EL FILTRO POR CIUDAD, igual que en la portada: quien eligió Caracas ve
   * lo que se retira en Caracas o cerca. `?todas=1` enseña el país entero
   * sin borrar la ciudad elegida.
   */
  const zona = await zonaDelCliente();
  const verTodas = filtros.todas === "1";
  const visibles =
    zona && !verTodas ? ciudadesVisiblesDesde(zona.slug) : undefined;

  const [resultado, categorias, comercios, departamentos] = await Promise.all([
    listarProductos({
      busqueda: filtros.q,
      categoria: filtros.categoria,
      comercio: filtros.comercio,
      orden: filtros.orden as OrdenCatalogo,
      pagina: Number(filtros.pagina) || 1,
      zona: visibles,
    }),
    listarCategoriasConProductos(),
    listarComerciosDelCatalogo(),
    /* LA TIRA TAMBIÉN AQUÍ DENTRO. Ver el comentario de abajo. */
    listarDepartamentosDePortada(idioma).catch(() => []),
  ]);

  const hayBusqueda = Boolean(
    filtros.q || filtros.categoria || filtros.comercio,
  );

  // Para "ver toda Venezuela" conservando la búsqueda y los filtros activos.
  const parametrosSinZona = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor && clave !== "todas" && clave !== "pagina")
      parametrosSinZona.set(clave, valor);
  }
  const haciaTodas = `/catalogo?${new URLSearchParams([...parametrosSinZona, ["todas", "1"]]).toString()}`;
  const haciaMiZona = `/catalogo${parametrosSinZona.size ? `?${parametrosSinZona.toString()}` : ""}`;

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("titulo")}
        </h1>
        <p className="mt-1 text-sm text-tinta-suave">{t("subtitulo")}</p>
      </header>

      {/**
       * LA TIRA DE DEPARTAMENTOS SE QUEDA AL ENTRAR.
       *
       * Antes solo salía en la portada: se tocaba un departamento, se entraba
       * al catálogo, y **la tira desaparecía**. Para ir a otro había que
       * devolverse con el botón de atrás del navegador.
       *
       * Eso es un callejón sin salida en el segundo clic, justo para quien
       * navega por gusto — que es quien más termina comprando. Ahora se queda,
       * con el departamento donde estás marcado en naranja.
       */}
      {departamentos.length > 0 ? (
        <div className="mb-6 border-b border-borde pb-5">
          <TiraDepartamentos
            departamentos={departamentos}
            activo={filtros.categoria}
          />
        </div>
      ) : null}

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

      <p className="mt-5 mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm font-medium">
        {t("resultados", { n: resultado.total })}
        {/* La franja del filtro: que se sepa que esto está acotado a su zona,
            con la puerta a ver el país entero sin perder su ciudad. */}
        {visibles && zona ? (
          <>
            <span className="font-normal text-tinta-suave">
              {tEntrega("viendoZona", { ciudad: zona.nombre })}
            </span>
            <Link
              href={haciaTodas}
              className="font-semibold text-riel-700 underline-offset-2 hover:text-carga-600 hover:underline"
            >
              {tEntrega("verTodaVenezuela")}
            </Link>
          </>
        ) : null}
        {verTodas && zona ? (
          <Link
            href={haciaMiZona}
            className="font-semibold text-riel-700 underline-offset-2 hover:text-carga-600 hover:underline"
          >
            {tEntrega("volverAMiZona", { ciudad: zona.nombre })}
          </Link>
        ) : null}
      </p>

      {resultado.productos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-borde px-6 py-16 text-center text-sm text-tinta-suave">
          {visibles && zona ? (
            <>
              <p className="font-semibold text-tinta">
                {tEntrega("sinComerciosTitulo", { ciudad: zona.nombre })}
              </p>
              <p className="mx-auto mt-1 max-w-md">
                {tEntrega("sinComerciosCatalogo")}
              </p>
              <Link
                href={haciaTodas}
                className="mt-3 inline-block font-semibold text-riel-700 underline underline-offset-2 hover:text-carga-600"
              >
                {tEntrega("verTodaVenezuela")}
              </Link>
            </>
          ) : (
            <p>{hayBusqueda ? t("sinResultados") : t("vacio")}</p>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
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
