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

Última revisión: **24 de agosto de 2026**.

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

## Los cuatro datos que faltan para cerrar las respuestas al contador

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

# BLOQUE 3 · LAS VENTAS DE ESTADOS UNIDOS (EN PAUSA)

**La pausa se quita con una línea** (`EN_PAUSA = false` en
`src/lib/ventas/pausa.ts`) — pero no antes de esto:

- [ ] 🔴 👤 **Comprar 2–3 productos de prueba y medir**: desde qué almacén sale
      (EE. UU. o China cambia el plazo de 5 a 20 días, y la ficha ya promete
      uno), **qué papel viene dentro de la caja** (si trae la factura del
      mayorista con el precio de compra, el comprador ve nuestro margen), qué
      dirección de devolución trae, y si el producto es el de la foto.
- [ ] 🔴 👤 **Preguntarle a CJ por escrito** desde qué almacén despacha y quién
      figura como _importer of record_.
- [ ] 🟠 👤 **Comparar contra otros dos o tres proveedores** antes de casarse
      con CJ.
- [ ] 🟠 💻 **Las tallas y colores en la ficha.** Hoy cada producto se publica
      como una sola cosa y **el comprador nunca elige**: la variante la escoge
      el sistema. Mandar la talla equivocada es una devolución.
- [ ] 🟠 💻 **Un carrito no puede mezclar destinos.** Lo de EE. UU. se entrega
      allá y lo de Venezuela se retira allá. `cabenJuntos()` existe en
      `src/lib/destino/reglas.ts` y **no está puesto en el carrito ni en el
      checkout**.
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

- [ ] 🟠 💻 **El webhook de salida al sistema del comercio** cuando entra un
      pago, con `referencia_deuda`. Prometido a la sesión de Bley.
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

# BLOQUE 6b · QUE EL SITIO VUELE (rendimiento y caché)

Lo pidió el dueño el 24 ago 2026 con dos capturas: _«se queda como tres
segundos así esa pantalla»_ (la tienda dibujando esqueletos grises) y _«algunos
videos se quedan pegados cuando le das play»_. No es un capricho de acabado:
tres segundos en blanco en la ficha de una tienda es la persona que se va.

- [ ] 🟠 💻 **Medir primero, con números.** Ficha de tienda, portada y ficha de
      producto en el sitio publicado: qué tarda el servidor (TTFB), qué tarda
      la base y qué tarda el borde. Sin esa medición cualquier arreglo es
      adivinar. Hoy `/es` y las fichas van con `no-store`.
- [ ] 🟠 💻 **La tienda tarda porque hace muchas consultas en fila** (tienda,
      productos, envío, color, verificación, videos, banners…). Juntar las que
      se puedan en un `Promise.all` y recordar un minuto lo que no cambia
      (color, política de envío, verificación), con la llave por mercado como
      manda `muro-cache`.
- [ ] 🟠 💻 **Caché en el borde para lo público.** Portada, fichas de tienda y
      de producto pueden servirse con `s-maxage` corto y `stale-while-revalidate`
      sin mentirle a nadie: el precio y las existencias se releen al comprar.
      Ojo con lo que lleva sesión y con el filtro por ciudad (va en cookie).
- [ ] 🟠 💻 **Los videos que se quedan pegados al dar play.** `/media` ya sirve
      por rangos (206), pero el archivo sale del bucket a través del worker en
      cada trozo. Dos caminos a medir: cachear el objeto en el borde
      (`cache-control` ya es `immutable`, falta que el borde lo guarde) o
      publicar el bucket por su propio dominio. También: `preload="none"` en lo
      que no se está viendo y arrancar el siguiente video un poco antes.
- [ ] 🟡 💻 **El esqueleto gris que dura tres segundos.** Con la caché puesta
      casi desaparece; lo que quede se arregla enseñando ya lo que se sabe
      (nombre, portada, primeros productos) y dejando cargar lo de abajo.

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
