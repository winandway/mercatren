# PLAN-PAISES — Un país = un dominio = un catálogo

> Escrito el 17 ago 2026, el día que entró `mercatren.cl`. Chile es el país de
> prueba: la estructura que se arma con él tiene que servir TAL CUAL para
> `mercatren.com.co`, `mercatren.mx` y los que vengan. Si agregar México
> obliga a programar algo nuevo, esta estructura quedó mal hecha.

## La regla de cabecera

**El dominio decide el mercado.** Quien entra por `mercatren.com` ve el
mercado principal (los comercios de Venezuela + el catálogo de EE. UU.);
quien entra por `mercatren.cl` ve SOLO lo de Chile. Un producto que no se
puede entregar en un país no puede salir en el dominio de ese país:
enseñarlo es prometer una entrega que no existe.

**Y cada país se opera como una empresa de ese país**: sus proveedores, sus
medios de pago, su moneda, sus impuestos, su logística. El código es uno; la
operación es por país.

## Cómo está armado (lo que ya existe desde hoy)

- **`src/lib/mercado/mercados.ts`** — la lista cerrada de mercados: código,
  dominio, nombre. Es lista y no tabla a propósito: abrir un país pasa por
  una publicación mirada, no por una fila creada de madrugada.
- **`src/lib/mercado/actual.ts`** — lee el dominio de la petición y devuelve
  el mercado. Un host desconocido (localhost, sitios.dev) cae en el
  principal.
- **`tiendas.mercado`** — a qué vitrina pertenece cada comercio. Los 28 de
  hoy están en `US`. No confundir con `paisOrigen` (desde dónde sale la
  mercancía): la ferretería es paisOrigen VE, mercado US.
- **El candado vive en las consultas** (`visibleAqui()` en
  `catalogo/consultas.ts` y `buscar.ts`), no en las páginas — igual que el
  alcance de los comercios: una pantalla nueva no puede olvidarse de él.
- Las llaves de la caché de portada y menú llevan el mercado; el sitemap, el
  `llms.txt` y el catálogo de Google quedaron fijados al principal (sus
  direcciones son de mercatren.com).
- Better Auth confía en todos los dominios de la lista: **la misma cuenta
  entra en todos**, aunque la cookie sea por dominio.

---

## Las fases

### ✅ Fase 0 — El candado del mercado (17 ago 2026)

`mercatren.cl` carga el sistema completo (encabezado, menú, páginas), con
**cero productos, cero tiendas y cero resultados de búsqueda**. La portada
enseña «Mercatren llega a Chile» con la invitación a abrir tienda — no una
parrilla vacía que se lee como un sitio roto. El selector de ciudades (que es
la geografía de Venezuela) no sale fuera del mercado principal.

### Fase 1 — Chile se puede operar (antes de buscar comercios chilenos)

| Qué                                                                                                                                                                                                                                                             | Cómo se comprueba                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Alta de comercio con mercado.** El registro y el alta desde el panel guardan el mercado del dominio por el que se entró; el equipo puede corregirlo en Comercios.                                                                                             | Una tienda creada desde mercatren.cl sale en .cl y NO en .com. |
| **Turnstile en el dominio nuevo.** El widget solo se dibuja en los dominios dados de alta en Cloudflare; sin esto, entrar y registrarse desde .cl se queda sin escudo (o sin login, si el escudo es exigido).                                                   | El login funciona en mercatren.cl con las claves reales.       |
| **Los correos dicen el dominio correcto.** Los enlaces de los correos salen de `SITIO.url`; para cuentas del mercado CL deben llevar mercatren.cl.                                                                                                              | El correo de bienvenida de una cuenta .cl enlaza a .cl.        |
| **Moneda por mercado (decisión de negocio).** Chile compra en CLP, y el CLP no tiene centavos. El dinero del proyecto es entero en unidades menores, así que el modelo aguanta; lo que hay que decidir es si Chile vende en CLP o en USD, y con qué procesador. | Está escrito aquí, con la decisión del dueño.                  |
| **Geografía de Chile** (regiones y comunas), como `entrega/venezuela.ts`, para el selector y el retiro/entrega.                                                                                                                                                 | El selector de ciudad aparece en .cl con comunas chilenas.     |

### Fase 2 — El comprador de Chile compra de verdad

- **Proveedores chilenos de dropshipping** — la búsqueda y las compras de
  prueba, igual que se hizo con CJ: qué papel viene en la caja, desde dónde
  sale, cuánto tarda. Sin esto no se abre la venta (la misma regla de la
  pausa de EE. UU.: `pausa.ts` sabrá de mercados).
- **Medios de pago del país.** Stripe funciona en Chile, pero el comprador
  chileno paga con Webpay/tarjetas locales; decidir procesador y cuenta
  receptora ANTES de publicar precios (el orden EIN→banco→Stripe→sitio de la
  sociedad, repetido para cada país).
- **Checkout por mercado**: dirección chilena, sin la pregunta «¿dónde lo
  retiras?» de Venezuela, y con el carrito incapaz de mezclar mercados
  (`cabenJuntos()` ya existe y esta fase lo conecta).
- **Impuestos**: boleta/factura y el registro que exija el SII — con contador
  o abogado del país, no adivinado desde el código.

### Fase 3 — SEO multidominio (el que se hace con calma y una sola vez)

Hoy los canónicos de TODAS las páginas apuntan a mercatren.com — y eso, con
.cl vacío, es **correcto**: le dice a Google que la página buena es la de
.com y evita contenido duplicado. Cuando Chile tenga catálogo propio:

1. **`SITIO.url` pasa a ser por mercado** (el host decide), y `rutaCanonica`
   emite el dominio del mercado.
2. **hreflang cruzado entre dominios**: `es-CL` → mercatren.cl, `es-US` /
   `es-VE` → mercatren.com, `x-default` → mercatren.com. Es lo que le dice a
   Google «es la misma marca, un sitio por país» — como Amazon o
   MercadoLibre.
3. **Un sitemap por dominio** (el de .cl lista lo de .cl) y **una propiedad
   de Search Console por dominio**.
4. **Datos estructurados por mercado**: la Organization es la misma
   (Mercatren LLC), el `areaServed` cambia.
5. El robots de un mercado vacío no cambia nada: los canónicos a .com ya lo
   protegen mientras tanto.

### Fase 4 — El panel sabe de países

- **Selector de mercado para el equipo** (rol soporte), arriba del panel,
  con el mismo mecanismo de cookie que «ver su panel»: elegido Chile, TODAS
  las listas —comercios, cuentas, órdenes, cobros, retiros— se acotan a ese
  mercado. Un vendedor no necesita selector: su alcance ya es su tienda.
- **Los números no se mezclan**: el resumen de ventas, la cola de
  validación y la de retiros dicen de qué mercado son. Sumar CLP con USD en
  una misma tarjeta es un número que no existe.
- **Retiros por país** ya casi está: `retiros/paises.ts` tiene los doce
  países y Mercury manda el wire. Lo que falta es que el desglose y la
  moneda del comercio chileno cuadren con lo que su banco recibe.

### Fase 5 — Abrir un país nuevo es una rutina, no un proyecto

La meta: agregar México = **una entrada en `mercados.ts` + esta lista**, en
un día de trabajo:

1. Comprar el dominio y agregarlo en YaDominios → al sitio `mercatren`.
2. La entrada en `MERCADOS` (código, dominio, nombre) + push.
3. El dominio en el widget de Turnstile.
4. Geografía del país (si vende con retiro/entrega local).
5. Proveedores + medios de pago + impuestos (fases 1–2 de ese país).
6. Search Console + sitemap del dominio (fase 3).
7. Comercios: los primeros del país, con su mercado puesto.

Hasta que un país complete su lista, su dominio enseña «Mercatren llega a
{país}» — que es un estado correcto y honesto, no un error.

---

## Lo que NO se hace, y por qué

- **No se comparte la sesión entre dominios (por ahora).** Las cookies no
  cruzan de .com a .cl; un SSO con traspaso de token es trabajo fino de
  seguridad para cuando exista un usuario que de verdad viva en dos países.
  La misma cuenta ya entra en los dos con su contraseña — eso alcanza hoy.
- **No se redirige por geolocalización.** Detectar el país por IP y mandar a
  la gente al dominio «correcto» rompe SEO (Googlebot entra desde EE. UU.),
  rompe los enlaces compartidos y quita control al usuario. El que quiere
  comprar en Chile entra a mercatren.cl; a lo sumo, más adelante, un aviso
  discreto «¿buscabas Mercatren Chile?» — nunca una redirección.
- **No se traduce el catálogo entre mercados.** Un producto vive en UN
  mercado. «Vender lo mismo en dos países» = dos productos, cada uno con su
  proveedor y su precio en su moneda.
