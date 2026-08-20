# PLAN-DROPI — El proveedor de Chile

> 17 ago 2026. Dropi es para `mercatren.cl` lo que CJ Dropshipping es para
> `mercatren.com`: quien pone la mercancía y la despacha. El módulo se
> construye desde cero, pero **calcado del de CJ**, que ya está probado.

## Lo que está COMPROBADO (no supuesto)

Todo esto se verificó contra la API en vivo el 17 ago 2026, no se sacó de
memoria ni de un blog.

| Dato                     | Valor                                                    | Cómo se comprobó                |
| ------------------------ | -------------------------------------------------------- | ------------------------------- |
| API de Chile             | `https://api.dropi.cl`                                   | responde                        |
| Especificación OpenAPI   | `https://api.dropi.cl/docs`                              | JSON de 34 KB, `openapi`        |
| Autenticación            | JWT en `Authorization: Bearer …`                         | `securitySchemes` de la spec    |
| Entrar                   | `POST /integrations/login`                               | probado: valida y responde      |
| Lo que pide entrar       | `email`, `password`, `white_brand_id`                    | spec + respuesta del servidor   |
| `white_brand_id` (Chile) | `1`                                                      | del propio panel `app.dropi.cl` |
| Comprobar la sesión      | `POST /integrations/whoiam` → trae `wallets` (el saldo)  | spec                            |
| Productos                | `GET /api/products/v4/index`                             | del panel                       |
| Fotos de un producto     | `GET /api/products/{id}/resources`                       | del panel                       |
| Categorías               | `GET /api/categories`                                    | probado: 401 sin token          |
| Panel                    | `https://app.dropi.cl`                                   | responde                        |
| Pantalla del token       | `/dashboard/config/integration-list`                     | del panel                       |
| Crear / ver / borrar     | `/createtokenlogin` · `/infotoken` · `/deletetokenlogin` | del panel                       |
| Soporte técnico          | `soporteti@dropi.co`                                     | contacto de la spec             |

**Ojo con una cosa de ellos:** cuando algo falla, su API devuelve la traza
completa del servidor (rutas de archivos, líneas, nombres de clases). Eso es
un descuido suyo, no nuestro — pero significa que **sus mensajes de error NO
se le enseñan nunca a un comprador**. Al equipo sí, enteros, como ya se hace
con CJ.

## Lo que FALTA, y cómo se consigue

**La especificación pública está incompleta.** Trae la autenticación y unos
pocos endpoints, pero **no trae el de crear un pedido** — que es justamente el
que convierte esto en un negocio. Los `tags` de la spec anuncian módulos
(«Products», «Warehouses») cuyos endpoints no aparecen.

La documentación completa existe y se llama **«Documentación API de
Integraciones Dropi»**. Usa una segunda forma de autenticarse, con la cabecera
`dropi-integration-key`, que convive con el JWT.

**Se pide a `soporteti@dropi.co`**, diciendo que es para una integración
propia contra `api.dropi.cl`. Es un correo, no un trámite.

Hasta tenerla, quedan tres cosas sin confirmar y **ninguna se inventa**:

1. La ruta y el cuerpo exactos para **crear un pedido**.
2. Si el catálogo y los pedidos van con el JWT o con `dropi-integration-key`.
3. **Cómo se escribe una dirección chilena** en su sistema. En Colombia usan
   el código DANE de 7 caracteres; Chile tiene región y comuna, y eso no se
   adivina — una dirección mal armada es un paquete que no llega.

---

## EL TOKEN: dónde se genera y a dónde va

**Genera el token desde el panel, en Integraciones. No uses el login con
correo y contraseña.**

El porqué, en una línea: el login devuelve un JWT que **caduca** («Token has
expired» está en su propia documentación), así que habría que guardar tu
contraseña de Dropi en el servidor para renovarlo. El token del panel no
caduca solo, no obliga a guardar ninguna contraseña, y se puede revocar sin
tocar tu cuenta.

### Paso 1 — Entra a la pantalla

```
https://app.dropi.cl/dashboard/config/integration-list
```

Es **Configuración → Integraciones** en el menú de la izquierda. El croquis de
esa pantalla está en el chat.

### Paso 2 — Crea la integración

En «Nombre de la integración» escribe:

```
Mercatren
```

Y pulsa **Generar token**.

**El token se muestra UNA SOLA VEZ.** Cópialo entero antes de cerrar esa
ventana; si lo pierdes, se borra y se crea otro.

### Paso 3 — El destino (esto lo hago yo)

Me lo pasas por el chat y lo cargo yo en el panel del sitio. Va como variable
de entorno, **nunca en el repositorio**, que es público:

| Variable         | Qué es                                  |
| ---------------- | --------------------------------------- |
| `DROPI_TOKEN`    | El token que acabas de generar          |
| `DROPI_URL`      | `https://api.dropi.cl` (ya lo pongo yo) |
| `DROPI_MARCA_ID` | `1` (el `white_brand_id` de Chile)      |

### Cómo se comprueba que quedó bien

En **Panel → Configuración → Dropi** aparece una sonda igual a la de CJ y a la
de Mercury: pulsas «Probar la conexión» y te dice el nombre de la cuenta y el
**saldo de la billetera** de Dropi. Si sale el saldo, está conectado.

---

## El módulo, por fases

Cada fase entra con sus pruebas y se comprueba en rojo, como el resto del
proyecto. **Y todo pasa por los tres muros multi-país que ya están puestos**:
el catálogo de Dropi cuelga de tiendas con `mercado = 'CL'`, así que un
producto chileno no puede salir en mercatren.com ni al revés — eso ya no hay
que construirlo, ya no compila de otra forma.

### Fase 1 · La conexión y la sonda

`src/lib/dropi/cliente.ts` — entrar, `whoiam`, y el manejo de errores. La
sonda en Configuración. **Es lo primero porque hasta que el token no responda,
todo lo demás es teoría.**

### Fase 2 · El catálogo

Buscar en Dropi desde el panel y agregar productos, igual que
`/panel/catalogo-usa`. Cuelgan de una tienda interna con `mercado = 'CL'`.

Dos cosas que ya nos costaron caro con CJ y no se repiten:

- **Los precios llegan en pesos chilenos, sin centavos.** Ya está resuelto en
  `mercado/moneda.ts`; el importador guarda pesos enteros.
- **El precio puede venir como rango** («12.50 -- 15.30» en CJ). Se toma el
  más barato y se comprueba que no quede en cero: un producto publicado sin
  precio se vendería regalado.

### Fase 3 · La cuenta del negocio

**El margen de Chile es una decisión tuya, no del código.** En Estados Unidos
es 30 % porque Mercatren compra, despacha y asume la devolución. En Chile pasa
lo mismo, así que lo razonable es partir de ahí — pero hay que restar antes lo
que cobre Dropi por el envío y lo que cobre el procesador chileno, y esos dos
números todavía no los tenemos. **Se decide con los números delante, no antes.**

Como con CJ, la pantalla enseña **lo que de verdad queda** después de que
todos cobren lo suyo. Es lo que el panel de Dropi no puede enseñar, porque no
conoce nuestras tarifas.

### Fase 4 · El pedido al proveedor

Cuando entra una venta de Chile, se crea el pedido en Dropi con la dirección
del comprador. Calcado de `src/lib/cj/pedidos.ts`, con sus mismas reglas:

- **Idempotente por pedido**: dos clics no compran dos veces. Es dinero de
  verdad saliendo dos veces.
- **Sin dirección no se compra**, y se dice qué campo falta.
- **Nunca tumba una venta**: va en su propio `try` al final de acreditar. Si
  Dropi no contesta, el cobro sigue en pie y la compra queda pendiente en el
  panel con el motivo exacto que dio Dropi.
- **Tabla nueva** (`pedidos_proveedor` ya existe y sirve), no columnas.

### Fase 5 · Las ventas de Chile en pausa hasta probarlas

Igual que Estados Unidos: `pausa.ts` aprende de mercados y Chile nace pausado.
**Antes de abrir la venta hay que comprar de verdad** y medir qué papel viene
DENTRO de la caja (si trae la factura del mayorista con el precio de compra,
el comprador ve nuestro margen), desde qué bodega salió, qué dirección de
devolución trae, y si el producto es el de la foto.

Vender lo que no se puede entregar no es un error de programación: es un
contracargo.

---

## El orden, y por qué

1. **El token** (tú) → sin eso no se puede probar nada.
2. **La documentación completa** (un correo a `soporteti@dropi.co`) → sin ella
   no se puede crear un pedido, y crear pedidos es el negocio.
3. **Fases 1 y 2** → se pueden hacer ya con lo comprobado.
4. **Fases 3, 4 y 5** → necesitan lo de arriba.

Las fases 1 y 2 arrancan en cuanto llegue el token. La 4 espera al correo.

## COLOMBIA, QUE ES LA CUENTA QUE SE USA DE VERDAD (19 ago 2026)

Todo lo de arriba se sondeó contra Chile, pero **la cuenta activa es la de
Colombia** — con facturación electrónica e identidad ya verificadas. Misma
estructura, comprobada el 19 ago 2026:

| Qué                | Dónde                                                   |
| ------------------ | ------------------------------------------------------- |
| API                | `https://api.dropi.co`                                  |
| Especificación     | `https://api.dropi.co/docs`                             |
| Pantalla del token | `app.dropi.co/dashboard/config/integration-list`         |

**LA SPEC PÚBLICA TIENE 8 RUTAS Y NO SIRVE PARA VENDER.** Bajada y contada:
login, `whoiam`, `register`, motivos de cancelación, categorías, usuarios y
bodegas. **Ni productos, ni crear orden, ni cotizador de flete.**

### Lo que sí se puede hacer sin pedir permiso a nadie

**El token se genera en el panel**, en Configuración → Integraciones. No hay
que escribir ningún correo para eso, y es el camino correcto: el token del
panel no caduca, así que no obliga a guardar la contraseña de Dropi en el
servidor para renovarlo.

### Lo que sí hay que pedir por correo

La **«Documentación API de Integraciones Dropi»** (17 páginas: autenticación,
encabezados, consultar órdenes, consulta de productos, generación de guías y
cotizador de flete). Usa la cabecera `dropi-integration-key`. Circula en
Scribd tras su muro de pago, pero se pide gratis a **marcos.amado@dropi.co**
—con copia a `soporteti@dropi.co`—, que es el canal que ellos mismos exigen:
cierran el chat de soporte y remiten ahí.

**El cotizador de flete es el endpoint que más importa de esa lista**, y lo
aprendimos caro con CJ: si el costo del envío no entra en el precio publicado,
cada venta barata pierde dinero y no aparece en ninguna pantalla.
