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

## FASE 2 · La capa de datos con el país OBLIGATORIO — ✅ HECHA (17 ago 2026)

**El miedo real que esta fase mata: «alguien se olvida de filtrar y un chileno
ve stock de Estados Unidos». Ese olvido no da error: devuelve datos
equivocados, que es lo que más tarda en descubrirse.**

### Las tres defensas, y por qué son tres

| Defensa                                                                           | Qué atrapa                            | Cuándo salta             |
| --------------------------------------------------------------------------------- | ------------------------------------- | ------------------------ |
| **El argumento obligatorio** — cada consulta recibe `mercado: Mercado` de primero | Llamar sin decir el país              | Al escribir (no compila) |
| **El tipo `FiltroDeMercado`** — símbolo único NO exportado en `repositorio.ts`    | Fabricar un filtro sin país y colarlo | Al escribir (no compila) |
| **La prueba-muro** (`tests/unit/muro-mercado.test.ts`)                            | Recibir el país y **no usarlo**       | Al correr las pruebas    |

Las dos primeras las comprueba el compilador; la tercera cubre lo que el
compilador no ve. El tipo obliga a RECIBIR el país, la prueba obliga a USARLO.

**Comprobada en ROJO** quitándole el filtro a `listarComerciosDelCatalogo`: la
prueba se puso roja nombrando esa función. Y de paso **destapó dos fugas
reales** que el compilador no podía ver: `listarComerciosDestacados` y
`obtenerTiendaPorSlug` todavía escribían `eq(tiendas.mercado, …)` a mano en vez
de usar la capa — dos copias que se habrían desincronizado al primer arreglo.
Ya no: la prueba prohíbe escribir ese filtro fuera del repositorio.

### Qué es GLOBAL y qué es POR PAÍS (decidido el 17 ago 2026)

|              | Tablas                                                                                                                                                        | Por qué                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **POR PAÍS** | `tiendas.mercado` · `pedidos.mercado` · el catálogo, stock y precios (cuelgan de la tienda) · envíos · impuestos · proveedores (CJ para US, Dropi para Chile) | Es lo que cambia de un país a otro: qué se vende, a cuánto, quién lo despacha                                           |
| **GLOBAL**   | Cuentas de usuario · el equipo interno · la configuración del sistema · los departamentos del catálogo                                                        | La misma cuenta entra en todos los dominios (`trustedOrigins`); los departamentos son el vocabulario común del servicio |

**`pedidos.mercado` se GUARDA, no se deduce de la tienda.** Un pedido es un
hecho ya ocurrido: si mañana un comercio cambia de vitrina, sus ventas viejas
tienen que seguir contando donde ocurrieron. Es la misma razón por la que la
factura copia los datos del emisor en vez de apuntarlos.

**El índice EMPIEZA por el país** (`idx_pedidos_mercado_estado`): así sirve
para «los pedidos de Chile» y para «los de Chile en tal estado». Al revés solo
serviría para lo segundo.

### El agujero que apareció al hacerlo: `schema.sql` no tenía las columnas

`tiendas.mercado` y `pedidos.mercado` se aplicaron a mano a las bases vivas
—correcto— pero **`schema.sql` se quedó sin ellas**, porque el generador
concatenaba las migraciones y se plantaba ante cualquier `ALTER`. En producción
no se veía nada; habría explotado el día que se levantara un sitio nuevo, con
una base naciendo incompleta.

Ahora el DDL sale de **`drizzle-kit export`**: el esquema TAL COMO ESTÁ HOY, así
que las tablas nacen completas. Comprobado contra una base vacía — 47 tablas,
las dos columnas presentes, y el archivo corre dos veces seguidas sin romperse
(que es lo que pasa en cada publicación). Sigue valiendo la regla de siempre:
**una columna nueva sobre una base viva se aplica A MANO**, y el generador ahora
lo avisa por pantalla en vez de detener el trabajo.

## FASE 3 · La caché con el país en la clave — ✅ HECHA (17 ago 2026)

**Sin esto, las fases 1 y 2 no sirven de nada: la caché responde ANTES de
llegar a la base.** Se puede tener el filtro de país perfecto en cada consulta
y aun así servirle a un visitante del .com una página chilena guardada, sin
tocar la base ni una vez. Y no se ve en desarrollo: aparece con tráfico real.

### La auditoría, ruta por ruta

**De 80 rutas, solo 5 se hornean.** Todas las páginas son dinámicas —consultan
la sesión o la base—, así que no había ISR compartido entre dominios. Las cinco
estáticas eran `_not-found`, `icon.png`, `apple-icon.png`, `robots.txt` y
**`manifest.webmanifest`** — y esa última era la única cuyo contenido cambia con
el país: lleva el nombre de la marca dentro.

**No se veía en ninguna pantalla.** Se veía en el celular de quien instalara la
aplicación desde Chile: el icono en su pantalla de inicio diría el nombre del
otro país. Ya es `force-dynamic`.

### Las llaves de la memoria del worker

Las cuatro llaves de `recordado()` llevan el mercado. La que faltaba era
`cobertura-ciudades`, y su consulta **contaba productos de todos los mercados**:
el bombillo de una ciudad prometía mercancía que en ese dominio no existe.

### Las URL absolutas, calculadas por petición

- **`rutaCanonica()` devuelve RELATIVAS.** Next las resuelve contra
  `metadataBase`, que el layout calcula por dominio — un cambio arregla las 18
  páginas que la usan. Antes mercatren.cl declaraba como canónica una dirección
  de mercatren.com, o sea le decía a Google «esta página en realidad es aquella
  otra», y el dominio chileno no se habría indexado nunca.
- **El sitemap sale del dominio de la petición.** Servía direcciones de .com
  desde .cl, y un mapa de dominio cruzado Google lo descarta entero. Comprobado:
  .com 642 direcciones, .cl 19 (solo las fijas, que es la verdad).
- **El JSON-LD de la organización** declara el dominio por el que se entró.
- **La tarjeta social** (`og-cl.png`) y el **logo del pie** también.

### El muro que lo fija

`tests/unit/muro-cache.test.ts`, **comprobado en ROJO dos veces**: quitándole el
país a una llave y volviendo a hornear el manifest. Las dos saltaron.

**`robots.txt` se queda estático a propósito**: no menciona ningún dominio, así
que sirve igual en todos.

## FASE 4 · El panel de administración por país — ✅ HECHA (17 ago 2026)

Soporte elige el país en el encabezado del panel y a partir de ahí solo ve ese.

**El selector es COMODIDAD; el muro es que el país viva en la SESIÓN.** Vive en
una cookie que solo escribe el servidor (`src/lib/mercado/panel.ts`), nunca en
un parámetro de la dirección — con un `?mercado=CL` el selector sería un adorno.

Tres candados, y el tercero es el que casi siempre falta:

1. **Solo el rol `soporte`**, y `esSoporteDeVerdad()`: quien esté mirando el
   panel de un comercio con el disfraz de «ver su panel» no puede además
   cambiar de país, o la franja diría una cosa y los números otra.
2. **El rol se comprueba AL LEER la cookie, no solo al escribirla.** A una
   cuenta a la que le bajen el rol se le deja de respetar en el acto, sin
   esperar a que caduque. Comprobado en ROJO quitando esa comprobación.
3. **Franja permanente** cuando no se mira el principal. Lo peligroso no es
   cambiar de país: es olvidar que lo cambiaste — quien vea «0 ventas» creyendo
   estar en .com buscará un fallo que no existe. Va en AZUL y no en ámbar
   porque el ámbar ya significa «estás viendo el panel de otro».

Volver al principal **borra** la cookie en vez de escribir «US»: dos formas de
significar lo mismo es como se acaban leyendo distinto en dos pantallas.

## El 200 de las páginas que no existen NO es un fallo (17 ago 2026)

Salió en el recorrido completo de los dos dominios: `mercatren.cl/es/tienda/
bley-ferreteria` —una tienda que solo existe en .com— responde **200** en vez
de 404. Y no es cosa del país: `mercatren.com/es/tienda/no-existe-jamas`
también responde 200.

**Es comportamiento documentado de Next 16**, no un fallo del código. Su guía
(`node_modules/next/dist/docs/.../loading.md`, sección Status Codes) lo dice
con todas las letras: en una respuesta **en streaming** las cabeceras ya
salieron cuando se ejecuta `notFound()`, así que el estado ya no se puede
cambiar. Todas nuestras páginas son dinámicas, así que todas van en streaming.

**Lo que protege el SEO es otra cosa, y está funcionando:** Next inyecta
`<meta name="robots" content="noindex">` en esas páginas. Comprobado en
producción — la ficha de un comercio de .com vista desde .cl lo lleva, la de
un producto ajeno lo lleva, y **una página buena NO lo lleva**. Google no
indexa lo que está marcado `noindex` aunque el estado sea 200; su propia guía
lo dice.

**Y el dato tampoco se filtra:** esas páginas no enseñan ni el nombre del
comercio ni un solo producto. El muro de la fase 2 hace su trabajo; lo único
que no cambia es el número del estado HTTP.

**NO se persiga el 404 a lo bruto.** La única forma de conseguirlo sería
comprobar la existencia en el middleware, antes de que empiece el streaming —
una consulta a la base en CADA visita a una ficha, en el borde, para arreglar
un número que Google ya está ignorando. Se apunta aquí por si algún día hace
falta por cumplimiento o por analítica; hoy no compensa.

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
