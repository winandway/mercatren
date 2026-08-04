import {
  ArrowRight,
  PackageCheck,
  Plane,
  ShieldCheck,
  ShoppingBag,
  Store,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ParrillaInfinita } from "@/components/catalogo/parrilla-infinita";
import { TiraDepartamentos } from "@/components/catalogo/tira-departamentos";
import { Link } from "@/i18n/navigation";
import { TarjetaProducto } from "@/components/catalogo/tarjeta-producto";
import { obtenerPortada } from "@/lib/catalogo/consultas";
import { nuevaSemilla } from "@/lib/catalogo/semilla";
import type { Idioma } from "@/lib/dinero";
import { cn } from "@/lib/utils";

/**
 * La portada.
 *
 * LOS PRIMEROS TRES SEGUNDOS DECIDEN SI ALGUIEN SE QUEDA, y lo que tiene que
 * ver en esos tres segundos es mercancía. Antes no veía ninguna: entre el
 * banner y una parrilla de veintitrés círculos, el primer producto quedaba a
 * dos pantallas de distancia. Ahora:
 *
 *   banner corto → tira de departamentos → productos, de inmediato
 *
 * LA PARRILLA TRAE TODO EL CATÁLOGO y sigue cargando mientras se baja. Con
 * 622 productos, dos carruseles de catorce enseñaban el 4% y escondían el
 * resto detrás de una flechita.
 *
 * SE BARAJA EN CADA VISITA con una semilla que se genera aquí y viaja a las
 * siguientes tandas. Sin semilla, cada tanda barajaría de nuevo y al bajar
 * saldrían productos repetidos.
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

  // Una semilla por visita. Se pasa al navegador para que las tandas
  // siguientes sigan el mismo orden.
  const semilla = nuevaSemilla();
  const { parrilla, departamentos, bandas, comercios } = await obtenerPortada(
    idioma,
    semilla,
  );

  return (
    <>
      {/**
       * EL BANNER, corto y con video.
       *
       * Antes ocupaba un cuarto de la pantalla de un teléfono con puro texto.
       * Ahora el texto va apretado y detrás corre el video de las cajas — la
       * misma altura cuenta mucho más, y se ve movimiento antes de leer nada.
       *
       * El video va MUDO y sin controles: es decoración, no contenido. Lleva
       * su cuadro fijo (`poster`) para que no haya un hueco negro mientras
       * carga, y quien tenga el ahorro de datos activado se queda con esa foto
       * y no descarga los 600 KB.
       */}
      <section className="relative isolate overflow-hidden bg-riel-900 text-white">
        <video
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45"
          src="/video/portada.mp4"
          poster="/video/portada.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-riel-900 via-riel-900/85 to-riel-900/40"
        />

        <div className="mx-auto max-w-[1500px] px-4 py-8 sm:py-12">
          <h1 className="max-w-2xl text-xl font-extrabold tracking-tight text-balance sm:text-3xl">
            {t("tituloHero")}
          </h1>
          <p className="mt-2 hidden max-w-xl text-sm text-white/80 sm:block">
            {t("subtituloHero")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link href="/catalogo" className="boton-principal">
              {t("verCatalogo")}
            </Link>
            <Link
              href="/vender"
              className="inline-flex items-center justify-center rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {t("abrirTienda")}
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1500px] px-4">
        {/* LOS DEPARTAMENTOS: una línea que se desliza, no una parrilla que tapa. */}
        {departamentos.length > 0 ? (
          <div className="border-b border-borde py-4">
            <TiraDepartamentos departamentos={departamentos} />
          </div>
        ) : null}

        {/**
         * LAS BANDAS: un departamento, sus productos, el siguiente.
         *
         * Es como baja Amazon. En vez de seiscientas cosas sueltas, el cliente
         * va pasando por ferretería, repuestos, motos, y en cada tramo sabe
         * dónde está. Las bandas pares llevan el fondo cambiado para que se
         * vea de un golpe dónde empieza una y termina otra.
         */}
        {bandas.map((banda, indice) => (
          <section
            key={banda.slug}
            className={cn("-mx-4 px-4 py-6", indice % 2 === 1 && "bg-slate-50")}
          >
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-bold">{banda.nombre}</h2>
              <Link
                href={`/catalogo?categoria=${banda.slug}`}
                className="shrink-0 text-sm font-semibold text-riel-700 hover:text-carga-600"
              >
                {t("verTodoDe")} ({banda.cuantos}) →
              </Link>
            </div>

            <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
              {banda.productos.map((producto) => (
                <li key={producto.id}>
                  <TarjetaProducto producto={producto} idioma={idioma} />
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* Y AL FINAL, DE TODO. La que no para. */}
        {parrilla.productos.length > 0 ? (
          <section className="pt-6">
            <div className="mb-3">
              <h2 className="text-lg font-bold">{t("masVariados")}</h2>
              <p className="mt-0.5 text-sm text-tinta-suave">
                {t("masVariadosTexto")}
              </p>
            </div>

            <ParrillaInfinita
              inicial={parrilla.productos}
              semilla={semilla}
              paginas={parrilla.paginas}
              idioma={idioma}
              textoCargando={t("cargandoMas")}
              textoFinal={t("yaViste")}
            />
          </section>
        ) : (
          <p className="my-10 rounded-xl border border-dashed border-borde px-6 py-16 text-center text-sm text-tinta-suave">
            {t("catalogoVacio")}
          </p>
        )}

        <div className="space-y-10 py-10">
          {/* Los comercios, que es de lo que va esto */}
          {comercios.length > 0 ? (
            <section>
              <h2 className="text-lg font-bold">{t("comercios")}</h2>
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
                    <h3 className="mt-3 font-bold">
                      {t(`pasos.${paso}Titulo`)}
                    </h3>
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
      </div>
    </>
  );
}
