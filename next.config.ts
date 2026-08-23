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
/**
 * ══ FORZAR HTTPS SOLO EN PRODUCCIÓN (18 ago 2026) ══
 *
 * `upgrade-insecure-requests` y HSTS eran fijos, también en `npm run dev`. En
 * una máquina de desarrollo eso rompe dos cosas:
 *
 * 1. **La página no llega a funcionar.** El navegador pide la hoja de estilos y
 *    los guiones por `https://localhost:3000`, donde no hay TLS, y mueren con
 *    error de conexión segura. La pantalla se dibuja pero nada responde: un
 *    formulario de entrar donde el botón no hace absolutamente nada.
 * 2. **Y se queda grabado.** HSTS lo recuerda el navegador **por dominio**, así
 *    que `localhost` queda clavado en HTTPS durante un año para TODOS los
 *    proyectos de esa máquina, no solo para este. Se limpia a mano en
 *    `chrome://net-internals/#hsts`, si uno sabe que existe.
 *
 * Lo destapó la prueba de devoluciones en celular: el login «no respondía» y la
 * causa no estaba en el login. Es el mismo fallo que arrastraba
 * `comprobante.spec.ts`, que llevaba meses en rojo sin que se supiera por qué.
 *
 * En producción las dos siguen igual de puestas, que es donde sirven.
 */
const EN_PRODUCCION = process.env.NODE_ENV === "production";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  /* LOS VIDEOS DE LOS COMERCIOS (23 ago 2026). `'self'` sirve los publicados
     (van por /media), y `blob:` es imprescindible para la VISTA PREVIA al
     subir: el navegador lee el archivo del disco como blob para medir su
     duración y sacarle la portada. Sin `blob:` la CSP lo bloquea y el
     formulario dice «no pudimos leer la duración» con un video perfecto
     delante — medido el 23 ago 2026. */
  "media-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.stripe.com https://challenges.cloudflare.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(EN_PRODUCCION ? ["upgrade-insecure-requests"] : []),
].join("; ");

const CABECERAS = [
  { key: "Content-Security-Policy", value: CSP },
  /* Un año de HTTPS obligatorio. El sitio ya va entero por HTTPS.
     Fuera de producción NO se manda: se le quedaría grabado al navegador que
     `localhost` va por HTTPS, y eso afecta a todos los proyectos de la máquina. */
  ...(EN_PRODUCCION
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]
    : []),
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

  /**
   * EL LÍMITE QUE DEJABA A LOS COMERCIOS SIN PODER CARGAR SUS PRODUCTOS.
   *
   * Next pone **1 MB** por defecto al cuerpo de una acción de servidor, y las
   * fotos de un producto viajan por ahí dentro. Cada foto se encoge en el
   * navegador hasta unos 400 KB (`PESO_OBJETIVO`), así que **a la tercera foto
   * ya se pasa** y el guardado revienta. El formulario deja elegir ocho.
   *
   * Y falla de la peor manera posible: el rechazo ocurre en el marco, antes de
   * llegar a nuestro código, así que no hay forma de devolver un motivo. El
   * comercio solo veía «no pudimos guardar ahora mismo» y volvía a intentarlo
   * con el mismo resultado.
   *
   * Le pasó a MEGAYES el 12 ago 2026 subiendo las fotos de sus motos.
   *
   * 20 MB da sitio a las ocho fotos con holgura y al caso en que comprimir
   * falla —un HEIC de iPhone en un navegador que no lo sabe dibujar— y se sube
   * el original. Sigue muy por debajo de lo que acepta Cloudflare.
   */
  experimental: {
    serverActions: { bodySizeLimit: "20mb" },
  },
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
