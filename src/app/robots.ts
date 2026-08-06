import type { MetadataRoute } from "next";

import { SITIO } from "@/lib/sitio";

/**
 * Las reglas para los buscadores.
 *
 * Se abre lo publico y se cierra todo lo que tenga datos de alguien: el panel,
 * el carrito, el pago, los comprobantes del bucket y las rutas del servidor.
 * El PDF completo del modelo tampoco se indexa: se entrega por enlace directo
 * a bancos y socios, no se busca en Google.
 *
 * POR QUÉ GOOGLEBOT Y GOOGLEBOT-IMAGE VAN NOMBRADOS APARTE (6 ago 2026)
 *
 * Con solo `User-agent: *` el sitio se rastreaba bien y salía en las
 * búsquedas normales, pero Google Merchant Center rechazó 622 de 625
 * productos con "Unable to do quality & policy checks on product pages —
 * update your robots.txt to include user-agents Googlebot and
 * Googlebot-Image".
 *
 * Merchant Center no se conforma con el comodín: entra a cada ficha a
 * comprobar que el precio y las existencias del catálogo coinciden con lo que
 * ve el comprador, y para eso exige que su robot esté nombrado. Sin eso no
 * puede hacer la comprobación, y un producto que no puede comprobar no lo
 * publica.
 *
 * `Googlebot-Image` es igual de necesario: si no puede leer las fotos, el
 * producto sale sin imagen — y sin imagen tampoco lo publica.
 *
 * LAS TRES LISTAS TIENEN QUE DECIR LO MISMO. Si un día se cierra una ruta
 * nueva y solo se agrega al comodín, el robot de Merchant Center entraría
 * donde no debe. Por eso la lista está escrita una vez y se reparte a las
 * tres; `tests/unit/robots.test.ts` falla si alguien las separa.
 */

/** Lo que ningún buscador debe rastrear. Una sola lista para las tres reglas. */
const CERRADO = [
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
  // Recuperar la contraseña: el enlace del correo lleva un pase en la
  // dirección y eso no puede acabar en un buscador.
  "/olvide-mi-clave",
  "/es/olvide-mi-clave",
  "/en/olvide-mi-clave",
  "/nueva-clave",
  "/es/nueva-clave",
  "/en/nueva-clave",
  "/media/",
  "/docs/mercatren-modelo-de-negocio.pdf",
];

/**
 * `/datos/` se cierra para todos MENOS para Googlebot.
 *
 * Ahí vive el catálogo que lee Merchant Center (`/datos/google`). Cerrárselo
 * sería entregarle una dirección que su propio robot tiene prohibido abrir.
 * El resto de `/datos/` son rutas de servidor que no devuelven páginas, así
 * que no hay nada que un buscador pueda indexar de ahí.
 */
const CERRADO_SALVO_GOOGLE = [...CERRADO, "/datos/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: CERRADO_SALVO_GOOGLE,
      },
      {
        // Merchant Center entra a cada ficha a comprobar precio y existencias.
        userAgent: "Googlebot",
        allow: "/",
        disallow: CERRADO,
      },
      {
        // Y a leer las fotos: sin imagen, el producto no se publica.
        userAgent: "Googlebot-Image",
        allow: "/",
        disallow: CERRADO,
      },
    ],
    sitemap: `${SITIO.url}/sitemap.xml`,
    host: SITIO.url,
  };
}
