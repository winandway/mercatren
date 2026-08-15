import { Store } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BotonAgregar } from "@/components/catalogo/boton-agregar";
import { cantidadMinima } from "@/lib/cj/mayorista";
import { codigoVisible } from "@/lib/catalogo/codigo";
import { Estrellas } from "@/components/catalogo/estrellas";
import { OpinionesProducto } from "@/components/catalogo/opiniones-producto";
import {
  opinionesDe,
  puedeValorar,
  resumenDeProducto,
} from "@/lib/valoraciones/consultas";
import { SelectorVariante } from "@/components/catalogo/selector-variante";
import {
  coloresDe,
  medidasDe,
  tallasDe,
  variantesDe,
} from "@/lib/productos/variantes";
import { DondeSeRetira } from "@/components/catalogo/donde-se-retira";
import { EntregaEstadosUnidos } from "@/components/catalogo/entrega-estados-unidos";
import { PreguntasProducto } from "@/components/catalogo/preguntas-producto";
import { preguntasDe } from "@/lib/preguntas/consultas";
import { politicaDeEnvio } from "@/lib/envios/consultas";
import { GaleriaProducto } from "@/components/catalogo/galeria-producto";
import { Link } from "@/i18n/navigation";
import { obtenerProductoPorSlug } from "@/lib/catalogo/consultas";
import { zonaDelCliente } from "@/lib/entrega/zona-cliente";
import { zonaPorSlug } from "@/lib/entrega/zonas";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import {
  comoJsonLd,
  fichaDeProducto,
  migasDePan,
} from "@/lib/seo/datos-estructurados";
import { rutaCanonica, SITIO } from "@/lib/sitio";

export const dynamic = "force-dynamic";

const POCAS_UNIDADES = 5;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const ficha = await obtenerProductoPorSlug(slug);
  if (!ficha) return {};

  const titulo =
    locale === "en"
      ? (ficha.producto.tituloEn ?? ficha.producto.tituloEs)
      : ficha.producto.tituloEs;
  const descripcion =
    (locale === "en"
      ? ficha.producto.descripcionEn
      : ficha.producto.descripcionEs) ?? undefined;

  /**
   * NINGUNA FICHA VA A GOOGLE SIN DESCRIPCIÓN.
   *
   * El catálogo importado viene casi todo sin descripción — el comercio no la
   * escribió en su sistema —, y una página sin `description` la resume Google
   * como quiere, normalmente con el primer texto que encuentre. Cuando falta,
   * se arma una honesta con lo que sí sabemos: qué es, de quién y dónde se
   * retira. No es relleno: es exactamente lo que el comprador necesita saber.
   */
  const resumen =
    descripcion ??
    [
      titulo,
      ficha.tiendaNombre,
      ficha.depositoZona
        ? (zonaPorSlug(ficha.depositoZona)?.nombre ?? null)
        : null,
    ]
      .filter(Boolean)
      .join(" · ");

  return {
    title: titulo,
    description: resumen,
    alternates: rutaCanonica(`/producto/${slug}`, locale),
    openGraph: {
      type: "website",
      title: titulo,
      description: resumen,
      url: `${SITIO.url}/${locale}/producto/${slug}`,
      images: ficha.imagenes[0]
        ? [
            ficha.imagenes[0].url.startsWith("http")
              ? ficha.imagenes[0].url
              : `${SITIO.url}${ficha.imagenes[0].url}`,
          ]
        : undefined,
    },
  };
}

export default async function PaginaProducto({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const t = await getTranslations("catalogo.producto");
  const tCatalogo = await getTranslations("catalogo");
  const ficha = await obtenerProductoPorSlug(slug);

  if (!ficha) notFound();

  /* Cómo despacha el comercio de ESTE producto. Antes la ficha decía a todo el
     mundo "no hacemos entregas a domicilio", y desde que los comercios pueden
     enviar eso era mentira: al que sí despacha le estábamos quitando la venta
     en su propia ficha. */
  /* Doce en la mayorista, una en el resto. Lo decide la tienda del producto,
     y el servidor lo vuelve a comprobar al crear el pedido. */
  const minimoDeCompra = cantidadMinima(ficha.tiendaId);

  const envioDelComercio = await politicaDeEnvio(ficha.tiendaId);
  /* Las preguntas de la ficha. Si fallan salen vacias y el bloque desaparece:
     un problema de base no puede tumbar la pagina donde se vende. */
  const preguntas = await preguntasDe(ficha.producto.id, locale);

  // La ciudad que eligio quien mira, para decirle si le queda cerca o lejos.
  const zona = await zonaDelCliente();

  /* Las tallas, los colores y las medidas. Un producto sin variantes trae la
     lista vacía y la ficha se ve exactamente como se ha visto hasta hoy. */
  const [variantes, medidas] = await Promise.all([
    variantesDe(ficha.producto.id),
    medidasDe(ficha.producto.id),
  ]);
  const tallas = tallasDe(variantes);
  const colores = coloresDe(variantes);

  const { producto } = ficha;

  /* Las estrellas y las opiniones. Si fallan salen vacías y el bloque
     desaparece: una ficha no puede caerse porque una opinión no cargó. */
  const [resumenEstrellas, opiniones, quienOpina] = await Promise.all([
    resumenDeProducto(producto.id).catch(() => ({
      promedio: null,
      cuantas: 0,
    })),
    opinionesDe(producto.id).catch(() => []),
    puedeValorar(producto.id).catch(() => ({ puede: false, suya: null })),
  ]);

  const titulo =
    idioma === "en"
      ? (producto.tituloEn ?? producto.tituloEs)
      : producto.tituloEs;
  const descripcion =
    idioma === "en"
      ? (producto.descripcionEn ?? producto.descripcionEs)
      : producto.descripcionEs;

  const agotado = producto.controlaExistencias && producto.existencias <= 0;
  const pocas =
    producto.controlaExistencias &&
    producto.existencias > 0 &&
    producto.existencias <= POCAS_UNIDADES;

  const ahorro =
    producto.precioAntesCentavos &&
    producto.precioAntesCentavos > producto.precioCentavos
      ? producto.precioAntesCentavos - producto.precioCentavos
      : null;

  /* Solo las medidas que el comercio cargó. En gramos y milímetros se
     guardan; en kilos y centímetros se leen. */
  const medidasVisibles = [
    medidas?.pesoGramos
      ? { etiqueta: t("peso"), valor: `${medidas.pesoGramos / 1000} kg` }
      : null,
    medidas?.largoMm
      ? { etiqueta: t("largo"), valor: `${medidas.largoMm / 10} cm` }
      : null,
    medidas?.anchoMm
      ? { etiqueta: t("ancho"), valor: `${medidas.anchoMm / 10} cm` }
      : null,
    medidas?.altoMm
      ? { etiqueta: t("alto"), valor: `${medidas.altoMm / 10} cm` }
      : null,
    (idioma === "en" ? medidas?.materialEn : medidas?.materialEs)
      ? {
          etiqueta: t("material"),
          valor: (idioma === "en"
            ? (medidas?.materialEn ?? medidas?.materialEs)
            : medidas?.materialEs) as string,
        }
      : null,
  ].filter(Boolean) as { etiqueta: string; valor: string }[];

  const datos = [
    { etiqueta: t("marca"), valor: producto.marca },
    {
      etiqueta: t("sku"),
      /* SIN LAS SIGLAS DEL PROVEEDOR. El código sigue identificando el
         producto —los números no se tocan— pero deja de ser el camino para
         encontrarlo en el catálogo del mayorista. El original queda entero en
         la base para reclamarle a CJ. */
      valor: codigoVisible(producto.sku, ficha.tiendaPais),
    },
    {
      etiqueta: t("categoria"),
      valor:
        idioma === "en"
          ? (ficha.categoriaNombreEn ?? ficha.categoriaNombreEs)
          : ficha.categoriaNombreEs,
    },
  ].filter((d) => d.valor);

  /**
   * LO QUE GOOGLE LEE DE ESTA FICHA.
   *
   * Sin esto, el resultado de búsqueda es un enlace azul y nada más. Con
   * esto sale con el precio y "en stock" dentro del propio resultado — que es
   * lo que hace que alguien entre. Todo sale de lo mismo que se ve abajo en
   * pantalla: si un dato no está en la página, tampoco va aquí.
   */
  const categoriaNombre =
    idioma === "en"
      ? (ficha.categoriaNombreEn ?? ficha.categoriaNombreEs)
      : ficha.categoriaNombreEs;

  const paraGoogle = fichaDeProducto(
    {
      slug: producto.slug,
      titulo,
      descripcion,
      precioCentavos: producto.precioCentavos,
      moneda: producto.moneda,
      existencias: producto.existencias,
      controlaExistencias: producto.controlaExistencias,
      sku: producto.sku,
      marca: producto.marca,
      categoria: categoriaNombre,
      /* ABSOLUTAS, SIEMPRE. Las fotos de nuestro bucket se sirven por
         `/media/...`, y Google descarta una imagen con ruta relativa: no
         sabe desde dónde colgarla. Las que vienen del servidor del comercio
         ya son absolutas y se dejan como están. */
      imagenes: ficha.imagenes.map((i) =>
        i.url.startsWith("http") ? i.url : `${SITIO.url}${i.url}`,
      ),
    },
    locale,
  );

  const migas = migasDePan(
    [
      { nombre: SITIO.nombre, ruta: "" },
      /* El nombre del catálogo, no el texto del botón de volver: la miga
         sale escrita en el resultado de Google y "Volver al catálogo" ahí
         se lee como un error. */
      { nombre: tCatalogo("titulo"), ruta: "/catalogo" },
      ...(categoriaNombre && ficha.categoriaSlug
        ? [
            {
              nombre: categoriaNombre,
              ruta: `/catalogo?categoria=${ficha.categoriaSlug}`,
            },
          ]
        : []),
      { nombre: titulo, ruta: `/producto/${producto.slug}` },
    ],
    locale,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        // `comoJsonLd` escapa el JSON: el título lo escribe el comercio, y un
        // `</script>` ahí dentro cerraría este bloque antes de tiempo.
        dangerouslySetInnerHTML={{ __html: comoJsonLd([paraGoogle, migas]) }}
      />

      <Link
        href="/catalogo"
        className="text-sm font-medium text-tinta-suave hover:text-riel-900"
      >
        ← {t("volverCatalogo")}
      </Link>

      <div className="mt-5 grid gap-8 md:grid-cols-2">
        <GaleriaProducto fotos={ficha.imagenes} titulo={titulo} />

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            {titulo}
          </h1>

          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-tinta-suave">
            <Store className="h-4 w-4" aria-hidden />
            {t("vendidoPor")}{" "}
            <Link
              href={`/tienda/${ficha.tiendaSlug}`}
              className="font-semibold text-riel-900 hover:text-carga-600"
            >
              {ficha.tiendaNombre}
            </Link>
          </p>

          {/* SI SE ENTREGA EN ESTADOS UNIDOS: envío gratis, plazo, el mapa
              del almacén y la salida del casillero para quien está fuera. No
              se dibuja nada de esto en un producto venezolano. */}
          <EntregaEstadosUnidos
            parte="aviso"
            paisOrigen={ficha.tiendaPais}
            tiendaId={ficha.tiendaId}
            idioma={locale}
            textos={{
              envioGratis: t("entregaUs.envioGratis"),
              aTodoEeuu: t("entregaUs.aTodoEeuu"),
              plazo: t("entregaUs.plazo"),
              precioFinal: t("entregaUs.precioFinal"),
              casilleroTitulo: t("entregaUs.casilleroTitulo"),
              casilleroTexto: t("entregaUs.casilleroTexto"),
              mapaTitulo: t("entregaUs.mapaTitulo"),
              mapaPie: t("entregaUs.mapaPie"),
            }}
          />

          {/* DÓNDE SE RETIRA, justo debajo de quién lo vende. Es lo primero
              que necesita saber quien ya se decidió: adónde voy por él. */}
          <div className="mt-3">
            <DondeSeRetira
              deposito={{
                nombre: ficha.depositoNombre,
                zona: ficha.depositoZona,
                queGuarda: ficha.depositoQueGuarda,
                direccion: ficha.depositoDireccion,
                comoLlegar: ficha.depositoComoLlegar,
              }}
              zonaCliente={zona?.slug ?? null}
              envio={envioDelComercio}
            />
          </div>

          <div className="mt-5 border-y border-borde py-4">
            <p className="flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight tabular-nums">
                {formatearPrecio(
                  producto.precioCentavos,
                  idioma,
                  producto.moneda,
                )}
              </span>
              {producto.unidad ? (
                <span className="text-sm text-tinta-suave">
                  {t("porUnidad", { unidad: producto.unidad })}
                </span>
              ) : null}
            </p>

            {ahorro ? (
              <p className="mt-1 text-sm">
                <span className="text-tinta-suave tabular-nums line-through">
                  {t("antes")}{" "}
                  {formatearPrecio(producto.precioAntesCentavos!, idioma)}
                </span>{" "}
                <span className="font-semibold text-precio-600">
                  {t("ahorras", { monto: formatearPrecio(ahorro, idioma) })}
                </span>
              </p>
            ) : null}

            <p className="mt-2 text-sm">
              {agotado ? (
                <span className="font-semibold text-red-700">
                  {t("sinExistencias")}
                </span>
              ) : producto.controlaExistencias ? (
                <span
                  className={
                    pocas ? "font-semibold text-carga-600" : "text-precio-600"
                  }
                >
                  {t("disponibles", { n: producto.existencias })}
                </span>
              ) : (
                <span className="text-precio-600">{t("disponible")}</span>
              )}
            </p>
          </div>

          <div className="mt-5">
            {/* CON VARIANTES SE ELIGE PRIMERO, sin ellas se compra directo.
                Un producto con tallas y colores no se puede agregar "en
                general": el comercio quedaría adivinando cuál despachar. */}
            {variantes.length > 0 ? (
              <SelectorVariante
                variantes={variantes}
                idioma={idioma}
                hayTallas={tallas.map((valor) => ({ valor }))}
                hayColores={colores}
                linea={{
                  productoId: producto.id,
                  slug: producto.slug,
                  titulo,
                  moneda: producto.moneda,
                  imagenUrl: ficha.imagenes[0]?.url ?? null,
                  tiendaNombre: ficha.tiendaNombre,
                  tiendaSlug: ficha.tiendaSlug,
                  unidad: producto.unidad,
                }}
              />
            ) : (
              <BotonAgregar
                agotado={agotado}
                minimo={minimoDeCompra}
                linea={{
                  productoId: producto.id,
                  slug: producto.slug,
                  titulo,
                  precioCentavos: producto.precioCentavos,
                  moneda: producto.moneda,
                  imagenUrl: ficha.imagenes[0]?.url ?? null,
                  tiendaNombre: ficha.tiendaNombre,
                  tiendaSlug: ficha.tiendaSlug,
                  unidad: producto.unidad,
                  maximo: producto.controlaExistencias
                    ? producto.existencias
                    : null,
                }}
              />
            )}
          </div>

          {/* EL MAPA Y EL CONSEJO DEL CASILLERO, DEBAJO DEL PRECIO.
              Arriba empujaban el precio y el botón de comprar fuera de la
              primera pantalla — y lo primero que tiene que ver quien abre una
              ficha es cuánto cuesta y dónde se compra. Aquí abajo acompañan al
              que ya se interesó, que es para quien son. */}
          <EntregaEstadosUnidos
            parte="mapa"
            paisOrigen={ficha.tiendaPais}
            tiendaId={ficha.tiendaId}
            idioma={locale}
            textos={{
              envioGratis: t("entregaUs.envioGratis"),
              aTodoEeuu: t("entregaUs.aTodoEeuu"),
              plazo: t("entregaUs.plazo"),
              precioFinal: t("entregaUs.precioFinal"),
              casilleroTitulo: t("entregaUs.casilleroTitulo"),
              casilleroTexto: t("entregaUs.casilleroTexto"),
              mapaTitulo: t("entregaUs.mapaTitulo"),
              mapaPie: t("entregaUs.mapaPie"),
            }}
          />

          <OpinionesProducto
            productoId={producto.id}
            opiniones={opiniones}
            puede={quienOpina.puede}
            suya={quienOpina.suya}
            textos={{
              titulo: t("opiniones"),
              sinOpiniones: t("sinOpiniones"),
              tuOpinion: t("tuOpinion"),
              enviar: t("enviarOpinion"),
              comentario: t("comentarioOpcional"),
              soloCompradores: t("soloCompradores"),
            }}
          />

          {/* LA FICHA TÉCNICA: peso y medidas.
              Solo sale lo que el comercio cargó — una tabla con "Peso: —" en
              todas las filas es peor que no tener tabla. Se guarda en gramos y
              milímetros enteros y aquí se convierte a kilos y centímetros, que
              es como piensa quien compra. */}
          {medidasVisibles.length > 0 ? (
            <dl className="mt-6 rounded-xl border border-borde bg-slate-50/60 p-4 text-sm">
              <p className="mb-2 text-xs font-bold tracking-wide text-tinta-suave uppercase">
                {t("fichaTecnica")}
              </p>
              {medidasVisibles.map((m) => (
                <div key={m.etiqueta} className="flex gap-2 py-1">
                  <dt className="w-32 shrink-0 text-tinta-suave">
                    {m.etiqueta}
                  </dt>
                  <dd className="font-medium">{m.valor}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {datos.length > 0 ? (
            <dl className="mt-6 space-y-2 text-sm">
              {datos.map((d) => (
                <div key={d.etiqueta} className="flex gap-2">
                  <dt className="w-28 shrink-0 text-tinta-suave">
                    {d.etiqueta}
                  </dt>
                  <dd className="font-medium">{d.valor}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>

      <section className="mt-10 max-w-3xl">
        <h2 className="text-lg font-bold">{t("descripcion")}</h2>
        <p className="mt-2 text-sm whitespace-pre-line text-tinta-suave">
          {descripcion || t("sinDescripcion")}
        </p>
      </section>

      {/* Va DESPUES de la descripcion: quien todavia duda ya la leyo, y es ahi
          donde aparece la pregunta que decide la compra. */}
      <PreguntasProducto preguntas={preguntas} />
    </div>
  );
}
