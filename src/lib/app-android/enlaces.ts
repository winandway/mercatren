/**
 * ══ LA APP DE ANDROID Y EL SITIO SE RECONOCEN (27 oct 2026) ══
 *
 * La app de Mercatren en Google Play es una Trusted Web Activity: abre
 * mercatren.com a pantalla completa. Para que Android la muestre SIN la barra
 * de direcciones del navegador, el sitio tiene que publicar en
 * `/.well-known/assetlinks.json` qué app puede abrirlo y con qué firma.
 *
 * Si este archivo falta o la huella no coincide, la app sigue funcionando,
 * pero con la barra del navegador arriba: se ve como una página y no como
 * una app, y Google la puede rechazar por eso.
 *
 * ══ LAS DOS HUELLAS ══
 *
 * 1. La de la llave de SUBIDA (vive fuera del repositorio, en la carpeta de
 *    configuración de Mercatren de la máquina). Firma el paquete que se sube.
 * 2. La de la llave con que Google Play FIRMA lo que instala la gente («Play
 *    App Signing»). Sale de Play Console → la app → Integridad de la app.
 *
 * Las dos son públicas: una huella no permite firmar nada. Candado:
 * `tests/unit/app-android-enlaces.test.ts`. Detalle en `app-android/LEEME.md`.
 */
export const PAQUETE_ANDROID = "com.mercatren.app";

export const HUELLAS_SHA256: readonly string[] = [
  // Llave de subida (mercatren-upload), creada el 27 oct 2026.
  "7E:B8:4A:D9:47:AE:9F:93:08:C3:93:1F:FD:CD:4B:51:57:57:6D:EA:99:BF:56:05:5E:D1:91:FA:31:02:C5:65",
];

/** El contenido de `/.well-known/assetlinks.json`. */
export function enlacesDeLaApp() {
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: PAQUETE_ANDROID,
        sha256_cert_fingerprints: [...HUELLAS_SHA256],
      },
    },
  ];
}
