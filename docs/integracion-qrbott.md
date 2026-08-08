# Integración QRbott ↔ Mercatren

> El contrato entre las dos plataformas de Windoce, LLC. Escrito el 8 ago 2026,
> con los datos que la sesión de QRbott verificó contra su base de producción.
>
> **Este archivo manda.** Si el código y este documento no coinciden, se
> corrigen los dos en el mismo trabajo.

## Qué es esto

`qrbott.com` arma tiendas con POS; `mercatren.com` es la vitrina en Estados
Unidos. Un comerciante toca **un botón** en su panel de QRbott y su catálogo
queda pegado en los dos lados: suba donde suba, aparece en ambos.

**No es lo mismo que la sincronización de Ferremateriales Bley.** Allá leemos un
archivo que un comercio ajeno publica, en una sola dirección y con permiso
puntual. Aquí las dos casas son nuestras, así que es una API nativa, de dos vías
y para todas las tiendas.

---

## LO PRIMERO: la bandera que evita borrarle el catálogo a un cliente

**El caso que lo motiva es real.** El piloto —Inversiones Multiservicios— tiene
**21 productos en Mercatren y 1 en QRbott**. Su catálogo de verdad está aquí,
no allá.

La sincronización retira lo que no viene en el archivo, y eso es correcto cuando
el origen manda el catálogo entero. Con un delta de un solo producto, retiraría
los otros 20: fuera de la tienda y fuera de Google, sin un solo error en
pantalla — el resumen diría «1 actualizado, 20 retirados» y quedaría en verde.

Por eso **cada envío declara qué trae**:

| `completo` | Qué significa                      | ¿Puede retirar lo ausente? |
| ---------- | ---------------------------------- | -------------------------- |
| `true`     | Es el catálogo ENTERO de la tienda | Sí                         |
| `false`    | Solo lo que cambió desde una fecha | **NUNCA**                  |

Con `completo: false`, lo único que despublica un producto es que venga en
`deletions` o con `status` de baja. **Nada implícito.**

La primera vinculación de una tienda que ya existe en Mercatren va **siempre**
con `completo: false`, sin excepción.

---

## La llave de emparejamiento

**`id` — el uuid de `bot_knowledge_base`.** Es estable y permanente: se genera
al crear el producto y ninguna operación lo reescribe.

**No se empareja por el código de barras.** `product_barcode` es opcional,
editable por el comerciante y puede repetirse entre variantes. Se manda como
dato extra (le sirve a Google Shopping), nunca como llave.

Del lado de Mercatren ese uuid se guarda en `productos.externo_id`, y la pareja
(tienda, externo_id) es única: reenviar **actualiza**, no duplica.

---

## El archivo de productos (QRbott → Mercatren)

```json
{
  "version": 1,
  "completo": false,
  "desde": "2026-08-08T12:00:00Z",
  "hasta": "2026-08-08T12:15:00Z",
  "tienda": {
    "externo_id": "39341d9e-0000-0000-0000-000000000000",
    "nombre": "Inversiones Multiservicios"
  },
  "categories": [
    {
      "id": "ferreteria",
      "slug": "ferreteria",
      "name_es": "Ferretería",
      "name_en": null
    }
  ],
  "products": [
    {
      "id": "8b895933-b8f5-458a-9fbd-6e8210673f70",
      "sku": "7591234567890",
      "title_es": "Cable THW calibre 12",
      "title_en": null,
      "description_es": "Cable de cobre THW, calibre 12, por metro.",
      "description_en": null,
      "category_id": "ferreteria",
      "brand": "Cabel",
      "price": 1.35,
      "compare_at_price": null,
      "stock": 213.5,
      "sale_type": "length",
      "unit": "m",
      "weight_grams": null,
      "status": "published",
      "featured": false,
      "sucursal": "principal",
      "images": [
        {
          "url": "https://…/cable-12.webp",
          "alt": "Cable THW 12",
          "position": 1
        }
      ]
    }
  ],
  "deletions": [
    {
      "id": "0b06d6c0-1c25-4cf8-8aa1-e4336948b7bf",
      "deleted_at": "2026-08-08T12:03:00Z"
    }
  ]
}
```

### El cursor `hasta` lo pone QRbott, y Mercatren lo devuelve tal cual

Mercatren guarda el `hasta` recibido y lo manda como `desde` la próxima vez.
**No usa su propio reloj**: dos servidores nunca están exactamente en hora, y
unos segundos de diferencia se comen los cambios de esa ventana sin que nadie
lo note.

### Campo por campo

| Campo              | De dónde sale (`bot_knowledge_base`) | Cuidados                                   |
| ------------------ | ------------------------------------ | ------------------------------------------ |
| `id`               | `id`                                 | **La llave. No cambia nunca**              |
| `sku`              | `product_barcode`                    | Opcional. Nunca es la llave                |
| `title_es`         | el nombre del producto               | Sin él, el producto se ignora              |
| `title_en`         | —                                    | `null` si no hay. **No se inventa**        |
| `price`            | **`product_price`**                  | Base, SIN impuesto y SIN margen. Ver abajo |
| `compare_at_price` | `product_original_price`             | Solo el precio tachado                     |
| `stock`            | `product_stock`                      | `null` = ilimitado. **Nunca `-1`**         |
| `sale_type`        | `sale_type`                          | `unit` · `weight` · `length`               |
| `unit`             | `unit_of_measure`                    | `u` · `kg` · `g` · `m` · `cm`              |
| `status`           | `is_active`                          | `published` · `draft` · `out_of_stock`     |
| `sucursal`         | `sucursal_id`                        | `null` = Principal                         |
| `images[].url`     | `product_image_url`                  | El grande. **Sin foto, no se manda**       |

### `stock: null` significa ILIMITADO, y `-1` no se manda nunca

QRbott usa `-1` y `NULL` para «existencias ilimitadas». Si ese `-1` llegara
crudo, Mercatren publicaría el producto con **menos uno** de existencias:
agotado en la tienda y `out_of_stock` para Google. Un producto que se vende
siempre, invisible.

**QRbott normaliza a `null` antes de mandar.** Mercatren trata `null` como
disponible sin contar unidades.

### El precio: solo el BASE viaja, en las dos direcciones

Mercatren publica **precio base + su margen**. Si le devolviera a QRbott el
precio publicado, QRbott lo guardaría como base, y en la siguiente vuelta
Mercatren le sumaría el margen otra vez:

```
100.00 → 103.09 → 106.28 → 109.57 → …
```

Subiendo solo, todos los días, sin que nadie toque nada y sin un solo error.
Cuando alguien lo note, el producto lleva semanas impagable.

Tres reglas, y ninguna es opcional:

1. Por el cable viaja **`product_price`**, que es la base sin impuesto.
2. **`product_original_price` NO es la base.** Es el precio tachado de
   marketing; se manda como `compare_at_price` y nada más. Tomarlo por base
   infla todo el catálogo de golpe.
3. Mercatren **no** suma el impuesto local del comerciante. Envío e impuestos
   van en cero (ver `CLAUDE.md`); el margen se calcula sobre el precio limpio.

### Las bajas van explícitas, porque el borrado es físico

QRbott borra los productos de verdad, así que un delta por fecha nunca los
vería: el producto simplemente deja de aparecer, y con `completo: false`
Mercatren no retira nada por ausencia. Seguiría publicado para siempre.

Por eso van en `deletions`, que QRbott arma de su tabla `pos_deletions`
(`entity='product'`). Mercatren los pasa a **borrador, no los borra**: pueden
tener pedidos viejos colgando.

---

## Las tres rutas de Mercatren

Sin prefijo `/api/`: en YaDominios Cloud lo capturan los estáticos antes de
llegar al código (regla 1 del proyecto).

### `POST /datos/socios/vincular`

Abre o engancha la tienda y devuelve su token.

```json
{
  "externo_id": "39341d9e-…",
  "nombre": "Inversiones Multiservicios",
  "slug_existente": "inversiones-multiservicios-ac0803"
}
```

**`slug_existente` es lo que evita el duplicado.** Si viene, Mercatren engancha
esa tienda; si no viene, crea una nueva. Sin ese dato, un cliente que ya tiene
tienda aquí terminaría con dos y su catálogo repartido entre las dos.

Responde `{ "tienda_id": "…", "token": "…", "productos_aqui": 21 }`.

**`productos_aqui` se enseña antes de confirmar.** Si dice 21 y en QRbott hay 1,
la persona que aprieta el botón tiene que verlo ANTES, no descubrirlo después.

### `POST /datos/socios/productos`

Recibe el archivo de arriba. Autenticación: `Authorization: Bearer <token de la
tienda>`. Responde con lo que hizo: creados, actualizados, a borrador,
ignorados y por qué.

### `GET /datos/socios/cambios?desde=<fecha>`

La vuelta que hoy no existe. Devuelve el mismo formato con lo que cambió en
Mercatren, más un `hasta` para la próxima llamada.

**No incluye el precio publicado ni las traducciones al inglés hechas aquí**:
esos campos son de Mercatren y no vuelven (ver la regla del precio).

---

## Quién manda sobre cada campo

| Campo                                         | Dueño                                  |
| --------------------------------------------- | -------------------------------------- |
| Título, descripción, foto, marca, **base**    | Quien lo editó de último               |
| **Existencias**                               | **Solo el POS de QRbott**              |
| Precio publicado, inglés, departamento, color | **Solo Mercatren.** Nunca viajan atrás |

Las existencias tienen un solo dueño a propósito: el inventario físico está en
el POS, y si los dos lados descuentan con segundos de diferencia se vende lo
que ya no hay. Cuando Mercatren venda, avisa para que el POS descuente.

## El eco infinito

Mercatren avisa → QRbott guarda → eso cuenta como cambio → QRbott avisa →
Mercatren guarda → para siempre.

Cada lado marca de dónde vino el último cambio (`sync_origin` allá) y **no
reenvía lo que llegó del otro lado**.

---

## Lo que falta decidir (8 ago 2026)

| #   | Punto                                     | Estado                              |
| --- | ----------------------------------------- | ----------------------------------- |
| 1   | Tabla correcta (`bot_knowledge_base`)     | ✅ resuelto por la sesión de QRbott |
| 2   | Stock decimal                             | ✅ ya estaba: `numeric(12,3)`       |
| 3   | Llave de socio y token por tienda         | ✅ patrón de SumUp                  |
| 4   | Contrato JSON                             | ✅ **este archivo**                 |
| 5   | Los 21 productos del piloto               | ⏳ decisión del dueño               |
| 6   | Cómo se engancha una tienda que ya existe | ✅ por `slug_existente`, no por RIF |
| 7   | `sync_origin` / `mercatren_synced_at`     | ⏳ migración del lado de QRbott     |

Sobre el 6: **no se engancha por identificación fiscal.** QRbott no la guarda
hoy, y esperar a agregarla bloquea todo. Peor: emparejar solo por RIF permite
enganchar en silencio la tienda equivocada. El slug lo confirma una persona,
que es más lento y más seguro.
