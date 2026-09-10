# Todo lo que queda pendiente en Mercatren

> **Este es EL documento.** Cuando preguntes «¿qué falta?», se contesta desde
> aquí y por bloques, en orden — no desde ningún otro archivo.
>
> Los planes por tema (`PLAN-CONTABILIDAD.md`, `PLAN-BUSCADOR-Y-CATALOGO.md`,
> `SEO.md`, `PLAN-PAISES.md`, `PLAN-COMISION.md`) siguen existiendo con el
> detalle y el porqué de cada punto. Aquí está **la lista completa**, para que
> no se pierda ninguno entre siete archivos.
>
> **La regla que manda:** primero lo formal y lo legal, después lo que crece.
> Un negocio que factura mal no se arregla creciendo — se arregla parando.
>
> 🔴 urgente · 🟠 importante · 🟡 cuando se pueda
> 👤 solo lo puede hacer Richard · 💻 es código

Última revisión: **2 de septiembre de 2026**.

---

# BLOQUE 1 · LO LEGAL Y LO FISCAL

Lo más urgente de todo el proyecto. Nada de lo de abajo importa si esto falla.

- [ ] 🔴 👤 **Preguntarle a Mercury, POR ESCRITO, si ejecutan wires a
      Venezuela** y bajo qué condiciones. Cinco minutos, y de la respuesta
      depende que un comercio venezolano pueda cobrar. Hoy no hay respuesta y
      se le está prometiendo el pago a gente.
- [ ] 🔴 👤 **Windoce, LLC: tres miembros y sin declarar desde 2023.** Al
      contador ya. Con tres miembros la multa del 1065 se cuenta **por mes y
      por miembro**. Puede ser lo más caro de esta lista entera.
- [ ] 🔴 👤 **Sales tax / economic nexus.** Hoy se cobra **cero** en todas las
      ventas (`pedidos/acciones.ts:422`, un cero literal) y nunca se evaluó.
      Con las ventas de EE. UU. en pausa, este es el momento barato.
- [ ] 🔴 👤 **La cuenta 850 de Xero** («Customer funds to be liquidated»)
      contradice los términos publicados. Al contador con la pregunta escrita.
- [ ] 🔴 👤 **Cierre de Windoce y apertura de Mercatren**, con la advertencia
      de que **los $337 mil del histórico NO son de ninguna de las dos**: son
      de la tienda anterior de Bley.
- [ ] 🔴 👤 **REGENERAR EL PDF DEL MODELO DE NEGOCIO.** El archivo que había
      publicado decía **«Windoce, LLC» 54 veces** y empezaba con «Mercatren es
      una tienda en línea operada por Windoce, LLC». Es el documento que se le
      manda a un banco o a un procesador cuando piden «muéstrame cómo
      funciona». **La descarga se retiró el 22 ago 2026**; la versión web de
      `/docs/modelo-de-negocio` está actualizada y correcta, así que nadie se
      queda sin nada — falta solo la versión imprimible. **Regenerarlo pasa por
      el abogado**, que fue quien revisó el original.
- [ ] 🟠 👤 **Los acuerdos de compraventa con cada comercio.** Los redacta el
      abogado. Tienen que decir **quién asume devolución y contracargo** (hoy
      no está escrito y en la práctica lo asume Mercatren) y **que la entrega
      ocurre en el país del comercio**.
- [ ] 🟠 👤 **Las tres cuentas de Xero:** puente de Stripe, costo de mercancía
      y comisiones de procesador — separadas, que son dos dueños distintos.
- [ ] 🟠 👤 **Cobrar las dos facturas pendientes** de Inversiones
      Multiservicios: $27.74 y $30.91.
- [ ] 🟠 👤 **La línea sobre Deea International:** qué hace ella que Mercatren
      no pueda. Sin eso escrito, no se monta.
- [ ] 🟠 👤 **¿Hay países a los que directamente no se les abre cuenta?** La
      lista del formulario fiscal trae **los 225 países que existen**, incluidos
      los sancionados (Cuba, Irán, Corea del Norte, Siria). Eso es correcto —no
      es una lista de a quién se le puede pagar, y quién recibe dinero lo
      deciden Mercury y OFAC—, pero **falta decidir si el alta de comercios se
      cierra para alguno**. Es pregunta para el abogado, no para el código.
- [ ] 🟡 👤 **El informe anual de Michigan vence el 15 feb 2027.** Si se pasa,
      la LLC pierde el «Good Standing» y con eso se caen Payoneer, Merchant
      Center y potencialmente Mercury.
- [ ] 🟡 💻 **Cláusula en los términos: el margen puede subir**, con aviso
      previo (`PLAN-COMISION.md`).

### 6 sep 2026 · las fotos se descargan con nombre al azar

- [x] ✅ 💻 **Las fotos nuevas se llaman como el producto y cada una dice
      qué se ve** (6 sep 2026, el mismo día). `slug-N-6letras.webp` desde el
      formulario y desde el copiador de CJ; casilla «Qué se ve» en los dos
      idiomas por foto; lo ya subido no se toca. Falta 👤 volver a subir las
      4 fotos del POS de QRBott para que salgan con el nombre nuevo.

### 8 sep 2026 · Miles de fichas sin stock por talla, y las descripciones

- [x] 💻 **2.642 fichas a la venta con todas sus tallas en cero** (863 CO ·
      1.779 US): las variantes se guardaban con `existencias: 0` fijo.
      Arreglado el guardado, el refresco y el barrido; candado en rojo.
- [x] 💻 **El lector de stock inventaba 1 por talla** (`inventoryNum` no se
      leía): 1.771 fichas en EE. UU. y 859 en Colombia con stock igual a su
      número de tallas, y el checkout cobrando fiado en ese 1. Sin dato es
      CERO desde hoy; candado en rojo.
- [x] 💻 **El barrido retiró las 2.643 el mismo día** (864 CO · 1.779 US,
      16:21). Lo que queda a la venta es todo comprable: CL 1.245 · CO
      3.247 · US 1.609. Cero fallos anotados.
- [ ] 🟠 💻 **Que vuelvan a la venta con stock real**: están en revisión;
      el afinado y el refresco les escriben el stock verdadero de cada
      talla a medida que CJ contesta (20 puntos por producto). Medir en
      dos días cuántas volvieron a `publicado` con alguna talla > 0.
- [x] 💻 **El traductor de descripciones hacía ~50 al día**: el latido de
      cada minuto pedía cero tandas de descripciones. Ahora traduce una por
      latido. Medir en dos días: tiene que pasar de decenas a cientos.
- [ ] 🟠 💻 **1.245 fichas de Chile sin descripción en NINGÚN idioma**: la
      importación no la trajo. Un traductor no arregla lo que no existe;
      hay que pedirle a CJ la descripción de cada una (cuesta puntos).
- [ ] 🟡 👤 **Fotos «de otras empresas»**: por origen no es masivo (4 URLs
      ajenas de 8.744). Si Richard se refiere a marcas o logos DENTRO de la
      foto de CJ, eso no se detecta por consulta: hace falta que mande dos
      ejemplos para ver qué es exactamente.

### 9 sep 2026 · Los monitores a la cabeza, variedad, y los puntos bien leídos ✅

- [x] 💻 Lista de prioridad del afinado + acción «priorizar» en la puerta;
      orden variado por departamento; foto en «mirar».
- [x] 💻 Con sesión del equipo, el buscador encuentra lo «en revisión» y la
      ficha abre con aviso y sin botón de comprar.
- [x] 💻 Los dos monitores de ESTUDIO de EE. UU.: CJ devolvía el flete en
      $0; publicados con flete manual de $40 el par ($239,19 y $239,08).
      Richard puede cambiar ese envío pidiéndolo.
- [ ] 🟠 👤 **Colombia no puede tener monitores de estudio con CJ**: los dos
      únicos que existen están solo en el almacén de EE. UU. (con
      `countryCode=CN` CJ devuelve lista vacía) y Colombia se surte de
      China. Para atender esa demanda hace falta otro proveedor. Decisión
      de Richard.
- [ ] 🟠 💻 **Miles de fichas de EE. UU. reciben flete $0 de CJ** («sin
      precio válido en 5: UPS…=0, GOFO…=0, Fedex…=0»): la cola avanzó 28
      en 6 h. Medir cuántas son y decidir si se publican con flete manual o
      se marcan «sin flete cotizable» para no volver a gastar puntos en ellas.
- [ ] 🟠 👤 **Richard: ¿mover los $200 de Payoneer a CJ?** Solo da más
      puntos lo que se COMPRA (100 puntos/día por cada $1 de pedidos del
      mejor mes de los últimos tres). El saldo sirve para que las compras
      se paguen solas; no sube el presupuesto de API por sí mismo.

### 8 sep 2026 · «¿Sin precio o sin stock?» ya se mide ✅

- [x] 💻 El vigilante cuenta publicados sin stock (por talla) y sin precio
      por plaza; salen en `/datos/salud` y en el panel del Vigilante.
- [ ] 🟡 💻 Si alguna plaza da un número distinto de cero de forma
      sostenida, buscar la causa: el barrido retira lo de CJ sin talla
      comprable cada latido, así que un «sin stock» que persista es de un
      comercio o de un producto sin tallas con existencias en cero.

### 8 sep 2026 · Aviso crítico de Next (solo Windows) 🟠

- [ ] 🟠 💻 **Subir Next de 16.2.12 a 16.3.4** (GHSA-p293-qw3h-jr36: RCE
      solo en servidores sobre Windows; aquí es Cloudflare Workers, no
      aplica, y quedó anotado en `scripts/auditoria.ts`). OpenNext 1.20.2
      acepta `>=16.2.11`. Hacerlo en su propio commit con `npm run verify`
      **y** `npm run cf:build`, leyendo antes las notas de la 16.3 en
      `node_modules/next/dist/docs/`.

### 8 sep 2026 · Las retiradas del barrido vuelven solas ✅

- [x] 💻 Los «casi listos» (retirados con flete real) van primero en el
      refresco de stock, a 4 por latido; el barrido los publica al leer
      stock real. Mochila de Richard: 3 variantes con stock en CJ.
- [ ] 🟠 💻 **Medir mañana** en `/datos/salud` → `reloj.ultimo.hizo`:
      «casi listos por mirar» tiene que bajar de ~2.642 a cero, y
      `catalogo.US.aLaVenta` subir desde 1.609.
- [x] 💻 El afinado llevaba un día en «0 ok, fallidos»: la ropa que CJ no
      cotiza volvía siempre a la cabeza, y GitHub chocaba con el reloj en
      CJ. Arreglado el orden y la colisión.
- [ ] 🔴 💻 **Mañana 9 sep, después de las 16:10 UTC (CJ reabre puntos):**
      leer en `/datos/salud` → `reloj.ultimo.hizo` el «último fallo: flete:
      sin precio válido en N: …» con los transportes y precios crudos, y
      decidir qué hacer con las prendas que CJ no cotiza desde su almacén
      de EE. UU. Y confirmar que «afinado: N ok» ya no es cero.

### 8 sep 2026 · Zelle al 6 % ✅

- [x] 💻 `COMISION_ZELLE_PB = 600`; tarifa pactada guardada por cobro para
      no tocar los 13 abiertos; textos y pruebas al día.
- [ ] 🟠 💻 **Probar de punta a punta el primer cobro por enlace pagado por
      Zelle al 6 %** (crear → pagar → acreditar) y anotarlo en
      VERIFICAR-PAGOS. En unidad está; en dinero real, no todavía.
- [ ] 🟡 👤 **Decidir si la tarjeta se queda en 3 %.** Con Zelle al 6 %, por
      encima de ~$282 de base la tarjeta le sale más barata al comprador y
      Mercatren gana menos ahí. Es decisión de negocio.

### 7 sep 2026 · Venezuela ya vive en mercatren.com.ve ✅

**HECHO.** El DNS apuntó y el dato se movió el mismo día: **6 comercios y
1.197 productos** en el catálogo de Venezuela. mercatren.com quedó con cero
productos venezolanos y sin selector de ciudad; mercatren.com.ve con su
hero de retiro, sus ciudades y sus comercios. Comprobado en el sitio
publicado, no supuesto.

- [x] 👤 DNS de `mercatren.com.ve` apuntado y dominio añadido al sitio.
- [x] 💻 Mudanza del dato (`scripts/mudar-venezuela.ts`, con marcha atrás).
- [x] 💻 **El país dejaba pasar seis formas del mismo dato** y la primera
      pasada movió 1 comercio de 6. Normalizados los 8 de producción y
      cerrado en el servidor (`codigo-de-pais.ts`).
- [x] 💻 **Las mil fichas no redirigían**: el middleware pedía la lista por
      red y fallaba en silencio. Ahora va escrita en `mudados.ts`.

Lo que queda:

- [x] 👤 Dar de alta `mercatren.com.ve` en Search Console y enviar su mapa
      (hecho el 7 sep; el índice quedó en «Correcto»).
- [ ] 🟠 👤 **Volver a enviar el mapa de Venezuela** ahora que declara las
      fichas en español: hasta hoy las declaraba TODAS en inglés. Y de paso
      enviar los cuatro hijos por separado, que Google los lee directo sin
      esperar a procesar el índice:

      ```
                                                                                                                                              https://mercatren.com.ve/mapa/productos-0.xml
                                                                                                                                              ```

                                                                                                                                              ```
                                                                                                                                              https://mercatren.com.ve/mapa/paginas.xml
                                                                                                                                              ```

                                                                                                                                              ```
                                                                                                                                              https://mercatren.com.ve/mapa/tiendas.xml
                                                                                                                                              ```

                                                                                                                                              Lo de antes, que ya no aplica:

                                                                                                                                              ```
                                                                                                                                                      https://mercatren.com.ve/sitemap.xml
                                                                                                                                                      ```

                                                                                                                                                      **NO se usa la herramienta «Cambio de dirección»**, y esto se
                                                                                                                                                      comprobó en la documentación de Google el 7 sep 2026 antes de
                                                                                                                                                      recomendarlo: esa herramienta es **solo para propiedades de dominio
                                                                                                                                                      completo** y le diría a Google que TODO mercatren.com se mudó a
                                                                                                                                                      mercatren.com.ve — cuando el .com sigue vivo con Estados Unidos. Sería
                                                                                                                                                      tirar el posicionamiento de toda la plaza grande para arreglar una
                                                                                                                                                      parte. Para una mudanza PARCIAL, Google pide exactamente las dos cosas
                                                                                                                                                      que ya están hechas: redirecciones permanentes (el 308 del middleware)
                                                                                                                                                      y los mapas del sitio separados (medido: el .com ya no lista ni una
                                                                                                                                                      dirección venezolana; el .com.ve tiene sus 6 tiendas y sus productos).
                                                                                                                                                      Este punto ya venía escrito mal en esta lista tres veces.

- [ ] 🟠 💻 **Avisar a los seis comercios** de su dirección nueva: los
      enlaces que reparten por WhatsApp siguen siendo del .com (funcionan
      por la redirección, pero conviene que repartan el bueno).
- [ ] 🟠 💻 **Turnstile no está activo en NINGÚN dominio** (medido con
      navegador real en los tres el 7 sep: ni pase, ni marco, ni guion). No
      frena nada de Venezuela, pero el escudo del login lleva tiempo
      apagado: la única defensa de `/entrar` es el límite de intentos.
      Se enciende cargando dos claves en el panel.
- [ ] 🟡 💻 Video del hero propio de Venezuela (hoy usa el genérico).

### 6 sep 2026 · TikTok Shop, cuenta aprobada

- [ ] 🟠 👤 **Pedir unidades del POS a Novi por CJ** (una para abrir y
      fotografiar, dos o tres de stock). Es lo que destranca TikTok Shop: la
      etiqueta trae el FCC ID (dice el fabricante) y las fotos del marcado
      FCC + seguridad eléctrica que pide la calificación de Electrónica,
      junto con la factura de CJ. Detalle en `PLAN-TIKTOK-SHOP.md`.
- [ ] 🟠 👤 **Bajar las 52 existencias del POS en mercatren.com al número
      real** (hoy, cero): la ficha es manual, no va a CJ, y se despacha a
      mano desde Novi.
- [ ] 🟡 👤 **Empezar el contenido en español y las campañas hacia la ficha
      de Mercatren** (Promote desde $3–10/día; Ads Manager $20/día por grupo)
      sin esperar a TikTok Shop. Lista de videos y etapas en el plan.
- [ ] 🟡 💻 **Píxel de TikTok en mercatren.com y origen «TikTok» en las
      órdenes**, cuando arranquen las campañas pagadas.

### 5 sep 2026 · la ficha de producto que se borraba

- ✅ 💻 **Arreglado:** el equipo llenaba «Nuevo producto» sin tienda elegida
  (el botón no arrastraba el comercio), el servidor decía «no se sabe a qué
  tienda va» y React vaciaba el formulario. Ahora sin tienda sale el buscador
  primero; la ciudad de retiro (mapa de Venezuela) solo se pide a tiendas
  venezolanas; y todo formulario largo restituye lo escrito si se reinicia
  tras un fallo. El producto perdido nunca llegó a la base: su texto está en
  el navegador de quien lo cargó y vuelve al abrir «Nuevo producto» ahí.

### 5 sep 2026 · el tramo de CJ, sin pasar por Stripe

- 💻 **HECHO · Panel → Equipo → Probar una compra.** Se pega el enlace de un
  producto y se ve, paso a paso y con la respuesta cruda de CJ, las variantes
  con stock, de qué almacén salen y qué transportes hay. Botón «Comprar de
  verdad a CJ» que crea, confirma —cambiando el transporte si el almacén no
  tiene stock— y paga del saldo. No toca Stripe ni las tablas de ventas.
- ✅ 💻 **PAGADO (5 sep, 20:37):** `PRUEBA-20260905184139` se pagó del saldo
  de CJ desde la puerta `/datos/probar-compra` (GitHub, sin sesión): saldo
  $150,00 → $138,60. La llamada correcta es `payBalance {orderId}` (v1);
  `payBalanceV2` era la equivocada para un pedido de un envío. Módulo y
  circuito automático llevan el arreglo; el vigilante reintenta las compras
  «por pagar» (MT-000014 es la primera).
- ✅ 💻 **Compra completa desde la puerta (5 sep, 20:56):** `PRUEBA-20260905205642`
  creada y pagada en una corrida, $138,60 → $127,20, nueve pasos en verde.
- 🔴 👤 **Falta una venta real con tarjeta** que se pague sola a CJ en el acto.
- ✅ 💻 **La sonda de salud ya no crea cuentas** «Soporte Diagnóstico» por
  visita (eran los correos de «Cuenta nueva» cada rato); barre las que dejó.
- 💻 **HECHO · los puntos de CJ ya no se desperdician:** el refresco de stock
  cede mientras haya cola (~31.000 puntos/día) y la sonda de salud dejó de
  gastar 50 puntos por visita a `/datos/salud`. El presupuesto del día se ve
  en `puntosDeCj` del canario.
- 🟠 👤 **La compra de las 12:35:** falta la captura de Panel → Órdenes con el
  número y el estado, para saber dónde se detuvo.

## Los cuatro datos que faltan para cerrar las respuestas al contador

- 🔴 👤 **MT-000011 (camiseta, cliente real ya cobrado $7.95):** la talla no
  tiene stock en ningún almacén de EE. UU. y desde China el costo supera lo
  cobrado. Decisión de negocio: (a) cambiar el almacén a China en el panel de
  CJ («Almacén de edición masiva» → China → Entregar) y asumir la diferencia
  para completar la primera compra de prueba, avisando a la clienta del plazo
  de 10–20 días; o (b) devolverle el dinero desde el pedido (tres puntos →
  devolver) y descartar la compra. (2 sep 2026)

- [ ] 👤 El **token de lectura de producción** (para decir qué factura salió a
      nombre de cuál sociedad y con qué fecha).
- [ ] 👤 Si **`EMISOR_IDENTIFICACION` y `EMISOR_DIRECCION`** se cambiaron el 12
      de agosto. Si no, hay facturas con el nombre de una sociedad y el número
      fiscal de la otra.
- [ ] 👤 El **EIN de Windoce, LLC** y a qué banco liquidaba.
- [ ] 👤 **A qué cuenta liquida Stripe** hoy (Chase o Mercury). 30 segundos en
      su panel; mis notas se contradicen.

---

# BLOQUE 2 · EL DINERO QUE NO PUEDE SALIR

- [ ] 🔴 👤 **Cargar `MERCURY_CUENTA_ID`** en el panel del sitio. Sin esa
      variable **los retiros automáticos no funcionan**: el sistema no sabe de
      qué cuenta sacar el dinero. `MERCURY_TOKEN` ya está.
- [ ] 🟠 👤 **Conectar Mercury a Xero.** Xero ve entrar por Chase y Stripe pero
      **no ve salir** el dinero a los comercios — que es el costo de mercancía.
- [ ] 🟡 💻 **Conectar la billetera con el WaaS de tokiia.com.** Hoy el saldo
      es un espejo calculado; cuando se conecte, la fuente de verdad pasa a ser
      el proveedor (`billeteras.proveedorBilleteraId` ya existe para eso).

---

# BLOQUE 3-RO · LA EXPANSIÓN POR ALMACENES DE CJ (plan del 27 ago 2026)

- [x] 💻 **«Traer el almacén completo» de CJ, por plaza (2 sep 2026).** Panel →
      Catálogo de {plaza} → un botón trae TODO el almacén (EE. UU. para el
      .com; China para Chile y Colombia) con filtros de stock mínimo,
      inventario verificado y tope; publica con envío estimado por
      departamento y el reloj afina flete, tallas y stock por detrás (unos
      3.840 por día) y traduce títulos y descripciones. Detalle en
      `CLAUDE.md` → «Traer el almacén completo de CJ».
- [ ] 🔴 👤 **Pulsarlo en las tres plazas, y mirar la primera sonda.** Selector
      en Estados Unidos → Catálogo → «Traer el almacén completo de Estados
      Unidos» → Empezar; después Colombia y Chile (almacén de China: ponerle
      tope, p. ej. 20.000, porque ese catálogo son millones). La primera
      corrida real contra CJ se ve ahí: si la sonda da cero, el panel dice
      qué filtro aflojar. **La llave de CJ no vive en la máquina de trabajo,
      así que esto no se pudo probar contra CJ desde el código.**
- [ ] 🟠 💻 **(Sesión de YaDominios Cloud) El planificador no invoca
      `/__scheduled`.** Mercatren declara `triggers.crons: ["* * * * *"]` en el
      `yadominios.json` publicado y responde 202 a `GET /__scheduled` con la
      cabecera `x-yad-cron` (probado a mano), pero en 20 minutos de
      observación ningún latido vino del planificador (`/datos/salud` →
      `reloj.ultimo.origen` nunca fue «puerta»). Mientras tanto Mercatren late
      con el tráfico (cada visita deja un latido de 25 s) y GitHub queda de
      respaldo. Revisar en la plataforma si los crons de `yadominios.json` se
      registran al publicar desde una rama de build.
- [x] 💻 **El reloj propio del sitio (3 sep 2026).** GitHub corría 5 veces al
      día, no cada 15 min. Ahora YaDominios Cloud invoca `/__scheduled` cada
      minuto y cada latido trabaja 25 s (importación, afinado, barrido, stock,
      traducción, y el vigilante cada 20 min). GitHub queda de respaldo para
      releer los catálogos de los comercios.
- [x] 💻 **El vigilante (2 sep 2026).** Panel → Equipo → Vigilante y
      `.github/workflows/vigilante.yml` cada 20 min: mira el reloj, CJ, Stripe,
      importaciones, compras al proveedor, Zelle, retiros y catálogos; retira
      de la venta lo de CJ sin flete real; avisa a soporte@ por correo.
- [ ] 🟠 💻 **La pistola de códigos de barras en la tienda de EE. UU.** Los
      clientes la piden y no aparece: el buscador de CJ con `countryCode=US`
      no la devuelve. Con el almacén completo importado, buscar «barcode
      scanner» en Panel → Mis productos (catálogo de EE. UU.) y, si sigue sin
      estar, es que CJ no la tiene en su almacén de EE. UU.: la salida es
      traerla de China para esa plaza (una tienda «desde China, 15–20 días»
      con su propio plazo en la ficha) — decisión del dueño.
- [ ] 🟠 👤 **Search Console: nada que reenviar.** `/sitemap.xml` ahora es un
      índice con trozos de 40.000 fichas; la dirección registrada sigue
      valiendo. A los días, mirar en Sitemaps que aparezcan los trozos.

**El plan completo vive en `PLAN-ALMACENES-CJ.md`** — los 17 almacenes por
continente, cómo se surten Chile y Colombia (no hay almacén sudamericano: se
mide US vs China vs México con la sonda de flete), y el orden de expansión.
**Próximo objetivo decidido por el dueño: RUMANÍA.** Antes de programar nada:
dominio mercatren.ro, IVA de la UE con el contador, y la decisión del idioma.

# BLOQUE 3-CL · ABRIR CHILE Y COLOMBIA — EL CÓDIGO ESTÁ COMPLETO (27 ago 2026)

**EL EQUIPO YA PUEDE CARGAR PRODUCTOS PARA CHILE Y COLOMBIA**: selector del
panel en el país → Panel → Catálogo (el de CJ) → Agregar. El producto entra a
`mercatren.cl` / `.com.co` en pesos, con el flete de su país y —en Chile— el
IVA dentro y el tope de USD 500 vigilado. **Requisito previo: cargar la tasa
del dólar en Configuración → La tasa del dólar**, o el botón se niega con ese
motivo.

- [x] ✅ 💻 Precio de Chile y de Colombia (pesos enteros; CL con IVA y tope)
- [x] ✅ 💻 Tasas CLP/COP editables con fecha de actualización
- [x] ✅ 💻 Catálogo de CJ por plaza, con aviso de destino antes de pulsar
- [x] ✅ 💻 Flete cotizado al país (respaldo propio, nunca cero)
- [x] ✅ 💻 Checkout: regiones/departamentos de lista, solo envío, SOLO
      tarjeta, Stripe cobra en la moneda del pedido, IVA anotado
- [x] ✅ 💻 F129 por trimestre en Configuración
- [x] ✅ 💻 Textos, hero, meta, og y franja de entrega por país

**Lo que queda es 👤 del dueño, en este orden:**

- [x] ✅ 💻 **La tasa es AUTOMÁTICA desde el 28 ago** (DolarApi, la misma que
      usa el dueño en sus otras apps): se refresca sola cada 90 segundos, con
      la última buena guardada 7 días de respaldo y candado si todo falla.
      El dueño solo decide el AJUSTE (% y monto fijo) en Configuración, una
      vez — no hay nada que actualizar a diario.
- [ ] 🔴 👤 **Turnstile**: agregar `mercatren.cl` y `mercatren.com.co` a los
      dominios del widget en Cloudflare, o el login desde allá queda sin
      escudo.
- [ ] 🔴 👤 **Decisión de negocio (Colombia)**: ¿quién asume lo que la aduana
      colombiana le cobre al comprador al recibir? Sin régimen tipo SII, el
      paquete puede llegar con cobro. Definirlo ANTES de publicar la primera
      ficha, porque decide qué promete la página.
- [ ] 🔴 👤 **Compra de prueba chilena** con lo primero que se cargue:
      comprobar que el paquete entra SIN cobro en la aduana (esa es LA prueba
      del circuito del SII y de que el courier de CJ transmite los 4 datos al
      SNA) y medir el plazo real, que la ficha hoy promete en 10–25 días.
- [ ] 🟠 👤 Compra de prueba colombiana, con la misma vara.

# BLOQUE 3 · LAS VENTAS DE ESTADOS UNIDOS (ABIERTAS DESDE EL 26 AGO 2026)

**LA PAUSA SE LEVANTÓ** (`EN_PAUSA = false` en `src/lib/ventas/pausa.ts`). Se
puso el 15 de agosto porque no se podía despachar; las dos cosas que faltaban
ya están: el pedido al proveedor se crea solo desde el 16 de agosto y el dinero
llegó a Payoneer para cargar CJ. **Se vuelve a poner con una línea** el día que
haga falta cerrar la plaza, sin apagar las fichas.

Lo que sigue pendiente NO frena la venta, pero hay que medirlo con las primeras
compras reales:

- [ ] 🔴 👤 **Comprar 2–3 productos de prueba y medir**: desde qué almacén sale
      (EE. UU. o China cambia el plazo de 5 a 20 días, y la ficha ya promete
      uno), **qué papel viene dentro de la caja** (si trae la factura del
      mayorista con el precio de compra, el comprador ve nuestro margen), qué
      dirección de devolución trae, y si el producto es el de la foto.
- [ ] 🔴 👤 **Preguntarle a CJ por escrito** desde qué almacén despacha y quién
      figura como _importer of record_.
- [ ] 🟠 👤 **Comparar contra otros dos o tres proveedores** antes de casarse
      con CJ.
- [x] ✅ **Las tallas y colores en la ficha** (`selector-variante.tsx`, ya
      conectado en la ficha del producto). Quedaba escrito como pendiente y ya
      estaba hecho: comprobado el 24 ago 2026.
- [x] ✅ **Un carrito no puede mezclar destinos.** Candado en `crearPedido`
      (decidido con la base) y aviso en el carrito con «vaciar y llevarme este».
- [x] ✅ **El espaciador y el enviar en los comentarios de los videos** (24
      ago): el visor se comía el espacio y el zoom de iOS sacaba el botón de
      la pantalla. Arreglado para todos los formularios del sitio.
- [x] ✅ **El corazón anota y «lo tuyo primero»** (24 ago): señales de compra
      y corazones reordenan las hileras de videos para quien entró. Reordena,
      no filtra.
- [x] ✅ **El visor inmersivo en el teléfono + vistas + precarga** (24 ago):
      pantalla completa como TikTok con volver y lupa, el botón de la tienda a
      la vista, contador de vistas real (2 s mirando) y el siguiente video
      precargado — sin tirón entre videos.
- [x] ✅ **Los videos se comprimen en el navegador al subir** (24 ago): de
      14,5 Mbps a ~2,8 (el rango de YouTube), con el índice adelante. Y el
      botón «Aligerar» para los ya subidos.
- [ ] 👤 **Aligerar los videos ya publicados**: entrar a Panel → Videos desde
      una computadora con Chrome y pulsar «Aligerar este video» en cada video
      pesado (botón ámbar). Uno por uno, esperando a que diga «Listo».
- [ ] 🟡 💰 **Cloudflare Stream si el sitio crece** (streaming adaptativo como
      YouTube): $5/1.000 min almacenados + $1/1.000 min entregados. Decisión
      de gasto del dueño; hoy no hace falta.
- [x] ✅ **Sección «Tu Próximo Producto Ganador»** (24 ago): videos neutros de
      Mercatren que llevan al catálogo, con su página propia y su enlace con
      PIN para subir desde el celular.
- [ ] 👤 **Crear la sección en producción y subir los 15 videos**: Panel →
      Secciones de video → Nueva sección, copiar el enlace, mandárselo por
      WhatsApp al teléfono con el que se graba.
- [x] ✅ **Transferencia ACH directa en el cobro por enlace** (26 ago): tres
      métodos —tarjeta, Zelle y ACH—, misma cola de validación.
- [ ] 🔴 👤 **Apuntar las variables de pago a Mercatren LLC.** Comprobado el 26
      ago: `PAGO_BENEFICIARIO`, `PAGO_BANCO`, `PAGO_CUENTA` y `PAGO_RUTA_ACH`
      todavía traen los datos de Windoce, LLC en Bank of America. Con ACH
      encendido, una factura entera se iría a la cuenta equivocada. Se cambian
      en el panel de YaDominios Cloud → Variables de entorno.
- [ ] 🟡 💻 **Las señales también en las bandas de PRODUCTOS de la portada**
      (después de la caché, reordenar sin filtrar — igual que los videos).
- [ ] 🟠 💻 **La página de la política de devoluciones**, con el plazo y el
      procedimiento (la dirección no se publica, sale al abrir el trámite).
- [ ] 🟡 💻 **Medir el envío con las compras reales.** Hoy el respaldo son
      **$3.50 sacados de UNA sola medición**. Con tres o cuatro, se ajusta.
- [ ] 🟡 💻 **Repartir por rubro** lo que ya está cargado, y **repasar los 78 a
      ojo**: con dos departamentos mal en una sola pasada, hay más.

---

# BLOQUE 4 · EL CATÁLOGO Y GOOGLE

- [ ] 🟠 💻 **Traducir los títulos al inglés.** Hoy `titulo_en` está vacío en
      casi todo el catálogo venezolano, y en el de CJ se guarda el inglés en
      los dos campos.
- [ ] 🟠 💻 **La dirección del producto en español.** Un producto que se llama
      «Billetera» todavía vive en `/producto/women-wristlet-wallet-...`.
- [ ] 🟠 👤 **Merchant Center: la ventana de devolución en 7 días** (quedó en
      `N/A`), darle a **Update** en la fuente de productos, y esperar la
      revisión (1–3 días).
- [ ] 🟡 💻 **Categorías de Google** (`google_product_category`) por
      departamento.
- [ ] 🟡 💻 **GTIN** cuando el comercio lo tenga.
- [ ] 🟡 💻 **Un feed por idioma** para Merchant Center.
- [ ] 🟡 💻 **Las palabras a posicionar por departamento**, en `SEO.md`.
- [ ] 🟡 👤 **Pedir la reindexación en Search Console** de las páginas que
      Google todavía cita con la copia vieja (portada, términos, privacidad,
      nosotros, cómo funciona, transparencia — en los dos idiomas).

## Agentes de IA (isitagentready.com daba 33/100 el 23 ago 2026)

- [x] 💻 Markdown para agentes, catálogo de API (RFC 9727) con OpenAPI,
      recurso protegido (RFC 9728), `auth.md`, servidor MCP de solo lectura con
      su tarjeta, índice de skills, manifiesto ARD y WebMCP. Hecho el 23 ago.
- [ ] 🟠 👤 **DNS-AID: los registros `_index._agents` y `_mcp._agents`** (tipo
      HTTPS/SVCB) en el DNS de mercatren.com, y **DNSSEC encendido**. Es lo
      único de esa lista que no sale del código: va en el panel del DNS del
      dominio (YaDominios Cloud / Cloudflare). Los valores exactos están en la
      sección «Agentes de IA» de `CLAUDE.md`.
- [ ] 🟡 💻 **Servidor OAuth/OIDC para la API de socios.** No se publicó un
      `/.well-known/oauth-authorization-server` porque no existe; publicarlo
      sería mentir. Se construye el día que un tercero lo necesite de verdad.
- [ ] 🟡 💻 **Notas de producto escritas por IA**: el plan está en
      `PLAN-BLOG-IA.md`; no se ejecuta hasta que el dueño decida cuántas por
      día, el tope y si se revisan.
- [ ] 🟠 👤 **Crear los primeros banners** en Panel → Equipo → Banners (la
      tienda de zapatos, la de electrónica…): el módulo está listo y vacío.

---

# BLOQUE 5 · COBROS Y FACTURACIÓN

- [x] ✅ **El webhook de salida al sistema del comercio** cuando entra un pago,
      firmado, con su botón de probar y el último error a la vista. Se
      configura en Mi tienda.
- [ ] 🟠 💻 **El flete y el manejo en el checkout de la tienda**, no solo en el
      cobro por enlace. Hoy un comprador del catálogo no puede pagar un flete
      acordado aparte.
- [ ] 🟡 💻 **Que el comercio guarde sus tarifas** (su flete habitual, su cargo
      por piso) para no reescribirlas en cada cobro.
- [ ] 🟡 💻 **El desglose dentro del documento de la factura.** Hoy se ve en la
      página de pago; en la factura va en una sola línea.
- [ ] 🟡 💻 **Pagar con el cupo de crédito desde el checkout**, la pantalla del
      cliente con su avance, y los avisos de vencimiento.
- [ ] 🟡 💻 **La orden de compra MT-OC de la MT-000002** dice $30.91 y debería
      decir $31.23. Es un documento contable ya emitido: **la decisión de
      corregirlo es tuya y del contador**.

---

# BLOQUE 6 · CHILE Y COLOMBIA

Las fases 1 a 4 del plan multi-país están hechas. Para operar de verdad falta:

- [ ] 🟠 👤 **Turnstile con `mercatren.cl` entre sus dominios.**
- [ ] 🟠 👤 **Un procesador de pagos chileno** (Webpay / Khipu / Flow).
- [ ] 🟠 💻 **La geografía de Chile y Colombia** (regiones y ciudades).
- [ ] 🟠 👤 **Dropi:** mandar el correo a `marcos.amado@dropi.co` con el ID de
      usuario para que activen la API.
- [ ] 🟡 💻 **El copy propio de cada plaza.** Hoy se hereda el de Venezuela.

---

# BLOQUE 6c · LOS SHORTS, SEGUNDA VUELTA — ✅ HECHO (24 ago 2026)

- [x] ✅ **Probar sin salir de la hilera.** El mouse encima mueve el video en la
      tarjeta; al quitarlo vuelve la portada.
- [x] ✅ **El clic abre el reproductor con los menús a los lados** (volvió al
      layout de la tienda), y **la pantalla completa solo con el botón de
      expandir** — la del navegador, no un CSS que la imite.
- [x] ✅ **Corazones, comentarios y compartir**, en la columna de la derecha.
      Uno por persona, el número sube al momento, y los comentarios se ocultan
      (no se borran) por quien los escribió, el comercio o el equipo.

# BLOQUE 6b · QUE EL SITIO VUELE — ✅ LA PRIMERA VUELTA, HECHA (24 ago 2026)

- [x] ✅ **Medido primero, con números** (portada ~2 s; ficha de tienda hasta
      2,8 s en producción).
- [x] ✅ **Bandas, primera tanda de la parrilla y videos de las hileras se
      recuerdan un minuto**, con el mercado y la ciudad en la llave. La portada
      sigue moviéndose porque la lista se rota en memoria.
- [x] ✅ **La ficha de tienda hace sus cinco consultas a la vez.**
- [x] ✅ **`/media` guarda lo público en la caché del borde** (los videos ya no
      salen del bucket por el worker en cada trozo).
- [x] ✅ **Segunda vuelta: la caché pasó al BORDE** (`recordadoEnElBorde`), que
      es lo que sobrevive a un worker frío — la de memoria sola seguía dando
      picos de dos segundos en producción.
- [ ] 🟠 💻 **Tercera vuelta: el ARRANQUE EN FRÍO, que es lo que queda.**
      Medido en producción CON la caché de borde puesta (24 ago 2026, seis
      lecturas por página): la portada sigue dando 2,7 · 3,3 · 1,7 · 3,0 · 1,8 ·
      0,39 s, y la ficha de una tienda 2,0 · 0,20 · 2,7 · 0,21 · 3,0 · 0,38 s.
      **Ese patrón —o rápido o lentísimo, sin término medio— no es la base: es
      el worker arrancando.** Las consultas ya no son el problema; el
      `_worker.js` pesa 12,3 MB sin comprimir (ver la nota del 17 ago) y eso es
      lo que hay que atacar. Dos caminos, y hay que medir antes de elegir:
      (a) cachear la RESPUESTA de las páginas públicas en el borde **solo
      cuando la petición no trae cookies** —que es el caso de Google y del
      enlace compartido, donde más duele— y seguir sirviendo dinámico a quien
      tiene ciudad elegida o sesión; (b) adelgazar el bundle. Lo que NO se hace
      es cachear a ciegas una página que depende de la cookie de ciudad: eso
      sería enseñarle a alguien el catálogo de otra ciudad.

# BLOQUE 7 · DEUDA TÉCNICA ESCRITA

Ninguna es urgente. Todas están documentadas con su motivo.

- [ ] 🟡 💻 **`zod` en los 9 archivos de acciones que faltan.** Es la deuda más
      grande que dejó el blindaje. Se cierra archivo por archivo, con su prueba.
- [ ] 🟡 💻 **`noUncheckedIndexedAccess` en TypeScript.** Rompe en 16 sitios.
- [ ] 🟡 💻 **Nonce por petición en la CSP**, para quitar `unsafe-inline`.
- [ ] 🟡 💻 **Renombrar `billetera`, `saldo` y `comision`** en la base. Es
      vocabulario prohibido de cara al público, aunque hoy solo sean nombres
      internos.
- [ ] 🟡 💻 **`e2e/comprobante.spec.ts` falla en local** (preexistente).
- [ ] 🟡 💻 **El buscador en enlaces de cobro, órdenes de compra, créditos y
      pedidos al proveedor** cuando pasen de unas 30 filas. Hoy tienen 0–2.
- [ ] 🟡 💻 **El peso del worker: 13,13 MB sin comprimir** (3,44 MB
      comprimido, contra un tope real de 10 MB comprimido). Si YaDominios
      Cloud vuelve a rechazar una publicación, la causa es que mide sin
      comprimir. **Se arregla en YaDominios Cloud, que es otra sesión.**

---

# CÓMO SE MANTIENE ESTE DOCUMENTO

Al terminar algo, se marca **en el mismo trabajo**, aquí y en su plan. Una
lista desactualizada miente igual que un panel que dice «En vivo» con el sitio
caído.

Al empezar algo nuevo que no esté aquí, se agrega antes de escribir la primera
línea de código.

- ✅ 💻 **El tablero del vigilante con la contabilidad completa** (3 sep 2026):
  qué hay en cada plaza, las tiendas de los comercios, botones para adelantar
  trabajo, historial de fallos con «ya lo arreglé», y el conteo dentro del
  correo.
- ✅ 💻 **Las fotos de los comercios se copian solas a nuestro bucket** (3 sep
  2026): 10 por hora desde el reloj; las que el origen ya no tiene se dan por
  perdidas, se esconden y el vigilante las nombra. Lo que queda es de los
  comercios: reponer en su sistema las fotos que el vigilante liste como
  perdidas.
- ✅ 💻 **Las cookies volvieron y el circuito de compra funciona** (4 sep
  2026, 00:00). Comprobado en producción: registro con sesión, carrito y
  checkout pidiendo la dirección de EE. UU. Los robots de GitHub, que
  fallaban con 404 porque también perdían su cabecera de autorización,
  vuelven a pasar. **Falta la compra de prueba con tarjeta (👤).**
- 🔴 👤 **Richard: devolverle el dinero a la clienta de la camiseta (MT-000011 y
  MT-000013).** Pagó dos veces la misma camiseta y no se puede enviar: no tiene
  ninguna talla en el almacén de EE. UU. (el motivo ya lo dice el vigilante y
  el panel). Panel → Órdenes → cada pedido → tres puntos → Devolver. Y en
  Pedidos al proveedor, descartar la MT-000011 (por_pagar, CJ la rechazó) y la
  MT-000004 (la prueba del 18 ago). El candado del checkout ya es cerrado
  (3 sep): sin confirmación de stock no se cobra.

- 🟡 💻 **El traductor del catálogo devuelve JSON roto de vez en cuando y se
  para** (visto el 3 sep 2026 en Panel → Configuración → Catálogo en español,
  con 45.039 títulos en inglés y 698 traducidos). El mensaje: «El traductor no
  devolvió JSON: { "t": [ { "id": "prod-BLLG3IcRj7IP", "titulo": "Ropa para
  hombre" -}, …» — se cuela un guion suelto y el texto se corta, así que la
  tanda entera se pierde en vez de rescatar lo que sí vino bien. Al fondo de la
  cola por decisión del dueño: no frena ninguna venta, el catálogo se ve igual
  en español o inglés, y el reloj sigue intentando tandas nuevas. Cuando se
  toque: rescatar los objetos válidos aunque el JSON venga cortado, pedir menos
  productos por tanda, y dejar el error con la tanda que falló para reintentarla.
