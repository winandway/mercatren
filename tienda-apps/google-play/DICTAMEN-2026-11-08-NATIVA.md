NO APTO — la app nativa 11 está bien hecha (instala, abre, entra con la cuenta del revisor, denuncia, bloquea y borra la cuenta), pero hoy abre en Estados Unidos con cero productos y solo un botón de «Create your store»; con Venezuela tendría contenido de sobra, pero entonces la ficha, las capturas, la Seguridad de los datos y las instrucciones para el revisor dicen otra cosa.

# Mercatren (com.mercatren.app) · Google Play · producción · app NATIVA de Expo · dictamen del 8 nov 2026 (tercero del día)

Paquete evaluado: `app-movil/salidas/mercatren-11.aab` y su `.apk` gemelo. Versión 2.0.0, versionCode 11,
targetSdk 36, compileSdk 37, firmado con la llave de subida (huella 7E:B8:4A…C5:65, la misma de la versión 1).
Sustituye, para la nativa, a los dictámenes DICTAMEN-2026-11-08.md y DICTAMEN-2026-11-08-B.md (que juzgaban la ventana
web). Lo que allí quedó cerrado en el sitio (privacidad 1.2, denunciar y bloquear en la web, borrar cuenta) sigue
cerrado.

## 0. Lo que vi hoy con mis ojos

- **Emulador** `mercatren_pruebas` (Android 16): el `.apk` 11 instala y abre sin errores. Pantalla de bienvenida:
  «Where are you shopping from?», con United States elegible y Venezuela, Chile, Colombia y Spain en gris, «Coming
  soon». Selector de idioma estilo Amazon arriba.
- **Inicio con Estados Unidos:** no hay un solo producto. Solo la tarjeta «Open your store on Mercatren» con
  «Create your store». Nada más en la pantalla.
- **Cuenta del revisor** (Mario Soporte, el correo del archivo de revisores): **entra hoy** en la nativa. Se ven
  My orders, My details and password, Blocked sellers, Country, Language, Help, Privacy, Terms, y en los tres puntos
  de arriba «Delete account». Cerré la sesión al terminar.
- **Puerta de datos en vivo:** Estados Unidos, Chile, Colombia y España dan total 0. Venezuela da **1.535**
  productos (64 páginas), todos con foto y ninguno agotado. Reparto por tienda: Bley Ferretería 1.483 (97 %),
  Inversiones multiservicios AC0803 29, Brillox Steel 8, MAXIUM 4, MEGAYES 2, Variedades COLOMBIA NEXT 1.
- **La lista de países la manda el servidor** (Venezuela sale hoy `encendido: false`). Encender Venezuela no exige
  compilar otra versión: es una línea en el sitio (`INTERRUPTORES.VE.enLaApp`) y una publicación.
- **Permisos del paquete:** INTERNET, ACCESS_NETWORK_STATE, ACCESS_WIFI_STATE, CAMERA, VIBRATE, almacenamiento
  solo hasta Android 12 (maxSdk 32) y el permiso interno de receptores. **No** pide READ_MEDIA_IMAGES ni
  READ_MEDIA_VIDEO (usa el selector de fotos del sistema), ni ubicación, ni micrófono, ni contactos. Bien.
- **Pagos:** hoja de pago de Stripe para la compra de productos físicos (Google Pay apagado). Plan Pro (9,99 al mes,
  primer mes gratis) y «Promocionar» se muestran dentro de la app, **sin cobrar nada**.
- **SDK que recogen datos sin que la persona escriba nada:** Stripe (señales del aparato contra fraude) y el escudo
  anti-robots, que corre en una ventana web dentro de la app (`escudo.tsx`, Turnstile de Cloudflare).

## 1. Lo que hay que corregir (bloquea), en orden de gravedad

1. **Con la configuración de hoy, la app no tiene contenido.**
   Qué está mal: el único país que se puede elegir es Estados Unidos y tiene 0 productos. El revisor abre la app y ve
   una tarjeta para crear tienda y nada que comprar (captura del inicio, hoy 1:36 pm en el emulador).
   Regla: Funcionalidad y contenido mínimos (answer 9898783): «We do not allow apps that only have limited
   functionality and content» y, como infracción, «Apps with very little content and that do not provide an engaging
   user experience».
   Cómo se corrige, una de dos (decisión de negocio de Richard):
   a) Comercios reales de Estados Unidos publican productos (sin inventar nada), o
   b) Se enciende Venezuela en la app. Para eso, antes, hace falta lo que el propio proyecto exige (punto 2).
   Quién: Richard decide; el código enciende el interruptor.
   Cómo se comprueba: en el emulador, con el `.apk` 11 y los datos borrados, el país elegido muestra productos con
   foto y precio, se abre una ficha, se agrega al carrito y se llega a la hoja de Stripe (sin pagar).

2. **Si se elige Venezuela: el candado del proyecto no deja encenderla todavía.**
   Qué está mal: `legales-por-pais.ts` tiene Venezuela con `revisadoPorAbogado: false` y la prueba
   `legales-por-pais.test.ts` impide `enLaApp: true` sin esa marca (FASE-5, sección «Los textos legales»). Además el
   cobro con tarjeta de la app nativa está en ROJO en VERIFICAR-PAGOS.md («EL COBRO CON TARJETA NO ESTÁ PROBADO»).
   Regla de Google que lo respalda: Acuerdo de distribución, 11.3: «You are solely responsible for compliance
   worldwide with all applicable laws», y 4.6: usar Google Play solo para lo permitido «by this Agreement and any
   applicable law». Regla de la casa: prohibido lanzar pagos sin probar el circuito completo.
   Quién: Richard (el abogado revisa los textos de Venezuela; dar el sí); código (marcar la revisión, encender el
   interruptor, hacer la compra de prueba del equipo por la app en Venezuela y anotarla en VERIFICAR-PAGOS.md).
   Cómo se comprueba: `npm run verify` en verde con `enLaApp: true` para VE; la puerta de países devuelve Venezuela
   `encendido: true`; una compra del equipo hecha en la app sale pagada en Stripe y el pedido queda con mercado VE.

3. **La ficha y las capturas no describen la app que se manda.**
   Qué está mal:
   - La consola guarda todavía la ficha del 27 oct (miles de productos, búsqueda por foto, casillero de Miami, CJ).
   - FICHA.md (texto nuevo, sin subir) dice «Shop U.S. Stores», «delivered to your door» y «U.S. stores». Si la app
     entra con Venezuela, es falso: allí se compra en comercios venezolanos y **se retira con el vendedor en la
     ciudad**, sin envío a domicilio.
   - Las 8 + 8 capturas de teléfono y las 4 + 4 de tableta son de la ventana web, no de la app nativa (otra
     navegación, otra barra de abajo, otras pantallas).
     Regla: Metadatos (answer 9898842): «Make sure that your app's title and description accurately describe your app's
     functionality», «We don't allow apps with misleading … metadata» y «Provide screenshots and videos that reflect
     your app's actual experience».
     Quién: código reescribe FICHA.md para el país que se elija (si es Venezuela: nombre sin «U.S.», compra y retiro en
     tu ciudad, pago con tarjeta, abrir tu tienda, denunciar y bloquear) en inglés, español de EE. UU. y español
     latinoamericano, y saca capturas nuevas del emulador con la app nativa y el catálogo real (sin datos personales,
     sin la cuenta del revisor a la vista). Richard (o el gerente con su orden) lo pega y sube en la consola.
     Cómo se comprueba: el auditor relee la ficha por la API: nada de foto, casillero, CJ, «thousands», «miles» ni
     «U.S. stores» si el país es Venezuela; cada captura se compara con una pantalla real del `.apk` 11.

4. **Seguridad de los datos: el formulario es el de la ventana web.**
   Qué está mal: falta «Device or other IDs» (lo recogen el SDK de Stripe al pagar y el escudo anti-robots al entrar y
   registrarse). El texto ya está en FICHA.md, pero solo nombra a Stripe; hay que sumar el escudo. Además, en la
   nativa las fotos de productos salen de la cámara o del selector del sistema: el motivo «Funciones» sigue valiendo,
   sin búsqueda por foto ni documentos del casillero.
   Regla: Data safety (answer 10787469, leída esta mañana): incluye lo recogido «through any third-party libraries or
   SDKs» y las respuestas deben ser «accurate and complete at all times».
   Quién: código corrige la tabla de FICHA.md; Richard la pega en Contenido de la app → Seguridad de los datos.
   Cómo se comprueba: la ficha pública muestra el tipo «Device or other IDs»; el auditor lo coteja con el paquete.

5. **Las instrucciones de «Acceso a la app» describen la web, no la nativa.**
   Qué está mal: dicen «My account > three-dot menu > Delete my account, then type DELETE» y no dicen qué país elegir.
   En la nativa es Account → tres puntos de arriba → Delete account, y si se enciende Venezuela, el revisor tiene que
   saber que la elija en la bienvenida (o en Account → Country) y que la entrega es retiro en la ciudad.
   Regla: Requisitos de acceso para la revisión (answer 15748846, leída esta mañana): «access all app functionality»
   y «Your sign-in details must be maintained at all times without any error».
   Quién: código reescribe el bloque en FICHA.md; Richard lo pega en Contenido de la app → Detalles de acceso. La
   contraseña ya entra hoy (comprobado en el emulador), no hay que cambiarla.
   Cómo se comprueba: siguiendo el texto al pie de la letra en el emulador, sin ayuda, se llega a una ficha, al menú de
   denunciar y bloquear, a Blocked sellers y a Delete account.

## 2. Condiciones de la casa (no son regla de Google, pero no se envía sin ellas)

6. **Gerencia levanta por escrito la orden «nada a las tiendas hasta que Apple apruebe Divoox»** para Google Play.
   Hoy sigue escrita en app-movil/LEEME.md y en la memoria del proyecto.
7. **Países de distribución en la consola, igualados con la app.** Hoy la consola dice «solo Estados Unidos». Si la
   app entra con Venezuela: agregar Venezuela (Richard, en Producción → Países y regiones). No pude leer la tabla
   oficial de países admitidos para apps gratuitas (la página no devolvió la tabla); Google sí nombra a Venezuela en
   su lista de países con apps. FALTA COMPROBAR que Venezuela aparece elegible en esa pantalla de la consola.
   Si se deja también Estados Unidos, el público de allí abre una tienda vacía: o se deja solo Venezuela, o se
   cumple el punto 1 a).
8. **Una revisión a la vez en la cuenta** de Windoce: ninguna otra app nuestra con un envío en revisión al pulsar.
9. **Autorización escrita de Gerencia y Richard.** El APTO es requisito, no permiso.

## 3. Qué exige Google si la app se publica para otro país (respuesta a Gerencia)

- **Países:** se eligen en la consola; el contrato con Google depende de dónde se distribuye (Acuerdo 2.1: «You are
  contracting with the applicable Google entity based on where You have selected to distribute Your Product»).
- **Leyes y sanciones:** Mercatren LLC responde por las leyes de cada país donde se distribuye (11.3) y por las de
  exportación y sanciones de EE. UU. (16.5: «YOU AGREE TO COMPLY WITH, AND NOT CAUSE GOOGLE TO VIOLATE, ALL EXPORT
  CONTROL AND SANCTIONS LAWS»). Venezuela tiene sanciones de EE. UU. dirigidas al gobierno y a personas en lista, no
  un embargo total: el contador o el abogado confirma que vender a particulares y cobrar en dólares por Stripe está
  permitido, y que Stripe acepta el uso (la compra la hace Mercatren LLC en EE. UU., la entrega es en Venezuela).
- **Contenido:** la ficha y las capturas tienen que contar lo que se ve en ese país (punto 3). La clasificación IARC
  vale para todos los países; no cambia.
- **Legales:** la política de privacidad debe abrir «worldwide without geographical restrictions» (la de
  mercatren.com en inglés abre, 200, y nombra a Venezuela). Desde la app, el enlace legal de Venezuela lleva a
  mercatren.com.ve, que abre (200).
- **Pagos:** la compra de productos físicos va con Stripe y NO con la facturación de Google (Payments, answer
  9858738: la facturación de Google «must not be used» cuando el pago es «for the purchase or rental of physical
  goods»). Esto vale igual en Venezuela.
- **¿Hay contenido suficiente con Venezuela?** Sí en cantidad: 1.535 productos con foto, sin agotados. Pero es casi
  una sola tienda (ver riesgo de abajo) y casi todo ferretería.

## 4. Riesgos que no bloquean

- RIESGO ALTO (pagos): Plan Pro (9,99 al mes) y «Promocionar» son servicios digitales con precio a la vista dentro
  de la app, sin facturación de Google. Hoy no se cobra nada y no se lleva a otro medio de pago, así que no rompe la
  regla; pero la política dice que lo digital «must use Google Play's billing system» y que la app no puede «lead
  users to a payment method other than Google Play's billing system». Un revisor que vea «9,99 al mes» puede
  rechazar. Recomendación: en la versión de Android, esconder el precio (o las dos pantallas) hasta que se decida
  cobrar con la facturación de Google, o decir «gratis por ahora» sin cifra. Lo decide Gerencia; lo hace el código.
- RIESGO MEDIO (cuenta, contenido repetido): el 97 % del catálogo de Venezuela es de Bley Ferretería, y Bley tiene su
  propia app en la misma cuenta de Windoce. Regla de spam (answer 9899034): «Creating multiple apps with highly
  similar functionality, content, and user experience». Mercatren es un mercado de muchas tiendas y Bley una sola,
  así que no es igual, pero las capturas de Mercatren no deben enseñar productos ni marca de Bley, y las de una y otra
  app deben verse claramente distintas.
- RIESGO MEDIO (cuenta): la app es de Mercatren LLC y se publica en la cuenta de Windoce; carta corta de autorización
  firmada por Richard (Suplantación, answer 9888374). Y FICHA.md dice «Divoox (organización)»: igualar con la cuenta
  real.
- RIESGO MEDIO (cuenta): ya hay un rechazo abierto en esta app; otro evitable suma hacia una suspensión.
- RIESGO BAJO (legales): los términos que se ven en mercatren.com.ve (inglés y español) empiezan diciendo que en
  mercatren.com se vende y entrega solo dentro de Estados Unidos, y más abajo hablan de la ley venezolana. Leído desde
  Venezuela confunde; conviene que la sección de Venezuela vaya primero en ese dominio.
- RIESGO BAJO: los títulos de los productos de Venezuela salen en inglés en la app en inglés, pero el texto
  alternativo de las fotos sigue en español y en mayúsculas («NIPLE PVC…»). Cosmético.
- RIESGO BAJO: la bienvenida enseña tres países «Coming soon». No es infracción, pero si se distribuye solo en
  Venezuela conviene que no parezca a medio hacer.

## 5. Lo que está bien (comprobado hoy)

- Instala y abre en Android 16 sin errores; nivel de API objetivo 36.
- Firma: la misma llave de subida de la versión 1; el versionCode 11 es mayor que el 1 de producción.
- Permisos: solo los que usa; cámara para fotos de productos, con su texto; sin permisos de fotos y videos del
  sistema (Permisos, answer 16558241: READ_MEDIA_IMAGES solo si el selector del sistema no alcanza).
- Borrar la cuenta dentro de la app (Account → tres puntos → Delete account) y por la web (la página de borrar cuenta
  en inglés, 200).
- Contenido de usuarios (answer 9876937): términos aceptados antes de abrir tienda (casilla en «crear tienda»),
  denunciar producto y tienda y bloquear vendedor desde la ficha, y «Blocked sellers» para deshacer.
- Privacidad y términos enlazados dentro de la app; la cuenta del revisor entra hoy.

## 6. Fuentes leídas hoy, 8 nov 2026

- Google Play, Functionality, Content, and User Experience (answer 9898783).
- Google Play, Metadata (answer 9898842).
- Google Play, User Generated Content (answer 9876937).
- Google Play, Payments (answer 9858738).
- Google Play, Spam (answer 9899034).
- Google Play, Permissions and APIs that Access Sensitive Information (answer 16558241).
- Google Play Developer Distribution Agreement (secciones 2.1, 4.6, 11.3 y 16.5).
- Play Console Help, Supported locations for distribution (answer 10532353; la tabla de países no se pudo leer) y
  Google Play Help, dónde está disponible el contenido (answer 2843119).
- Play Console Help, App content (answer 9859455).
- De esta mañana, mismas fechas: Data safety (10787469), sign-in details (15748846), User Data (10144311),
  Impersonation (9888374), target API level.
- Lo nuestro: app-movil/LEEME.md, app-movil/app.json, el código de app-movil (pago, cobro, borrar cuenta, denuncia,
  plan Pro, promocionar, escudo, crear tienda), el `.apk` 11 instalado en el emulador, el manifiesto del paquete,
  la puerta de datos de la app en vivo (países y catálogo de los cinco países), las páginas legales de los dos
  dominios en vivo, docs/FASE-5-PAISES-EN-LA-APP.md, el interruptor de países, VERIFICAR-PAGOS.md, FICHA.md y los
  dos dictámenes anteriores de hoy.

## 7. Para Richard

No se manda todavía porque la app abre en Estados Unidos sin un solo producto. Con Venezuela sí tendría qué mostrar,
pero antes el abogado tiene que revisar los textos de Venezuela, el equipo tiene que hacer una compra de prueba desde
la app, y la ficha, las fotos y las instrucciones para Google se rehacen para Venezuela.
