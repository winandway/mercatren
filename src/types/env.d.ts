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
  /** CJ Dropshipping: surte el catalogo de Estados Unidos. */
  CJ_API_KEY?: string;
  STRIPE_SECRET_KEY: string;
  /** La clave publicable: va al navegador, no es secreta. */
  STRIPE_CLAVE_PUBLICA?: string;
  /** Para verificar que los avisos de pago vienen de Stripe de verdad. */
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_WEBHOOK_SECRET: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;

  /**
   * Datos de la cuenta que recibe los pagos de los clientes.
   *
   * NUNCA van escritos en el codigo: el repositorio es publico, y un numero de
   * cuenta junto a su ruta ACH es justo lo que hace falta para intentar un
   * cobro no autorizado. Se cargan en el panel de YaDominios Cloud, y en la
   * computadora de cada quien en .dev.vars (que no se sube).
   *
   * Solo se le muestran al cliente que tiene un pedido por pagar.
   */
  PAGO_BENEFICIARIO?: string;
  PAGO_BANCO?: string;
  PAGO_CUENTA?: string;
  PAGO_RUTA_ACH?: string;
  PAGO_RUTA_WIRE?: string;
  PAGO_SOPORTE_TELEFONO?: string;
  PAGO_SOPORTE_CORREO?: string;
  ZELLE_CORREO_RECEPTOR?: string;
  ZELLE_NOMBRE_RECEPTOR?: string;

  /**
   * Quien emite las facturas de venta. Datos de registro publico, no secretos:
   * van en el entorno para poder cambiarlos el dia que la sociedad pase a
   * Mercatren LLC sin tocar codigo, y para no tener el domicilio fiscal
   * escrito en un repositorio publico.
   */
  EMISOR_IDENTIFICACION?: string;
  EMISOR_DIRECCION?: string;

  /**
   * A donde se manda una devolucion.
   *
   * Va en el entorno y NO en el codigo porque puede cambiar dentro de un ano,
   * o antes, y cambiarla no puede depender de una publicacion. Es la misma
   * razon por la que no se publica en ninguna pagina: solo la ve quien ya
   * abrio su tramite, y asi siempre es la de hoy.
   */
  DEVOLUCION_DIRECCION?: string;

  /**
   * Envio de correos del sistema, con el servicio propio de Mercatren
   * (Cloudflare Email Sending). El remitente debe ser @mercatren.com: el
   * dominio entero esta autorizado y firmado.
   */
  CLOUDFLARE_EMAIL_TOKEN: string;
  CORREO_REMITENTE: string;

  /**
   * Escudo anti-robots de la entrada (Cloudflare Turnstile). La clave del
   * sitio es publica y va al navegador; el secreto NUNCA sale del servidor.
   * Si faltan, no hay escudo y la entrada funciona como siempre.
   */
  TURNSTILE_CLAVE_SITIO?: string;
  TURNSTILE_SECRETO?: string;

  /** La direccion base del agente operativo, sin barra al final. */
  AGENTE_URL?: string;
  /**
   * El token del agente operativo. Identifica a la CUENTA y a la EMPRESA:
   * quien lo tenga le habla al agente como si fuera Mercatren. Solo servidor.
   */
  AGENTE_TOKEN?: string;
  /** La llave del robotito que sincroniza los catálogos (ver /datos/sincronizar). */
  SINCRONIZAR_LLAVE?: string;

  /**
   * La llave de las plataformas socias (QRbott). Solo sirve para VINCULAR una
   * tienda, y es la credencial mas peligrosa del sistema: quien la tenga puede
   * pedir el token de cualquier comercio. Si falta, esa puerta se cierra.
   */
  SOCIO_LLAVE?: string;

  /**
   * El token de la API de Mercury, para preparar los retiros a los comercios.
   *
   * Token **Custom** con cuatro permisos y SIN `Send Money`: puede pedir un
   * pago con aprobacion, no ejecutarlo. Si se filtra, quien lo tenga no saca
   * dinero — solo deja solicitudes que alguien rechaza de un clic.
   */
  TRADUCCION_LLAVE?: string;
  TRADUCCION_MODELO?: string;
  MERCURY_TOKEN?: string;
  /** La cuenta de Mercury de la que salen los retiros. */
  MERCURY_CUENTA_ID?: string;
}

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SITIO_URL?: string;
    NEXT_PUBLIC_NOMBRE_SITIO?: string;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  }
}
