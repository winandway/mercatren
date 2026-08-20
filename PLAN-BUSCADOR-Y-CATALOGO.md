# Plan: que el catálogo de Estados Unidos se pueda buscar en español

> Escrito el 19 de agosto de 2026, con el catálogo de CJ ya publicado y las
> ventas de Estados Unidos en pausa. Todo lo que dice este documento está
> **comprobado en el código**, no supuesto — cada bloque nombra el archivo y la
> línea donde vive el problema.
>
> **ESTADO AL 19 AGO 2026, 01:30 — ejecutado en piloto automático.**
> ✅ hecho · ⚠️ queda, con su motivo escrito abajo · ❌ sin empezar
>
> **Las ❌ son lo que falta.** Cuando algo se termina, se cambia por ✅ en el
> mismo trabajo. Una lista desactualizada miente igual que un panel que dice
> «En vivo» con el sitio caído.

---

## Los tres problemas, en una línea cada uno

| # | Qué se ve | Qué es de verdad |
| - | --------- | ---------------- |
| 1 | Buscar «repuestos» no encuentra nada | Los 78 productos están **en inglés**, hasta en el campo de español |
| 2 | Las bicicletas salen en «Repuestos de carro» | La palabra **«tire»** manda a repuestos, y se prueba antes que deportes |
| 3 | Una venta deja $0.82 en vez de $3.09 | El precio se calculó con el **envío en CERO** |

**El tercero es el único que cuesta dinero de verdad, y por eso va primero.**

---

# BLOQUE A · El precio no lleva el envío dentro

> **Es el más urgente y no es opinable: cada venta que entre hoy deja menos de
> un tercio de lo que debería.**

La causa está en una sola línea, `src/lib/cj/catalogo.ts:194`:

```
const precio = desglosarUs(costo, 0);
```

Ese `0` es el costo del envío. En la pantalla del buscador de CJ está bien —ahí
se enseña un precio mínimo y la pantalla lo dice—, pero **el mismo cálculo es el
que se guarda al publicar el producto**, y ahí ya no es una estimación: es el
precio que paga el comprador.

Medido con la primera compra real (MT-000004): el envío costó **$1.57**, no los
$4–7 que yo había estimado. Con el margen del 30 % declarado, un producto que
debería dejar $3.09 deja **$0.82**.

- [ ] ⚠️ **A1 · Medir el envío de verdad, no estimarlo.** Hacer 3 compras de
      prueba de productos distintos (uno chico, uno mediano, uno pesado) y
      anotar el `postageAmount` real que devuelve CJ. Con una sola medición no
      se puede sacar una regla.
- [x] ✅ **A2 · Decidir el modelo de envío.** Tres caminos y hay que elegir uno:
      (a) preguntar el flete real a CJ producto por producto al publicarlo —
      exacto pero lento y una llamada más por producto; (b) una tarifa plana por
      tramo de peso; (c) un promedio único. **Recomendación: (a) al publicar,
      guardado en el producto.** Se paga el costo una sola vez, en el momento en
      que el precio se fija.
- [x] ✅ **A3 · Guardar el costo del envío en el producto.** Hoy no se guarda en
      ningún lado, así que no se puede recalcular sin volver a preguntarle a CJ.
      **Tabla nueva o columna nueva** — y ojo con la regla del proyecto: una
      columna nueva NO llega sola a producción con `schema.sql`.
- [x] ✅ **A4 · Recalcular los 78 productos publicados.** Con el mismo orden que
      manda `PLAN-COMISION.md`: primero se recalculan los precios, después se
      cargan, y recién entonces se despliega. Al revés, la diferencia sale de
      nuestro bolsillo.
- [x] ✅ **A5 · Prueba en rojo.** Una prueba que falle si alguien vuelve a
      publicar un producto con el envío en cero. Se comprueba metiendo el fallo
      a propósito.

---

# BLOQUE B · Las bicicletas están en la tienda equivocada

La causa exacta, en `src/lib/cj/departamento.ts:83`: el departamento
`repuestos-carro` captura la palabra **`tire`**, y la lista se recorre de arriba
abajo (`línea 383`), así que gana antes de llegar a `deportes-aire-libre`
(línea 226), que es donde sí están `bicycle` y `cycling`.

Toda bicicleta de rueda gruesa de CJ se llama **«Fat Tire Bike»**. Todas caen en
repuestos de carro.

Y hay una segunda, del mismo tipo: `repuestos-carro` también captura **`truck`**,
así que el «**Hand Truck**» —que es una carretilla de almacén— aparece como
repuesto de carro.

Es exactamente el mismo error que ya está documentado con «card» y «car»: una
palabra que dentro de un contexto significa otra cosa.

- [x] ✅ **B1 · «tire» solo cuenta si no hay una bicicleta cerca.** La regla no
      puede ser quitar `tire` a secas —un neumático de carro sí es un repuesto—:
      hay que comprobar primero si el texto dice `bike`, `bicycle` o `cycling`.
      Lo mismo con `hand truck` contra `truck`.
- [x] ✅ **B2 · Crear el departamento de bicicletas.** Hoy hay **25 departamentos
      y ninguno es de bicicletas**. Sin él, el sistema de una tienda por rubro
      no puede darles tienda propia, porque la tienda se deriva del
      departamento (`src/lib/cj/rubros.ts:48`).
- [x] ✅ **B3 · Decidir qué entra en ese departamento.** Bicicletas de adulto,
      de niño, eléctricas, y los accesorios (inflador, casco, candado, sillín).
      **Las de niño van ahí y no en «Bebés y niños»**: quien busca una bicicleta
      para su hijo la busca entre bicicletas.
- [x] ✅ **B4 · Pruebas con los títulos REALES de CJ.** No con ejemplos
      inventados: con «S26109 Elecony 26 Inch Fat Tire Bike Youth Full Shimano
      21 Speed», «Professional Electric Bike For Adults, 26 X 4.0 Inches Fat
      Tire» y «Hand Truck, 600 Lbs Load Capacity». Si la prueba usa ejemplos de
      laboratorio, no protege de nada.
- [ ] ⚠️ **B5 · Repartir lo que ya está mal colocado.** El botón «Repartir por
      rubro» del panel ya existe y **mueve, no copia** — conserva dirección,
      fotos y precio. Se pulsa después de B1 y B2.
- [ ] ⚠️ **B6 · Revisar los otros 78 a ojo.** Con dos fallos encontrados en una
      pantalla, es seguro que hay más. Una pasada por el panel mirando el
      departamento de cada uno, que son 78 y se hace en veinte minutos.

---

# BLOQUE C · El buscador en español (el problema grande)

**El buscador NO está roto.** Comprobado en `src/lib/catalogo/buscar.ts:102`:
busca en título español, título inglés, descripción, marca, SKU y categoría.
Funciona.

Lo que pasa es que **el dato está en inglés**. Al importar de CJ se guarda el
título en inglés **en los dos campos**, el de inglés y el de español. Así que
buscar «repuestos» no encuentra nada porque en la base no existe esa palabra en
ninguna parte: dice «Auto Parts».

**Esto no es un detalle de acabado: es el producto entero.** Mercatren vende al
mercado hispano de Estados Unidos y a Latinoamérica. Un catálogo que solo se
puede buscar en inglés no le sirve a la persona para la que se hizo.

### C.1 — La traducción

- [x] ✅ **C1 · Decidir quién traduce.** Recomendación: **modelo de texto barato**
      (`gemini-2.5-flash` o Groq, los dos aprobados por la regla de la casa). El
      costo es de centavos: un título con su descripción son ~200 fichas, así
      que 10.000 productos cuestan menos de un dólar. **Los modelos de imagen
      caros siguen bloqueados; esto es texto y no los toca.**
- [x] ✅ **C2 · Aclarar por qué esto NO rompe la regla de «no se inventan
      traducciones».** Esa regla existe para el catálogo de los comercios
      venezolanos: no se le pone en la boca a un comerciante una descripción que
      él no escribió. **En el catálogo de Estados Unidos el vendedor es Mercatren
      LLC** — la ficha es nuestra, y traducirla es escribir nuestro propio texto.
      Hay que dejarlo escrito en `CLAUDE.md` o el próximo que lea la regla la
      aplicará donde no toca.
- [x] ✅ **C3 · Traducir el título.** Y no traducir palabra por palabra: los
      títulos de CJ vienen cargados de palabras sueltas para su buscador
      («S24109 Elecony 24 Inch Fat Tire Bike Youth Full Shimano 7 Speed»). Hay
      que **reescribirlos como los escribiría una tienda**, no traducirlos.
- [ ] ⚠️ **C4 · Traducir la descripción.** Hoy muchas fichas son de dos líneas, y
      eso ya está costando: hay 28 páginas en Search Console marcadas como
      «rastreada, actualmente sin indexar» justo por eso.
- [x] ✅ **C5 · Guardar los dos idiomas de verdad.** `titulo_es` en español y
      `titulo_en` en inglés, cada uno con lo suyo. Hoy los dos tienen el inglés.
- [x] ✅ **C6 · Que el importador no vuelva a publicar en inglés.** El candado va
      **en el momento de agregar el producto**, no en una limpieza posterior. Si
      no, dentro de un mes estamos igual con 3.000 productos en vez de 78.
- [ ] ⚠️ **C7 · Traducir los 78 que ya están.** Una corrida por tandas, con barra
      de avance, que se pueda parar y retomar — igual que el botón que trae las
      fotos al bucket. Y **idempotente**: que solo toque los que aún están en
      inglés.

### C.2 — Que el buscador entienda cómo habla la gente

Traducir no alcanza. La misma cosa se llama distinto en cada país, y quien no
encuentra a la primera se va.

- [x] ✅ **C8 · Sinónimos por concepto.** «repuesto» = «autoparte» = «parte» =
      «pieza» = «refacción» (México). «llanta» = «caucho» (Venezuela) = «goma»
      = «neumático». «celular» = «móvil». «computadora» = «ordenador» = «PC».
      Sin esto, media clientela busca la palabra de su país y no encuentra nada.
- [x] ✅ **C9 · Singular y plural.** «repuesto» tiene que encontrar «repuestos» y
      al revés. Hoy la búsqueda es por texto contenido, así que «repuestos» no
      encuentra «repuesto».
- [x] ✅ **C10 · Los acentos ya se ignoran — comprobarlo, no suponerlo.** Hay una
      función `normalizar` en el buscador; hace falta una prueba que confirme
      que «bateria» encuentra «batería».
- [x] ✅ **C11 · Buscar también por número de parte.** Es lo que de verdad se
      escribe cuando se busca un repuesto, sobre todo desde Venezuela. Ya se
      busca en el SKU; falta comprobar que el número de parte de CJ llegue ahí.
- [x] ✅ **C12 · Cuando no hay resultados, no dejar la pantalla vacía.** Hoy dice
      «No encontramos nada para "repuestos"» y ahí muere. Debe ofrecer el
      departamento más cercano, o los productos más vistos. Una pantalla vacía
      es una venta perdida y una persona que no vuelve.

---

# BLOQUE D · SEO en español

Todo lo del bloque C sirve para el buscador de adentro. Esto es para que la
gente **llegue** desde Google, que es de donde viene quien todavía no nos
conoce.

- [ ] ⚠️ **D1 · La dirección del producto en español.** Un producto que se llama
      «Winch Straps» vive hoy en una dirección en inglés. **Ojo: una dirección
      que ya está en Google no se cambia sin más** — si se cambia, hay que dejar
      una redirección o se pierde lo indexado.
- [x] ✅ **D2 · Título y descripción de la página, en español.** Hoy salen del
      título del producto, así que salen en inglés.
- [x] ✅ **D3 · El archivo que se le manda a Google.** `/datos/google` manda hoy
      **el catálogo entero, incluidos los productos venezolanos**, que no se
      pueden entregar en Estados Unidos. Eso es causa de suspensión en Merchant
      Center. Hay que separarlo por mercado.
- [ ] ⚠️ **D4 · Un archivo por idioma.** Merchant Center acepta el mismo producto
      en español y en inglés; hoy solo va uno.
- [ ] ⚠️ **D5 · Las palabras que se quieren posicionar, por departamento.** No es
      lo mismo posicionar «repuestos de carro en Estados Unidos» que «bicicletas
      para niños». Cada departamento necesita las suyas, y van en `SEO.md`.

---

# BLOQUE E · Que no vuelva a pasar (los candados)

> Sin este bloque, los otros cuatro se deshacen solos en un mes. Es el que menos
> se ve y el que más ahorra.

- [x] ✅ **E1 · No se publica un producto sin título en español.** Comprobado en
      el servidor, no en el formulario.
- [x] ✅ **E2 · No se publica un producto con el envío en cero.**
- [x] ✅ **E3 · No se publica un producto sin departamento.** Hoy uno que no se
      reconoce se deja sin colgar, que está bien para navegar pero lo hace
      invisible para quien filtra.
- [x] ✅ **E4 · Una prueba de las palabras trampa.** «tire» en una bicicleta,
      «truck» en una carretilla, «card» en una cartera. Cada trampa que se
      encuentre se agrega ahí, para que la lista crezca con lo aprendido y no
      con lo imaginado.
- [x] ✅ **E5 · Una prueba de humo del buscador en español.** Que busque
      «repuestos», «bicicleta» y «herramientas» contra el catálogo real y exija
      que devuelvan algo. Es la red mínima: si alguien vuelve a publicar en
      inglés, salta ahí.

---

# BLOQUE F · Lo que hay que resolver antes de vender (no es de buscador)

Esto no lo pediste en este plan, pero va aquí para que la lista sea la lista
completa y no haya sorpresas el día que llegue el saldo.

- [ ] ❌ **F1 · Las tallas y colores.** La ficha publica cada producto como una
      sola cosa. El sistema elige la variante más barata al comprar y lo avisa
      en ámbar, pero **el comprador nunca eligió**. Con ropa y calzado eso es
      una devolución garantizada.
- [ ] ❌ **F2 · Quitar la pausa de las ventas de Estados Unidos.** Es una línea
      (`EN_PAUSA = false`), pero antes hay que poder despachar de verdad: saldo
      en CJ y una compra completa que llegue.
- [ ] ❌ **F3 · Un carrito no puede mezclar destinos.** Lo de EE. UU. se entrega
      allá y lo de Venezuela se retira allá. La función que lo decide
      (`cabenJuntos()`) **ya existe y todavía no está puesta** en el carrito ni
      en el checkout.
- [ ] ❌ **F4 · La página de la política de devoluciones**, con la dirección de
      Novi, para Merchant Center.

---

## El orden en que yo lo haría

1. **BLOQUE A** — es dinero, y cada día que pasa se vende barato.
2. **BLOQUE B** — es de una tarde y arregla algo que se ve feo hoy mismo.
3. **BLOQUE C** — es el grande y el que de verdad cambia el negocio.
4. **BLOQUE E** — pegado al C, no después: los candados se ponen mientras se
   arregla, o no se ponen nunca.
5. **BLOQUE D** — cuando el catálogo ya esté en español, porque el SEO se
   alimenta de eso.
6. **BLOQUE F** — cuando llegue el saldo.

**A y B se pueden hacer sin esperar a nadie.** C depende de decidir el modelo de
traducción. F depende de que Payoneer apruebe la cuenta.

---

# LO QUE QUEDÓ FUERA, Y POR QUÉ (19 ago 2026)

> Nada de esto se dejó por falta de tiempo. Cada uno tiene un motivo, y el
> motivo es que **no se puede cerrar desde el código**.

## Necesitan dinero o una decisión del dueño

- **⚠️ A1 · Medir el envío con tres compras reales.** Hoy el respaldo son $3.50,
  sacados de UNA medición ($1.57 en MT-000004) más colchón. Hacen falta dos o
  tres compras más, de productos de distinto peso, para que ese número deje de
  ser una suposición. **Cuesta dinero de verdad y sale de la billetera de CJ,
  que está en cero hasta que Payoneer apruebe.**

- **⚠️ C7 · La llave del traductor.** Todo está construido y probado: el botón,
  las tandas, los candados. Falta pegar `TRADUCCION_LLAVE` en las variables del
  sitio, y esa llave la saca el dueño en `https://aistudio.google.com/apikey`.
  Sin ella el botón dice exactamente qué falta, y el catálogo se queda en
  inglés — que es lo correcto: nunca se inventa una traducción.

## Son pulsar un botón del panel, contra la base de producción

Están construidos y esperando. **No se disparan desde aquí a propósito**: la
base de producción no se toca desde una computadora sin que una persona lo
pida.

- **⚠️ B5 · Repartir por rubro**, para mover las bicicletas ya publicadas a su
  tienda nueva. Panel → Catálogo de EE. UU. Mueve, no copia: conserva
  dirección, fotos y precio.
- **⚠️ B6 · Repasar los 78 a ojo.** Con dos trampas encontradas en una sola
  pantalla, es seguro que hay más. Son 78 y se hace en veinte minutos.
- **⚠️ D1 · La dirección del producto en español.** Depende de que los títulos
  estén traducidos primero, y **una dirección que ya está en Google no se
  cambia sin dejar una redirección** o se pierde lo indexado.

## Es trabajo de otro bloque

- **⚠️ D4 · Un feed por idioma** para Merchant Center. Antes hay que tener los
  títulos en español, o serían dos feeds diciendo lo mismo en inglés.
- **⚠️ D5 · Las palabras a posicionar por departamento.** Va en `SEO.md` y es
  trabajo de marketing, no de código.

## Bloque F entero: no depende de esto

**F1 (tallas y colores), F2 (quitar la pausa), F3 (un carrito no puede mezclar
destinos) y F4 (la página de devoluciones)** siguen igual que estaban. F2 es
además una decisión del dueño que exige poder despachar de verdad, y eso pasa
por el saldo de CJ.
