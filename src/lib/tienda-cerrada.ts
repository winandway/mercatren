import { DESARROLLADOR } from "@/lib/sociedad";

/**
 * LA TIENDA CERRADA, Y LAS PÁGINAS LEGALES QUE NUNCA SE APAGAN (5 nov 2026).
 *
 * Mercatren está en pausa por orden de Richard: no vende. Pero Google Play
 * rechazó la app el 5 nov porque el enlace de privacidad que declaramos daba
 * la página de pausa de la plataforma. Meta de Gerencia: la tienda sigue
 * cerrada y las páginas legales responden siempre, en las MISMAS direcciones
 * que ya están en Play Console y App Store Connect, así no se cambia ningún
 * enlace en las tiendas.
 *
 * La pausa de la plataforma (YaDominios) tapa el sitio entero y nuestro código
 * ni corre. Por eso la tienda se cierra AQUÍ, en el código: el middleware
 * contesta la página de «cerrado» (503) a todo, menos a lo de abajo.
 *
 * Solo en producción: en desarrollo y en las pruebas automáticas la tienda se
 * ve abierta, que es lo que esas pruebas recorren. Volver a abrir la tienda es
 * decisión de Richard: se pone `TIENDA_CERRADA` en `false`.
 *
 * Candado: `tests/unit/tienda-cerrada.test.ts`.
 */
/* ABIERTA desde el 5 nov 2026: Richard pidió «deje la página funcional, todas
   las páginas funcionales», con el catálogo de CJ borrado y el foco en la app.
   El cierre queda listo para volver a usarlo con una línea. */
export const TIENDA_CERRADA = false;

/**
 * Lo que responde con la tienda cerrada, en los dos idiomas y también sin el
 * idioma delante (esas direcciones solo redirigen al idioma):
 *
 * - `privacy`, `terms`, `delete-account` y `support` (con sus casos):
 *   las que declaramos en Google Play y en App Store Connect.
 * - `entrar`, `olvide-mi-clave` y `nueva-clave`: borrar la cuenta exige haber
 *   entrado, y Google pide que se pueda hacer desde la web.
 * - `panel`: el equipo tiene que poder trabajar (detrás de su sesión).
 */
const SIEMPRE_ABIERTA =
  /^(?:\/(?:es|en))?\/(?:privacy|terms|delete-account|support|entrar|olvide-mi-clave|nueva-clave|panel)(?:\/.*)?$/;

/** Las páginas legales declaradas en las tiendas, para el candado. */
export const PAGINAS_LEGALES = [
  "privacy",
  "terms",
  "delete-account",
  "support",
] as const;

/** ¿Responde esta página con la tienda cerrada? */
export function abiertaConTiendaCerrada(ruta: string): boolean {
  return SIEMPRE_ABIERTA.test(ruta);
}

/** La tienda está cerrada en este entorno (solo en producción). */
export function tiendaCerradaAqui(
  entorno: string | undefined = process.env.NODE_ENV,
  cerrada: boolean = TIENDA_CERRADA,
): boolean {
  return cerrada && entorno === "production";
}

const TEXTOS = {
  es: {
    titulo: "Mercatren está cerrado por ahora",
    texto:
      "Estamos preparando la tienda de nuevo. Mientras tanto, estas páginas siguen disponibles:",
    enlaces: [
      ["privacy", "Política de privacidad"],
      ["terms", "Términos y condiciones"],
      ["delete-account", "Borrar mi cuenta"],
      ["support", "Ayuda"],
    ],
    otroIdioma: ["en", "English"],
    derechos: "Todos los derechos reservados. Desarrollado por",
  },
  en: {
    titulo: "Mercatren is closed for now",
    texto:
      "We’re getting the store ready again. In the meantime, these pages are still available:",
    enlaces: [
      ["privacy", "Privacy Policy"],
      ["terms", "Terms and Conditions"],
      ["delete-account", "Delete my account"],
      ["support", "Help"],
    ],
    otroIdioma: ["es", "Español"],
    derechos: "All rights reserved. Developed by",
  },
} as const;

/** El idioma de la página cerrada: el de la dirección, o inglés. */
export function idiomaDe(ruta: string): "es" | "en" {
  return ruta === "/es" || ruta.startsWith("/es/") ? "es" : "en";
}

/** La página «cerrado», entera, sin base de datos ni React. */
export function paginaCerrada(ruta: string, dominio: string): string {
  const idioma = idiomaDe(ruta);
  const t = TEXTOS[idioma];
  const anio = new Date().getUTCFullYear();
  const enlaces = t.enlaces
    .map(
      ([destino, nombre]) =>
        `<li><a href="/${idioma}/${destino}">${nombre}</a></li>`,
    )
    .join("");
  return `<!doctype html>
<html lang="${idioma}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${t.titulo}</title>
<style>
  body { margin:0; min-height:100vh; display:grid; place-items:center; padding:2rem;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background:#10263A; color:#ffffff; text-align:center; }
  main { max-width:32rem; }
  h1 { font-size:clamp(1.5rem,4vw,2.2rem); margin:0 0 .75rem; }
  p { color:#c9d6e3; line-height:1.6; }
  ul { list-style:none; padding:0; margin:1.25rem 0; }
  li { margin:.6rem 0; }
  a { color:#FF6B1A; font-weight:600; }
  footer { margin-top:2rem; font-size:.8rem; color:#9fb3c8; }
  footer a { color:#9fb3c8; font-weight:400; }
</style></head>
<body><main>
<h1>${t.titulo}</h1>
<p>${t.texto}</p>
<ul>${enlaces}</ul>
<p><a href="/${t.otroIdioma[0]}">${t.otroIdioma[1]}</a></p>
<footer>© ${anio} ${dominio} | ${t.derechos} <a href="${DESARROLLADOR.sitio}" target="_blank" rel="noopener noreferrer nofollow">${DESARROLLADOR.nombre}</a></footer>
</main></body></html>`;
}
