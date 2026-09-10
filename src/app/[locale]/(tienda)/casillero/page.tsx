import { Boxes, MapPin, PackageCheck, ShoppingCart, Truck } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CopiarLinea } from "@/components/casillero/copiar-linea";
import { LogoBestway } from "@/components/casillero/logo-bestway";
import { Link } from "@/i18n/navigation";
import { BODEGA_MIAMI, lineasDeEtiqueta } from "@/lib/casillero/bodega";
import { TIENDAS_CONOCIDAS } from "@/lib/casillero/tiendas";
import type { Idioma } from "@/lib/dinero";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "casillero" });
  return { title: t("titulo"), description: t("seo") };
}

/**
 * ══ LA PÁGINA DEL CASILLERO ══
 *
 * Producto nuevo, pedido por Richard el 9 sep 2026: dirección propia en
 * Miami para comprar en cualquier tienda de Estados Unidos y recibir en
 * Sudamérica. Vive en los CUATRO dominios, porque el comprador es el mismo
 * en los cuatro.
 *
 * ══ POR QUÉ NO PIDE NADA A LA BASE ══
 *
 * Es la página a la que llega quien todavía no es cliente. Se dibuja con
 * constantes y textos, así que responde igual de rápido con la base
 * saturada — y el día que la base falle, esta puerta de entrada sigue
 * abierta. Los datos reales aparecen al crear el casillero.
 */
export default async function PaginaCasillero({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;
  const t = await getTranslations("casillero");

  /* ══ LA DIRECCIÓN VA TAPADA AQUÍ ══ Richard, 9 sep 2026: «la dirección
     tiene que estar oculta… si la gente no crea la cuenta y pone la
     dirección directamente y nos manda algo, no sabemos de quién es». Es
     también lo que hacen todos los casilleros del mercado. Se enseña la
     FORMA de la ficha —qué campos hay que llenar en la tienda— y nada más;
     los datos reales aparecen dentro de la cuenta. */
  const ejemplo = lineasDeEtiqueta(t("ejemploNombre"), "", idioma, "tapada");

  const pasos = [
    { Icono: PackageCheck, titulo: t("paso1Titulo"), texto: t("paso1") },
    { Icono: ShoppingCart, titulo: t("paso2Titulo"), texto: t("paso2") },
    { Icono: Boxes, titulo: t("paso3Titulo"), texto: t("paso3") },
    { Icono: Truck, titulo: t("paso4Titulo"), texto: t("paso4") },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <section className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
          {t("titulo")}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-tinta-suave">
          {t("bajada")}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/casillero/crear" className="boton-principal">
            {t("crear")}
          </Link>
          <Link href="/casillero/mi-casillero" className="boton-secundario">
            {t("yaTengo")}
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-center text-xl font-bold">{t("comoTitulo")}</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pasos.map(({ Icono, titulo, texto }, i) => (
            <li
              key={titulo}
              className="rounded-xl border border-borde bg-white p-5"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-carga-500/10 text-sm font-bold text-carga-600">
                  {i + 1}
                </span>
                <Icono className="h-5 w-5 text-tinta-suave" aria-hidden />
              </div>
              <h3 className="mt-3 font-bold">{titulo}</h3>
              <p className="mt-1 text-sm text-tinta-suave">{texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ══ TODAS LAS TIENDAS, NINGUNA EN EXCLUSIVA ══ Richard: «nosotros no
          nos casamos con ninguna empresa». Van con nuestra tipografía y no
          con su logotipo: un logotipo ajeno se lee como que ellos nos
          respaldan, y el nombre en texto dice lo mismo sin pedir permiso. */}
      <section className="mt-12 rounded-2xl bg-riel-950 p-6 text-white sm:p-8">
        <h2 className="text-center text-xl font-bold">{t("tiendasTitulo")}</h2>
        <p className="mt-1 text-center text-sm text-white/70">
          {t("tiendasBajada")}
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {TIENDAS_CONOCIDAS.map((tienda) => (
            <li
              key={tienda.nombre}
              className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold"
            >
              <span
                aria-hidden
                className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black text-white"
                style={{ backgroundColor: tienda.color }}
              >
                {tienda.nombre[0]}
              </span>
              {tienda.nombre}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div>
          <h2 className="text-xl font-bold">{t("direccionTitulo")}</h2>
          <p className="mt-1 text-sm text-tinta-suave">
            {t("direccionBajada")}
          </p>
          <div className="mt-4 rounded-lg border border-carga-500/40 bg-carga-500/10 p-3">
            <p className="text-sm font-bold">{t("avisoCodigoTitulo")}</p>
            <p className="mt-1 text-sm">{t("avisoCodigo")}</p>
          </div>
          <div className="mt-3 rounded-lg border border-borde bg-slate-50 p-3">
            <p className="text-sm font-bold">{t("porQuePrivadaTitulo")}</p>
            <p className="mt-1 text-sm text-tinta-suave">
              {t("porQuePrivada")}
            </p>
          </div>
          <div className="mt-4 space-y-2">
            {ejemplo.map((l) => (
              <CopiarLinea
                key={l.campo}
                campo={l.campo}
                valor={l.valor}
                nota={l.nota}
                tapado={l.tapado}
                copiar={t("copiar")}
                copiado={t("copiado")}
              />
            ))}
          </div>
        </div>

        {/* LA BODEGA Y QUIÉN LA OPERA. El sello de Bestway va aquí porque es
            quien firma el recibo ante UPS y FedEx, y porque el código del
            casillero empieza por «BW»: sin esta tarjeta, ese prefijo no se
            explica solo. */}
        <aside className="h-fit rounded-xl border border-borde bg-white p-5 text-center">
          <h2 className="text-base font-bold">{t("bodegaTitulo")}</h2>
          <LogoBestway clase="mx-auto mt-4 h-auto w-44" />
          <p className="mt-3 text-xs text-tinta-suave">{t("bodegaBajada")}</p>
          {/* SOLO LA CIUDAD. La calle es privada: se ve dentro de la
              cuenta, con el código al lado, que es lo único que la hace
              servir. */}
          <p className="mt-3 flex items-center justify-center gap-1 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-tinta-suave" aria-hidden />
            {BODEGA_MIAMI.ciudad}, Florida
          </p>
        </aside>
      </section>

      <section className="mt-12 text-center">
        <Link href="/casillero/crear" className="boton-principal">
          {t("crear")}
        </Link>
      </section>
    </main>
  );
}
