# Plan: tallas, colores y medidas

Modelo de Amazon: un producto padre que agrupa, y variantes vendibles que se
diferencian por talla y/o color, cada una con su propio precio y su stock.
Aparte, las medidas físicas (peso, largo, ancho, alto), que NO son variantes:
son ficha técnica.

**Decisión de diseño que evita romper producción:** todo va en TABLAS NUEVAS,
no en columnas nuevas de `productos`. `schema.sql` corre en cada publicación y
solo hace `CREATE TABLE IF NOT EXISTS`, así que una tabla nueva se crea sola;
una columna nueva necesitaría un `ALTER` a mano con el token, y entre la
publicación y el ALTER el sitio se cae con 500. Ya pasó el 5 ago 2026 con
`deposito_id`.

- [x] 1. Esquema: tablas `variantes_producto` y `medidas_producto`, con su
      migración versionada en `drizzle/migrations/`.
- [x] 2. Regenerar `schema.sql` y aplicar las tablas a la base local.
- [x] 3. Consultas del catálogo: traer las variantes y las medidas en la ficha
      del producto y en la del panel.
- [x] 4. Acciones del servidor: guardar, editar y borrar variantes; guardar
      las medidas. Con el ajuste de precio aplicado a cada variante.
- [x] 5. Formulario del vendedor: bloque de variantes (talla, color, precio,
      stock) y bloque de medidas.
- [x] 6. Ficha del producto: selector de talla y color, con el precio y el
      stock de la variante elegida.
- [x] 7. Ficha técnica en el producto: peso y medidas, solo lo que esté
      cargado.
- [x] 8. Carrito: que la variante elegida viaje con su identidad, su precio y
      su tope de stock.
- [x] 9. `crearPedido`: validar la variante contra la base y descontar SU
      stock, no el del padre.
- [x] 10. Textos en español e inglés.
- [x] 11. Tipos, lint y pruebas en verde, con prueba nueva del precio de la
      variante.
- [x] 12. Verificar en el navegador con captura y publicar.
