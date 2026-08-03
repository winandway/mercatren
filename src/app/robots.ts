import type { MetadataRoute } from "next";

import { SITIO } from "@/lib/sitio";

/**
 * Las reglas para los buscadores.
 *
 * Se abre lo publico y se cierra todo lo que tenga datos de alguien: el panel,
 * el carrito, el pago, los comprobantes del bucket y las rutas del servidor.
 * El PDF completo del modelo tampoco se indexa: se entrega por enlace directo
 * a bancos y socios, no se busca en Google.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/panel/",
          "/es/panel/",
          "/en/panel/",
          "/carrito",
          "/es/carrito",
          "/en/carrito",
          "/checkout",
          "/es/checkout",
          "/en/checkout",
          "/pedido/",
          "/es/pedido/",
          "/en/pedido/",
          "/entrar",
          "/es/entrar",
          "/en/entrar",
          "/datos/",
          "/media/",
          "/docs/mercatren-modelo-de-negocio.pdf",
        ],
      },
    ],
    sitemap: `${SITIO.url}/sitemap.xml`,
    host: SITIO.url,
  };
}
