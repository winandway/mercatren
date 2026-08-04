# Lo que depende de ti

Cosas que no puedo hacer yo y que quedan esperándote. Todo lo demás lo sigo
trabajando sin parar.

Cada punto dice **qué falta**, **por qué no puedo hacerlo yo** y **qué tienes
que hacer exactamente**. Cuando resuelvas uno, táchalo y avísame.

---

## 1. Cambiar la contraseña temporal del superadmin

**Qué falta:** que la cuenta `mercatren@windoce.com` deje de usar la contraseña
temporal que te pasé por chat.

**Por qué no puedo:** una contraseña que pasó por un chat ya no es secreta.

**Qué tienes que hacer:** entra a **Panel → Cuenta → Cambiar contraseña** y
pon la tuya. Al guardarla se cierran las demás sesiones automáticamente.

**Ya resuelto:** la cuenta existe, entra al panel y tiene rol `soporte`.

---

## 2. Las cuentas del comercio piloto y del validador

**Qué falta:** que Bley Ferretería tenga su cuenta para ver sus pagos y su
billetera, y que exista al menos un validador.

**Por qué no puedo:** crear una cuenta exige poner una contraseña, y las
contraseñas de otras personas no pasan por mis manos.

**Qué tienes que hacer:** que cada persona se registre en
`mercatren.com/es/registro` y me pases los correos. Yo les asigno el rol
(`vendedor` vinculado a su tienda, o `validador`).

---

## ~~3. El sitio dejó de tomar las versiones nuevas~~ — RESUELTO

**Qué era:** no era YaDominios Cloud. Las publicaciones **fallaban** en las
pruebas automáticas y por eso nunca llegaban al sitio; el panel no tenía nada
que servir. Las últimas cuatro se cayeron por lo mismo: tres pruebas que se
quedaron escritas con textos viejos ("Entrar" en vez de "Iniciar sesión") y
una que empezó a encontrar dos cosas al agregarse el ojito de la contraseña.

Arregladas el 4 ago 2026, la publicación salió verde y todo lo atrasado entró
de golpe. **No tienes que hacer nada.**

---

## 4. Revisión legal de términos y privacidad

**Qué falta:** que un abogado lea lo que está publicado en `/terminos` y
`/privacidad`.

**Por qué no puedo:** puedo describir con precisión cómo funciona la operación,
pero no puedo dar por buena la parte de responsabilidad, la ley aplicable ni
afirmar la calificación regulatoria del servicio. Eso lo firma un abogado, no
una página.

**Qué tienes que hacer:** pasárselos al abogado y decirme qué cambiar. Están
completos y en los dos idiomas; probablemente sea retocar, no rehacer.

---

## 5. Verificación de Google Search Console

**Qué falta:** confirmar que la verificación del dominio sigue en pie.

**Por qué no puedo:** el registro de verificación vive en tu panel de DNS.

**Qué tienes que hacer:** si Search Console te pide verificar de nuevo, me pasas
lo que te muestre y te digo dónde ponerlo. El mapa del sitio ya está enviado y
aceptado con 629 direcciones.

---

## 6. Datos bancarios en producción

**Qué falta:** que las variables de la cuenta que recibe los pagos estén
cargadas en el panel de YaDominios Cloud. Hoy **faltan todas**; se ve en
**Panel → Configuración**.

**Por qué no puedo:** no escribo números de cuenta ni rutas ACH en ningún
archivo. El repositorio es público y esos datos permiten intentar un cobro no
autorizado.

**Qué tienes que hacer:** cargar en el panel del sitio:

- `PAGO_BENEFICIARIO`
- `PAGO_BANCO`
- `PAGO_CUENTA`
- `PAGO_RUTA_ACH`
- `PAGO_RUTA_WIRE`
- `ZELLE_CORREO_RECEPTOR`
- `PAGO_SOPORTE_TELEFONO`

Los valores los tienes en tu archivo local `.dev.vars`. Mientras falten, la
página del pedido avisa que el equipo aún no los configuró; **nunca inventa
datos**.

---

## 7. Traer las fotos del catálogo en producción

**Qué falta:** pulsar un botón. Nada más. **Ya lo puedes hacer tú**: la cuenta
de soporte existe y entra al panel.

**Ya está hecho y probado:** en mi copia local trajo las **689 fotos** desde el
servidor del comercio a nuestro almacenamiento, sin fallar ninguna. Va por
tandas, con barra de avance, se puede parar y retomar, y repetirla no duplica
nada.

**Qué tienes que hacer:** entrar a **Panel → Configuración → Fotos del
catálogo** y pulsar **"Traer las fotos"**. Tarda unos minutos.

**Riesgo mientras tanto:** las fotos de `mercatren.com` se sirven desde el
servidor del comercio. Si esa tienda se apaga, el catálogo se queda sin
imágenes de un día para otro.
