# PLAN — Notas diarias de productos escritas por IA (blog de productos)

> Pedido por el dueño el 23 ago 2026, **solo como plan**: «una IA va a publicar
> una, dos o tres noticias al día en el blog de productos: toma un producto o
> dos y hace una especie de noticia de ese producto — que está en oferta, que
> Mercatren lo vende, para qué sirve, recomendaciones». Se deja escrito para
> ejecutarlo después, cuando se decida encender la IA que escribe y publica.
> **Nada de esto está construido todavía.**

## 1. Qué se quiere y por qué

- Cada nota es una página más que Google y los asistentes de IA pueden citar:
  el blog de producto es la forma más barata de tener cientos de páginas con
  texto propio en español (y en inglés) sobre lo que de verdad vendemos.
- El catálogo ya tiene ~2.000 productos; a 2–3 notas por día son 60–90 páginas
  nuevas al mes sin que una persona escriba nada.
- La nota habla DEL PRODUCTO (qué es, para qué sirve, a quién le conviene, cómo
  se cuida o se usa, qué viene en la caja), del comercio que lo vende (ciudad,
  cómo se retira o que se despacha en EE. UU.) y de cómo se paga. Termina con
  el botón a la ficha.

## 2. Reglas que NO se negocian (vienen de las reglas de la casa)

1. **No se inventa nada.** La IA solo puede afirmar lo que sale de la ficha
   (título, descripción, marca, categoría, precio, existencias, comercio,
   ciudad, país de entrega, fotos). Si la ficha no dice para qué sirve, la nota
   no lo dice. Prohibido inventar materiales, medidas, garantías, plazos o
   beneficios («cuida la piel», «dura 10 años») que no estén en la descripción.
2. **Nada de salud ni promesas médicas**: un labial «humecta» solo si la ficha
   lo dice; nunca «cura», «trata», «previene».
3. **Vocabulario prohibido del proyecto** (`tests/unit/vocabulario-publico.test.ts`):
   la misma prueba que vigila `src/contenido/` vigila las notas generadas.
4. **Bilingüe**: cada nota en español e inglés (inglés de nativo). Sin la
   traducción no se publica.
5. **Modelo de TEXTO barato y aprobado**: `gemini-2.5-flash` (el mismo del
   traductor del catálogo), con `TRADUCCION_LLAVE`. **Jamás un modelo de
   imagen**: las fotos son las del producto. Tope de gasto: ~$0,002 por nota;
   se fija un tope mensual en la variable `BLOG_IA_TOPE_NOTAS` (por defecto 90).
6. **Revisión humana opcional pero con interruptor**: arranca en modo
   «borrador» (la nota se guarda y el equipo la publica con un botón). Cuando
   haya confianza, se pasa a «publicar solo» y el equipo solo mira la cola de
   las que la IA marcó con duda.
7. **Se marca que la escribió una IA** al pie de la nota («Nota escrita con
   ayuda de IA a partir de la ficha del producto; revisada por el equipo»).
   Es lo honesto y lo que hoy piden las políticas de contenido.
8. **Nunca se escribe una nota de un producto sin foto, sin precio o en
   borrador**, ni de uno que lleve menos de 24 h publicado (el comercio puede
   estar corrigiéndolo).

## 3. Cómo se elige el producto del día (turno justo, como la portada)

- **Rondas por familia de vendedor**, igual que `ordenPorRondas`: un día un
  comercio venezolano, al día siguiente otro, y CJ (la familia «us») entra como
  UNA sola familia. Así una tienda con un producto sale tantas veces como la
  ferretería con seiscientos.
- Dentro de la tienda: primero lo recién subido, luego lo que tiene descuento
  (`precio_antes_centavos`), luego lo que nunca tuvo nota.
- Un producto no repite nota en 90 días. Se guarda en una tabla nueva
  (`notas_producto`: producto_id, slug de la nota, idioma, estado, escrito_en,
  modelo, revisado_por).

## 4. Dónde viven las notas (decisión técnica)

Hoy los artículos del blog están en código (`src/contenido/articulos/es.ts` /
`en.ts`), que es perfecto para las notas del equipo pero no para 90 al mes.
Las notas de IA van en **tabla nueva** `notas_producto` (título, resumen,
cuerpo en bloques JSON —los mismos bloques del motor de artículos—, idioma,
slug, estado, producto_id, fechas). El blog lista las dos fuentes juntas,
ordenadas por fecha; la página `/blog/<slug>` busca primero en código y luego
en la tabla. El `sitemap.xml` las incluye cuando están publicadas.

## 5. Quién las dispara (el reloj va FUERA de la app)

Igual que la sincronización de catálogos: un flujo de GitHub Actions
(`.github/workflows/blog-ia.yml`) con `cron` dos veces al día hace
`POST /datos/blog/generar` con la llave `BLOG_IA_LLAVE` (404 a quien no la
trae, 503 si no está configurada). La ruta elige el producto del día, pide la
nota al modelo, la valida y la guarda como borrador o publicada según el
interruptor. **No se cancela una corrida en marcha.**

## 6. Qué valida el código ANTES de guardar (nada de creer al modelo)

- Que el JSON venga completo: título ≤ 90, resumen ≤ 200, 3–6 bloques, ambos
  idiomas.
- Que no aparezca ninguna palabra del vocabulario prohibido ni ninguna de la
  lista de salud.
- Que **cada dato numérico** (precio, medidas) de la nota exista tal cual en la
  ficha; si el modelo escribe un número que no está, la nota se descarta y se
  anota el motivo (como `intentos_descripcion`).
- Que el enlace a la ficha sea el del producto elegido.
- Que no repita el título de otra nota.

## 7. Pantalla del panel (Equipo → Notas de IA)

- Cola de borradores con vista previa, «Publicar», «Editar», «Descartar».
- Interruptor «publicar solo» y el tope mensual.
- Contador de gasto estimado del mes.
- Lista de descartadas con el motivo (así se afinan las instrucciones).

## 8. Orden de trabajo cuando se ejecute (estimación: un día de trabajo)

1. Tabla `notas_producto` + `schema.sql` + pruebas de las reglas puras
   (elección del producto, validación de la nota).
2. Ruta `/datos/blog/generar` + llamada al modelo + validador.
3. Blog y `/blog/<slug>` leyendo de las dos fuentes; sitemap.
4. Pantalla del panel y el interruptor.
5. Flujo de GitHub con el cron y las dos variables (`BLOG_IA_LLAVE` en el sitio
   y en el repositorio; `TRADUCCION_LLAVE` ya existe).
6. Una semana en modo borrador mirando la cola; recién ahí «publicar solo».

## 9. Lo que decide el dueño antes de encender (decisiones de negocio)

- Cuántas por día (1, 2 o 3) y el tope mensual.
- Si las notas de CJ se firman como «Mercatren» o como la tienda de rubro.
- Si se publica solo o con revisión, y quién revisa.
