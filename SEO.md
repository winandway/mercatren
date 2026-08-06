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

| Fecha      | Productos en el archivo | Mapa del sitio | Aprobados en Shopping | Indexadas en Google |
| ---------- | ----------------------: | -------------: | --------------------: | ------------------: |
| 6 ago 2026 |                     625 |            642 |       0 (en revisión) |           por medir |

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

### Las reglas para buscadores (`src/app/robots.ts`)

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
