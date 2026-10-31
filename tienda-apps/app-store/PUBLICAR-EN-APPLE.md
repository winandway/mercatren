# Mercatren en la App Store de Apple (receta de este proyecto)

> Hecho el 31 oct 2026 a partir de la receta probada con Divoox
> (`/Users/windocellc/tumbite/docs/PUBLICAR-EN-APPLE.md`). Mercatren NO es
> Expo: el paso de compilar es distinto (Xcode en esta Mac, sin EAS). Escrito
> para que otra sesión, sin memoria, saque la próxima versión sola.

## Los datos de la app

| Qué                    | Valor                                                                        |
| ---------------------- | ---------------------------------------------------------------------------- |
| Cuenta                 | Apple Developer de **Windoce LLC** (go@windoce.com), equipo `7KM9P6R682`     |
| Nombre en la tienda    | `Mercatren: Shop U.S. Stores` (es-MX: `Mercatren: tiendas de EE. UU.`)       |
| Bundle ID              | `com.mercatren.app` (el mismo paquete que en Google Play)                    |
| Número de la app (ASC) | `6829188120` (en `tienda-apps/app-store/ids.mjs`)                            |
| SKU                    | `mercatren-ios`                                                              |
| Idioma principal       | Inglés (EE. UU.) + español (México)                                          |
| Categorías             | Compras (Shopping) y Negocios (Business)                                     |
| Precio / países        | Gratis · **solo Estados Unidos** (como en Google Play)                       |
| Dispositivos           | Solo iPhone (`TARGETED_DEVICE_FAMILY = 1`); en iPad corre en modo compatible |

## Qué es la app

Una app nativa pequeña en SwiftUI (`app-ios/`) que muestra mercatren.com con
**lo nativo que Apple pide** para no tratarla como «un sitio empaquetado»
(guía 4.2): barra de pestañas propia (Inicio, Buscar, Carrito, Cuenta),
deslizar para recargar, volver con el gesto, barra de carga, pantalla propia
de «sin conexión» con «Reintentar», avisos nativos para los `confirm()` del
sitio, y los enlaces de fuera (WhatsApp, correo, teléfono, otros sitios) en
su app o en Safari. El idioma del teléfono decide el del sitio (`/es` o
`/en`). Como en Android, **cada publicación del sitio actualiza la app** sin
pasar por la tienda.

## Lo que ya existe y NO se pide

- La llave de la API de App Store Connect (de la cuenta, sirve para todas sus
  apps): `~/.config/mercatren/apple-asc/` (`AuthKey.p8`, `key-id`,
  `issuer-id`, `team-id`), copiada de `~/.config/tumbite/apple-asc/`. Carpeta
  700, archivos 600, nunca en el repositorio.
- La llave de avisos (APNs) en `~/.config/mercatren/apple-apns/` (Mercatren
  todavía no manda avisos).
- La cuenta de los revisores: la misma de Google Play,
  `~/.config/mercatren/revisores-google-play.txt`.
- El teléfono de la empresa para el contacto de revisión:
  `~/.config/tumbite/empresa-windoce.md`.
- `xcodegen` (instalado con Homebrew) y Xcode.

## Sacar una versión nueva (lo de todas las veces)

1. **Subir el número** en `app-ios/project.yml`: `CURRENT_PROJECT_VERSION`
   (siempre) y `MARKETING_VERSION` si cambia la versión.
2. **Compilar, firmar y subir**, todo con un comando:
   ```bash
   cd /Users/windocellc/Mercatren.com && ./app-ios/subir.sh
   ```
   Genera el proyecto con `xcodegen`, archiva **sin firmar** y la exportación
   firma para la tienda y sube, con la llave de la API (sin contraseña).
3. **Comprobar que Apple la aceptó** (Xcode dice «Upload succeeded» aunque
   Apple la rechace después): `GET /v1/apps/6829188120/buildUploads` →
   `COMPLETE`, y el build en `VALID`.
4. Si cambió la ficha o las capturas: `node tienda-apps/app-store/ficha.mjs`
   y `node tienda-apps/app-store/capturas.mjs`.
5. Crear la versión nueva en App Store Connect (o por la API), **adjuntar la
   compilación** y **enviar a revisión**:
   `node tienda-apps/app-store/enviar-revision.mjs`.

## Las trampas que ya costaron (31 oct 2026)

1. **«Your team has no devices»**: con firma automática, `archive` firma
   primero «de desarrollo», y eso exige un iPhone registrado. Se archiva con
   `CODE_SIGNING_ALLOWED=NO` y la firma de tienda la pone `-exportArchive`.
2. **«…you need to include all of the orientations to support iPad
   multitasking»**: `TARGETED_DEVICE_FAMILY` puesto solo a nivel de proyecto
   no basta; xcodegen lo deja en `1,2` en el target. Va **en el target**.
3. **La versión de la tienda tiene que decir lo mismo que la compilación**:
   App Store Connect crea «1.0» y la app dice «1.0.0». Se cambia por la API
   (`precio-y-paises.mjs` lo hace).
4. **Países**: `POST /v2/appAvailabilities` exige nombrar los 175
   territorios, cada uno con disponible sí o no.
5. **Las listas del formulario «Nueva app»** no toman el valor con un clic
   automatizado: se ponen con JavaScript y el evento `change`.
6. **El ícono** sin transparencia (Apple lo rechaza con canal alfa):
   `tienda-apps/app-store/iconos-ios.mjs`.

## Lo que se hizo en el Chrome de Richard (Apple no tiene API para esto)

- **Crear la app** (Apps → «+» → Nueva app).
- **Privacidad de la app**, sacada del código: nombre, correo, teléfono,
  dirección, información de pago (Stripe), otra información financiera (la
  cuenta bancaria de los comercios), fotos o videos, atención al cliente,
  otro contenido del usuario (preguntas, fichas), ID de usuario, historial de
  compras e interacción con el producto (los «me gusta» de los videos). Todo
  **vinculado a la identidad**, para **funcionalidad de la app** (y la
  interacción, también personalización), y **nada para rastreo**: el sitio no
  tiene analíticas ni publicidad. Si se agrega cualquiera de las dos, esto se
  vuelve a llenar.

## Riesgos de la revisión, escritos antes de que lleguen

- **Guía 4.2 (funcionalidad mínima)**: es la razón de las pestañas y lo nativo.
  Si Apple la rechaza por «sitio empaquetado», el siguiente paso es sumar
  avisos (notificaciones push con la llave APNs ya guardada).
- **Guía 2.1 (app completa)**: con Mercatren en pausa, los productos del
  proveedor actual dicen «Muy pronto» en vez del botón de comprar. Las notas
  para el revisor lo explican. Si Apple lo rechaza por eso, se responde desde
  App Store Connect o se espera a abrir la venta.
