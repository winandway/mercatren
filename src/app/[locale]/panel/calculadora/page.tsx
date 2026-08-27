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

  /* ══ LO QUE ZELLE DE VERDAD VA A PERMITIR EN EL ENLACE (27 ago 2026) ══

     La calculadora prometía «transferencia y Zelle» para cualquier monto, y
     con $7.475 eso es falso: el enlace no ofrece Zelle por encima del tope.
     Prometer un método que no va a salir es exactamente la queja del dueño
     («no pones claras las cosas»), así que el mínimo y el tope viajan al
     componente y el aviso los dice según el monto escrito. Se leen con las
     MISMAS funciones que usa el enlace — dos cuentas distintas de la misma
     regla se desincronizan a la primera edición del panel. */
  const { minimoAplicable, maximoAplicable } =
    await import("@/lib/cobros/zelle");
  const { configuracion } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");
  const db = getDb();
  const leer = async (clave: string) => {
    const [fila] = await db
      .select({ valor: configuracion.valor })
      .from(configuracion)
      .where(eq(configuracion.clave, clave))
      .limit(1)
      .catch(() => []);
    const n = fila ? Number.parseInt(fila.valor, 10) : Number.NaN;
    return Number.isFinite(n) ? n : null;
  };
  const zelleLimites = {
    minimoCentavos: minimoAplicable({
      minimoTiendaCentavos: null,
      minimoGlobalCentavos: await leer("zelle_cobros_minimo_centavos"),
    }),
    maximoCentavos: maximoAplicable({
      maximoGlobalCentavos: await leer("zelle_cobros_maximo_centavos"),
    }),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold tracking-tight">{t("titulo")}</h1>
      <CalculadoraFactura
        zelleLimites={zelleLimites}
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
