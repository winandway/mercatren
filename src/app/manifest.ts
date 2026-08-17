import type { MetadataRoute } from "next";

import { mercadoActual } from "@/lib/mercado/actual";
import { esMercadoPrincipal, marcaDelMercado } from "@/lib/mercado/mercados";

/**
 * Ficha de instalacion de la aplicacion (PWA).
 * Es lo que lee el celular cuando el usuario elige "Agregar a inicio".
 *
 * ══ ERA LA UNICA RUTA ESTATICA QUE DEPENDIA DEL PAIS (17 ago 2026) ══
 *
 * La auditoria de cache de la fase 3 encontro que de 80 rutas solo 5 se
 * prerenderizan, y esta era la unica de las cinco cuyo contenido cambia con
 * el dominio: se horneaba una vez con «Mercatren» y se servia igual en
 * mercatren.cl.
 *
 * Eso no se veia en ninguna pantalla — se veia en el celular de quien
 * instalara la aplicacion desde Chile: el icono en su pantalla de inicio
 * diria el nombre del otro pais. Justo la clase de fallo que el plan avisa
 * que no aparece en desarrollo.
 *
 * `force-dynamic` la saca del horneado: se arma por peticion, con su dominio.
 */
export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const mercado = await mercadoActual();
  const marca = esMercadoPrincipal(mercado)
    ? "Mercatren"
    : marcaDelMercado(mercado);

  return {
    name: marca,
    short_name: marca,
    description: "Tu agente de compras y ventas entre países",
    id: "/es",
    start_url: "/es",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0b1c2c",
    lang: "es",
    dir: "ltr",
    categories: ["shopping", "business"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
