import { getTranslations, setRequestLocale } from "next-intl/server";

import { CalculadoraFactura } from "@/components/panel/facturar/calculadora-factura";
import { COMISION_ZELLE_PB } from "@/lib/dinero";
import type { Idioma } from "@/lib/dinero";
import { esEquipoInterno } from "@/lib/autorizacion";
import { listarComercios } from "@/lib/zelle/consultas";
import { productosParaCuadrar } from "@/lib/productos/consultas";

export const dynamic = "force-dynamic";

/**
 * PANEL → CUADRAR UNA FACTURA.
 *
 * El caso que la pidió: un comercio con una factura de $7,475.00 exactos y
 * tubos de $199.05 — 37,55 unidades. Estaba probando cantidades a mano desde
 * el celular.
 *
 * Los productos salen del ALCANCE de la sesión, como todo en el panel: un
 * vendedor cuadra con los suyos, y el equipo puede abrir los de un comercio
 * con `?comercio=slug` para ayudarle —que es justo lo que el dueño quería
 * hacer desde su computadora.
 */
export default async function PaginaCalculadora({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ comercio?: string }>;
}) {
  const { locale } = await params;
  const { comercio } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("panel.calculadora");

  /* Solo los publicados y con precio: cuadrar con un borrador sin precio da
     una factura que no se puede cobrar. */
  const { tiendaId, productos } = await productosParaCuadrar(comercio);

  /* El equipo cuadra POR un comercio. Antes solo se podía con `?comercio=` en
     la dirección: quien no sabía escribirla veía la pantalla vacía y sin
     forma de arreglarlo — que es justo lo que le pasó al dueño. */
  /* El siguiente de la serie de cobros: consecutivo de verdad, no adivinado
     sobre lo último que alguien escribió a mano. Se MIRA sin consumirlo —
     abrir esta pantalla y cerrarla no puede dejar un hueco— y al crear el
     cobro se toma el de verdad, atómicamente. */
  const { getDb } = await import("@/lib/db");
  const { SERIES } = await import("@/lib/facturas/numeracion");
  const { proponerNumero } = await import("@/lib/facturas/serie");
  const referenciaSugerida = await proponerNumero(
    getDb(),
    SERIES.cobroEnlace,
  ).catch(() => "");

  const esEquipo = await esEquipoInterno().catch(() => false);
  const comercios = esEquipo
    ? (await listarComercios().catch(() => [])).map((c) => ({
        id: c.id,
        slug: c.slug,
        nombre: c.nombre,
      }))
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold tracking-tight">{t("titulo")}</h1>
      <CalculadoraFactura
        idioma={locale as Idioma}
        comisionPuntosBase={COMISION_ZELLE_PB}
        tiendaId={tiendaId}
        comercios={comercios}
        comercioElegido={comercio}
        referenciaSugerida={referenciaSugerida}
        productos={productos}
      />
    </div>
  );
}
