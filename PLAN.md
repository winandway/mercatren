# Plan

Lo que está en marcha. Se marca aquí a medida que se termina.

> Lo que depende de ti sigue en `BLOQUEADO.md`: cargar los datos del banco y
> pulsar el botón que trae las 689 fotos del catálogo.

---

## Tanda terminada — retiros, contraseña y entrega

- [x] **1. Retiros del comercio.** Pide cuánto y cómo —a otro comercio de
      Mercatren, ACH o wire—, el saldo se aparta al pedirlo, al equipo le entra
      en una cola y al tocar "Ya lo pagué" el saldo baja de verdad.
      _Probado: $24,283.75 → pide $1,000.50 → disponible $23,283.25 con el
      total intacto → pagado → total $23,283.25 y 71 retiros._

- [x] **2. Olvidé mi contraseña.** Pedir el enlace y poner la nueva. Nunca dice
      si el correo existe.

- [x] **3. Entrega del pedido.** Ficha en `/panel/ordenes/<número>` con la
      dirección, el teléfono y el botón que cierra la venta.

- [x] **4. Publicar y verificar.** Aquí apareció que **las cuatro
      publicaciones anteriores habían fallado** por tres pruebas escritas con
      textos viejos. Arregladas, todo lo atrasado entró de golpe.

---

## Portada nueva

- [x] **La primera fila baraja en cada visita** y hay cinco filas en vez de dos.
- [x] **22 departamentos nuestros, centrados**, tomados de los de Amazon y
      adaptados. Salen todos; el que no tiene productos dice "Próximamente".
- [x] **El vendedor elige su departamento** de la lista cerrada, y las
      categorías que importa de su sistema se cuelgan solas.
- [x] **Los círculos son solo iconos.** Se probó con una foto real de producto
      y rompía la fila: entre veintidós círculos iguales, uno con la foto de
      una lámina de zinc desentonaba, y encima la imagen de un departamento de
      Mercatren acababa dependiendo de qué subió un comercio ese día. Esa
      parte del sitio es nuestra.
- [x] **Departamento "Otros"**, al final de la lista.

---

## Plan de pagos — tarjeta protagonista, Zelle desde $200

Decidido el 4 ago 2026 (pendiente solo la decisión del fee, abajo).

**Las reglas del negocio:**

- **Tarjeta (Stripe) es el método principal.** Cualquier monto. Comisión de
  Mercatren: **2%** (200 puntos base). El fee de Stripe (2.9% + $0.30) es
  aparte y lo cobra Stripe.
- **Zelle solo desde $200.** Debajo de eso la opción NO aparece en el
  checkout, con su explicación. Comisión: **3%**, como hasta ahora.
- **Zelle se puede prender y apagar** desde Panel → Configuración, sin
  publicar nada. Lo mismo para tarjeta. Guardado en la tabla `configuracion`.
- **Datos del receptor Zelle:** correo `pay@windoce.com`, beneficiario
  Windoce LLC. Van en las variables del panel (`ZELLE_CORREO_RECEPTOR`,
  `PAGO_BENEFICIARIO`), nunca en el repo.
- **El fee viaja DENTRO del precio publicado (decidido y HECHO).** El
  comercio escribe su precio y el robotito publica base + ajuste:
  V = (base + $0.30) / 0.971, techo al centavo. Funciona en el formulario,
  en la sincronización y con un botón en Configuración para el catálogo
  viejo. Aplicado a los 689 productos en producción el 4 ago 2026 —
  reversible: la base quedó en `precio_base_centavos`.
- **Pedido mínimo: YA NO HACE FALTA.** Con el fee dentro del precio, hasta
  una venta de $0.48 (publicada a $0.81) deja los números completos.

**Los pasos, en orden:**

- [x] **1. Comisión por método.** Tarjeta 2% (`COMISION_TARJETA_PB`), Zelle
      3% (el de la tienda). En `src/lib/dinero.ts`.
- [x] **2. Reglas del checkout.** Tarjeta primera y preseleccionada; Zelle
      deshabilitada bajo $200 con "Desde $200" a la vista y revalidada en el
      servidor. (Interruptores por método: pendiente.)
- [x] **3. Pantalla de cobro con Stripe.** Payment Element embebido en la
      página del pedido, webhook firmado en `/datos/stripe`, acreditación
      idempotente a la billetera (multi-comercio, neto tras 2%), stock
      descontado y correos al cliente y al comercio. Sin claves se apaga solo
      y lo dice. **Las 3 claves quedaron cargadas el 4 ago 2026** y el
      webhook está en vivo: comprobado que rechaza una firma falsa (se le
      mandó un "pago aprobado" de $9,999.99 inventado y lo tiró). Falta la
      única prueba que no se puede hacer desde fuera: **una compra real con
      tarjeta**.
- [ ] **4. Transparencia con el comercio.** La tabla de comisiones por método
      en /vender/comisiones y el desglose por venta en el panel.

## Stock (pedido del 4 ago 2026)

- [x] **Con stock en cero no se puede agregar al carrito** — ya estaba: la
      ficha marca agotado y el carrito acota al máximo disponible.
- [x] **El cliente ve cuántas unidades quedan** — antes solo se avisaba con 5
      o menos; ahora la ficha enseña siempre "Quedan N".
- [x] **El stock viene de la tienda original** — la sincronización ya trae
      `stock` del archivo del comercio y el pago confirmado lo descuenta.
- [ ] **Sincronización automática programada.** Hoy el comercio sincroniza a
      mano desde su panel; falta el robotito que lo haga solo cada noche
      (cron), para que el stock de Bley nunca se quede atrás.

## Correos — el estudio (multitienda: equipo, vendedor, cliente)

Existen 9 y quedan huecos claros. Los hechos hoy: comercio aprobado ("ya
puedes vender"), aviso al equipo de comercio nuevo, aviso al equipo de
comprobante por validar, y los de la venta con tarjeta (reusan compra
aprobada + venta acreditada).

- [ ] Al cliente: **tu pedido fue enviado / entregado** (al avanzar el
      pedido desde el panel).
- [ ] Al equipo: **retiro solicitado**; al comercio: **retiro pagado** (con
      referencia) y **retiro rechazado** (con motivo).
- [ ] Al comercio: **producto quedado sin stock** (se agotó algo publicado).
- [ ] Al equipo: **resumen diario** de ventas y pendientes (opcional, más
      adelante).

## Lo que sigue

- [ ] **La cola de "Otros" en el panel.** Hoy "Otros" ya recoge lo que no
      encaja, pero nadie lo revisa desde el sitio. Falta la pantalla donde el
      equipo ve qué se acumuló ahí y, cuando aparezcan diez vendedores de
      instrumentos musicales, cree el departamento y mueva los productos de un
      clic. **Es el mecanismo con el que la lista crece con lo que el mercado
      trae, no con lo que adivinemos hoy.**

- [ ] **Pagar con el saldo de la billetera.** Es lo que le da sentido a los
      retiros: quien ya tiene plata adentro no debería tener que transferir
      otra vez.

- [ ] **Pagar con tarjeta.** Stripe está conectado; falta la pantalla de cobro.

- [ ] **Aviso al equipo cuando entra un retiro**, y al comercio cuando sale su
      transferencia. Los 7 correos que ya existen son el molde.

- [ ] **Envío e impuestos.** Hoy van en cero a propósito.
