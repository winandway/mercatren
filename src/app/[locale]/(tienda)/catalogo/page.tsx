import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ControlesCatalogo } from "@/components/catalogo/controles-catalogo";
import { ParrillaInfinita } from "@/components/catalogo/parrilla-infinita";
import { bannersPara } from "@/lib/banners/consultas";
import { TiraDepartamentos } from "@/components/catalogo/tira-departamentos";
import { Link } from "@/i18n/navigation";
import {
  listarCategoriasConProductos,
  listarComerciosDelCatalogo,
  listarDepartamentosDePortada,
  listarProductos,
  type OrdenCatalogo,
} from "@/lib/catalogo/consultas";
import { consultaDeLista } from "@/lib/catalogo/seguir-bajando";
import { mercadoDeLaPeticion } from "@/lib/mercado/repositorio";
import { zonaDelCliente } from "@/lib/entrega/zona-cliente";
import { ciudadesVisiblesDesde } from "@/lib/entrega/zonas";
import type { Idioma } from "@/lib/dinero";

/**
 * ══ EL EQUIPO ENCUENTRA LO QUE ESTÁ EN REVISIÓN (9 sep 2026) ══
 *
 * Richard: «dame la posibilidad de buscarlos en el buscador y poderlos
 * encontrar, no importa que no estén disponibles». Solo al BUSCAR y solo con
 * sesión del equipo: al pasear por departamentos no se mezclan 45.000 fichas
 * en revisión con las publicadas. El público, Google, el mapa del sitio y el
 * feed siguen viendo únicamente lo publicado.
 */
async function buscandoComoEquipo(q: string | undefined): Promise<boolean> {
  if (!q) return false;
  const { esEquipoInterno } = await import("@/lib/autorizacion");
  return esEquipoInterno().catch(() => false);
}
import { metaDeCatalogo } from "@/lib/seo/meta";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Parametros>;
}): Promise<Metadata> {
  const { locale } = await params;
  const filtros = await searchParams;
  const t = await getTranslations({ locale, namespace: "catalogo" });
  const base = { title: t("titulo"), description: t("subtitulo") };

  /* Con búsqueda o departamento, el título dice qué se está viendo y cuántos
     hay: «Ropa y calzado: 40 productos» posiciona; «Catálogo» a secas, no.
     Si la base no contesta, salen los textos fijos de siempre. */
  if (!filtros.q && !filtros.categoria && !filtros.comercio) return base;

  /* ══ BUSCANDO, EL TÍTULO NO CONSULTA LA BASE (20 sep 2026) ══
     Esto corría la búsqueda ENTERA una segunda vez —conteo y orden incluidos—
     solo para escribir «12 productos para…» en la descripción de la pestaña.
     Con `porPagina: 6` no coincidía con la de la página, así que nada la
     compartía: cada visita a `?q=` recorría el catálogo el doble. Y la página
     de resultados de un buscador interno no se indexa (Google lo pide así), de
     modo que esa descripción no la leía nadie. */
  if (filtros.q) {
    const busqueda = filtros.q.slice(0, 80);
    const en = locale === "en";
    return {
      title: en ? `Results for “${busqueda}”` : `Resultados para «${busqueda}»`,
      description: base.description,
      robots: { index: false, follow: true },
    };
  }

  try {
    const mercado = await mercadoDeLaPeticion();
    const [r, departamentos] = await Promise.all([
      listarProductos(mercado, {
        busqueda: filtros.q,
        paraElEquipo: await buscandoComoEquipo(filtros.q),
        categoria: filtros.categoria,
        comercio: filtros.comercio,
        porPagina: 6,
      }),
      filtros.categoria
        ? listarDepartamentosDePortada(mercado, locale)
        : Promise.resolve([]),
    ]);
    const departamento = departamentos.find(
      (d) => d.slug === filtros.categoria,
    );
    /* Un slug que no es de ningún departamento y sin productos: los textos de
       siempre, no «ferreteria-y-construccion: 0 productos» en Google. */
    if (filtros.categoria && !departamento && r.total === 0) return base;
    const nombreCategoria =
      departamento?.nombre ??
      (filtros.categoria
        ? filtros.categoria
            .replace(/-/g, " ")
            .replace(/^\w/, (c) => c.toUpperCase())
        : null);
    const comercioNombre = filtros.comercio
      ? (r.productos[0]?.tiendaNombre ?? filtros.comercio)
      : null;
    return {
      ...metaDeCatalogo({
        mercado: mercado.codigo,
        busqueda: filtros.q ?? null,
        categoria: nombreCategoria,
        comercio: comercioNombre,
        total: r.total,
        idioma: locale === "en" ? "en" : "es",
        tituloBase: base.title,
        descripcionBase: base.description,
      }),
    };
  } catch {
    return base;
  }
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

  const mercado = await mercadoDeLaPeticion();

  const [resultado, categorias, comercios, departamentos] = await Promise.all([
    listarProductos(mercado, {
      busqueda: filtros.q,
      paraElEquipo: await buscandoComoEquipo(filtros.q),
      categoria: filtros.categoria,
      comercio: filtros.comercio,
      orden: filtros.orden as OrdenCatalogo,
      pagina: Number(filtros.pagina) || 1,
      zona: visibles,
    }),
    listarCategoriasConProductos(mercado),
    listarComerciosDelCatalogo(mercado),
    /* LA TIRA TAMBIÉN AQUÍ DENTRO. Ver el comentario de abajo. */
    listarDepartamentosDePortada(mercado, idioma).catch(() => []),
  ]);
  /* Los banners de la casa para el catálogo. Sin banners activos no cambia nada. */
  const bannersCatalogo = await bannersPara(mercado, "catalogo", idioma);

  const hayBusqueda = Boolean(
    filtros.q || filtros.categoria || filtros.comercio,
  );

  // Para "ver toda Venezuela" conservando la búsqueda y los filtros activos.
  const parametrosSinZona = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor && clave !== "todas" && clave !== "pagina")
      parametrosSinZona.set(clave, valor);
  }
  /* La identidad de ESTE listado: sus filtros, sin la página. */
  const claveDeLista = `catalogo?${parametrosSinZona.toString()}${verTodas ? "&todas=1" : ""}#${resultado.pagina}`;
  const haciaElPrincipio = `/catalogo${parametrosSinZona.size ? `?${parametrosSinZona.toString()}` : ""}${verTodas ? `${parametrosSinZona.size ? "&" : "?"}todas=1` : ""}`;
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
            <>
              {/* UNA BÚSQUEDA SIN RESULTADOS NO PUEDE SER UN CALLEJÓN SIN
                  SALIDA. Antes aquí solo decía «no encontramos nada» y ahí
                  moría: quien llega hasta este punto ya quería comprar algo, y
                  dejarlo mirando una pantalla vacía es perder la venta y a la
                  persona. Se le dice por qué pudo fallar —el catálogo tiene
                  mucho producto todavía en inglés— y se le deja una puerta. */}
              <p className="font-semibold text-riel-800">
                {!hayBusqueda
                  ? t("vacio")
                  : filtros.q
                    ? t("sinResultadosTitulo", { texto: filtros.q })
                    : t("sinResultados")}
              </p>
              {hayBusqueda ? (
                <>
                  <p className="mx-auto mt-1 max-w-md">
                    {t("sinResultadosAyuda")}
                  </p>
                  <Link
                    href="/catalogo"
                    className="mt-3 inline-block font-semibold text-riel-700 underline underline-offset-2 hover:text-carga-600"
                  >
                    {t("sinResultadosVerTodo")}
                  </Link>
                </>
              ) : null}
            </>
          )}
        </div>
      ) : (
        <>
          {/* SE SIGUE BAJANDO, SIN BOTÓN «SIGUIENTE» (20 sep 2026). La página
              trae las 24 primeras y la parrilla pide las demás al acercarse
              al final, con estos mismos filtros. La `key` es obligatoria: al
              cambiar de búsqueda la pieza tiene que nacer de nuevo, o
              enseñaría lo bajado de la búsqueda anterior. */}
          {resultado.pagina > 1 ? (
            <p className="mb-4 text-sm">
              <Link
                href={haciaElPrincipio}
                className="font-semibold text-riel-700 underline underline-offset-2 hover:text-carga-600"
              >
                ← {t("seguirBajando.desdeElPrincipio")}
              </Link>
            </p>
          ) : null}
          <ParrillaInfinita
            key={claveDeLista}
            clave={claveDeLista}
            inicial={resultado.productos}
            banners={bannersCatalogo}
            semilla={0}
            paginas={resultado.paginas}
            desdePagina={resultado.pagina}
            idioma={idioma}
            consulta={consultaDeLista({
              q: filtros.q,
              categoria: filtros.categoria,
              comercio: filtros.comercio,
              orden: filtros.orden,
              todas: verTodas,
            })}
            columnas="grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6"
            textoCargando={t("seguirBajando.cargando")}
            textoFinal={t("seguirBajando.fin")}
          />
        </>
      )}

      {/* Sin JavaScript no hay scroll que cargue nada: ahí sí, los enlaces de
          siempre. Con JavaScript este bloque no existe. */}
      {resultado.paginas > 1 ? (
        <noscript>
          <Paginacion
            pagina={resultado.pagina}
            paginas={resultado.paginas}
            filtros={filtros}
            locale={locale}
            textos={{
              anterior: t("paginacion.anterior"),
              siguiente: t("paginacion.siguiente"),
              posicion: t("paginacion.posicion", {
                pagina: resultado.pagina,
                paginas: resultado.paginas,
              }),
            }}
          />
        </noscript>
      ) : null}
    </div>
  );
}

/**
 * EL PAGINADOR DE RESPALDO, SOLO PARA QUIEN NO TIENE JAVASCRIPT.
 *
 * Va dentro de un `<noscript>`, y por eso lleva `<a>` a secas y NO `<Link>`:
 * un componente de cliente dentro de `<noscript>` se manda en un trozo aparte
 * cuyo hueco el navegador no puede encontrar (con JavaScript, lo de dentro de
 * `<noscript>` es texto, no elementos), y React revienta al buscarlo —
 * «Cannot read properties of null (reading 'parentNode')»— llevándose la
 * carga del resto de la página. Visto el 20 sep 2026 en la primera prueba.
 */
function Paginacion({
  pagina,
  paginas,
  filtros,
  locale,
  textos,
}: {
  pagina: number;
  paginas: number;
  filtros: Parametros;
  locale: string;
  textos: { anterior: string; siguiente: string; posicion: string };
}) {
  function enlace(destino: number) {
    const consulta = new URLSearchParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor && clave !== "pagina") consulta.set(clave, valor);
    }
    if (destino > 1) consulta.set("pagina", String(destino));
    const texto = consulta.toString();
    return `/${locale}/catalogo${texto ? `?${texto}` : ""}`;
  }

  const estilo =
    "inline-flex items-center gap-1 rounded-lg border border-borde px-3 py-2 text-sm font-semibold";

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-3"
      aria-label={textos.posicion}
    >
      {pagina > 1 ? (
        <a href={enlace(pagina - 1)} className={estilo}>
          ← {textos.anterior}
        </a>
      ) : null}
      <span className="text-sm text-tinta-suave tabular-nums">
        {textos.posicion}
      </span>
      {pagina < paginas ? (
        <a href={enlace(pagina + 1)} className={estilo}>
          {textos.siguiente} →
        </a>
      ) : null}
    </nav>
  );
}
