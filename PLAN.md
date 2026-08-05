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

## Retiro en depósito — TODO SE BUSCA, NADA SE LLEVA

Corregido el 5 ago 2026 por el dueño, y cambia el modelo entero: **Mercatren
no lleva nada a domicilio.** Esto es ferretería — láminas de zinc, tubos de
seis metros, cabilla — y mover eso pide un camión que no tenemos. **El precio
publicado es el precio de retirarlo en el depósito donde está.**

Eso simplifica todo: **ninguna zona bloquea una venta.** El que compra decide
si puede llegar; lo único que no se vale es que se entere después de pagar.

### Hecho

- [x] **Zonas** (`src/lib/entrega/zonas.ts`): lista cerrada nuestra, con las
      ciudades vecinas de El Vigía que el dueño nombró — Caños Zancudo,
      Tucaní, El Chivo, Los Naranjos, Cuatro Esquinas, La Tendida, Mérida,
      Santa Aurora, El Zulia. Nada de GPS: las direcciones venezolanas no se
      geocodifican y el comercio piensa en "El Vigía", no en coordenadas.
- [x] **Tres distancias, no dos:** `aqui` (tu ciudad) · `cerca` (pueblo
      vecino, un rato en carro) · `lejos` (horas). No es lo mismo media hora
      que siete, y esa diferencia decide la compra.
- [x] **Tabla `depositos`** y `productos.deposito_id`.
- [x] **Importador** (`npm run ubicaciones:importar`) que lee el export del
      Control Box y une por `externo_id`. Corrido: 737 del archivo, 6
      ubicaciones, los 689 nuestros ubicados, cero sin ciudad.
- [x] **Caracas conserva su ciudad** aunque no tenga depósitos creados: sus
      135 caen en un depósito con el nombre de su bodega. Sin eso se habrían
      quedado sin zona y el sistema no sabría que están en Caracas.

### Falta

- [ ] **Las direcciones.** El sistema de Bley solo guarda "Merida el vigia" y
      "Caracas". Hay que escribirlas a mano — prompt ya entregado a esa
      sesión, pidiendo también horario, teléfono y **si el local atiende
      público** (si es galpón cerrado, no se ofrece ir a buscar ahí).
- [x] **El selector de ciudad arriba.** Donde decía "Entregar en Estados
      Unidos" y era mentira. Se pregunta, no se adivina: nada de IP (un
      celular en El Vigía puede salir con IP de Bogotá) ni de GPS (permiso que
      la mayoría niega). Se guarda en una cookie de un año, no en la cuenta,
      porque quien todavía no se registró también necesita saber si su compra
      le queda cerca. **En el celular va en su propia franja bajo el
      buscador**: escondido en `xl:` no lo veía nadie, y el celular es por
      donde entra casi todo el mundo.
- [x] **Fuera la bandera de Estados Unidos del selector de idioma.** Pegada a
      las letras "ES" se leía como país, no como idioma — es lo que el dueño
      reclamó tres veces. Y la frase "Compras en Estados Unidos" pasó a decir
      la verdad: se paga desde allá, se retira en tu ciudad.
- [x] **El aviso de retiro en la ficha**, debajo de quién lo vende, con el
      tono que corresponde a la distancia: gris "pasas y lo recoges" ·
      naranja "cerquita de ti" · ámbar con triángulo "tendrías que ir hasta
      allá". Los tres probados en el navegador.
- [x] **El mapa de verdad: estado → ciudad (5 ago 2026).** La lista plana de
      pueblos era "una chapuza" (palabras del dueño) y se rehízo con la
      división oficial de Venezuela: 24 estados y 481 ciudades
      (`src/lib/entrega/venezuela.ts`, fuente pública zokeber/venezuela-json).
      El selector abre por estados; cuando un comercio de Valera o Puerto
      Ordaz llegue, su ciudad ya existe.
- [x] **El bombillo verde.** El selector marca dónde Mercatren ya está
      ("Mercatren está aquí" en el estado; "N productos" en la ciudad). Sale
      de los depósitos con productos publicados, no de una lista a mano —
      crece solo. Y de paso enseña dónde FALTA un comercio.
- [x] **Elegir ciudad FILTRA el catálogo.** Caracas enseña lo de Caracas
      (114); El Vigía lo suyo (507); Tucaní ve lo de su estado. La regla:
      tu ciudad + tu estado + los vecinos que cruzan la raya (Sur del Lago y
      La Tendida cuentan como cerca de El Vigía). En una ciudad sin comercios
      no se esconde el sitio: aviso claro + catálogo del país + "¿Vendes en
      Valencia? Abre tu tienda y sé el primero". Siempre hay salida a "Ver
      toda Venezuela" sin perder la ciudad elegida.
- [ ] **El aviso de retiro en el checkout.** Falta ahí; en la ficha ya está.
- [ ] **El formulario de producto del vendedor no pide la ciudad.** Un
      producto creado a mano queda sin depósito y por eso no sale cuando un
      cliente filtra por ciudad (los importados sí traen el suyo). Falta que
      el formulario pida el depósito/ciudad y no deje publicar sin él.
- [ ] **Que el pedido y el correo digan dónde retirar.** Hoy el pedido pide
      dirección de entrega como si fuéramos a llevarlo.

### EN RESERVA — el reparto a domicilio (NO se promete)

Va a existir, pero **no se anuncia en ninguna pantalla hasta que el
transporte exista de verdad**. Prometer una entrega que no se puede cumplir
cuesta más caro que no ofrecerla.

Cuando llegue:

- Con **mototaxis o apps de delivery**, no con flota propia.
- **Solo para cosas chicas**: una cinta métrica, un rollo de teflón. Una
  lámina de zinc no la lleva una moto.
- Entonces el producto necesita un campo de "se puede repartir" (por peso o
  por tamaño) y las zonas ganan un cuarto estado: `reparto`.
- El costo del envío entra en `crearPedido` y en el total, que hoy van en
  cero a propósito.

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
