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
| A · Depende de ti             |      0 |      9 |
| B · Depende de mí (programar) |      1 |      4 |
| C · Después del lanzamiento   |      0 |      5 |
| **TOTAL**                     |  **1** | **18** |

**Para abrir al público hacen falta, como mínimo: A1, A2 y A4.**

---

## BLOQUE A — Depende de ti

Cosas que yo no puedo hacer: contraseñas, datos bancarios, decisiones de
negocio y firmas.

- ⬜ **A1. Cargar los datos bancarios en producción.** `PAGO_BENEFICIARIO`,
  `PAGO_BANCO`, `PAGO_CUENTA`, `PAGO_RUTA_ACH`, `PAGO_RUTA_WIRE`,
  `ZELLE_CORREO_RECEPTOR`, `PAGO_SOPORTE_TELEFONO`, en el panel de YaDominios
  Cloud. Los valores están en tu `.dev.vars`.
  **Bloqueante:** sin esto, la pantalla del pedido avisa que faltan los datos
  y nadie puede pagar. Yo no los escribo: el repositorio es público y una
  cuenta con su ruta ACH permite intentar un cobro no autorizado.

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
