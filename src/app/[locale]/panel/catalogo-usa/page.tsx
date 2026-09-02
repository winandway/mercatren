import { ExternalLink, Flag, Package } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { BuscadorCj } from "@/components/panel/cj/buscador";
import { RepartirCatalogo } from "@/components/panel/cj/repartir";
import { ImportarMasivo } from "@/components/panel/cj/importar-masivo";
import { estadoImportacionMasiva } from "@/lib/cj/masivo-acciones";
import { Link } from "@/i18n/navigation";
import { esEquipoInterno } from "@/lib/autorizacion";
import { buscarEnCj } from "@/lib/cj/catalogo";
import { cjConfigurado } from "@/lib/cj/cliente";

export const dynamic = "force-dynamic";

/**
 * EL CATÁLOGO DE ESTADOS UNIDOS: elegir qué se vende.
 *
 * Aquí se busca en CJ y se eligen los productos. La decisión se toma viendo
 * **lo que de verdad queda** —después de CJ, el envío y Stripe—, que es algo
 * que el panel de CJ no puede enseñar porque no conoce nuestras tarifas.
 *
 * Solo el equipo interno: es el catálogo propio de Mercatren LLC, no el de un
 * comercio.
 */
export default async function PaginaCatalogoUsa({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (!(await esEquipoInterno())) redirect(`/${locale}/panel`);

  const t = await getTranslations("panel.catalogoUsa");

  /* A qué plaza va lo que se agregue: lo decide el selector de país del panel
     (arriba a la derecha). Se dice ANTES de buscar, en grande y con color, y
     además decide EL ALMACÉN donde se busca: EE. UU. busca en su almacén
     local; Chile y Colombia en el de CHINA (decisión del dueño, 27 ago 2026),
     que es el central y el que surte al dropshipping de Latinoamérica. */
  const { mercadoDelPanel } = await import("@/lib/mercado/panel");
  const { plazaDelMercado } = await import("@/lib/cj/plazas");
  const { mercadoPorCodigo } = await import("@/lib/mercado/mercados");
  const plaza = plazaDelMercado(await mercadoDelPanel());

  /* ══ LOS BOTONES APUNTAN A LA TIENDA DE LA PLAZA (28 ago 2026) ══
     «Ver lo que llevo agregado» iba fijo a la tienda de EE. UU.: con el
     selector en Chile, el dueño cayó en los 234 productos en dólares del
     catálogo americano y creyó que se habían publicado por accidente. La
     tienda pública de CL/CO vive en SU dominio, así que ese enlace es
     absoluto. */
  const tiendaDePlaza = plaza.tiendaGeneral.slug;
  const vitrinaDePlaza =
    plaza.mercado === "US"
      ? `/tienda/${tiendaDePlaza}`
      : `https://${mercadoPorCodigo(plaza.mercado).dominio}/es/tienda/${tiendaDePlaza}`;
  const almacen = plaza.almacen;

  /* La búsqueda corre en el servidor: la llave de CJ no puede viajar al
     navegador ni dentro de una respuesta. */
  async function buscar(filtros: { texto?: string; pagina?: number }) {
    "use server";
    if (!(await esEquipoInterno())) {
      const te = await getTranslations("panel.catalogoUsa");
      return { ok: false as const, motivo: te("soloEquipo") };
    }
    return buscarEnCj(filtros, almacen);
  }

  const configurado = cjConfigurado();
  /* La importación masiva es solo del rol soporte (publica miles de fichas
     con precio): a quien no lo sea, `estadoImportacionMasiva` le devuelve
     null y la tarjeta no se dibuja. */
  const masivo = configurado ? await estadoImportacionMasiva() : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Flag className="h-5 w-5 text-carga-500" aria-hidden />
          {plaza.mercado === "US"
            ? t("titulo")
            : t("tituloPlaza", {
                pais: plaza.mercado === "CL" ? "Chile" : "Colombia",
              })}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-tinta-suave">
          {plaza.mercado === "US" ? t("texto") : t("textoPlaza")}
        </p>

        {plaza.mercado !== "US" ? (
          <p className="mt-3 rounded-lg border border-carga-500/40 bg-carga-500/10 px-3 py-2 text-sm font-bold text-riel-900">
            {t("plazaDestino", {
              dominio:
                plaza.mercado === "CL" ? "mercatren.cl" : "mercatren.com.co",
              moneda: plaza.moneda,
            })}
          </p>
        ) : null}

        {/* DÓNDE VER LO QUE SE LLEVA AGREGADO. Sin estos dos enlaces, el
            catálogo se arma a ciegas: se eligen veinte productos y no hay
            forma de mirarlos juntos ni de ver cómo le quedan al comprador. */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={{
              pathname: "/panel/productos",
              query: { comercio: tiendaDePlaza },
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-slate-50"
          >
            <Package className="h-3.5 w-3.5" aria-hidden />
            {t("verMisProductos")}
          </Link>
          <Link
            href={vitrinaDePlaza}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-slate-50"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            {t("verLaTienda")}
          </Link>
        </div>
      </header>

      <RepartirCatalogo />

      {masivo ? <ImportarMasivo inicial={masivo} almacen={almacen} /> : null}

      {configurado ? (
        <BuscadorCj buscar={buscar} idioma={locale} almacen={almacen} />
      ) : (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t("sinLlave")}
        </p>
      )}
    </div>
  );
}
