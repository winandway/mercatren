NO APTO — denunciar y bloquear ya están en la web y la privacidad ya cuenta todo, pero la tienda de Estados Unidos sigue con cero productos y la ficha guardada en Play Console sigue prometiendo miles de productos, búsqueda por foto y casillero.

# Mercatren (com.mercatren.app) · Google Play · producción · reenvío tras el rechazo del 5 nov 2026 · dictamen B del 8 nov 2026

Reemplaza al dictamen de la mañana (DICTAMEN-2026-11-08.md). Revisado sobre el commit 5d5d52a6, ya publicado.
Paquete que se evalúa: la versión 1 (1.0.0, versionCode 1, ventana web TWA), que es la que tiene producción hoy. La
nativa 2.0.0 (versionCode 11) sigue sin subir y sigue bajo la orden de Gerencia de esperar a Apple.

## 0. Qué cambió desde el dictamen de la mañana

| Punto de la mañana                   | Estado ahora                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Catálogo de EE. UU. vacío         | SIGUE ABIERTO. Puerta de la app: total 0. Página de catálogo: «No products published yet. Coming soon.» Snailock y USApam: 0 productos.                                                                                                                                                                                           |
| 2. Ficha de la consola engañosa      | SIGUE ABIERTO en la consola (leída hoy por la API). El texto de FICHA.md ya está bien.                                                                                                                                                                                                                                            |
| 3. Denunciar y bloquear en la web    | CERRADO. Visto en el sitio en vivo: «Report this store» y «Block this seller» en las tiendas de EE. UU.; «Denunciar este producto», «Denunciar esta tienda» y «Bloquear a este vendedor» en la ficha de Venezuela; página de vendedores bloqueados responde 200. Términos aceptados antes de registrarse y antes de abrir tienda. |
| 4. Privacidad incompleta             | CERRADO. Versión 1.2, vigente desde el 8 nov 2026: datos de la tienda, fotos y videos, búsquedas, denuncias y bloqueos, y Stripe con los datos del aparato que recoge.                                                                                                                                                            |
| 5. Seguridad de los datos sin Stripe | Texto listo en FICHA.md («Identificadores del aparato»); FALTA pegarlo en la consola.                                                                                                                                                                                                                                             |
| 6. Contraseña de «Acceso a la app»   | FALTA comprobar (la hará Richard). El correo del archivo coincide con la ficha.                                                                                                                                                                                                                                                   |

## 1. Lo que hay que corregir (bloquea), en orden de gravedad

1. **La tienda de Estados Unidos no tiene ni un producto.**
   Qué vi hoy: la puerta de datos de la app devuelve `"total":0`; la página del catálogo en inglés dice «No products
   published yet. Coming soon.»; la portada dice «We're loading the catalog»; las dos tiendas que se ven (Snailock y
   USApam) tienen 0 productos. El revisor no puede abrir una ficha, ni probar el carrito, ni llegar al pago, ni ver
   «Denunciar este producto» (que solo vive en la ficha).
   Regla: Funcionalidad y contenido mínimos (answer 9898783): «We do not allow apps that only have limited functionality
   and content» y, como ejemplo de infracción, «Apps with very little content and that do not provide an engaging user
   experience». Acceso para la revisión (answer 15748846): «access all app functionality».
   Quién: Richard (decisión de negocio): qué comercios reales de EE. UU. publican productos. El código ayuda a cargarlos.
   Nada de productos de prueba ni inventados.
   Cómo se comprueba: la puerta de la app da total mayor que cero; la página del catálogo enseña productos con foto y
   precio; con la cuenta del revisor se llega a la pantalla de pago con tarjeta (sin pagar) y se ve el menú de tres puntos
   en una ficha de EE. UU.

2. **La ficha guardada en Play Console sigue prometiendo lo que la app no tiene.**
   Qué vi hoy por la API (edición abierta y borrada sin confirmar): en en-US, es-US y es-419 la descripción corta dice
   «Shop thousands of products» / «Compra miles de productos»; la completa sigue con Miami, búsqueda por foto y «thousands»;
   las notas de la versión dicen «search with a photo, watch store videos»; las 8 capturas de teléfono por idioma son las
   mismas del 27 oct (catálogo de CJ borrado, búsqueda por foto, casillero de Miami).
   Regla: Metadatos (answer 9898842): «You must ensure your app's metadata accurately reflects its functionality»,
   «We don't allow apps with misleading … metadata» y «Provide screenshots and videos that reflect your app's actual
   experience».
   Quién: Richard (o el gerente con su orden) pega en la consola el texto nuevo de FICHA.md: nombre, descripción corta y
   completa en los tres idiomas y notas de la versión. Las capturas las rehace el código con las plantillas de la carpeta
   fuente cuando exista el punto 1; Richard las sube (8 + 8 de teléfono y 4 + 4 de tableta).
   Cómo se comprueba: el auditor relee la ficha por la API: ninguna mención de foto, casillero, CJ, «thousands» ni «miles»,
   y las huellas de las capturas cambian; se miran una por una.

3. **Seguridad de los datos: falta «Identificadores del aparato» en la consola.**
   Qué es: Stripe.js en el pago recoge identificadores del navegador o del aparato para prevenir fraude; la privacidad 1.2
   ya lo dice, pero el formulario guardado no.
   Regla: Data safety (answer 10787469): incluye lo que se recoge «through any third-party libraries or SDKs» y las
   respuestas deben ser «accurate and complete at all times».
   Quién: Richard en la consola (Contenido de la app → Seguridad de los datos), con la tabla de FICHA.md: agregar
   «Device or other IDs», recopilado, no compartido, opcional, propósito prevención de fraude y seguridad; quitar del
   motivo de Fotos la búsqueda por foto y de Otra información el documento del casillero.
   Cómo se comprueba: la sección de Seguridad de los datos de la ficha pública muestra el tipo nuevo.

4. **Falta comprobar que la contraseña guardada en «Acceso a la app» entra hoy.**
   Qué vi: el archivo de revisores existe y su correo es el de la ficha. No entré con ella en esta revisión y el campo de la
   consola no se lee por la API.
   Regla: answer 15748846: «Your sign-in details must be maintained at all times without any error».
   Quién: Richard: entra en la web con esa cuenta (y sale), y vuelve a pegar en la consola la contraseña del archivo y el
   texto de instrucciones de FICHA.md, que ya coincide con lo que hay en la web (tres puntos en la ficha, «Blocked sellers»
   en Account, borrar cuenta desde los tres puntos de My account).
   Cómo se comprueba: Richard entra y ve «Mario Soporte»; captura del campo guardado con la contraseña oculta.

## 2. Condiciones de la casa (no son regla de Google, pero no se envía sin ellas)

5. Cambiar en la consola la dirección de privacidad: hoy guarda la dirección vieja en español (que redirige); debe ser la
   que termina en /en/privacy. Richard, en Contenido de la app → Política de privacidad.
6. Elegir el paquete por escrito: versión 1 (web), que con este dictamen ya cumple denunciar y bloquear, o la nativa 11
   (necesita que Gerencia levante la espera por Divoox y rehacer Seguridad de los datos para ella).
7. Una revisión a la vez en la cuenta: antes de pulsar, ninguna otra app de la cuenta con un envío nuestro en revisión.
   No lo pude leer por la API; lo mira Richard en la lista de apps.
8. Autorización escrita de Gerencia y Richard. El APTO es requisito, no permiso.

## 3. Riesgos que no bloquean

- RIESGO MEDIO (cuenta): la app es de Mercatren LLC y se publica en la cuenta de Windoce. Conviene una carta corta de
  Mercatren LLC autorizando la publicación (Suplantación, answer 9888374). Además FICHA.md dice que la cuenta es «Divoox
  (organización)» y el dictamen de la mañana la leyó como Windoce, LLC: igualar ese dato en FICHA.md.
- RIESGO MEDIO (cuenta): ya hay un rechazo abierto en esta app; otro evitable suma hacia una suspensión.
- RIESGO MEDIO (pagos, a futuro): Plan Pro y promocionados se ofrecen sin cobrar; el día que se cobren dentro de la app
  son servicios digitales y se audita antes.
- RIESGO BAJO: la página de búsqueda con foto y la de casillero siguen respondiendo 200 dentro de la web aunque no estén
  enlazadas desde la portada. Si el revisor llega por el buscador del sitio verá funciones apagadas. Mejor que digan con
  claridad que no están disponibles o redirijan.
- RIESGO BAJO: la denuncia y el bloqueo se comprobaron en el HTML servido del sitio en vivo y por la prueba de punta a
  punta de la sesión del proyecto; el auditor no los pulsó con una sesión. Se repasan con la cuenta del revisor cuando
  exista el punto 1.
- RIESGO BAJO: la cuenta del revisor tiene el correo sin confirmar; hoy ningún flujo lo exige.
- NOTA: la página Shorts en inglés tiene títulos de videos en español. Cosmético.

## 4. Lo que está bien (comprobado hoy)

- Privacidad en inglés (versión 1.2), borrar cuenta (la dirección corta redirige y termina en 200), salud del sitio
  ok, archivo de vínculos de Android 200.
- Denunciar y bloquear en la web, con página de vendedores bloqueados para deshacer (punto 3 de la mañana).
- Aceptación de términos antes de registrarse y antes de publicar como tienda (UGC, answer 9876937: «Requires users
  accept the app's terms of use … before users can create or upload UGC»).
- Texto de FICHA.md sin CJ, sin foto, sin casillero y sin plazos de entrega; notas de la versión nuevas.
- Nivel de API objetivo 36 en la versión 1 y en la nativa.

## 5. Fuentes leídas hoy, 8 nov 2026

- Google Play, Functionality, Content, and User Experience (answer 9898783).
- Google Play, User Generated Content (answer 9876937).
- Google Play, Metadata (answer 9898842).
- Play Console Help, Requirements for providing sign in details for review (answer 15748846).
- Del dictamen de la mañana, mismas fechas: User Data (10144311), Data safety (10787469), borrado de cuenta (13327111),
  Impersonation (9888374).
- Lo nuestro: DICTAMEN-2026-11-08.md, FICHA.md, el commit 5d5d52a6, el sitio en vivo con curl (catálogo, tiendas,
  ficha de Venezuela, privacidad, borrar cuenta, salud, vínculos de Android) y la API de Google Play en solo lectura
  (ficha, capturas y notas de la versión; la edición se borró sin confirmar).

## 6. Para Richard

No se manda todavía porque la tienda de Estados Unidos sigue sin un solo producto y la ficha de Google sigue prometiendo
miles de productos, búsqueda por foto y el casillero. Denunciar, bloquear y la privacidad ya quedaron bien.
