import { z } from "zod";

/**
 * TODAS LAS VARIABLES DE ENTORNO, DECLARADAS EN UN SOLO SITIO.
 *
 * POR QUÉ NO SE VALIDA AL COMPILAR (que es lo habitual)
 *
 * En este proyecto las variables no existen cuando se compila: viven en el
 * panel de YaDominios Cloud y llegan en cada petición dentro de `env`. La
 * máquina de GitHub que compila el sitio no las tiene ni debe tenerlas. Un
 * `env.ts` que revisara al arrancar tumbaría todas las publicaciones.
 *
 * QUÉ SE PROTEGE ENTONCES
 *
 * El fallo de verdad de esta arquitectura es otro, y ya pasó: alguien escribe
 * `env.COSA_NUEVA` en el código, funciona perfecto en su computadora porque la
 * tiene en `.dev.vars`, y en producción no está porque nadie la cargó en el
 * panel. Nadie se entera hasta que un cliente ve la pantalla en blanco.
 *
 * Contra eso: aquí se declara cada variable, y `tests/unit/entorno.test.ts`
 * falla si el código usa una que no esté en esta lista o si `.env.example` se
 * queda atrás. Así, agregar una variable obliga —en la misma compilación— a
 * documentarla.
 *
 * Escrito el 6 ago 2026 con el blindaje.
 */

/**
 * SIN ESTAS EL SITIO NO EXISTE. Las pone la plataforma sola, no hay que
 * cargarlas a mano en ningún panel.
 */
export const IMPRESCINDIBLES = ["DB", "BUCKET"] as const;

/**
 * ESTAS SE CARGAN EN EL PANEL DE YADOMINIOS CLOUD.
 *
 * Ninguna es obligatoria para que el sitio levante, y es a propósito: el
 * proyecto está hecho para funcionar a medias antes que caerse entero. Sin la
 * clave del correo, el aviso se pierde pero la compra se completa. Sin las
 * claves del escudo, la entrada funciona como siempre. Un pago aprobado jamás
 * se deshace porque un servicio de al lado no estuviera configurado.
 *
 * Lo que sí hace cada una: si falta, la parte que depende de ella lo dice en
 * pantalla en vez de inventarse los datos.
 */
export const esquemaEntorno = z.object({
  // La dirección del sitio y su nombre.
  NEXT_PUBLIC_SITIO_URL: z.string().url().optional(),
  NEXT_PUBLIC_NOMBRE_SITIO: z.string().min(1).optional(),

  /* La clave de las sesiones. Si no está, el sitio genera una la primera vez y
     la guarda en su propia base (tabla `configuracion`). Se hizo así porque un
     sitio recién publicado se quedaba sin poder autenticar a nadie. */
  BETTER_AUTH_SECRET: z.string().min(32).optional(),

  // Cobros con tarjeta.
  STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
  STRIPE_CLAVE_PUBLICA: z.string().startsWith("pk_").optional(),

  /* LOS DATOS BANCARIOS NUNCA VAN EN EL CÓDIGO. El repositorio es público, y un
     número de cuenta junto a su ruta ACH es justo lo que hace falta para
     intentar un cobro no autorizado en Estados Unidos. Si faltan, la pantalla
     del pedido lo dice; nunca inventa datos. */
  PAGO_BENEFICIARIO: z.string().optional(),
  PAGO_BANCO: z.string().optional(),
  PAGO_CUENTA: z.string().optional(),
  PAGO_RUTA_ACH: z.string().optional(),
  PAGO_RUTA_WIRE: z.string().optional(),
  PAGO_SOPORTE_TELEFONO: z.string().optional(),
  PAGO_SOPORTE_CORREO: z.string().email().optional(),

  // La cuenta que recibe los pagos por Zelle.
  ZELLE_CORREO_RECEPTOR: z.string().email().optional(),
  ZELLE_NOMBRE_RECEPTOR: z.string().optional(),

  /* QUIÉN EMITE LAS FACTURAS. Son datos de registro público, no secretos —
     van en el entorno para que el día que la sociedad pase a Mercatren LLC se
     cambien sin tocar código, y para no tener el domicilio fiscal escrito en
     un repositorio público. Si faltan, la factura sale con el nombre de la
     sociedad y sin esos renglones; nunca inventa una dirección. */
  EMISOR_IDENTIFICACION: z.string().optional(),
  EMISOR_DIRECCION: z.string().optional(),

  // Los correos del sistema.
  CLOUDFLARE_EMAIL_TOKEN: z.string().optional(),
  CORREO_REMITENTE: z.string().optional(),

  /* El escudo anti-fuerza bruta del login. Se apaga solo si no está
     configurado: dejar a todos los clientes afuera por una variable sin cargar
     es peor que no tener escudo. */
  TURNSTILE_CLAVE_SITIO: z.string().optional(),
  TURNSTILE_SECRETO: z.string().optional(),

  /**
   * LA LLAVE DE LAS PLATAFORMAS SOCIAS (hoy QRbott).
   *
   * Solo sirve para VINCULAR una tienda, y es la credencial más peligrosa del
   * sistema: quien la tenga puede pedir el token de cualquier comercio. Va
   * larga a propósito.
   *
   * Si no está cargada, `/datos/socios/vincular` responde que no está
   * disponible en vez de dejar entrar. Es la única puerta del proyecto que se
   * cierra al faltarle su variable: las demás siguen funcionando a medias,
   * pero una que abre catálogos ajenos no puede quedar abierta por descuido.
   */
  SOCIO_LLAVE: z.string().min(32).optional(),

  /**
   * El token de la API de Mercury, para preparar los retiros a los comercios.
   *
   * Es un token **Custom** con cuatro permisos y sin `Send Money`: puede PEDIR
   * un pago con aprobación, no ejecutarlo. Si se filtra, quien lo tenga no
   * saca dinero — solo deja solicitudes que alguien rechaza de un clic.
   *
   * Opcional a propósito: sin él el panel sigue funcionando entero y los
   * retiros se hacen a mano como hasta ahora.
   */
  MERCURY_TOKEN: z.string().optional(),
});

export type Entorno = z.infer<typeof esquemaEntorno>;

/** Los nombres declarados, para que las pruebas los comparen con el código. */
export const NOMBRES_DECLARADOS: string[] = [
  ...IMPRESCINDIBLES,
  ...Object.keys(esquemaEntorno.shape),
];

/**
 * Revisa el entorno y devuelve lo que falta, sin lanzar.
 *
 * NO LANZA A PROPÓSITO. Quien la llame decide qué hacer: la pantalla de
 * configuración del panel puede mostrar la lista, y el sitio sigue de pie
 * mientras tanto.
 */
export function revisarEntorno(entorno: Record<string, unknown>): {
  bien: boolean;
  faltanImprescindibles: string[];
  malFormadas: string[];
} {
  const faltanImprescindibles = IMPRESCINDIBLES.filter((n) => !entorno[n]);

  const resultado = esquemaEntorno.safeParse(entorno);
  const malFormadas = resultado.success
    ? []
    : resultado.error.issues.map((p) => `${p.path.join(".")}: ${p.message}`);

  return {
    bien: faltanImprescindibles.length === 0 && malFormadas.length === 0,
    faltanImprescindibles,
    malFormadas,
  };
}
