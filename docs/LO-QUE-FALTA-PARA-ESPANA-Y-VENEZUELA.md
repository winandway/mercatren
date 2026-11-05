# Lo que falta para España y Venezuela

> Escrito el 5 de noviembre de 2026, por encargo de Gerencia. Aquí está todo
> lo que **no puede hacer el equipo de código**: lo que depende de Richard, del
> contador y del abogado. Cada punto dice qué es y por qué hace falta, en
> palabras simples.
>
> El detalle técnico, con las leyes y las fuentes, está en dos páginas aparte:
> `docs/paises/ESPANA-IMPUESTOS-Y-LEGAL.md` y
> `docs/paises/VENEZUELA-IMPUESTOS-Y-LEGAL.md`.

## Cómo estamos hoy

- **Venezuela** vende en su web (mercatren.com.ve) desde antes. En la app está
  preparada y **apagada**.
- **España** se puede mirar dentro de mercatren.com, pero **no cobra**. En la
  app está preparada y **apagada**.
- Nada se enciende sin el sí de Richard. Y hay un candado en el código: la app
  no deja encender un país si sus textos legales no están listos.

---

## VENEZUELA

### Lo que depende de Richard

1. **Decir sí para encender Venezuela en la app.**
   - _Por qué:_ el país está listo en el código, pero encenderlo es abrir una
     venta nueva. Antes, el equipo hace una compra real por la app, de punta a
     punta.
2. **Hacer la compra real final por la app**, con tarjeta (y con Zelle si se
   decide sumarlo a la app).
   - _Por qué:_ es la regla de la casa desde agosto: ningún cobro se anuncia
     sin probarlo entero, hasta ver el dinero entrar y el pedido avanzar.
3. **Decidir si Zelle entra a la app.** Hoy la app solo cobra con tarjeta;
   Zelle sigue en la web.
   - _Por qué:_ en Venezuela casi todo se paga por Zelle. Sin Zelle en la app,
     mucha gente va a seguir comprando por la web.
4. **Si el contador dice que Mercatren tiene que inscribirse en Venezuela**
   (ver abajo), decidir si se sigue igual o se cambia la forma de vender allá.
   - _Por qué:_ inscribirse allá significa declarar impuestos en Venezuela
     todos los meses. Es una decisión de negocio, no de código.

### Lo que depende del contador venezolano

1. **¿Mercatren tiene que inscribirse en Venezuela (el RIF) para revender?**
   - _Por qué:_ la ley del IVA de Venezuela cobra el impuesto donde está la
     mercancía, y la mercancía está en Venezuela. Si la respuesta es sí,
     Mercatren tendría que facturar y declarar allá. **La venta de la web ya
     está abierta, así que este riesgo existe hoy.**
2. **¿Ya está fijado el IVA extra por pagar en dólares?** La ley de 2020 creó un
   IVA adicional de entre 5 y 25 por ciento para lo que se paga en divisas, y
   no encontramos el decreto que diga cuánto es.
   - _Por qué:_ en Mercatren todo se paga en dólares. Si ese IVA extra está
     vigente, cambia el precio.
3. **Si algún comercio es «contribuyente especial»: ¿quién paga el 3 % del
   impuesto a las transacciones (IGTF) cuando Mercatren le paga?**
   - _Por qué:_ si nadie lo prevé, lo absorbe el comercio sin saberlo o se lo
     cobra a Mercatren después. Al comprador no le toca.

### Lo que depende del abogado

1. **Revisar la sección de Venezuela de los términos y de la privacidad.**
   - _Por qué:_ hasta hoy, mercatren.com.ve enseñaba los términos de Estados
     Unidos, que dicen «vendemos y entregamos únicamente dentro de Estados
     Unidos». Con la venta abierta, eso contradice lo que de verdad pasa.
     **Por orden de Gerencia, la sección de Venezuela ya se publicó el 5 nov
     2026 sin revisar** (es mejor que lo que había). El abogado la revisa y, si
     cambia algo, se corrige. Mientras no la revise, la app no se enciende en
     Venezuela.
2. **¿Tiene que inscribirse Mercatren en el registro de la SUNDDE (RUPDAE)?
   ¿Le aplica la Ley de Precios Justos?**
   - _Por qué:_ esa ley dice que aplica también a extranjeros que venden en
     Venezuela por internet. No bloquea hoy, pero hay que saberlo.

---

## ESPAÑA

### Lo que depende de Richard

1. **Registrar a Mercatren LLC en el IVA de España, con un representante
   fiscal.**
   - _Por qué:_ en España, quien vende a un consumidor cobra el IVA (21 %) y lo
     paga a Hacienda. Una empresa de Estados Unidos sin oficina en Europa
     **tiene que nombrar un representante fiscal en España**: la ley solo
     exceptúa a Noruega. Sin ese registro, Mercatren pagaría el IVA dos veces
     (el que le cobra el comercio y el suyo).
2. **Contratar el representante en Europa para los datos personales** (lo pide
   el reglamento europeo de protección de datos).
   - _Por qué:_ una empresa de fuera de Europa que vende a personas en Europa de
     forma habitual tiene que tener ese representante. Lo ofrecen despachos
     como servicio.
3. **Decidir qué dirección y qué teléfono de la empresa se publican.**
   - _Por qué:_ la ley española obliga a que la tienda muestre quién vende, con
     su dirección, teléfono y número fiscal. Hoy la regla de la casa es no
     publicar la dirección: hay que decidir cuál se muestra.
4. **Decidir quién paga el envío de vuelta cuando alguien se arrepiente** (el
   comprador o Mercatren).
   - _Por qué:_ en España el comprador tiene 14 días para arrepentirse sin dar
     motivos. La ley deja que ese envío de vuelta lo pague él, pero solo si se
     le avisó antes.
5. **Decidir el margen de España.**
   - _Por qué:_ con la fórmula de hoy, el IVA que Mercatren paga sobre su
     propio margen se come cerca de un tercio de lo que gana, y con la tarjeta
     europea (que cuesta más) **la venta da pérdida**. Hay que subir el margen
     antes de encender.
6. **Decir en cuántos días se contesta un reclamo** (por ejemplo, 10).
   - _Por qué:_ la ley pide decirlo en las condiciones.
7. **Decir sí para encender España**, después de lo anterior y de una compra
   real en euros.

### Lo que depende del contador (y la gestoría en España)

1. **Darse de alta y sacar el número fiscal español** (formularios 030 y 036
   de Hacienda).
   - _Por qué:_ sin ese número no se puede facturar con IVA ni descontar el IVA
     que cobra el comercio.
2. **Presentar el IVA cada tres meses y el resumen del año** (modelos 303 y
   390), desde el alta, aunque no haya ventas.
   - _Por qué:_ es obligatorio desde que uno se da de alta.
3. **Opinar sobre DAC7** (una declaración de plataformas, modelo 238), antes de
   cerrar el primer año con ventas.
   - _Por qué:_ como Mercatren le compra al comercio y revende, se puede
     sostener que no es una «plataforma», pero el comercio publica su catálogo
     en Mercatren. Mejor tener la opinión por escrito.

### Lo que depende del abogado

1. **Revisar las secciones de España de los términos, la privacidad y las
   devoluciones.** Ya están escritas, con la ley de cada frase: quién vende,
   los 14 días para arrepentirse con su formulario, la garantía de 3 años, los
   tribunales del consumidor, el representante en Europa y la agencia de
   protección de datos.
   - _Por qué:_ los términos de hoy son los de Estados Unidos («se rigen por
     las leyes de Estados Unidos»), y para un consumidor español esa cláusula no
     vale. No se publican hasta tener los datos de Richard y el visto bueno del
     abogado.
2. **Decir si hacen falta las hojas de reclamaciones** de alguna comunidad
   autónoma.
   - _Por qué:_ son de cada comunidad, y para una tienda sin local en ninguna
     no está claro que apliquen.

---

## Lo que el equipo de código hace solo (no depende de nadie)

Por orden de Gerencia, en marcha: la sección de devoluciones de España, el
texto del botón de pagar, los datos del fabricante en la ficha (lo pide el
reglamento europeo de seguridad de productos), las facturas con el IVA de
España, el botón «Desistir del contrato aquí» en «Mis pedidos», y el precio
equivalente en bolívares junto al precio en dólares.
