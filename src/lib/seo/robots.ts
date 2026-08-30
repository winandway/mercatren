import { MEDIA_PRIVADOS_URL } from "@/lib/media/privados";
import { SITIO } from "@/lib/sitio";

/**
 * Las reglas para los buscadores.
 *
 * Se abre lo publico y se cierra todo lo que tenga datos de alguien: el panel,
 * el carrito, el pago, los comprobantes del bucket y las rutas del servidor.
 * El PDF completo del modelo tampoco se indexa: se entrega por enlace directo
 * a bancos y socios, no se busca en Google.
 *
 * ══ POR QUÉ ESTO SE ESCRIBE A MANO Y NO CON `MetadataRoute.Robots` ══
 *
 * Next arma el robots.txt solo, pero su formato solo admite `User-agent`,
 * `Allow`, `Disallow` y `Sitemap`. No hay forma de meterle la línea
 * `Content-Signal`, que es la que declara qué pueden hacer las IA con el
 * catálogo. Por eso el texto se compone aquí y `src/app/robots.txt/route.ts`
 * lo sirve.
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
 * ve el comprador, y para eso exige que su robot esté nombrado.
 *
 * Y NO ALCANZÓ CON NOMBRARLOS (8 ago 2026)
 *
 * El error siguió igual: 634 productos, el 99,8 % del catálogo. El motivo era
 * que aquí se cerraba `/media/` ENTERO, y el catálogo manda las fotos como
 * `https://mercatren.com/media/productos/...`. Le dábamos a Google la
 * dirección de la foto y en el mismo archivo le prohibíamos abrirla.
 *
 * Cerrar de más no es "más seguro": costó el catálogo entero fuera de Google
 * Shopping, sin que nada se viera roto en el sitio.
 *
 * LAS TRES LISTAS TIENEN QUE DECIR LO MISMO. Si un día se cierra una ruta
 * nueva y solo se agrega al comodín, el robot de Merchant Center entraría
 * donde no debe. Por eso la lista está escrita una vez y se reparte a las
 * tres; `tests/unit/robots.test.ts` falla si alguien las separa.
 */

/** Lo que ningún buscador debe rastrear. Una sola lista para las tres reglas. */
export const CERRADO = [
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
  /* De `/media` solo se cierra lo privado, NUNCA la carpeta entera: por ahí
     salen también las fotos de los productos, que Google TIENE que poder
     abrir. La lista sale del mismo sitio que usa la ruta que sirve los
     archivos, para que no puedan volver a decir cosas distintas. */
  ...MEDIA_PRIVADOS_URL,
  "/docs/mercatren-modelo-de-negocio.pdf",
];

/**
 * `/datos/` se cierra para todos MENOS para Googlebot.
 *
 * Ahí vive el catálogo que lee Merchant Center (`/datos/google`). Cerrárselo
 * sería entregarle una dirección que su propio robot tiene prohibido abrir.
 */
export const CERRADO_SALVO_GOOGLE = [...CERRADO, "/datos/"];

/**
 * QUÉ PUEDEN HACER LAS IA CON ESTE CATÁLOGO (9 ago 2026).
 *
 * `Content-Signal` es una declaración de preferencia, no un candado: quien la
 * respeta la respeta, y técnicamente no impide nada. Por eso se elige pensando
 * en qué conviene al negocio, no en qué se puede bloquear.
 *
 *  - `search=yes`  — que el sitio salga en buscadores. Es a lo que venimos.
 *  - `ai-input=yes`— que un asistente pueda CITAR un producto nuestro cuando
 *    alguien pregunta dónde comprar algo. Eso es tráfico y compradores; cerrarlo
 *    sería desaparecer del sitio donde la gente empezó a buscar.
 *  - `ai-train=no` — entrenar un modelo con el catálogo no nos devuelve nada.
 *    Es lo único que se niega, y se niega por eso: porque no hay intercambio.
 *
 * La diferencia entre `ai-input` y `ai-train` es la que importa y se confunde
 * fácil: uno es que te citen hoy, el otro es que te copien para siempre.
 */
export const SENAL_DE_CONTENIDO = "search=yes, ai-input=yes, ai-train=no";

type Regla = { agente: string; cerrado: string[] };

/** Las tres reglas, en orden. Se exporta para que las pruebas las revisen. */
export function reglasRobots(): Regla[] {
  return [
    { agente: "*", cerrado: CERRADO_SALVO_GOOGLE },
    // Merchant Center entra a cada ficha a comprobar precio y existencias.
    { agente: "Googlebot", cerrado: CERRADO },
    // Y a leer las fotos: sin imagen, el producto no se publica.
    { agente: "Googlebot-Image", cerrado: CERRADO },
  ];
}

/** El archivo tal cual lo lee un robot. */
/**
 * ══ EL ROBOTS ES DEL DOMINIO QUE LO PIDE (30 ago 2026) ══
 *
 * Estaba clavado a mercatren.com: el robots.txt de mercatren.cl le decía a
 * Google «Sitemap: https://mercatren.com/sitemap.xml» — el mapa de OTRO
 * dominio. Cada dominio declara SU host, SU mapa y SU llms.txt; sin la base
 * se cae al principal, que es lo que había.
 */
export function robotsTxt(base: string = SITIO.url): string {
  const bloques = reglasRobots().map(({ agente, cerrado }) =>
    [
      `User-agent: ${agente}`,
      /* La señal va DENTRO de cada grupo, no suelta arriba: así la lee el
         mismo agente al que le aplica, que es como está definida. */
      `Content-Signal: ${SENAL_DE_CONTENIDO}`,
      "Allow: /",
      ...cerrado.map((ruta) => `Disallow: ${ruta}`),
    ].join("\n"),
  );

  return [
    `# Mercatren — ${base.replace("https://", "")}`,
    "# Que pueden hacer las IA con este contenido: https://contentsignals.org/",
    `# Para agentes y asistentes: ${base}/llms.txt`,
    "",
    bloques.join("\n\n"),
    "",
    `Host: ${base}`,
    `Sitemap: ${base}/sitemap.xml`,
    /* ARD (§6.1): dónde está el manifiesto de capacidades para agentes. */
    `Agentmap: ${base}/.well-known/ai-catalog.json`,
    "",
  ].join("\n");
}
