/**
 * EL ESCUDO ANTI-ROBOTS DENTRO DE LA APP (5 nov 2026).
 *
 * Entrar y crear cuenta exigen el pase de Cloudflare Turnstile (regla de la
 * casa: «Todo login lleva escudo anti-robots»), y el servidor lo comprueba
 * antes de mirar la contraseña (`src/app/datos/auth/[...all]/route.ts`).
 *
 * Turnstile no tiene versión nativa: Cloudflare indica cargarlo en una vista
 * web de una página del propio dominio («Mobile implementation», en su
 * documentación). Esta es esa página: dibuja el recuadro y le pasa el pase a
 * la app con `ReactNativeWebView.postMessage`. La app lo manda en la cabecera
 * `x-escudo`, igual que la web.
 *
 * Lo que la página manda lo lee la app en `app-movil/src/lib/escudo.ts`.
 *
 * Sin la clave del sitio cargada no hay escudo: la página avisa
 * `{"sinEscudo":true}` y la app entra sin pase, igual que la web (el servidor
 * tampoco lo exige si no tiene con qué comprobarlo).
 */
export type MensajeDelEscudo =
  { pase: string } | { pase: null } | { sinEscudo: true } | { error: true };

export function paginaDelEscudo(
  claveSitio: string | undefined,
  idioma: "es" | "en",
): string {
  /* «<» escapado: nada de lo que venga en los ajustes puede cerrar el guion. */
  const ajustes = JSON.stringify({ clave: claveSitio ?? null, idioma }).replace(
    /</g,
    "\\u003c",
  );
  return `<!doctype html>
<html lang="${idioma}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<meta name="robots" content="noindex">
<title>Mercatren</title>
<style>html,body{margin:0;padding:0;background:transparent}body{display:flex;justify-content:center;align-items:center;min-height:70px}</style>
</head>
<body>
<div id="caja"></div>
<script>
var AJUSTES = ${ajustes};
/* El puente de la app puede no estar listo en el primer instante (en iPhone
   un aviso mandado antes de que la página termine de cargar se pierde): se
   espera a «load» y, si hace falta, se reintenta unos segundos. */
function avisar(m) {
  var intentos = 0;
  function mandar() {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(m));
    } else if (intentos++ < 100) {
      setTimeout(mandar, 50);
    }
  }
  if (document.readyState === "complete") mandar();
  else window.addEventListener("load", mandar);
}
function dibujar() {
  window.turnstile.render("#caja", {
    sitekey: AJUSTES.clave,
    language: AJUSTES.idioma,
    theme: "light",
    callback: function (pase) { avisar({ pase: pase }); },
    "expired-callback": function () { avisar({ pase: null }); },
    "error-callback": function () { avisar({ error: true }); }
  });
}
if (!AJUSTES.clave) {
  avisar({ sinEscudo: true });
} else {
  var guion = document.createElement("script");
  guion.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  guion.async = true;
  guion.onload = dibujar;
  guion.onerror = function () { avisar({ error: true }); };
  document.head.appendChild(guion);
}
</script>
</body>
</html>`;
}
