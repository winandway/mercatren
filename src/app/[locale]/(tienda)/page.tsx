import {
  ArrowRight,
  PackageCheck,
  Plane,
  ShieldCheck,
  ShoppingBag,
  Store,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ParaTi } from "@/components/catalogo/para-ti";
import { HileraVideos } from "@/components/videos/hilera-videos";
import { HILERAS, ordenarParaHilera, valeLaPena } from "@/lib/videos/hileras";
import { resumenSocialDe } from "@/lib/videos/social";
import { BannerPublicitario } from "@/components/catalogo/banner-publicitario";
import { ParrillaInfinita } from "@/components/catalogo/parrilla-infinita";
import { TiraDepartamentos } from "@/components/catalogo/tira-departamentos";
import { Link } from "@/i18n/navigation";
import { TarjetaProducto } from "@/components/catalogo/tarjeta-producto";
import { obtenerPortada } from "@/lib/catalogo/consultas";
import { nuevaSemilla } from "@/lib/catalogo/semilla";
import { videosParaHileras } from "@/lib/videos/consultas";
import { personalizarVideos } from "@/lib/videos/personalizar";
import { bannersPara } from "@/lib/banners/consultas";
import { intercalarBanners } from "@/lib/banners/reglas";
import { zonaDelCliente } from "@/lib/entrega/zona-cliente";
import { ciudadesVisiblesDesde } from "@/lib/entrega/zonas";
import type { Idioma } from "@/lib/dinero";
import { mercadoActual } from "@/lib/mercado/actual";
import { esMercadoPrincipal } from "@/lib/mercado/mercados";
import { videoDePortada } from "@/lib/mercado/portada";
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
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ todas?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;
  const mercado = await mercadoActual();
  const videoDelHero = videoDePortada(mercado.codigo);

  const t = await getTranslations("inicio");
  const tEntrega = await getTranslations("entrega");

  /**
   * EL FILTRO POR CIUDAD. Quien eligió Caracas ve lo de Caracas; quien
   * eligió Tucaní ve lo de su estado (El Vigía incluido); quien no eligió
   * nada ve todo. `?todas=1` es la salida: enseña el país entero SIN borrar
   * la ciudad elegida, que sigue mandando en los avisos de cada ficha.
   */
  const zona = await zonaDelCliente();
  const verTodas = (await searchParams).todas === "1";
  const visibles =
    zona && !verTodas ? ciudadesVisiblesDesde(zona.slug) : undefined;

  // Una semilla por visita. Se pasa al navegador para que las tandas
  // siguientes sigan el mismo orden.
  const semilla = nuevaSemilla();
  let portada = await obtenerPortada(mercado, idioma, semilla, visibles);

  /**
   * EN TU CIUDAD TODAVÍA NO HAY NADA. Una portada en blanco parece un sitio
   * muerto, así que se enseña el catálogo completo — pero avisando primero,
   * y con la invitación que le da sentido al bombillo apagado: aquí falta un
   * comercio, y ese comercio puede ser tuyo.
   *
   * EL AVISO SOLO SALE CON UN CERO DE VERDAD. Si lo que hubo fue un tropiezo
   * de la base (`portada.fallo`), se enseña el país entero igual, pero SIN
   * acusar a la ciudad: el dueño vio "En Caracas todavía no hay comercios"
   * con dos comercios y 114 productos allí — era un error vestido de dato.
   */
  const filtroVacio = Boolean(visibles && portada.parrilla.total === 0);
  const sinCobertura = filtroVacio && !portada.fallo;
  if (filtroVacio) {
    portada = await obtenerPortada(mercado, idioma, semilla);
  }
  const { parrilla, departamentos, bandas, comercios } = portada;
  /* La parrilla vino con 48: los primeros 24 abren la portada («De todas las
     tiendas»: cada comercio venezolano con sus dos más nuevos, luego seis de
     CJ, luego el resto), y los otros 24 arrancan la parrilla infinita del
     final, que sigue pidiendo desde la página 3. `paginas` se recalcula en
     tandas de 24, que es como las sirve /datos/catalogo. */
  /* LOS SHORTS (23 ago 2026): hileras de videos entre los bloques de
     productos, como en YouTube. Si la base falla o hay menos de tres videos,
     la portada se ve exactamente como antes: `HileraVideos` no dibuja nada. */
  const videosSinOrdenar = await videosParaHileras(
    mercado,
    idioma,
    semilla,
    24,
  );
  /* La lista de la caché es igual para todos; el orden de ESTA persona
     (sus corazones, sus compras) se aplica después y en memoria. */
  const videosDeLaPortada = await personalizarVideos(videosSinOrdenar);

  /* ══ VARIAS HILERAS, CADA UNA CON SU TÍTULO Y SU BARAJA ══

     Lo pidió el dueño: «tenemos que repetir los mismos videos, pero los
     barajeamos diferente… eso es lo que hacen las redes sociales». Con
     cincuenta videos, tres hileras seguidas con el mismo orden se leen como
     un error; con órdenes distintos, cada una se siente una sección nueva. */
  const corazonesDeLaPortada = await resumenSocialDe(
    videosDeLaPortada.map((v) => v.id),
    null,
  ).catch(() => new Map<string, { corazones: number }>());
  const corazonesDe = (id: string) =>
    corazonesDeLaPortada.get(id)?.corazones ?? 0;
  const corazonesTotales = videosDeLaPortada.reduce(
    (suma, v) => suma + corazonesDe(v.id),
    0,
  );
  const hilerasDeVideos = HILERAS.filter((clave) =>
    valeLaPena(videosDeLaPortada, clave, corazonesTotales),
  ).map((clave, i) => ({
    clave,
    videos: ordenarParaHilera(
      videosDeLaPortada,
      clave,
      corazonesDe,
      /* La semilla de la visita, desplazada por hilera: dos hileras
         seguidas nunca barajan igual, y dentro de la misma visita el orden
         no cambia al navegar. */
      semilla + i * 7919,
    ).slice(0, 12),
  }));
  const deTodasLasTiendas = parrilla.productos.slice(0, 24);
  const restoDeLaParrilla = parrilla.productos.slice(24);
  const paginasDe24 = Math.max(1, Math.ceil(parrilla.total / 24));
  /* Los banners de la casa para la portada (23 ago 2026): salen en medio de
     las parrillas, cada tantos productos. Sin banners activos no cambia nada. */
  const bannersPortada = await bannersPara(mercado, "portada", idioma);
  const filtrada = Boolean(visibles) && !sinCobertura;

  /**
   * UN MERCADO NUEVO, TODAVÍA SIN CATÁLOGO (17 ago 2026).
   *
   * Quien entra por mercatren.cl no puede ver la mercancía de mercatren.com
   * —no se le puede entregar en Chile—, así que su catálogo arranca en cero.
   * Una portada con parrillas vacías se lee como un sitio roto; esta se lee
   * como lo que es: un país que está por abrir. Sale el aviso y la invitación
   * a los comercios, que es exactamente lo que un mercado vacío necesita.
   *
   * SOLO con un cero DE VERDAD: si lo que hubo fue un tropiezo de la base
   * (`portada.fallo`), la portada normal se dibuja igual — misma regla que el
   * aviso de ciudad sin comercios.
   */
  if (
    !esMercadoPrincipal(mercado) &&
    parrilla.total === 0 &&
    !portada.fallo &&
    !visibles
  ) {
    return (
      <section className="relative isolate overflow-hidden bg-riel-900 text-white">
        {/* El mismo video del país que lleva el hero normal: «Mercatren llega
            a Chile» con Santiago detrás cuenta más que un fondo plano. */}
        <video
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-80"
          src={videoDelHero.video}
          poster={videoDelHero.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-riel-900 via-riel-900/70 to-riel-900/10"
        />
        <div className="mx-auto max-w-[1500px] px-4 py-16 sm:py-24">
          <h1 className="max-w-2xl text-2xl font-extrabold tracking-tight text-balance sm:text-4xl">
            {t("mercadoNuevoTitulo", { pais: mercado.nombre })}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/80 sm:text-base">
            {t("mercadoNuevoTexto", { pais: mercado.nombre })}
          </p>
          <div className="mt-6">
            <Link href="/vender" className="boton-principal">
              {t("abrirTienda")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

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
        {/* EL VIDEO ES DEL PAÍS DEL DOMINIO (28 ago 2026): Santiago con los
            Andes en mercatren.cl, Bogotá en mercatren.com.co, la cinta de
            cajas en el resto. La tabla vive en src/lib/mercado/portada.ts. */}
        <video
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-80"
          src={videoDelHero.video}
          poster={videoDelHero.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
        />
        {/* LA CAPA DE COLOR, ACLARADA (8 ago 2026).

            Estaba tan cargada que las cajas del video pasaban desapercibidas y
            el hueco se leía como un fondo azul plano. Ahora el velo se
            concentra a la IZQUIERDA, que es donde va el texto y donde hace
            falta para leerlo, y se abre hacia la derecha para que se vea lo
            que pasa por la cinta. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-riel-900 via-riel-900/70 to-riel-900/10"
        />

        <div className="mx-auto max-w-[1500px] px-4 py-8 sm:py-12">
          {/* EL HERO HABLA DEL PAÍS DEL DOMINIO (27 ago 2026). «Compra en
              Estados Unidos» en mercatren.cl le dice al chileno que esta
              tienda no es para él — en la primera línea que lee. */}
          <h1 className="max-w-2xl text-xl font-extrabold tracking-tight text-balance sm:text-3xl">
            {esMercadoPrincipal(mercado)
              ? t("tituloHero")
              : t("tituloHeroMercado", { pais: mercado.nombre })}
          </h1>
          <p className="mt-2 hidden max-w-xl text-sm text-white/80 sm:block">
            {esMercadoPrincipal(mercado)
              ? t("subtituloHero")
              : t("subtituloHeroMercado")}
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

        {/* LA FRANJA DEL FILTRO: el cliente tiene que saber que el catálogo
            está acotado a su zona, y tener la puerta para ver el país entero
            sin perder su ciudad elegida. */}
        {filtrada && zona ? (
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-borde py-2.5 text-sm">
            <span className="font-semibold">
              {tEntrega("viendoZona", { ciudad: zona.nombre })}
            </span>
            <Link
              href="/?todas=1"
              className="font-semibold text-riel-700 underline-offset-2 hover:text-carga-600 hover:underline"
            >
              {tEntrega("verTodaVenezuela")}
            </Link>
          </p>
        ) : null}
        {verTodas && zona ? (
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-borde py-2.5 text-sm">
            <span className="font-semibold">
              {tEntrega("viendoTodaVenezuela")}
            </span>
            <Link
              href="/"
              className="font-semibold text-riel-700 underline-offset-2 hover:text-carga-600 hover:underline"
            >
              {tEntrega("volverAMiZona", { ciudad: zona.nombre })}
            </Link>
          </p>
        ) : null}

        {/* EL BOMBILLO APAGADO, dicho de frente: en tu ciudad no hay nada
            todavía — y la invitación a que el primero seas tú. */}
        {sinCobertura && zona ? (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">
              {tEntrega("sinComerciosTitulo", { ciudad: zona.nombre })}
            </p>
            <p className="mt-0.5">{tEntrega("sinComerciosTexto")}</p>
            <Link
              href="/vender"
              className="mt-1.5 inline-block font-semibold underline underline-offset-2 hover:text-carga-600"
            >
              {tEntrega("abreTuTiendaAqui", { ciudad: zona.nombre })}
            </Link>
          </div>
        ) : null}

        {/**
         * «MÁS DE LO QUE ESTABAS MIRANDO»: sigue el interés de la persona
         * (dos fichas de la misma categoría → más de esa categoría). Vive en
         * el navegador y no dibuja nada hasta que hay señal: la portada sin
         * historial se ve exactamente igual que antes.
         */}
        {/**
         * DE TODAS LAS TIENDAS, PRIMERO (23 ago 2026). Es lo que pidió el dueño
         * con todas las letras: «esas tiendas son chiquitas, sácalas de primero
         * a todos; ¿que tiene un solo producto? no importa, sácalo de primero».
         * Es la primera tanda de la parrilla (ver `ordenPorRondas`): los dos
         * más nuevos de CADA comercio venezolano, seis de CJ, y recién después
         * el resto. Antes el primer bloque de la portada era la banda del
         * departamento más grande —la ferretería entera— y después todo CJ.
         */}
        {deTodasLasTiendas.length > 0 ? (
          <section className="pt-6">
            <div className="mb-3">
              <h2 className="text-lg font-bold">{t("deTodasLasTiendas")}</h2>
              <p className="mt-0.5 text-sm text-tinta-suave">
                {t("deTodasLasTiendasTexto")}
              </p>
            </div>
            <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
              {intercalarBanners(deTodasLasTiendas, bannersPortada).map(
                (x, i) =>
                  x.tipo === "banner" ? (
                    <li
                      key={`banner-${x.banner.id}-${i}`}
                      className="col-span-full"
                    >
                      <BannerPublicitario banner={x.banner} />
                    </li>
                  ) : (
                    <li key={x.item.id}>
                      <TarjetaProducto producto={x.item} idioma={idioma} />
                    </li>
                  ),
              )}
            </ul>
          </section>
        ) : null}

        {/* La primera hilera de Shorts, justo después del primer bloque de
            productos: la persona ya vio mercancía y aquí ve quién la vende. */}
        {hilerasDeVideos[0] ? (
          <HileraVideos
            videos={hilerasDeVideos[0].videos}
            hilera={hilerasDeVideos[0].clave}
          />
        ) : null}

        <ParaTi idioma={idioma} />

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

            {/* ══ ESTA HILERA ESTABA DENTRO DEL `<ul>` (25 ago 2026) ══

                Como hija de un grid ocupaba UNA celda: el título salía en
                vertical, una palabra por línea, y el resto de la fila en
                blanco. Se veía roto en la portada y en la parrilla infinita.
                Va fuera de la lista, que es su sitio: una hilera no es un
                producto.

                Y cada una lleva SU título y SU baraja: el dueño lo pidió con
                el ejemplo de las redes — los mismos videos, ordenados
                distinto, se sienten secciones nuevas. */}
            {hilerasDeVideos[indice + 1] ? (
              <HileraVideos
                videos={hilerasDeVideos[indice + 1]!.videos}
                hilera={hilerasDeVideos[indice + 1]!.clave}
              />
            ) : null}
          </section>
        ))}

        {/* Y AL FINAL, DE TODO. La que no para: sigue desde la página 2. */}
        {restoDeLaParrilla.length > 0 ? (
          <section className="pt-6">
            <div className="mb-3">
              <h2 className="text-lg font-bold">{t("masVariados")}</h2>
              <p className="mt-0.5 text-sm text-tinta-suave">
                {t("masVariadosTexto")}
              </p>
            </div>

            <ParrillaInfinita
              inicial={restoDeLaParrilla}
              semilla={semilla}
              paginas={paginasDe24}
              desdePagina={2}
              banners={bannersPortada}
              idioma={idioma}
              textoCargando={t("cargandoMas")}
              textoFinal={t("yaViste")}
              sinFiltroDeZona={!filtrada}
            />
          </section>
        ) : deTodasLasTiendas.length === 0 ? (
          <p className="my-10 rounded-xl border border-dashed border-borde px-6 py-16 text-center text-sm text-tinta-suave">
            {t("catalogoVacio")}
          </p>
        ) : null}

        <div className="space-y-10 py-10">
          {/* Los comercios, que es de lo que va esto */}
          {comercios.length > 0 ? (
            <section>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-bold">{t("comercios")}</h2>
                <Link
                  href="/tiendas"
                  className="shrink-0 text-sm font-semibold text-riel-700 hover:text-carga-600"
                >
                  {t("verTodasLasTiendas")} →
                </Link>
              </div>
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
