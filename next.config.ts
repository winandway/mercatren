import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * LAS CABECERAS DE SEGURIDAD (blindaje del 6 ago 2026).
 *
 * Son instrucciones que el sitio le da al navegador de cada visitante sobre lo
 * que tiene permitido hacer con la página. Cuestan cero y cierran familias
 * enteras de ataque.
 *
 * OJO CON LA CSP, QUE ES LA QUE PUEDE TUMBAR EL SITIO. Está escrita para este
 * proyecto en concreto, no copiada de un ejemplo:
 *
 * - `script-src` lleva `unsafe-inline` y `unsafe-eval` porque Next mete guiones
 *   en línea para arrancar la página. Quitarlos deja el sitio en blanco. La
 *   forma correcta de apretarlo es con nonce por petición, y eso obliga a tocar
 *   el código del producto: queda anotado como deuda.
 * - `img-src` acepta cualquier `https`. Los productos importados muestran las
 *   fotos desde el servidor del propio comercio, y cada comercio nuevo trae un
 *   dominio que hoy no se conoce. Cerrarlo dejaría el catálogo sin imágenes.
 * - Stripe y Turnstile van nombrados: sin sus dominios, no se puede pagar con
 *   tarjeta ni entrar al panel.
 * - `frame-ancestors 'none'` impide que alguien meta el sitio dentro de un
 *   marco en otra página para robar clics sobre el panel.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.stripe.com https://challenges.cloudflare.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const CABECERAS = [
  { key: "Content-Security-Policy", value: CSP },
  /* Un año de HTTPS obligatorio. El sitio ya va entero por HTTPS. */
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  /* Que el navegador no adivine el tipo de un archivo: así una imagen subida
     por alguien no se puede hacer pasar por un guion. Importa de verdad aquí,
     donde los clientes suben comprobantes. */
  { key: "X-Content-Type-Options", value: "nosniff" },
  /* Nadie mete el sitio dentro de un marco. Para navegadores viejos que no
     entienden `frame-ancestors`. */
  { key: "X-Frame-Options", value: "DENY" },
  /* Al salir del sitio no se filtra la dirección completa de la que se venía.
     Las direcciones del panel llevan identificadores de pedidos y comercios. */
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  /* El sitio no usa cámara, micrófono ni ubicación. Se apagan de entrada. */
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:ruta*", headers: CABECERAS }];
  },
  turbopack: {
    // Hay otro package-lock.json mas arriba en el disco; sin esto Next elige
    // esa carpeta como raiz y avisa en cada compilacion.
    // OJO: no usar `import.meta.dirname` aqui. Este archivo se carga como
    // CommonJS, ahi queda indefinido y el servidor de desarrollo deja de
    // encontrar los paquetes ("Cannot find module 'next-intl'").
    root: process.cwd(),
  },
};

export default withNextIntl(nextConfig);

// El trabajador de la aplicacion instalable (public/sw.js) NO se genera aqui:
// lo arma `npm run sw` con el generador propio de Serwist, porque el plugin de
// Next trabaja con webpack y este proyecto compila con Turbopack.

// Permite usar la base de datos y el bucket de YaDominios Cloud mientras se
// trabaja con `npm run dev`, sin conectarse a nada remoto.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
void initOpenNextCloudflareForDev();
