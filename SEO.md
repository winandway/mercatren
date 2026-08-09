# SEO y posicionamiento de Mercatren

Todo lo que tiene que ver con que la gente **encuentre** Mercatren: Google
Search, Google Shopping, el mapa del sitio, las etiquetas y los datos que
leen los buscadores.

**Este archivo se actualiza en el mismo trabajo que toca cualquiera de esas
cosas.** Si se cambia una etiqueta, se agrega una página o Google reporta un
error, se anota aquí — con la fecha y qué se hizo. Un archivo de SEO
desactualizado hace perder días persiguiendo problemas ya resueltos.

---

## LO PRIMERO: cómo comprobar si ya está posicionando

> El dueño va a preguntar: **"escanea"**, **"¿ya está posicionando?"**,
> **"¿ya salen las imágenes?"**. Estos son los pasos exactos. Se corren
> todos, se comparan con la última medición anotada abajo, y se le reporta
> **el número**, no una impresión.

### 1. ¿Cuántas páginas tiene Google indexadas?

```bash
curl -s "https://www.google.com/search?q=site:mercatren.com&num=100" \
  -H "User-Agent: Mozilla/5.0" | grep -o 'mercatren.com/[a-z/-]*' | sort -u | wc -l
```

Ojo: Google limita y a veces bloquea esta consulta. **La fuente que manda es
Search Console** (Páginas → Indexadas), que el dueño puede abrir. Si el
comando devuelve poco o nada, decirlo así — no concluir que no está indexado.

### 2. ¿El catálogo y el mapa siguen sanos?

```bash
curl -s https://mercatren.com/datos/google | grep -c "<item>"      # productos
curl -s https://mercatren.com/sitemap.xml | grep -c "<url>"        # direcciones
curl -s -o /dev/null -w "%{http_code}\n" https://mercatren.com/robots.txt
```

### 3. ¿Los datos estructurados siguen saliendo en las fichas?

```bash
curl -s https://mercatren.com/es/producto/laminas-de-techo-pvc-acanalado \
  | grep -o '"@type":"[A-Za-z]*"' | sort -u
```

Tiene que aparecer: `Product`, `Offer`, `BreadcrumbList`, `Organization`.
Si falta `Product` u `Offer`, Google dejó de ver el precio → es urgente.

### 4. ¿Las imágenes salen desde nuestro dominio?

```bash
curl -s https://mercatren.com/datos/google \
  | grep -o '<g:image_link>[^<]*' | sed 's|.*//||;s|/.*||' | sort | uniq -c
```

Todas tienen que decir `mercatren.com`. Si aparece otro dominio, es que hay
fotos nuevas sin traer (Panel → Configuración → Fotos del catálogo).

### 5. Lo que solo se ve entrando (pedírselo al dueño con captura)

- **Search Console** → Páginas indexadas, y Sitemaps → "Páginas descubiertas"
- **Merchant Center** → Products → **Needs attention**: cuántos productos
  siguen sin aprobar y por qué
- **Merchant Center** → Products → All products: cuántos "Not showing"

### Cómo se reporta

Comparar contra la **última medición** de la tabla de abajo, anotar la nueva
fila con la fecha, y decirle en números: _"de X pasaste a Y"_. Si no hay
cambio, decirlo igual — un "sigue en 0 después de dos semanas" es
información, no un fracaso que haya que maquillar.

---

## Mediciones

| Fecha      | Productos en el archivo | Mapa del sitio |            Aprobados en Shopping | Indexadas en Google |
| ---------- | ----------------------: | -------------: | -------------------------------: | ------------------: |
| 6 ago 2026 |                     625 |            642 |                  0 (en revisión) |           por medir |
| 8 ago 2026 |                     640 |            662 | 0 — 634 rechazados por el robots |           por medir |
| 9 ago 2026 |                     643 |            665 |        por medir (ver más abajo) |           por medir |

**Medición del 9 ago 2026, un día después de corregir el robots.txt.**
Comprobado desde fuera, con el agente de Googlebot:

| Qué                                                  | Resultado                                                |
| ---------------------------------------------------- | -------------------------------------------------------- |
| Ficha de producto, tienda y catálogo, para Googlebot | **200** las tres, en menos de 1,7 s                      |
| Fotos del catálogo                                   | Todas desde `mercatren.com`, y una real responde **200** |
| `robots.txt` bloquea `/media/`                       | **No** — solo los prefijos privados                      |
| Datos estructurados en la ficha                      | `Product`, `Offer`, `BreadcrumbList`, `Organization`     |
| `site:mercatren.com` desde la terminal               | 0 — **Google bloquea esa consulta**, no significa nada   |

Search Console reportó ese día: 421 «descubierta sin indexar», 53 «alternativa
con canónica», 28 «rastreada sin indexar», 3 noindex, 1 redirección y **1
duplicada** (era el único motivo real y bajó a uno).

**Los 421 no son un error.** Son direcciones que Google conoce y todavía no ha
ido a mirar. Se le mandaron 665 de un sitio de semanas: entra de a poco y
acelera cuando gana confianza. No hay nada que apurar — pedir indexación una
por una no funciona.

**El 8 de agosto se corrigió la causa** (ver «De `/media` solo se cierra lo
privado»). La medición de arriba es de ANTES de que Google volviera a entrar:
el panel de Merchant Center enseña la última revisión que hizo, no el estado
del sitio. La próxima fila se anota cuando Google relea, entre 24 y 72 horas
después de pedirle la nueva lectura del robots.txt.

---

## Direcciones clave

| Qué                           | Dónde                                          |
| ----------------------------- | ---------------------------------------------- |
| Mapa del sitio                | `https://mercatren.com/sitemap.xml`            |
| Reglas para buscadores        | `https://mercatren.com/robots.txt`             |
| Catálogo para Google Shopping | `https://mercatren.com/datos/google`           |
| Search Console                | `search.google.com/search-console`             |
| Merchant Center               | `merchants.google.com` — cuenta **5835487683** |

---

## Qué hay montado, y por qué

### El mapa del sitio (`src/app/sitemap.ts`)

Se arma solo con las páginas fijas + las tiendas activas + los productos
publicados, cada uno con sus dos idiomas y `x-default`. **Página pública
nueva = agregarla a la lista `FIJAS`**, o Google no la encuentra por aquí.

### Las reglas para buscadores (`src/lib/seo/robots.ts`)

El texto se compone ahí y lo sirve `src/app/robots.txt/route.ts`. **Ya no lo
genera Next**: su formato no admite la línea `Content-Signal` (ver «Que nos
encuentren las IA», más abajo).

Tres bloques: `*`, `Googlebot` y `Googlebot-Image`.

**Googlebot va nombrado aparte y no se puede quitar.** Con solo el comodín,
Merchant Center rechazó 622 de 625 productos con _"Unable to do quality &
policy checks on product pages"_. Merchant Center entra a cada ficha a
comprobar que el precio del catálogo coincide con el de la página, y para eso
exige ver su nombre. `Googlebot-Image` es igual de necesario: sin poder leer
la foto, el producto no se publica.

`/datos/` está cerrado para todos **menos para Googlebot**, porque ahí vive el
propio catálogo que Merchant Center va a leer.

Lo privado (panel, comprobantes, checkout, recuperar contraseña) está cerrado
para los tres. `tests/unit/robots.test.ts` falla si alguien separa las listas.

#### De `/media` solo se cierra lo privado, NUNCA la carpeta entera

**Y con nombrar a Googlebot no alcanzó.** El 8 de agosto Merchant Center
seguía rechazando **634 productos, el 99,8 % del catálogo**, con el mismo
mensaje. El motivo estaba en este mismo archivo: se cerraba `/media/` entero,
y el catálogo manda las fotos como `https://mercatren.com/media/productos/…`.

Le dábamos a Google la dirección de la foto y en el mismo archivo le
prohibíamos abrirla. Peor: la prueba **exigía** que `/media/` estuviera
cerrado, así que el error estaba clavado por escrito y en verde.

Ahora solo se cierran los prefijos privados, y la lista sale de un solo sitio
(`src/lib/media/privados.ts`) que usan a la vez el robots.txt y la ruta que
sirve los archivos. Agregar un prefijo privado nuevo lo cierra en los dos
lados; abrir las fotos no puede volver a abrir un comprobante.

**El robots.txt es un aviso, no una cerradura.** Lo que protege de verdad los
comprobantes es `src/app/media/[...clave]/route.ts`, que exige sesión y
responde 404 a quien no corresponde. Cerrar de más en el robots no daba ni una
pizca de seguridad extra — y costó el catálogo entero fuera de Google Shopping.

### Que nos encuentren las IA, no solo Google (9 ago 2026)

Cada vez más gente empieza a buscar preguntándole a un asistente, no
escribiendo en Google. Cuando alguien pregunta _«dónde compro cable THW
calibre 12»_, ChatGPT o Claude salen a leer sitios — y leen muy mal el HTML de
una tienda: menús, banners, botones y guiones.

Lo montado hasta ahora:

| Qué                  | Dónde                       | Para qué                                                       |
| -------------------- | --------------------------- | -------------------------------------------------------------- |
| **`llms.txt`**       | `src/app/llms.txt/route.ts` | Le explica al asistente qué es el sitio y dónde está cada cosa |
| **`Content-Signal`** | `src/lib/seo/robots.ts`     | Declara qué puede hacer una IA con el catálogo                 |

**El `robots.txt` ya no lo genera Next.** Su formato solo admite `User-agent`,
`Allow`, `Disallow` y `Sitemap`, y no deja meter `Content-Signal`. Ahora el
texto se compone en `src/lib/seo/robots.ts` y lo sirve
`src/app/robots.txt/route.ts`. **Todas las protecciones de antes siguen ahí y
siguen vigiladas por `tests/unit/robots.test.ts`.**

#### Qué dice la señal, y por qué

```
Content-Signal: search=yes, ai-input=yes, ai-train=no
```

- **`search=yes`** — que salgamos en buscadores. Es a lo que venimos.
- **`ai-input=yes`** — que un asistente pueda **citar un producto nuestro** al
  responderle a alguien. Eso es tráfico y compradores. Cerrarlo sería
  desaparecer del sitio donde la gente empezó a buscar.
- **`ai-train=no`** — entrenar un modelo con el catálogo no nos devuelve nada.
  Es lo único que se niega, y se niega por eso.

La diferencia entre los dos últimos se confunde fácil y es la que importa: uno
es **que te citen hoy**, el otro es **que te copien para siempre**.

Ojo: es una **declaración de preferencia, no un candado**. Quien la respeta la
respeta; técnicamente no impide nada.

#### Lo que NO se hizo, y por qué (para no repetir la discusión)

La herramienta de Cloudflare (`isitagentready.com`) dio 29/100 y sugirió diez
cosas. Cuatro **no se hacen**, y no es pereza:

| Sugerencia                                                                 | Por qué no                                                                                                                                  |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `/.well-known/openid-configuration`, `oauth-protected-resource`, `auth.md` | **No hay API pública con OAuth.** Publicarlo es anunciar puertas que no existen: un agente las prueba, falla, y nos marca como poco fiables |
| DNS-AID                                                                    | Es un **borrador** de IETF, ni siquiera norma. Exige DNSSEC. Adopción casi nula                                                             |

Y tres son proyectos aparte, no casillas: servidor MCP, índice de habilidades
y WebMCP. Valen, pero exigen construir un servidor.

**El número no es la meta.** Subir a 100 publicando metadatos falsos deja el
sitio peor que en 29.

**Lo que sigue pendiente y sí vale:** responder en Markdown cuando el agente
manda `Accept: text/markdown`. Es la que más mueve la aguja de las que quedan.

### Los avisos de Search Console: cuáles son normales y cuál no

Search Console manda correos de _"Nuevos motivos que impiden la indexación"_.
**Tres de los cuatro que salieron el 7 ago 2026 son el comportamiento correcto
del sitio**, y perseguirlos es perder el tiempo:

| Motivo                                            | ¿Hay que hacer algo?                                                                                     |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Página alternativa con etiqueta canónica adecuada | **No.** Es el hreflang funcionando: Google entendió que `/es` y `/en` son la misma página en dos idiomas |
| Excluida por una etiqueta "noindex"               | **No.** Es el panel, el carrito, el checkout y recuperar contraseña. Están cerrados a propósito          |
| Página con redirección                            | **No.** Es `/` mandando a `/es`, y las direcciones sin idioma                                            |
| **Duplicada: Google eligió otra canónica**        | **SÍ.** Ver abajo                                                                                        |

**La única de verdad es la cuarta, y tiene dos causas:**

1. **Fichas duplicadas en el catálogo.** De los 689 productos cargados, solo
   621 son códigos distintos: hay **68 fichas repetidas publicadas**, con el
   mismo título, la misma descripción y la misma foto en dos direcciones.
   Google las ve como copias y se queda con una. Ya está resuelto en el código
   (`src/lib/catalogo/agrupar.ts`), pero **solo se aplica cuando corra la
   primera sincronización**: las duplicadas pasarán a borrador y saldrán del
   mapa del sitio.

2. **Las fichas en inglés muestran el texto en español.** Cuando un producto
   importado no trae `titulo_en`, `/en/producto/x` enseña exactamente lo mismo
   que `/es/producto/x`. Para Google son dos direcciones con el mismo
   contenido, y pliega una sobre la otra.

   **Esto NO se arregla inventando traducciones** (regla del proyecto, y en
   EE.UU. un catálogo mal traducido se nota). Se arregla cuando los comercios
   carguen el inglés de verdad. Mientras tanto el `hreflang` está bien puesto,
   que es lo que Google pide: plegar dos páginas idénticas es su
   comportamiento normal, no una penalización.

### Los datos estructurados (`src/lib/seo/datos-estructurados.ts`)

- **`Product` + `Offer`** en cada ficha: precio en dólares (no en centavos),
  disponibilidad tomada de las existencias reales, SKU, marca y categoría.
- **`BreadcrumbList`**: Google enseña `Mercatren › PVC › Tubo` en vez de la
  dirección cruda.
- **`Store`** en la página de cada comercio, con su ciudad. Sin ciudad
  cargada no se inventa una dirección.
- **`Organization`** en el layout, una sola vez.

**El vendedor declarado es Windoce, LLC**, no el comercio. Es quien vende y
factura al comprador; poner al comercio ahí diría lo contrario de lo que
dicen los términos.

**Todo el JSON-LD pasa por `comoJsonLd()`, que lo escapa.** Los títulos los
escribe el comercio, y un `</script>` dentro de uno cerraría el bloque y
dejaría el resto corriendo como HTML de la página.

### El catálogo para Shopping (`src/app/datos/google/route.ts`)

Se genera al vuelo desde la base, así que **siempre está al día**: cambia un
precio en el panel y el archivo ya lo dice. Google lo lee cada 24 horas.

Tres cosas que Google rechaza si se hacen mal, y que aquí están resueltas:

1. **El precio va como `12.34 USD`**, sacado de `precio_centavos`, que es
   exactamente el que se cobra. Nunca con símbolo ni coma decimal.
2. **`identifier_exists: no`** — casi nada del catálogo de una ferretería
   tiene código de barras. Sin declararlo, Google rechaza cientos de golpe.
3. **El `id` no pasa de 50 caracteres.** Google corta ahí y descarta el
   producto entero. Al recorte se le pega una firma del nombre completo: dos
   productos parecidos no chocan, y el mismo producto da siempre el mismo id
   (si cambiara, Google borraría el viejo y perdería su historial).

### Metadatos por página

Canónicas y `hreflang` en producto, tienda y todas las páginas de contenido,
vía `rutaCanonica()` de `src/lib/sitio.ts`. Sin eso, `/es` y `/en` compiten
entre sí como si fueran páginas distintas.

**Descripción de respaldo**: el catálogo importado viene casi todo sin
descripción, y una página sin `description` la resume Google como quiere.
Cuando falta, se arma con lo que sí sabemos: qué es, de quién y dónde se
retira.

---

## Google Merchant Center

**Cuenta 5835487683 · Mercatren · Estados Unidos · español**

| Ajuste                   | Cómo quedó                                          |
| ------------------------ | --------------------------------------------------- |
| País de venta            | Estados Unidos, USD                                 |
| Idioma                   | Español (los títulos del catálogo están en español) |
| Fuente de productos      | Enlace a `/datos/google`, cada 24 h a las 12:00 AM  |
| Política de devoluciones | `mercatren.com/es/devoluciones` — **Verified**      |
| Política de envío        | Gratis · 1-3 días hábiles · todos los productos     |
| Actualización automática | Precio, disponibilidad y condición: **activadas**   |
| Mejora de imágenes       | Activada                                            |
| Actualización de envío   | Apagada a propósito                                 |

### Por qué solo Estados Unidos

Venezuela aparece en el selector pero **no está en la lista oficial de países
soportados** — es mercado beta y probablemente exija bolívares. Y declarar
países donde todavía no hay comercios (Colombia, México, Chile, Ecuador,
Argentina) es _misrepresentation_: Google desaprueba los productos allá y,
en una cuenta nueva, deja mala reputación desde el día uno.

**Se agregan cuando haya comercios con mercancía real en ese país.** Google
lo permite en cualquier momento y sin penalidad.

### La tensión que hay que conocer

Mercatren no envía: se retira. Pero Merchant Center para "United States"
asume entrega en Estados Unidos, y no hay casilla que diga "se retira en otro
país" — el _local pickup_ de Google exige tiendas en el mismo país de venta.

Lo declarado es lo más honesto que permite el formulario:

- **Tránsito 0-0** — verdadero, no hay transportista.
- **Preparación 1-3 días** — real: validar el pago y que el comercio lo tenga
  listo.
- **Costo cero** — verdadero, no se cobra nada por la entrega.

Y el sitio lo dice de frente en [`/entrega`](https://mercatren.com/es/entrega)
y en cada ficha de producto. Si Google pregunta, ahí está la explicación, más
el documento del modelo de negocio.

---

## Historial

### 5 ago 2026 — el catálogo empieza a hablarle a Google

Las 622 fichas salían como un enlace azul y nada más. Se agregaron
`Product` + `Offer` (precio, existencias, marca, categoría), migas de pan,
`Store` en las tiendas, canónicas y `hreflang`, `x-default` en el mapa y
descripción de respaldo. Las fotos pasaron a direcciones absolutas — Google
descarta una imagen relativa.

De paso, un agujero: el JSON-LD se escribía sin escapar y un `</script>` en
el título de un producto habría sacado el resto fuera del bloque.

### 6 ago 2026 — Merchant Center, de cero a configurado

- Cuenta creada, dominio verificado solo (misma cuenta de Search Console).
- Páginas nuevas obligatorias: `/devoluciones` y `/entrega`, bilingües y
  enlazadas desde el pie. Sin política de devoluciones publicada, Google no
  aprueba la cuenta — es el requisito que más rechazos causa.
- Catálogo conectado por enlace, lectura diaria.
- **17 productos rechazados** por `id` de más de 50 caracteres → resuelto.
- **622 productos rechazados** por `robots.txt` sin Googlebot → resuelto.
- Política de envío creada: gratis, 1-3 días.
- El sitio estuvo caído unas horas por una bandera de suspensión pegada en la
  plataforma (fallo de YaDominios, nada del código).

---

## Lo que falta

### Del lado del dueño

- [ ] **Return window en `7` días.** Quedó en `N/A` — la política está
      incompleta hasta que se ponga (Shipping and returns → Return policies).
- [ ] Darle a **Update** en la fuente de productos, para que Google relea con
      el robots.txt corregido.
- [ ] Esperar la revisión: de uno a tres días para que los avisos de
      _Needs attention_ se caigan.

### Programable, cuando toque

- [ ] **Traducir los títulos al inglés.** Hoy `titulo_en` está vacío en casi
      todo el catálogo y por eso el feed va en español. Con títulos en inglés
      se podría abrir un segundo feed y llegar al público que busca en inglés.
- [ ] **Categorías de Google** (`google_product_category`). Ahora se manda
      `product_type` con el nombre del comercio; la taxonomía oficial de
      Google mejora dónde se muestra cada producto.
- [ ] **GTIN cuando el comercio lo tenga.** Un producto de marca con código de
      barras se posiciona mucho mejor que uno sin identificar. Hoy todos van
      con `identifier_exists: no`.
- [ ] **Reseñas de productos.** `AggregateRating` en los datos estructurados
      saca las estrellas en el resultado — pero requiere tener reseñas reales;
      no se inventan.
- [ ] **Segundo feed en inglés** si algún día se declara un país anglófono.

---

## Reglas que no se rompen

1. **Página pública nueva → al mapa del sitio** (`FIJAS` en `sitemap.ts`) y
   con su `rutaCanonica()`. Si no, Google no la encuentra.
2. **Nunca quitar `Googlebot` ni `Googlebot-Image` del robots.txt.** Sin
   ellos, Merchant Center no publica ni un producto.
3. **Nada de datos inventados en los datos estructurados.** Ni una política
   de devoluciones que no exista, ni un plazo de envío que no se cumpla, ni
   una valoración sin reseñas. Google compara con la página, y lo que no
   coincide se castiga.
4. **El precio del feed = el precio de la página.** Salen los dos de
   `precio_centavos`; si alguna vez se separan, Google desaprueba en bloque.
5. **Todo JSON-LD pasa por `comoJsonLd()`.** Hay prueba que falla si aparece
   un `JSON.stringify` suelto.
