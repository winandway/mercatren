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
- **Pedido mínimo con tarjeta: $2.00.** En una venta de $0.48 los $0.30
  fijos de Stripe se comen el 65%; el mínimo protege al comercio.

**La decisión pendiente — quién paga el fee de Stripe:**

Recomendación: **nada de recargos al cliente.** El precio de la etiqueta es
lo que paga; el 2% de Mercatren y el fee de Stripe se descuentan del lado
del comercio, con el desglose línea por línea en su panel (bruto − comisión
− fee = neto). Es lo que hacen Amazon, eBay y Mercado Libre, y esquiva el
problema legal de los recargos por tarjeta (prohibidos en varios estados,
regulados por Visa/Mastercard, y Stripe exige avisos). El "consentimiento
del cliente" deja de hacer falta porque no hay recargo que consentir.

**Los pasos, en orden:**

- [ ] **1. Comisión por método.** Hoy `comision_puntos_base` es una sola
      (300). Pasa a dos: Zelle 300, tarjeta 200. La cuenta vive en
      `src/lib/dinero.ts` y sus pruebas se amplían.
- [ ] **2. Reglas del checkout.** Zelle solo si el total ≥ $200 (con el
      motivo visible cuando no llega); pedido mínimo $2 con tarjeta;
      interruptores por método en Configuración.
- [ ] **3. Pantalla de cobro con Stripe.** Payment Element embebido, webhook
      en `/datos/stripe` (nunca `/api/`), acreditación a la billetera del
      comercio con el neto ya descontado, y el desglose en la ficha de la
      venta. Necesita `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` en el
      panel (las carga el dueño).
- [ ] **4. Transparencia con el comercio.** En /vender/comisiones y en el
      panel: la tabla de comisiones por método, y en cada venta el desglose
      exacto de a dónde fue cada centavo.

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
