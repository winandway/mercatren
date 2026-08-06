# Mapa de lanzamiento de Mercatren

Todo lo que falta para abrir al público, en un solo lugar. **Este documento no
se borra ni se reescribe: se va marcando.**

- ✅ = hecho y verificado en el sitio publicado
- ⬜ = pendiente
- 🔒 = bloqueado esperando algo (dice esperando qué)

**Regla de trabajo (pedida el 5 ago 2026):** al terminar cada trabajo, se
actualiza este archivo y se cierra el reporte con la lista de lo hecho en ✅ y
**el número exacto de lo que falta**, con los nombres escritos para poder
escoger el siguiente.

---

## Marcador

| Bloque                        | Hechas | Faltan |
| ----------------------------- | -----: | -----: |
| A · Depende de ti             |      0 |     10 |
| B · Depende de mí (programar) |      2 |      7 |
| C · Después del lanzamiento   |      0 |      6 |
| **TOTAL**                     |  **2** | **23** |

**Para abrir al público hacen falta, como mínimo: A1, A2 y A4.**

---

## BLOQUE A — Depende de ti

Cosas que yo no puedo hacer: contraseñas, datos bancarios, decisiones de
negocio y firmas.

- ⬜ **A1. Cargar los datos de cobro en producción.** Solo tres, en el panel
  de YaDominios Cloud: `ZELLE_CORREO_RECEPTOR`, `ZELLE_NOMBRE_RECEPTOR` y
  `PAGO_SOPORTE_TELEFONO`. Los valores están en tu `.dev.vars`.
  **Las de transferencia bancaria NO van** (6 ago 2026): Mercatren solo
  recibe por Zelle, y cargarlas haría que la pantalla del pedido ofreciera
  un ACH que nadie valida.
  **Bloqueante:** sin esto, la pantalla del pedido avisa que faltan los datos
  y nadie puede pagar. Los escribes tú porque el repositorio es público y
  cualquier dato de cobro escrito en el código queda visible para siempre en
  el historial, aunque después se borre.

- ⬜ **A2. Activar el escudo del login.** `TURNSTILE_CLAVE_SITIO` y
  `TURNSTILE_SECRETO` en el mismo panel. Comprobado el 5 ago 2026: **hoy no
  está activo en producción.**
  **Bloqueante:** sin él, cualquiera puede probar miles de contraseñas por
  minuto contra las cuentas que ven el dinero de los comercios.

- ⬜ **A3. Cambiar la contraseña temporal del superadmin.**
  `mercatren@windoce.com` sigue con la que pasó por chat. Panel → Cuenta →
  Cambiar contraseña.

- ⬜ **A4. Una compra real de punta a punta.** Con tarjeta (Stripe ya está
  cargado; falta verlo cobrar de verdad) y con Zelle subiendo la captura.
  _Nota: el pago por Zelle ya lo probaste._

- ⬜ **A5. Pulsar "Traer las fotos".** Panel → Configuración → Fotos del
  catálogo. Son 689 fotos que hoy se sirven desde el servidor de Bley: si esa
  tienda se apaga, el catálogo se queda sin imágenes.

- ⬜ **A6. Visto bueno final del abogado** a los términos y privacidad V1
  publicados, **y su cláusula de autofacturación** (sin ella no puedo arrancar
  B4).

- ⬜ **A7. Las cuentas del equipo.** Que el validador y Bley se registren en
  `/registro` y me pases los correos para asignarles el rol. Hoy el único que
  valida pagos eres tú.

- ⬜ **A8. Las direcciones de los depósitos de Bley.** Para que el pedido le
  diga al cliente a dónde ir a retirar.

- ⬜ **A9. Decisión: cómo se define el precio de compra al comercio.**
  ¿Por producto (él lo declara) o un porcentaje del precio publicado? Con tu
  respuesta arranco B4.

---

## BLOQUE B — Depende de mí

- ✅ **B1. Los correos que faltan.** _(5 ago 2026)_ Seis avisos nuevos: cobro
  solicitado (al equipo), transferencia hecha, transferencia no hecha con su
  motivo, pedido listo para retirar **con la dirección adentro**, constancia de
  entrega y producto agotado. El correo de la compra ahora también dice dónde
  se retira cada cosa, desde el primer minuto. Con prueba que vigila los dos
  idiomas y el vocabulario prohibido por la figura jurídica.

- ⬜ **B2. El ciclo del pedido después del pago.** Que el comercio marque
  "listo para retirar" y "entregado" desde su panel, con su aviso al cliente.

- ⬜ **B3. Verificación al aprobar comercios.** Los términos prometen que
  verificamos identidad y registro mercantil; hoy aprobar es un solo botón sin
  checklist ni constancia.

- 🔒 **B4. Facturación automática.** Orden de compra, factura de compra por
  autofacturación, factura de venta y el margen por operación.
  **Esperando A6 y A9.**

- ⬜ **B5. La cola de "Otros".** Pagos de pedidos con varios comercios que
  quedan sin comercio asignado; hoy no tienen pantalla propia.

---

## BLOQUE C — Después del lanzamiento

No frenan la apertura: el sitio funciona sin ellas.

- ⬜ **C1. Conectar la billetera con el WaaS de tokiia.** El saldo espejo ya
  funciona y cuadra con el sistema anterior.
- ⬜ **C2. Sincronización nocturna automática del catálogo.** Hoy el comercio
  la dispara a mano desde su panel y funciona.
- ⬜ **C3. Pagar con saldo a favor** (nota de crédito) y los interruptores de
  encender/apagar Zelle por comercio.
- ⬜ **C4. Envío e impuestos.** Hoy van en cero a propósito, se acuerdan con
  el comercio.
- ⬜ **C5. Renombrar los identificadores internos** (`billetera`, `saldo`,
  `comision`) por el vocabulario correcto. Deuda técnica conocida; no se ve de
  cara al público.

---

---

## BLOQUE D — Lo que pidió el negocio el 6 ago 2026

Salió de una tarde en que **MEGAYES** (repuestos de moto, Venezuela) no pudo
cargar ni un producto: cada intento se caía y perdía lo escrito. Lo supimos
por WhatsApp, no por el sistema.

- ✅ **D1. Que un fallo no borre el trabajo de un comercio.** _(6 ago 2026)_
  Ya está en producción. Ninguna caída vuelve a llegar como pantalla en blanco
  en inglés: se explica en su idioma, se le dice que lo guardado está a salvo, y
  si el problema es que le falta dar de alta su tienda, el botón está ahí mismo.
  Lo escrito en el formulario ya no se pierde pase lo que pase.

- ✅ **D2. Enterarnos de quién se registra.** _(6 ago 2026)_ Llega un correo al
  equipo en cuanto alguien crea una cuenta, con su nombre, su correo y si ya dio
  de alta comercio. Antes, entre el registro y el alta de la tienda la persona
  era **invisible** para nosotros: podía pasar días chocándose con fallos sin
  que nadie lo supiera.

- ⬜ **D3. Aprobación temporal: que pueda trabajar mientras lo revisamos.**
  Hoy un comercio que se registra queda `pendiente` y no puede hacer nada útil.
  La idea es al revés: **que cargue sus productos desde el primer minuto**, con
  un aviso claro de que está en revisión y que su tienda no sale al público
  hasta que se apruebe. Así no pierde su tiempo esperándonos, y nosotros
  seguimos controlando qué sale a la calle. Incluye el correo de "tu cuenta
  está en revisión, mientras tanto puedes ir cargando tu catálogo".

- ⬜ **D4. Que el registro se sienta acompañado.** Hoy el cliente se registra y
  no pasa nada visible: ni "estamos procesando tu cuenta", ni qué sigue, ni
  cuánto tarda. Pantalla de bienvenida con los pasos y en qué punto está.

- ⬜ **D5. Pago por partes (apartado).** El caso de MEGAYES: su cliente compra
  $2.000 y quiere abonar $500 hoy, $1.200 en quince días y el resto al final.
  **El plan completo está escrito en `PLAN-PAGO-POR-PARTES.md`**, incluida la
  razón por la que no podemos dar crédito de verdad y qué sí podemos hacer.
  Antes de programar nada hacen falta tres decisiones tuyas y el visto bueno
  del abogado.

- ⬜ **D6. Revisión automática del comercio (KYB).** Comprobar con IA que quien
  se registra es un comercio de verdad: que la identificación fiscal tenga el
  formato de su país, que el sitio web exista y hable de lo mismo, que la
  dirección sea un local y no un descampado, que el catálogo cuadre con el
  rubro declarado. **No para aprobar solo, sino para llegar a la revisión con
  el trabajo medio hecho** y una lista de lo que huele raro. Va después de D3.

## Además, hecho sobre la marcha

Trabajos que no estaban en la lista y salieron de peticiones directas. No
cambian el marcador de arriba, que sigue contando los 19 del lanzamiento.

- ✅ **Velocidad de la portada** _(5 ago 2026)_ — se acabó la pantalla en
  blanco al entrar: consultas en paralelo, textos del panel fuera del paquete
  público y esqueleto de carga.
- ✅ **Nombre del comercio piloto** _(5 ago 2026)_ — es `Ferremateriales Bley
C.A`. De paso se desactivó el importador, que se lo reescribía en cada
  corrida. **Falta cambiarlo en la base real desde Panel → Mi tienda.**
- ✅ **SEO del catálogo** _(5 ago 2026)_ — las 622 fichas ya le dicen a Google
  su precio, si hay existencias, marca y categoría; migas de pan; ficha de
  tienda; canónicas y hreflang; descripción de respaldo. Todo el JSON-LD va
  escapado.
- ✅ **Blindaje de seguridad y pruebas** _(6 ago 2026)_ — el proyecto pasó de
  **6 de 20** protecciones a **18 de 20**. Lo que hay ahora: el sitio se avisa
  solo si una página se cae (prueba de humo sobre 18 direcciones), ninguna
  prueba puede gastar dinero de verdad ni escribirle a una persona real,
  ninguna clave puede entrar al repositorio (revisado commit por commit: cero
  filtraciones en 190 commits), el navegador de cada visitante recibe seis
  instrucciones de seguridad, y nada se puede subir sin pasar la revisión
  completa. **No se tocó ni una línea del producto.** Detalle y las 2 que
  faltan: sección «El blindaje» del `CLAUDE.md`.

---

## Lo que ya está listo y probado

Para que no se pierda de vista lo que ya no hay que volver a tocar:

catálogo con tallas, colores y medidas · filtro por ciudad con mapa de
cobertura (24 estados, 481 ciudades) · directorio de tiendas con buscador ·
barajado con ventaja para lo nuevo y sello que se apaga solo a los 7 días ·
precios con la fórmula completa (2% + Stripe) y calculadora en el panel ·
carrito y compra · comprobante de pago con cola de validación · retiros ·
billetera del comercio · términos y privacidad V1 con aceptación registrada ·
documentación pública y PDF del modelo · SEO con mapa del sitio enviado ·
aplicación instalable · velocidad de la portada.
