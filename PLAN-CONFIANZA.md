# Plan: estrellas, reseñas y confianza

> Escrito el 9 ago 2026, a pedido del dueño: _«quiero ver cómo funciona el
> sistema de cinco estrellas de Amazon… y que se vea bonito»_. Investigado con
> fuentes, no de memoria.

---

## LO PRIMERO: por qué NO se pueden poner estrellas por defecto

El pedido era: **darle de 4 a 5 estrellas a cada producto por defecto**, y
dejar algunos en 3 «para que se vea normal». El objetivo declarado era vender
más, mejorar el SEO y generar confianza.

**Eso consigue exactamente lo contrario en las tres cosas.** No es una opinión
de estilo; son tres hechos comprobables:

### 1. Es ilegal en el país donde vendemos

La FTC prohibió las reseñas falsas con una norma que entró en vigor el **21 de
octubre de 2024** (16 CFR Parte 465). Prohíbe explícitamente **crear reseñas o
puntuaciones que no vengan de un cliente real**.

La multa llega a unos **51.744 dólares POR VIOLACIÓN**. Con 700 productos eso
no es un riesgo teórico: es la empresa entera.

Y Mercatren vende **a compradores en Estados Unidos**. Es justo la jurisdicción
que aplica.

### 2. Google lo prohíbe, y el castigo mata el SEO que se busca

La política de Google para los datos de reseñas dice, con estas palabras:
_«No incluyas reseñas falsas»_, _«las puntuaciones deben venir directamente de
los usuarios»_, _«no dependas de editores humanos para crear o compilar
puntuaciones»_.

**El castigo es una acción manual**: Google deja de mostrar las estrellas y
puede **ignorar todos nuestros datos estructurados**. O sea: se perdería el
`Product` y el `Offer` que hoy sí funcionan y que son lo que sostiene la ficha
en Google Shopping.

Se pondrían estrellas para mejorar el SEO y el resultado sería quedarse sin el
SEO que ya se tiene.

### 3. Comercialmente tampoco funciona

Un catálogo donde **todo** tiene 4,5 estrellas y **cero** reseñas escritas es
la firma clásica de una tienda inventada. El comprador que se toma el trabajo
de mirar lo nota en dos segundos, y a partir de ahí desconfía de todo lo demás
—incluidos los precios y los plazos, que sí son ciertos.

Peor para nosotros: el sello de «empresa verificada» que acabamos de construir
pierde todo su valor si al lado hay estrellas regaladas. Se gasta la única
señal honesta que teníamos.

**Conclusión: esa parte no se hace.** Todo lo demás del pedido sí, y hay mucho.

---

## Cómo funciona de verdad Amazon

### Son DOS sistemas separados, no uno

| Qué se puntúa   | Dónde sale                | Quién puede                     |
| --------------- | ------------------------- | ------------------------------- |
| **El producto** | Las estrellas de la ficha | Quien lo compró                 |
| **El vendedor** | La ficha del vendedor     | Quien le compró, sobre el trato |

Se confunden todo el tiempo y son cosas distintas: un producto bueno vendido
por alguien que despacha tarde tiene cinco estrellas de producto y dos de
vendedor. **Nosotros necesitamos los dos**, porque somos un mercado con muchos
comercios.

### La estrella NO es un promedio

Esto es lo que casi nadie sabe. Desde 2015 Amazon **pondera** cada reseña:

- **Si fue compra verificada** — el peso más alto de todos
- Cuánta gente la marcó como útil
- Qué tan reciente es
- Qué tan larga y detallada
- Si trae foto o video

Y lo más importante para nosotros: **una puntuación sin texto, de alguien que
no compró, no entra en el promedio.** Amazon la descarta.

O sea que el propio Amazon ya resuelve el problema que nosotros íbamos a crear:
distingue entre una estrella que vale y una que no.

### Las insignias se ganan, no se ponen

«Amazon's Choice», «Best Seller», la insignia azul de conversión: **todas salen
del comportamiento real** —ventas, tasa de conversión, devoluciones bajas—, no
de una casilla que alguien marca.

---

## Lo que sí genera confianza cuando todavía no hay reseñas

Esto es lo que recomiendan quienes montan mercados nuevos, y coincide con lo
que ya tenemos a medio construir:

| Señal                                   | ¿La tenemos?                     |
| --------------------------------------- | -------------------------------- |
| Empresa verificada, con constancia      | ✅ Se construyó el 9 ago         |
| Datos fiscales de la empresa a la vista | ✅ RIF, dirección, teléfono      |
| Contacto directo con el comercio        | ✅ Botón de WhatsApp             |
| Precio cerrado, sin sorpresas           | ✅ El margen va incluido         |
| Política de envío y devolución clara    | ✅ Cuatro modos de envío         |
| **Cuántas unidades se han vendido**     | ⬜ Planeado en `PLAN-VITRINA.md` |
| **Preguntas y respuestas**              | ⬜ No existe                     |
| **Reseñas reales de quien compró**      | ⬜ No existe                     |
| Tiempo de respuesta del comercio        | ⬜ No existe                     |

---

## EL PLAN, en cuatro fases

### FASE 1 · «Se han vendido N» — la que reemplaza a las estrellas falsas

Ya está diseñada en `PLAN-VITRINA.md` fase 2: se deduce de cuánto bajaron las
existencias entre una sincronización y la siguiente.

**Es el sustituto directo de lo que se quería lograr**, y es mejor: «se han
vendido 47» convence más que una estrella sin nombre, y es un hecho
comprobable. Nadie puede acusarnos de inventarlo porque sale del inventario del
propio comercio.

Y cuenta también lo que se vende en el mostrador — que es justo el argumento de
la vitrina que dio Ferremateriales Bley.

**Regla: si es 0, no se dibuja.** Igual que no enseñamos cuántas ventas lleva un
comercio hasta que el número acompañe.

### FASE 2 · Preguntas y respuestas en cada producto

**La más rentable de todas, y la que nadie espera.**

- **No necesita ni un comprador para arrancar.** El comercio puede escribir él
  mismo las preguntas frecuentes de su producto: «¿este cable es de cobre puro?»
  «¿el galón rinde para cuántos metros?». Eso **no es una reseña**: es
  información del producto, y es legítima venga de donde venga.

#### Una corrección: el «resultado enriquecido» de FAQ ya no existe

El primer borrador de este plan decía que el dato `FAQPage` haría que la ficha
ocupara más espacio en Google. **Eso ya no es cierto y conviene no repetirlo.**

Google restringió esa función en **septiembre de 2023** a sitios de gobierno y
salud, y en **junio de 2026** la retiró del todo. Poner `FAQPage` en una ficha
de producto hoy **no dibuja nada** en los resultados. El dato sigue siendo
válido y no molesta, pero no hay que esperar nada de él.

**La función se hace igual, y por tres razones que sí se sostienen:**

1. **Es la cura de nuestro problema medido de SEO.** Search Console reporta 28
   páginas «rastreada: actualmente sin indexar» — eso es Google diciendo «entré
   y no me pareció suficiente». Las fichas del catálogo importado tienen dos
   líneas de descripción y nada más. Cinco preguntas respondidas convierten una
   ficha flaca en una página con sustancia, **y en las palabras que la gente
   escribe de verdad al buscar** («¿sirve para 220?», «¿cuántos metros trae?»).
2. **Lo leen los asistentes de IA.** Acabamos de abrir `llms.txt` y declarar
   `ai-input=yes` para que ChatGPT y Claude puedan citar nuestros productos. Un
   bloque de preguntas y respuestas es exactamente lo que un asistente cita
   cuando alguien pregunta si un producto sirve para algo.
3. **Responde la objeción antes de que mate la venta.** Es literalmente para lo
   que sirve, y no depende de ningún buscador.

Después, el comprador puede preguntar y el comercio responder. Cada respuesta es
contenido nuevo en la ficha.

### FASE 3 · Reseñas de verdad, con la mecánica de Amazon

Solo puede puntuar **quien tiene un pedido pagado de ese producto**, una vez por
pedido. Y se copia lo que Amazon hace bien:

- Sello de **compra verificada** en cada reseña
- Se puede marcar como útil, y eso pesa en el orden
- Las recientes pesan más
- **Dos puntuaciones separadas: el producto y el comercio**

**Y lo que de verdad consigue reseñas: pedirlas.** Un correo unos días después
de la entrega. Sin eso, un mercado nuevo puede pasar meses en cero. Ya tenemos
el sistema de correos montado, así que es agregar uno más.

Al principio habrá pocas y está bien. **Cinco reseñas reales valen más que
setecientas inventadas** — y las cinco son legales.

### FASE 4 · Las estrellas en Google, cuando sean ciertas

Recién ahí se agrega `aggregateRating` a los datos estructurados y aparecen las
estrellas amarillas en los resultados de búsqueda.

Con reseñas reales eso es legal, Google lo premia, y **es exactamente el
resultado visual que se quería** — solo que llegando por el camino que no nos
puede costar la empresa ni el posicionamiento.

---

## Orden y por qué

1. **Fase 1** primero: no depende de nadie más y da el número que reemplaza a
   la estrella.
2. **Fase 2** enseguida: es la de mejor relación esfuerzo/resultado, sirve para
   SEO desde el día uno y no necesita compradores.
3. **Fase 3** cuando haya pedidos entregados. Sin entregas no hay a quién
   pedirle una reseña.
4. **Fase 4** cuando haya reseñas suficientes para que el promedio signifique
   algo (unas cinco por producto).

---

## Fuentes

- [FTC · Norma final sobre reseñas y testimonios (16 CFR 465)](https://www.ftc.gov/system/files/ftc_gov/pdf/r311003consumerreviewstestimonialsfinalrulefrn.pdf)
- [eCFR · 16 CFR Parte 465](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-D/part-465)
- [Goodwin · Análisis de la norma de la FTC](https://www.goodwinlaw.com/en/insights/publications/2024/09/alerts-practices-cldr-ftc-finalizes-rule-on-consumer-reviews)
- [Google · Política de datos estructurados de reseñas](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)
- [Seller Labs · Cómo funcionan de verdad las reseñas de Amazon](https://www.sellerlabs.com/knowledge-base/how-amazon-reviews-actually-work-verified-unverified-and-vine/)
- [FeedbackWhiz · Cómo calcula Amazon la puntuación](https://www.feedbackwhiz.com/blog/how-does-amazon-calculate-product-ratings/)
- [Playbook de confianza en mercados](https://techvinta.com/blog/marketplace-trust-and-safety-playbook)
