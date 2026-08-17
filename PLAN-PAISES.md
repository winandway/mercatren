# PLAN-PAISES — Multi-inquilino: un país = un inquilino, el dominio es la puerta

> Versión 2 — 17 ago 2026. El dueño trajo el plan de arquitectura armado junto
> con YaDominios Cloud y ESTE es el que manda. La versión 1 de este archivo
> (multidominio por fases) queda absorbida aquí: lo construido ese mismo día
> se mapea abajo, fase por fase. Chile (`mercatren.cl`) es el país de prueba;
> cuando esté en orden, vienen el resto de dominios.

## La doctrina (esto manda sobre todas las decisiones)

**El problema no es multidominio: es multi-inquilino.** Cada país es un
INQUILINO con su catálogo, su stock, sus precios, sus pedidos y su
administrador. El dominio es solo la puerta por la que se entra.

**Regla de oro: el código NUNCA se separa. Se separa el DATO.** Nada de una
carpeta para Chile: el arreglo del carrito se haría en una y se olvidaría en
la otra. Carpetas por país solo para páginas de verdad distintas (una landing
local, un texto legal), jamás para lógica.

**Tres muros independientes — poner uno y creerse a salvo es el error clásico:**

| Muro   | Regla                                                        |
| ------ | ------------------------------------------------------------ |
| CÓDIGO | No se separa nunca. Uno solo.                                |
| DATOS  | El país es una dimensión OBLIGATORIA, no un filtro opcional. |
| CACHÉ  | El país va DENTRO de la clave de caché.                      |

**Separar las bases de datos NO salva de la caché**: la caché responde ANTES
de llegar a la base. Se hacen las tres cosas.

**País e idioma son dos ejes distintos.** En Chile y en Colombia se habla
español: el idioma jamás decide el país. Hoy la app resuelve idioma (next-intl)
y país (host) por caminos separados, y así se queda.

## Lo verificado por la plataforma (no supuesto)

- mercatren.com y mercatren.cl apuntan al MISMO sitio y al MISMO worker; un
  despliegue sirve los dos.
- La petición llega INTACTA: el `Host` original es de fiar.
- Bindings de hoy: `env.DB` (UNA sola base D1), `env.BUCKET`, `env.ASSETS` y
  las variables del panel. **No asumir varias bases**: `env.DB_CL` /
  `env.DB_GLOBAL` está contemplado en el plan Cosmos de YaDominios Cloud pero
  NO construido. No diseñar contando con ello hasta el aviso.
- Este repo usa **App Router** (`src/app/`).
- Dominios, DNS, certificados y correo los lleva YaDominios Cloud. Cuando se
  registre mercatren.com.co, la plataforma lo conecta y avisa.

---

## FASE 1 · El país se resuelve UNA sola vez — ✅ HECHA (17 ago 2026)

Mapa explícito, nunca adivinado por la extensión
(`src/lib/mercado/mercados.ts`, lista cerrada, 8 pruebas):

```
mercatren.com     → US (principal/global)
mercatren.cl     → CL
mercatren.com.co → CO   (cuando se registre)
cualquier otro   → principal (localhost, sitios.dev, hosts raros)
```

**La mecánica en este repo: `mercadoActual()` (src/lib/mercado/actual.ts) lee
el Host con `headers()` — una sola función de deducción, un solo lugar donde
equivocarse.** Se eligió esto en vez de inyectar el país desde el middleware
por una razón de esta plataforma: el matcher del middleware EXCLUYE `/datos`
(las rutas de servidor: parrilla infinita, sugerencias del buscador, feeds),
así que un header inyectado ahí no existiría justo en las rutas que también
consultan el catálogo. Leer el Host directo cubre TODAS las puertas con el
mismo camino. El objetivo de la fase —nadie deduce el país por su cuenta— se
cumple: la única forma de saber el mercado es llamar a `mercadoPorHost` /
`mercadoActual`.

El middleware no toca `_next`, estáticos ni imágenes (ya era así).

## FASE 2 · La capa de datos con el país OBLIGATORIO — A MEDIAS

**El miedo real que esta fase mata: «alguien se olvida de filtrar y un chileno
ve stock de Estados Unidos». Ese olvido no da error: devuelve datos
equivocados, que es lo que más tarda en descubrirse.**

Lo hecho (17 ago 2026):

- `tiendas.mercado` NOT NULL con su índice, aplicada a producción y a local
  con ALTER a mano (schema.sql no agrega columnas a tablas existentes). Los
  28 comercios de hoy → `US`.
- El candado en el catálogo público: `visibleAqui()` dentro de
  `catalogo/consultas.ts` y `buscar.ts`. Comprobado en producción: en .cl la
  búsqueda da cero y la ficha de un producto o tienda de .com sale
  «no encontrado».

Lo que falta para cerrar la fase:

- [ ] **La capa de repositorio formal**: ninguna página ni API habla con
      `env.DB` directo; cada función de la capa recibe el país y el TIPO lo
      hace obligatorio (pedir productos sin país no compila).
- [ ] **La prueba-muro**: recorre la capa y FALLA si una consulta a una tabla
      con dimensión de país va sin su filtro. Se comprueba en ROJO.
- [ ] **`mercado` en las tablas por país que faltan** (pedidos al crearse, y
      las que vengan), con índice compuesto que empiece por el país.
- [ ] **Documentar qué es GLOBAL y qué es POR PAÍS.** Decidido hoy: - Por país: tiendas (su vitrina), catálogo/stock/precios (cuelgan de la
      tienda), pedidos, envíos, impuestos, proveedores (CJ para US, Dropi u
      otro para Chile). - Global: cuentas de usuario (la misma cuenta entra en todos los
      dominios — ya funciona con `trustedOrigins`), el equipo interno, la
      configuración del sistema.

## FASE 3 · La caché con el país en la clave — A MEDIAS

Sin esto, las fases 1 y 2 no sirven de nada: los dos dominios comparten
worker y una caché por ruta sin país sirve contenido cruzado — y no se ve en
desarrollo, aparece con tráfico real.

Lo hecho (17 ago 2026):

- Las llaves de `recordado()` (caché en memoria del worker) llevan el
  mercado: portada, menú de categorías, comercios destacados.
- Las rutas que consultan el catálogo son dinámicas (usan `headers()`), así
  que hoy no hay ISR compartido entre dominios en esas páginas.

Lo que falta para cerrar la fase:

- [ ] **Auditar el caché incremental de OpenNext** ruta por ruta: toda ruta
      cacheada cuya respuesta dependa del país lleva el país en la clave, o
      se declara dinámica. Con su prueba en rojo.
- [ ] **`Vary` donde corresponda.**
- [ ] **Matar las URL absolutas fijas**: `SITIO.url` / `NEXT_PUBLIC_SITIO_URL`
      alimentan canónicos, sitemap, robots y los enlaces de los correos. Con
      varios dominios hay varios valores: se calculan POR PETICIÓN desde el
      host/país. (Mientras .cl esté vacío, sus canónicos apuntando a .com son
      correctos — evitan contenido duplicado; el cambio entra con el catálogo
      chileno. El sitemap, llms.txt y el feed de Google quedaron fijados al
      principal a propósito hasta esta fase.)

## FASE 4 · El panel de administración por país — PENDIENTE

Al entrar, el administrador elige el país y solo ve y toca ese país.

**El selector es COMODIDAD; el muro es que el país viva en la SESIÓN del
servidor** y toda consulta lo use. Si un parámetro de URL puede cambiarlo, el
selector es un adorno. Mismo mecanismo de cookie que «ver su panel», con las
mismas tres reglas: solo soporte, comprobado en el servidor, franja visible.
Los números no se mezclan: CLP con USD en una misma tarjeta es un número que
no existe.

## FASE 5 · Bases separadas — SOLO si hace falta, y va la ÚLTIMA

Con las fases 1–3 bien hechas deja de ser urgente. Se haría por ley de
residencia de datos o para vender la operación de un país — NO para evitar
que se mezcle stock (eso lo mata la fase 2). Su costo real: migraciones ×N
que se desincronizan, informes globales sumados en código, y una base extra
para lo común (serían cuatro, no tres). Depende del plan Cosmos de YaDominios
Cloud (`env.DB_CL`…), que avisará cuando exista.

---

## Lo que abre Chile de verdad (operación, no arquitectura)

Pendiente de decisión del dueño o de trabajo por fase:

- **Moneda: DECIDIDO (17 ago 2026) — Chile vende en PESOS CHILENOS (CLP).**
  El CLP no tiene centavos: la unidad menor ES el peso, así que
  `precio_centavos` guarda pesos enteros para el mercado CL y el formateo
  sale de la moneda del producto. Falta elegir el procesador (Webpay /
  tarjetas locales) y corregir el pie de .cl, que hoy dice «cobra en
  dólares».
- **La IMAGEN de la miniatura con «Mercatren.cl»** (pedido el 17 ago 2026,
  con captura). El texto de la tarjeta de WhatsApp ya sale chileno, pero la
  imagen (`/og.png`, la genera `npm run iconos`) trae dibujado
  «Mercatren.com». Hay que generar una `og-cl.png` con «Mercatren.cl» y que
  el layout sirva la imagen del mercado — el motivo es confianza: quien
  recibe el enlace chileno tiene que ver la casa chilena completa, imagen
  incluida.
- **Turnstile**: agregar mercatren.cl a los dominios del widget, o el
  login/registro desde .cl se queda sin escudo.
- **Copy por mercado**: el `<title>` y el hero dicen «Compra en Estados
  Unidos» — el texto de .cl se escribe cuando Chile tenga su propuesta.
- **Geografía de Chile** (regiones y comunas) para selector y entrega.
- **Proveedores chilenos** (Dropi u otro): compras de prueba antes de abrir
  la venta, igual que CJ — la pausa (`pausa.ts`) sabrá de mercados.
- **Impuestos**: boleta/factura y SII, con contador o abogado del país.
- **Alta de comercio con mercado**: el registro guarda el mercado del dominio
  por el que entró; el equipo lo corrige en Comercios.
- **Correos con el dominio del mercado** (enlaces de bienvenida, compra…).

## Cómo se trabaja (no es opcional)

- Cada fase con sus pruebas, y cada prueba comprobada en ROJO.
- Antes de dar algo por terminado, recorrer el camino COMPLETO de un
  visitante en los DOS dominios.
- Cada error se arregla para TODOS los casos: «¿dónde MÁS vive este fallo?».
- Un mensaje en pantalla que engaña es un fallo completo.
- **No se redirige por geolocalización, nunca**: rompe SEO y los enlaces
  compartidos. El dominio es la elección del usuario.
