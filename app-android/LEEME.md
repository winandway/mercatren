# App de Android de Mercatren (Google Play)

## Qué es

Es la app de Mercatren para Google Play. No tiene pantallas propias: es una
**Trusted Web Activity (TWA)**, es decir, abre `https://mercatren.com` a
pantalla completa dentro de Chrome, sin barra de direcciones. Todo lo que se
ve en la app es el sitio web: cada publicación del sitio actualiza la app sin
tener que subir una versión nueva a la tienda.

- Paquete: `com.mercatren.app`
- Abre: `https://mercatren.com/` (el sitio manda solo al idioma del teléfono,
  inglés o español).
- Si el teléfono no tiene un navegador compatible con TWA, abre el sitio en una
  pestaña personalizada (Custom Tab).
- Generado con `@bubblewrap/core` (Google). La configuración de origen está en
  `twa-manifest.json`.

| Pieza                               | Versión          |
| ----------------------------------- | ---------------- |
| Plugin de Android para Gradle (AGP) | 8.9.1            |
| Gradle (wrapper)                    | 8.11.1           |
| androidbrowserhelper                | 2.7.4            |
| compileSdk / targetSdk              | 36               |
| minSdk                              | 24 (Android 7.0) |
| Java para compilar                  | 17               |

El minSdk es 24 porque `androidbrowserhelper` 2.7.4 no admite menos. El SDK 36
pide como mínimo AGP 8.9.1 (tabla oficial de compatibilidad de Android).

## Dónde vive la llave de subida (NUNCA en el repositorio)

La llave y su contraseña están **fuera del repositorio**, en la carpeta privada
`~/.config/mercatren/` (permisos 700; archivos 600):

- `play-upload.jks` — la llave de subida (alias `mercatren-upload`).
- `play-upload.properties` — las cuatro claves que lee Gradle: `storeFile`,
  `storePassword`, `keyAlias`, `keyPassword`.

Gradle lee ese archivo de propiedades desde fuera. Si hace falta usar otro, se
indica con la variable de entorno `MERCATREN_SIGNING_PROPS` (ruta completa del
archivo). Si se pide un release y no encuentra el archivo, **la compilación se
detiene con un error**: nunca sale un paquete sin firmar en silencio.

**Respaldo obligatorio:** guarda una copia de `play-upload.jks` y de su
contraseña en el gestor de contraseñas (Bitwarden). Si se pierde, Google Play
permite pedir un cambio de llave de subida, pero tarda días.

## Cómo compilar

Hace falta Java 17 y el SDK de Android de la máquina.

Paquete para subir a Google Play (AAB) y APK para probar, los dos firmados:

```bash
cd /Users/windocellc/Mercatren.com/app-android && export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ANDROID_HOME=/Users/windocellc/Library/Android/sdk && ./gradlew --no-daemon bundleRelease assembleRelease
```

Copiar los paquetes a la carpeta `salida/` con su nombre de versión
(cambia `1.0.0-1` por la versión que compilaste):

```bash
cd /Users/windocellc/Mercatren.com/app-android && mkdir -p salida && cp app/build/outputs/bundle/release/app-release.aab salida/mercatren-1.0.0-1.aab && cp app/build/outputs/apk/release/app-release.apk salida/mercatren-1.0.0-1.apk
```

Comprobar que el APK salió firmado con la llave de Mercatren:

```bash
cd /Users/windocellc/Mercatren.com/app-android && /Users/windocellc/Library/Android/sdk/build-tools/36.0.0/apksigner verify --print-certs salida/mercatren-1.0.0-1.apk
```

Tiene que decir `Verifies` y `CN=Mercatren LLC`.

Probar en un emulador encendido:

```bash
cd /Users/windocellc/Mercatren.com/app-android && /Users/windocellc/Library/Android/sdk/platform-tools/adb install -r salida/mercatren-1.0.0-1.apk && /Users/windocellc/Library/Android/sdk/platform-tools/adb shell monkey -p com.mercatren.app -c android.intent.category.LAUNCHER 1
```

Mientras el archivo de vínculos (abajo) no esté publicado en el sitio, la app
abre con una barra de dirección arriba. Cuando el sitio lo publique, la barra
desaparece.

La carpeta `salida/`, `build/`, `.gradle/`, `local.properties` y cualquier
`.jks`, `.keystore`, `.aab`, `.apk` están en `.gitignore`: no se suben.

## Cómo subir una versión nueva

Cada vez que se sube un paquete a Google Play, el **versionCode** tiene que ser
mayor que el anterior (Google rechaza uno repetido).

1. En `app/build.gradle`, dentro de `defaultConfig`:
   - `versionCode` → súmale 1 (1, 2, 3…).
   - `versionName` → el nombre visible (por ejemplo `1.0.1`).
2. En `twa-manifest.json`, pon los mismos dos valores en `appVersionCode` y
   `appVersionName` (y en `appVersion`), para que coincidan.
3. Compila con el comando de arriba y copia a `salida/` como
   `mercatren-<versionName>-<versionCode>.aab`.
4. Sube el `.aab` en Play Console.

Solo hace falta una versión nueva cuando cambia algo de la app en sí (nombre,
ícono, colores, paquete, versión de la librería). Los cambios del sitio web no
la necesitan.

## El archivo de vínculos del sitio (Digital Asset Links)

Para que Android confíe en que la app y el sitio son del mismo dueño (y quite la
barra de dirección), el sitio tiene que publicar `assetlinks.json` en:

`https://mercatren.com/.well-known/assetlinks.json`

- El contenido está en `assetlinks.json` de esta carpeta. Hoy trae la huella
  SHA-256 de la **llave de subida**.
- Tiene que responder **200**, con tipo `application/json` y **sin
  redirecciones** (Android no sigue redirecciones para este archivo).
- **Cuando la app esté en Google Play con «Play App Signing»**, Google firma la
  app con SU propia llave. Su huella sale en Play Console, dentro de la app, en
  la sección «Integridad de la app» → «Firma de apps» (en inglés «App
  integrity» → «App signing»): es la huella del certificado SHA-256 de la
  **llave de firma de apps** (no la de subida). **Esa huella se agrega
  como segunda línea** en `sha256_cert_fingerprints` (se dejan las dos: la de
  subida y la de Google), y se vuelve a publicar el archivo en el sitio. Sin la
  huella de Google, la app que baja la gente desde la tienda muestra la barra de
  dirección.

Comprobar que Google lee bien el archivo publicado:

```bash
cd /Users/windocellc/Mercatren.com/app-android && curl -s "https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://mercatren.com&relation=delegate_permission/common.handle_all_urls"
```

Tiene que aparecer `com.mercatren.app` con las huellas.

## Volver a generar el proyecto

El proyecto se generó con `@bubblewrap/core` desde `twa-manifest.json`. Si hay
que cambiar colores, íconos o nombre, lo más seguro es editar
`twa-manifest.json` y regenerar con Bubblewrap; después hay que volver a poner a
mano la sección de firma de `app/build.gradle` (bloque «FIRMA DE RELEASE»), el
`minSdkVersion 24` y el cambio de `jcenter()` por `mavenCentral()` del
`build.gradle` de la raíz.
