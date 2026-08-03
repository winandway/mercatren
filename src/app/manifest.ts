import type { MetadataRoute } from "next";

/**
 * Ficha de instalacion de la aplicacion (PWA).
 * Es lo que lee el celular cuando el usuario elige "Agregar a inicio".
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mercatren",
    short_name: "Mercatren",
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
