# Plan: que el catálogo de Estados Unidos se venda en español

> Ejecución del `PLAN-BUSCADOR-Y-CATALOGO.md`. Piloto automático.
>
> **Regla que manda sobre todo:** nada de este trabajo escribe en la base de
> producción por su cuenta. Lo que tenga que tocar los 78 productos ya
> publicados queda como **botón del panel**, que es como ya funcionan «Repartir
> por rubro» y «Traer las fotos».

## Bloque B — Las bicicletas están en la tienda equivocada

- [x] B1 · `bicicletas` como departamento nuevo, con su icono y sus dos idiomas
- [x] B2 · Que «tire» no gane cuando el texto habla de una bicicleta
- [x] B3 · Que «truck» no gane cuando dice «hand truck» (carretilla)
- [x] B4 · Pistas del departamento nuevo: bicicleta, e-bike, casco, inflador…
- [x] B5 · Pruebas con los títulos REALES de CJ, no inventados
- [x] B6 · Comprobar las pruebas en ROJO (meter el fallo a propósito)

## Bloque C — El buscador en español

- [x] C1 · Diccionario de sinónimos por concepto (repuesto/refacción/autoparte…)
- [x] C2 · Que singular y plural se encuentren entre sí
- [x] C3 · Prueba de que los acentos ya se ignoran (no suponerlo)
- [x] C4 · Enchufar los sinónimos al buscador real
- [x] C5 · Términos de búsqueda en español derivados del departamento
- [x] C6 · Cuando no hay resultados, ofrecer salida en vez de pantalla vacía
- [x] C7 · Módulo de traducción con proveedor enchufable + variable de entorno
- [x] C8 · Botón del panel para traducir por tandas, idempotente y retomable

## Bloque A — El precio no lleva el envío dentro

- [x] A1 · Decidir el modelo y dejarlo escrito: flete real al publicar
- [x] A2 · Tabla nueva para guardar el costo de envío de cada producto
- [x] A3 · Pedirle a CJ el flete real al agregar el producto
- [x] A4 · Botón del panel para recalcular los 78 ya publicados
- [x] A5 · Candado: no se publica un producto con el envío en cero

## Bloque D — SEO en español

- [x] D1 · El archivo de Google, separado por mercado (hoy manda todo junto)
- [x] D2 · Título y descripción de la ficha, en el idioma de la página

## Bloque E — Los candados

- [x] E1 · Prueba de las palabras trampa (tire, truck, card…)
- [x] E2 · Prueba de humo del buscador en español
- [x] E3 · Documentar todo en CLAUDE.md y marcar el plan grande

## Bloque F — Lo que queda fuera y por qué

- [x] F1 · Dejar escrito, con su motivo, lo que no se puede cerrar aquí
