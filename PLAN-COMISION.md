# Plan: el margen de Mercatren pasa al 3 %

> Decidido por el dueño el 10 de agosto de 2026, después de comparar con el
> mercado: Amazon cobra 15 % en la mayoría de categorías (8 % en electrónica,
> con un rango de 5 % a 45 %), y Mercado Libre entre 11,8 % y 20 % según país y
> tipo de publicación. Mercatren estaba en 2 % con tarjeta.
>
> **La meta declarada es llegar a 8–10 % en menos de un año**, subiendo por
> tramos (3 % → 5 % → 6 % → …). Se arranca en 3 % y se avisa desde el primer
> día para que nadie se lleve una sorpresa.

## EL ORDEN NO ES NEGOCIABLE

Los 714 productos publicados tienen su precio calculado **con el 2 % adentro**:

```
Precio = (precio del comercio + $0.30) ÷ (1 − 2.9 % − margen)
```

Si se despliega el 3 % sin recalcular los precios, durante esa ventana el
precio sigue siendo el del 2 % y se descuenta el 3 %: **ese punto sale del
bolsillo del comercio, en silencio y en cada venta.** Es exactamente el fallo
que ya pasó del 5 al 7 de agosto de 2026.

Al revés, el error es nuestro y cuesta lo mismo: precio nuevo, descuento viejo,
y Mercatren cobra 1 % menos durante diez minutos.

**Por eso: primero los precios en la base, después el código.**

## Lo que cambia para cada uno

| Precio del comercio | Publica hoy (2 %) | Publica ahora (3 %) | Sube  | Mercatren gana  |
| ------------------- | ----------------- | ------------------- | ----- | --------------- |
| $30.91              | $32.82            | $33.17              | $0.35 | $0.66 → $1.00   |
| $100.00             | $105.47           | $106.59             | $1.12 | $2.11 → $3.20   |
| $500.00             | $526.08           | $531.67             | $5.59 | $10.52 → $15.95 |

**El comercio sigue recibiendo su precio completo.** La diferencia la paga el
comprador, y aun así el precio final queda muy por debajo de cualquier
plataforma comparable.

**Y por Zelle sigue siendo más barato para el comprador**, ahora con una
explicación más limpia que antes: el margen es el mismo 3 % en los dos métodos,
pero por Zelle no hay procesador. En $100: $103.10 contra $106.59.

## Los pasos

### Fase 1 — que el cambio no le cueste nada al comercio

- [x] Los 5 productos sin precio base resultaron ser **borradores en cero**:
      no hay nada que deducir y no se publican. No hacía falta tocarlos
- [x] Script que recalcula el precio publicado de los 714 productos con el 3 %,
      partiendo del precio base — nunca del publicado, que ya lleva el ajuste
- [x] Aplicarlo a producción y comprobar los totales antes y después

### Fase 2 — el código

- [x] `COMISION_TARJETA_PB` de 200 a 300, con el porqué escrito al lado
- [ ] Repasar todo lo que documenta el 2 % (`CLAUDE.md`, comentarios, textos
      públicos) para que no quede ni una cifra vieja contradiciendo a la nueva
- [x] Pruebas de la fórmula con los números nuevos

### Fase 3 — la tabla de comisiones, de cara al público

- [ ] Página pública comparando lo que cobra cada plataforma, con Mercatren
      arriba del todo por ser la más barata
- [ ] Decir **desde ya** que el porcentaje va a subir por tramos, con aviso
      previo y nunca sobre ventas ya hechas
- [ ] Bilingüe, en el mapa del sitio y enlazada desde donde se explica el
      modelo

### Fase 4 — que quede firmado

- [ ] Cláusula en los términos: el margen puede subir, con aviso previo, y
      nunca se aplica hacia atrás

### Cierre

- [ ] `npm run verify` en verde
- [ ] Comprobar en el navegador
- [ ] Documentar en `CLAUDE.md`
- [ ] Publicar y comprobar que quedó en verde
