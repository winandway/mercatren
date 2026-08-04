import {
  ArrowRight,
  PackageCheck,
  Plane,
  ShieldCheck,
  ShoppingBag,
  Shuffle,
  Store,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FilaProductos } from "@/components/catalogo/fila-productos";
import { RejillaDepartamentos } from "@/components/catalogo/rejilla-departamentos";
import { TarjetaProducto } from "@/components/catalogo/tarjeta-producto";
import { Link } from "@/i18n/navigation";
import { obtenerPortada, type ProductoLista } from "@/lib/catalogo/consultas";
import type { Idioma } from "@/lib/dinero";

/**
 * La portada.
 *
 * DOS COSAS QUE LA HACEN DISTINTA:
 *
 * 1. LA PRIMERA FILA BARAJA EN CADA VISITA. Con 622 productos y dos filas
 *    fijas, quien entraba tres veces veía lo mismo tres veces y se iba
 *    pensando que aquí hay veinte cosas. Ahora el catálogo entero se va
 *    asomando solo.
 *
 * 2. LOS DEPARTAMENTOS VAN EN EL CENTRO y salen todos, tengan productos o no.
 *    Son la lista cerrada de Mercatren, no las categorías que cada comercio
 *    inventa: uno vacío es el cartel que le dice al que llega "aquí se pueden
 *    vender motos".
 *
 * Por eso NO se puede cachear: `force-dynamic` es lo que permite barajar.
 */
export const dynamic = "force-dynamic";

const ICONOS = [ShoppingBag, PackageCheck, Plane];
const PASOS = ["uno", "dos", "tres"] as const;

export default async function PaginaInicio({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const t = await getTranslations("inicio");
  const {
    descubre,
    destacados,
    nuevos,
    baratos,
    ofertas,
    departamentos,
    comercios,
  } = await obtenerPortada(idioma);

  const hayCatalogo = descubre.length > 0;
  const etiquetas = { anterior: t("anterior"), siguiente: t("siguiente") };

  return (
    <>
      {/* Lo primero que se ve */}
      <section className="relative overflow-hidden bg-riel-900 text-white">
        {/* Un resplandor naranja detrás del título: da profundidad sin meter
            una foto que tarde en cargar. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full bg-carga-500/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-[1500px] px-4 py-14 sm:py-20">
          <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">
            {t("tituloHero")}
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-white/80 sm:text-lg">
            {t("subtituloHero")}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/catalogo" className="boton-principal">
              {t("verCatalogo")}
            </Link>
            <Link
              href="/vender"
              className="inline-flex items-center justify-center rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {t("abrirTienda")}
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1500px] space-y-12 px-4 py-10">
        {/* LOS DEPARTAMENTOS, en el centro. Es el mapa del sitio. */}
        {departamentos.length > 0 ? (
          <section>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-xl font-bold sm:text-2xl">
                {t("departamentos")}
              </h2>
              <p className="mt-1.5 text-sm text-balance text-tinta-suave">
                {t("departamentosTexto")}
              </p>
            </div>

            <div className="mt-8">
              <RejillaDepartamentos
                departamentos={departamentos}
                textoVacio={t("proximamente")}
              />
            </div>
          </section>
        ) : null}

        {hayCatalogo ? (
          <>
            {/* La fila que baraja. Va primera a propósito: es la que hace que
                la portada se sienta distinta cada vez. */}
            <Carrusel
              titulo={t("descubre")}
              ayuda={t("descubreTexto")}
              conIcono
              verTodo={t("verTodo")}
              hrefVerTodo="/catalogo"
              productos={descubre}
              idioma={idioma}
              etiquetas={etiquetas}
            />

            <Carrusel
              titulo={t("destacados")}
              verTodo={t("verTodo")}
              hrefVerTodo="/catalogo"
              productos={destacados}
              idioma={idioma}
              etiquetas={etiquetas}
            />

            <Carrusel
              titulo={t("ofertas")}
              verTodo={t("verTodo")}
              hrefVerTodo="/catalogo"
              productos={ofertas}
              idioma={idioma}
              etiquetas={etiquetas}
            />

            {/* Los comercios, que es de lo que va esto */}
            {comercios.length > 0 ? (
              <section>
                <h2 className="text-xl font-bold">{t("comercios")}</h2>
                <p className="mt-1 text-sm text-tinta-suave">
                  {t("comerciosTexto")}
                </p>

                <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {comercios.map((comercio) => (
                    <li key={comercio.slug}>
                      <Link
                        href={`/tienda/${comercio.slug}`}
                        className="group flex h-full items-center gap-4 overflow-hidden rounded-xl bg-white p-4 ring-1 ring-borde transition-all hover:ring-2 hover:ring-carga-500"
                      >
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-riel-900 text-carga-400">
                          <Store className="h-6 w-6" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold group-hover:text-carga-600">
                            {comercio.nombre}
                          </span>
                          <span className="block text-xs text-tinta-suave">
                            {comercio.paisOrigen} ·{" "}
                            {t("productosDisponibles", { n: comercio.cuantos })}
                          </span>
                        </span>
                        <ArrowRight
                          className="h-4 w-4 shrink-0 text-tinta-suave transition-transform group-hover:translate-x-1 group-hover:text-carga-600"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <Carrusel
              titulo={t("nuevos")}
              verTodo={t("verTodo")}
              hrefVerTodo="/catalogo?orden=recientes"
              productos={nuevos}
              idioma={idioma}
              etiquetas={etiquetas}
            />

            <Carrusel
              titulo={t("baratos")}
              verTodo={t("verTodo")}
              hrefVerTodo="/catalogo?orden=precio_asc"
              productos={baratos}
              idioma={idioma}
              etiquetas={etiquetas}
            />
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-borde px-6 py-16 text-center text-sm text-tinta-suave">
            {t("catalogoVacio")}
          </p>
        )}

        {/* Como funciona */}
        <section className="rounded-2xl bg-slate-50 p-6 sm:p-8">
          <h2 className="text-xl font-bold">{t("comoFunciona")}</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {PASOS.map((paso, indice) => {
              const Icono = ICONOS[indice];
              return (
                <article key={paso}>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-carga-500/15 text-riel-800">
                    <Icono className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-3 font-bold">{t(`pasos.${paso}Titulo`)}</h3>
                  <p className="mt-1 text-sm text-tinta-suave">
                    {t(`pasos.${paso}Texto`)}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/como-funciona"
              className="inline-flex items-center gap-2 rounded-lg border border-riel-800 px-4 py-2 text-sm font-semibold text-riel-900 transition-colors hover:bg-riel-900 hover:text-white"
            >
              {t("verDetalle")}
            </Link>
            <Link
              href="/transparencia"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-tinta-suave transition-colors hover:text-riel-900"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden />
              {t("paraBancos")}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

/** Un bloque con titulo, enlace a "ver todo" y la fila desplazable. */
async function Carrusel({
  titulo,
  ayuda,
  conIcono,
  verTodo,
  hrefVerTodo,
  productos,
  idioma,
  etiquetas,
}: {
  titulo: string;
  /** Una línea debajo del título. Solo la lleva la fila que baraja. */
  ayuda?: string;
  conIcono?: boolean;
  verTodo: string;
  hrefVerTodo: string;
  productos: ProductoLista[];
  idioma: Idioma;
  etiquetas: { anterior: string; siguiente: string };
}) {
  // Una fila vacía no se dibuja: un título con nada debajo se lee como que
  // algo se rompió.
  if (productos.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            {conIcono ? (
              <Shuffle
                className="h-4 w-4 shrink-0 text-carga-500"
                aria-hidden
              />
            ) : null}
            {titulo}
          </h2>
          {ayuda ? (
            <p className="mt-0.5 text-sm text-tinta-suave">{ayuda}</p>
          ) : null}
        </div>
        <Link
          href={hrefVerTodo}
          className="shrink-0 text-sm font-semibold text-riel-700 hover:text-carga-600"
        >
          {verTodo} →
        </Link>
      </div>

      <FilaProductos
        etiquetaAnterior={etiquetas.anterior}
        etiquetaSiguiente={etiquetas.siguiente}
      >
        {productos.map((producto) => (
          <div
            key={producto.id}
            className="w-[160px] shrink-0 snap-start sm:w-[190px]"
          >
            <TarjetaProducto producto={producto} idioma={idioma} />
          </div>
        ))}
      </FilaProductos>
    </section>
  );
}
