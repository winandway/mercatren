# Lo que depende de ti

Cosas que no puedo hacer yo y que quedan esperándote. Todo lo demás lo sigo
trabajando sin parar.

Cada punto dice **qué falta**, **por qué no puedo hacerlo yo** y **qué tienes
que hacer exactamente**. Cuando resuelvas uno, táchalo y avísame.

---

## 1. Tu cuenta de Soporte en el sitio publicado

**Qué falta:** que exista una cuenta con la que entres al panel de
administración en `mercatren.com`.

**Por qué no puedo:** crear una cuenta exige poner una contraseña. No invento
contraseñas para tus cuentas reales ni te las pido por chat: la eliges tú y no
pasa por mis manos.

**Qué tienes que hacer:**

1. Entra a `https://mercatren.com/es/entrar`
2. Crea la cuenta con tu correo y la contraseña que quieras.
3. Dime el correo que usaste.

Con eso yo te subo el rol a `soporte` y ya entras al panel con todos los
permisos. El nombre visible debe llevar la palabra **Soporte** (regla del
proyecto).

---

## 2. Las cuentas del comercio piloto y del validador

**Qué falta:** que Bley Ferretería tenga su cuenta para entrar a ver sus pagos
y su billetera, y que exista al menos un validador.

**Por qué no puedo:** lo mismo — contraseñas.

**Qué tienes que hacer:** que cada persona se registre en
`mercatren.com/es/entrar` y me pases los correos. Yo les asigno el rol
(`vendedor` vinculado a su tienda, o `validador`).

---

## 3. Revisión legal de términos y privacidad

**Qué falta:** que un abogado lea lo que ya está publicado en
`/terminos` y `/privacidad`.

**Por qué no puedo:** puedo describir con precisión cómo funciona la
operación, pero no puedo dar por buena la parte de responsabilidad, la ley
aplicable ni afirmar la calificación regulatoria del servicio. Eso lo firma un
abogado, no una página.

**Qué tienes que hacer:** pasárselos al abogado del proyecto y decirme qué hay
que cambiar. Están escritos completos y en los dos idiomas; probablemente sea
retocar, no rehacer.

---

## 4. Verificación de Google Search Console

**Qué falta:** confirmar que la verificación del dominio sigue en pie.

**Por qué no puedo:** el registro de verificación vive en tu panel de DNS.

**Qué tienes que hacer:** si Search Console te pide verificar de nuevo (se
perdió el registro TXT anterior al mover los nameservers), me pasas lo que te
muestre y te digo dónde ponerlo. El mapa del sitio ya está enviado y aceptado
con 629 direcciones.

---

## 5. Datos bancarios en producción

**Qué falta:** que las variables de la cuenta que recibe los pagos estén
cargadas en el panel de YaDominios Cloud.

**Por qué no puedo:** no escribo números de cuenta ni rutas ACH en ningún
archivo. El repositorio es público y esos datos permiten intentar un cobro no
autorizado.

**Qué tienes que hacer:** en el panel del sitio, sección de variables de
entorno, cargar:

- `PAGO_BENEFICIARIO`
- `PAGO_BANCO`
- `PAGO_CUENTA`
- `PAGO_RUTA_ACH`
- `PAGO_RUTA_WIRE`
- `ZELLE_CORREO_RECEPTOR`
- `PAGO_SOPORTE_TELEFONO`
- `BETTER_AUTH_SECRET` (una cadena larga aleatoria)

Los valores los tienes en tu archivo local `.dev.vars`. Mientras falten, la
página del pedido avisa que el equipo aún no los configuró; **nunca inventa
datos**.

---

## 6. El sistema de notificaciones

**Qué falta:** conectar el envío de avisos con el servicio propio de
YaDominios Cloud.

**Por qué no puedo:** todavía no existe; lo están construyendo ustedes.

**Qué tienes que hacer:** cuando esté listo, pasarme cómo se llama y cómo se
le habla. Las 7 plantillas y los 7 momentos donde se dispara cada aviso ya
están hechos y funcionando; solo se cambia la pieza que entrega el mensaje.
Es un archivo.

---

## 7. Las fotos del catálogo viven en el servidor del comercio

**Qué falta:** decidir cuándo copiamos las fotos a nuestro almacenamiento.

**Por qué no puedo (todavía):** puedo hacerlo yo, pero son 622 productos
descargando de un servidor ajeno, y conviene avisarle al comercio antes.

**Riesgo mientras tanto:** si esa tienda vieja se apaga o cambia de dominio,
el catálogo de Mercatren se queda sin fotos de un día para otro.

**Qué tienes que hacer:** decirme cuándo lo hago. Es un rato de proceso y
queda resuelto para siempre.
