/**
 * El widget del casillero de Mercatren.
 *
 * Se pega en cualquier sitio con dos líneas:
 *
 *   <div id="mtr-casillero"></div>
 *   <script src="https://mercatren.com/widget/casillero.js"
 *           data-clave="pk_xxxxxxxx" async></script>
 *
 * ══ ES UN IFRAME, Y NO UNA INYECCIÓN DIRECTA ══
 *
 * Por dos motivos, los dos importantes: los estilos del sitio que lo aloja
 * no pueden romper el formulario, y ese sitio no puede leer lo que la
 * persona escribe. Un formulario inyectado vive en su página y su
 * JavaScript lo ve todo.
 *
 * Este archivo es ESTÁTICO a propósito: lo sirve el almacén de archivos, no
 * el código, así que carga rápido y no gasta servidor.
 */
(function () {
  "use strict";
  var script = document.currentScript;
  if (!script) return;
  var clave = script.getAttribute("data-clave") || "";
  if (!/^pk_[A-Za-z0-9]{8,64}$/.test(clave)) {
    console.error("[casillero] falta o no vale el data-clave del widget");
    return;
  }

  var destino =
    document.getElementById(
      script.getAttribute("data-destino") || "mtr-casillero",
    ) ||
    (function () {
      var d = document.createElement("div");
      script.parentNode.insertBefore(d, script);
      return d;
    })();

  var origen = new URL(script.src).origin;
  var marco = document.createElement("iframe");
  marco.src =
    origen +
    "/widget/form?clave=" +
    encodeURIComponent(clave) +
    "&idioma=" +
    encodeURIComponent((document.documentElement.lang || "es").slice(0, 2));
  marco.title = "Mercatren · Crea tu casillero";
  marco.loading = "lazy";
  marco.style.cssText =
    "width:100%;border:0;display:block;min-height:520px;color-scheme:light";
  /* Lo mínimo para que el formulario funcione y nada más. */
  marco.setAttribute("sandbox", "allow-forms allow-scripts allow-same-origin");
  destino.appendChild(marco);

  /* El alto lo dice el propio formulario: sin esto queda una barra de
     desplazamiento dentro del marco, que se ve roto en el celular. */
  window.addEventListener("message", function (e) {
    if (e.origin !== origen) return;
    var d = e.data;
    if (d && d.tipo === "mtr-casillero-alto" && typeof d.alto === "number") {
      marco.style.height = Math.max(320, Math.min(2000, d.alto)) + "px";
    }
  });
})();
