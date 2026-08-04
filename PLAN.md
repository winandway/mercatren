# Plan de esta tanda

Los cuatro pasos que quedaron de la revisión y que dependen de mí. Se marcan
aquí a medida que se terminan.

> Los dos que dependen de ti siguen en `BLOQUEADO.md`: cargar los datos del
> banco y pulsar el botón que trae las 689 fotos del catálogo.

---

- [x] **1. Retiros del comercio.** Que pueda sacar su saldo. Pide cuánto y
      cómo — a otro comercio de Mercatren, ACH o wire —, el saldo se le aparta
      en ese momento, a nosotros nos entra en una cola, hacemos la
      transferencia en el banco a mano y al tocar "Ya lo pagué" el saldo baja
      de verdad.
      _Probado de punta a punta: $24,283.75 → pide $1,000.50 → disponible
      $23,283.25 con el total intacto → marcado pagado → total $23,283.25 y
      71 retiros. Tabla `retiros` nueva, tres formas, y el saldo apartado
      mientras espera._

- [x] **2. Olvidé mi contraseña.** El correo ya existe y funciona; falta la
      pantalla que lo dispara y la que permite poner la nueva. Hoy quien se
      olvida de su clave se queda afuera y tiene que llamarte.
      _Probado el ciclo entero: se pide el enlace, se abre como llegaría por
      correo, se pone la clave nueva y se entra con ella. Nunca dice si el
      correo existe o no._

- [x] **3. Entrega del pedido.** El comercio no ve a dónde mandar el producto
      ni tiene cómo marcarlo entregado, así que el pedido se queda en "pagado"
      para siempre. Falta la ficha con los datos de entrega y el botón que
      cierra la venta.
      _Ficha nueva en `/panel/ordenes/<número>`: dirección, teléfono, nota del
      cliente, qué lleva y los botones para cerrarla. Probado: pasa a
      "Entregado" y los botones desaparecen._

- [ ] **4. Probar en el navegador, publicar y verificar en vivo.** Los tres de
      arriba se ven en pantalla, así que van al preview antes del build, con
      captura, y después se comprueban en el sitio publicado.

---

**Si por "los 4 pasos" te referías a otra cosa** —por ejemplo a pagar con el
saldo de la billetera o con tarjeta en vez del paso 4— dímelo y lo cambio.
Estos son los que quedaron nombrados en la revisión.
