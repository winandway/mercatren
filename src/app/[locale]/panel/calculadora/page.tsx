import { getTranslations, setRequestLocale } from "next-intl/server";

import { CalculadoraFactura } from "@/components/panel/facturar/calculadora-factura";
import { COMISION_ZELLE_PB } from "@/lib/dinero";
import type { Idioma } from "@/lib/dinero";
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

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold tracking-tight">{t("titulo")}</h1>
      <CalculadoraFactura
        idioma={locale as Idioma}
        comisionPuntosBase={COMISION_ZELLE_PB}
        tiendaId={tiendaId}
        productos={productos}
      />
    </div>
  );
}
