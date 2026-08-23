import { Encabezado } from "@/components/layout/encabezado";
import { PiePagina } from "@/components/layout/pie-pagina";
import { RastroDeNavegacion } from "@/components/navegacion/rastro-de-navegacion";

/**
 * Todo lo que ve el publico: catalogo, producto, carrito, ayuda.
 * El panel de administracion tiene su propia estructura y no pasa por aqui.
 */
export default function LayoutTienda({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Anota la página anterior por pestaña: la flecha «← Volver» de la
          ficha lo necesita porque en las navegaciones de cliente el referrer
          no se actualiza. */}
      <RastroDeNavegacion />
      <Encabezado />
      <main className="flex-1">{children}</main>
      <PiePagina />
    </>
  );
}
