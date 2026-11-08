import { Encabezado } from "@/components/layout/encabezado";
import { PiePagina } from "@/components/layout/pie-pagina";
import { WebMcp } from "@/components/agentes/webmcp";
import { RastroDeNavegacion } from "@/components/navegacion/rastro-de-navegacion";
import { AvisoAppAndroid } from "@/components/marca/aviso-app-android";
import { getTranslations } from "next-intl/server";
import {
  fichaDeGooglePlay,
  insigniaDeGooglePlay,
} from "@/lib/app-android/google-play";

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
  const tPlay = await getTranslations({ locale, namespace: "googlePlay" });
  return (
    <>
      {/* WebMCP: si el navegador trae agente, se le anuncian buscar y abrir. */}
      <WebMcp locale={locale} />
      {/* Anota la página anterior por pestaña: la flecha «← Volver» de la
          ficha lo necesita porque en las navegaciones de cliente el referrer
          no se actualiza. */}
      <RastroDeNavegacion />
      {/* Sin pulso de visitas desde el 5 nov 2026: mirar no escribe en la base
          (regla «La nube no se come el dinero»). */}
      <Encabezado />
      <main className="flex-1">{children}</main>
      <PiePagina />
      {/* Solo en celulares Android y fuera de la app (8 nov 2026). */}
      <AvisoAppAndroid
        ficha={fichaDeGooglePlay(locale)}
        insignia={insigniaDeGooglePlay(locale)}
        textos={{
          titulo: tPlay("avisoAndroid"),
          texto: tPlay("avisoAndroidTexto"),
          alt: tPlay("alt"),
          cerrar: tPlay("cerrar"),
        }}
      />
    </>
  );
}
