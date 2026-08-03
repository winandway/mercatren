import { Encabezado } from "@/components/layout/encabezado";
import { PiePagina } from "@/components/layout/pie-pagina";

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
      <Encabezado />
      <main className="flex-1">{children}</main>
      <PiePagina />
    </>
  );
}
