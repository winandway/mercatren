import { Encabezado } from "@/components/layout/encabezado";
import { PiePagina } from "@/components/layout/pie-pagina";
import { WebMcp } from "@/components/agentes/webmcp";
import { PulsoDeVisita } from "@/components/analitica/pulso-de-visita";
import { RastroDeNavegacion } from "@/components/navegacion/rastro-de-navegacion";

/**
 * Todo lo que ve el publico: catalogo, producto, carrito, ayuda.
 * El panel de administracion tiene su propia estructura y no pasa por aqui.
 */
export default async function LayoutTienda({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      {/* WebMCP: si el navegador trae agente, se le anuncian buscar y abrir. */}
      <WebMcp locale={locale} />
      {/* Anota la página anterior por pestaña: la flecha «← Volver» de la
          ficha lo necesita porque en las navegaciones de cliente el referrer
          no se actualiza. */}
      <RastroDeNavegacion />
      <PulsoDeVisita />
      <Encabezado />
      <main className="flex-1">{children}</main>
      <PiePagina />
    </>
  );
}
