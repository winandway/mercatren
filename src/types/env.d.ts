/**
 * Variables y secretos que la aplicacion espera encontrar en el entorno.
 *
 * Los bindings (DB, BUCKET, ASSETS) los genera wrangler en cloudflare-env.d.ts;
 * aqui solo se suman los valores que se cargan desde el panel de YaDominios
 * Cloud o desde .dev.vars cuando se trabaja local.
 *
 * NINGUN valor real vive en el repositorio. Ver .env.example.
 */
interface CloudflareEnv {
  /** Direccion publica del sitio. Ej: https://mercatren.com */
  NEXT_PUBLIC_SITIO_URL: string;
  NEXT_PUBLIC_NOMBRE_SITIO: string;

  /** Llave larga y aleatoria que firma las sesiones. */
  BETTER_AUTH_SECRET: string;

  /** Stripe Connect: cobros del cliente y pago dividido al vendedor. */
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;

  /** Cuenta de Zelle que recibe los pagos de los clientes. */
  ZELLE_CORREO_RECEPTOR?: string;
  ZELLE_NOMBRE_RECEPTOR?: string;

  /** Envio de correos (confirmaciones de pedido, avisos de envio). */
  RESEND_API_KEY: string;
  CORREO_REMITENTE: string;
}

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SITIO_URL?: string;
    NEXT_PUBLIC_NOMBRE_SITIO?: string;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  }
}
