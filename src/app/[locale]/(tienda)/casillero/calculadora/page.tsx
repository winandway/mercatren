import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CalculadoraEnvio } from "@/components/casillero/calculadora-envio";
import { Link } from "@/i18n/navigation";
import { paisesCotizables } from "@/lib/casillero/calculadora-publica";
import type { Idioma } from "@/lib/dinero";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "casillero.calculadora",
  });
  return { title: t("titulo"), description: t("bajada") };
}

const CLAVES = [
  "titulo",
  "bajada",
  "paisEtiqueta",
  "peso",
  "pesoAyuda",
  "valor",
  "valorAyuda",
  "medidas",
  "medidasAyuda",
  "largoIn",
  "anchoIn",
  "altoIn",
  "calcular",
  "calculando",
  "total",
  "pesoFacturable",
  "impuestoIncluido",
  "impuestoAparte",
  "estimado",
  "error_entrada",
  "error_sin-tarifa",
  "error_sin-peso",
  "renglon_flete",
  "renglon_despacho",
  "renglon_seguro",
  "renglon_almacenaje",
  "renglon_ajuste-minimo",
  "modo",
  "aereo",
  "maritimo",
  "aereoAyuda",
  "maritimoAyuda",
  "unidad",
  "libras",
  "kilos",
  "medidasBarco",
  "medidasBarcoAyuda",
  "seguroCasilla",
  "seguroAyuda",
  "totalBarco",
  "piesFacturables",
  "renglon_flete-maritimo",
  "error_sin-medidas",
  "detallesTitulo",
  "ayudaBoton",
  "obligatorios",
  "ayuda_peso_titulo",
  "ayuda_peso",
  "ayuda_valor_titulo",
  "ayuda_valor",
  "ayuda_medidas_titulo",
  "ayuda_medidas",
  "ayuda_seguro_titulo",
  "ayuda_seguro",
] as const;

/**
 * ══ LA CALCULADORA, EN SU PROPIA PÁGINA (16 sep 2026) ══
 *
 * Richard: _«¿en qué parte está la calculadora? No la veo por ningún lado»_.
 * Vivía al final de la página pública del casillero, y con sesión nadie
 * pasa por ahí: «Casillero» lleva directo al suyo. Ahora tiene dirección
 * propia y se enlaza desde el casillero, desde «mi casillero», desde la
 * cuenta y desde la ficha del producto. Quien va a comprar en otra tienda
 * o en la nuestra la encuentra en dos toques.
 */
export default async function PaginaCalculadora({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;
  const tc = await getTranslations("casillero.calculadora");
  const t = await getTranslations("casillero");

  const cotizables = await paisesCotizables().catch(() => []);
  const paises = cotizables.map((c) => ({
    codigo: c.codigo,
    aereo: c.aereo,
    maritimo: c.maritimo,
    seguroPorciento: c.seguroPorciento,
    nombre: tc.has(`paises.${c.codigo}`) ? tc(`paises.${c.codigo}`) : c.codigo,
    salida: tc.has(`salida.${c.codigo}`) ? tc(`salida.${c.codigo}`) : undefined,
  }));
  const textos: Record<string, string> = Object.fromEntries(
    CLAVES.map((k) => [k, tc(k)]),
  );

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      {paises.length > 0 ? (
        <CalculadoraEnvio paises={paises} idioma={idioma} textos={textos} />
      ) : (
        <div className="rounded-2xl border border-borde p-6 text-center">
          <h1 className="text-xl font-bold">{tc("titulo")}</h1>
          <p className="mt-2 text-sm text-tinta-suave">{tc("pronto")}</p>
        </div>
      )}
      <p className="mt-6 text-center text-sm text-tinta-suave">
        {tc("sinCasilleroTexto")}{" "}
        <Link
          href="/casillero"
          className="font-semibold text-carga-600 hover:underline"
        >
          {t("crear")}
        </Link>
      </p>
    </main>
  );
}
