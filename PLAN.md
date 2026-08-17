# Plan: ejecutar lo que falta de PLAN-PAISES.md (fases 2, 3, 4 + Chile)

> Piloto automático, 17 ago 2026. El orden lo manda el plan del dueño.
> **Lo que depende del dominio va de ÚLTIMO**: YaDominios Cloud está haciendo
> su ajuste ahora mismo y hay que darles tiempo.

## FASE 2 · La capa de datos con el país OBLIGATORIO

- [x] Paso 1: `src/lib/mercado/repositorio.ts` — el país como PRIMER argumento
      y obligatorio en el TIPO. `paraMercado(mercado)` devuelve el juego de
      consultas ya atado a ese país; pedir el catálogo sin país no compila.
- [x] Paso 2: Mover las consultas públicas del catálogo y del buscador a esa
      capa, sin cambiar su comportamiento (mismas pruebas en verde).
- [x] Paso 3: La prueba-muro (`tests/unit/muro-mercado.test.ts`): recorre las
      consultas de tablas con dimensión de país y FALLA si alguna va sin su
      filtro de mercado. **Se comprueba en ROJO** metiendo el fallo a propósito.
- [x] Paso 4: `pedidos.mercado` (columna + índice compuesto que empieza por
      ella) y que `crearPedido` lo escriba desde el mercado de la petición.
- [x] Paso 5: Aplicar el ALTER a la base local y a producción (aditivo, sin
      DROP ni DELETE), y comprobar que los pedidos viejos quedan en `US`.
- [x] Paso 6: Documentar en PLAN-PAISES.md qué es GLOBAL y qué es POR PAÍS,
      con la tabla definitiva.

## FASE 4 · El panel de administración por país

- [ ] Paso 7: El mercado del panel vive en la SESIÓN (cookie firmada por el
      servidor), NUNCA en un parámetro de la URL. `mercadoDelPanel()` con sus
      pruebas.
- [ ] Paso 8: El selector en el encabezado del panel (solo rol `soporte`) y la
      franja permanente cuando NO se está en el mercado principal.
- [ ] Paso 9: Que las consultas del panel (comercios, cuentas, órdenes,
      cobros, retiros) respeten ese mercado. El alcance del comercio manda por
      encima, como siempre.

## Chile de verdad (lo que no depende del dominio)

- [ ] Paso 10: Moneda por mercado (`src/lib/mercado/moneda.ts`): CL → CLP sin
      decimales, US → USD. El formateo del dinero sale de ahí, con pruebas.
- [ ] Paso 11: El alta de comercio guarda el mercado del dominio por el que
      entró, y el equipo lo puede corregir en Comercios.
- [ ] Paso 12: El copy de .cl sin «cobra en dólares» ni Estados Unidos (pie,
      hero y llamada a vender), bilingüe.

## Lo que depende del dominio — VA AL FINAL

- [ ] Paso 13: La imagen de la miniatura por mercado (`og-cl.png` que dice
      «Mercatren.cl») y que el layout sirva la del mercado.
- [ ] Paso 14: Matar las URL absolutas fijas: canónicos, sitemap, robots,
      `llms.txt` y los enlaces de los correos calculados POR PETICIÓN desde el
      host/mercado.
- [ ] Paso 15: Auditar el caché de OpenNext ruta por ruta — toda ruta cacheada
      cuya respuesta dependa del país lleva el país en la clave o se declara
      dinámica. Con su prueba.
- [ ] Paso 16: `npm run verify` completo, publicar, y comprobar EN VIVO el
      camino completo de un visitante en los DOS dominios.
