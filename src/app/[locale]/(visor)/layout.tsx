import { Encabezado } from "@/components/layout/encabezado";
import { PiePagina } from "@/components/layout/pie-pagina";
import { RastroDeNavegacion } from "@/components/navegacion/rastro-de-navegacion";

/**
 * EL VISOR DE VIDEOS: INMERSIVO EN EL TELÉFONO, CON MENÚS EN ESCRITORIO.
 *
 * Lo pidió el dueño con la captura delante (24 ago 2026): en el celular, el
 * encabezado completo —logo, buscador, ciudad, menú— se comía media pantalla
 * y **el botón «Entra en mi tienda» quedaba escondido debajo**. Sus palabras:
 * «el buscador acá debería ocultarse… y agarrar ese espacio para el botón de
 * ir a la tienda».
 *
 * ══ CÓMO SE RESUELVE ══
 *
 * - **En el teléfono, el video ES la pantalla** (como TikTok y los Shorts):
 *   ni encabezado ni pie. La flecha de volver y la lupa van DENTRO del visor,
 *   flotando sobre el video, y el botón de la tienda queda siempre a la
 *   vista.
 * - **En escritorio no cambia nada**: menús a los lados, como se decidió el
 *   24 de agosto. Por eso el encabezado va en `hidden sm:block`, no borrado.
 * - Es un GRUPO DE RUTAS: la URL `/video/<slug>` no cambia — la misma regla
 *   que la barra de Docs.
 *
 * El rastro de navegación se queda: la flecha de volver lo necesita (el
 * referrer no se actualiza en navegaciones de cliente).
 */
export default async function LayoutVisor({
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return (
    <>
      <RastroDeNavegacion />
      <div className="hidden sm:block">
        <Encabezado />
      </div>
      <main className="flex-1">{children}</main>
      <div className="hidden sm:block">
        <PiePagina />
      </div>
    </>
  );
}
