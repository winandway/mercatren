import type { Articulo } from "./tipos";
import { CORREO_CONTACTO } from "@/lib/correo/direcciones";
import { SOCIEDAD } from "@/lib/sociedad";

/**
 * Los artículos en español.
 *
 * ORDEN: el más nuevo primero. Se ordenan solos por fecha al listarlos, pero
 * escribirlos así ayuda a leer el archivo.
 *
 * REGLA AL AGREGAR UNO: se escribe también en `en.ts`, con el mismo `slug`.
 * Una prueba falla si un artículo existe en un idioma y no en el otro — un
 * enlace que lleva a una página vacía en inglés es peor que no tener el enlace.
 */
export const ARTICULOS_ES: Articulo[] = [
  {
    slug: "limites-de-zelle",
    tipo: "documentacion",
    titulo: "Los límites de Zelle al pagarle a Mercatren",
    resumen:
      "Por qué a veces tu banco no te deja mandar el monto completo por Zelle, cuánto es el máximo hoy, y cuál es la vía que sí funciona para una factura grande.",
    fecha: "2026-08-27",
    temas: ["pagos", "zelle", "transferencia", "compradores"],
    cuerpo: [
      {
        tipo: "aviso",
        tono: "ojo",
        titulo: "Esto es temporal",
        texto: `Esta página está escrita el jueves 27 de agosto de 2026 y describe una situación TEMPORAL. La cuenta de ${SOCIEDAD.nombre} es nueva, y los bancos limitan los primeros envíos a un destinatario que no conocen. Si estás leyendo esto dentro de dos o tres meses, es muy probable que ya no aplique: el límite sube solo a medida que la cuenta madura y que tú nos vas pagando.`,
      },
      { tipo: "subtitulo", texto: "Qué pasa exactamente" },
      {
        tipo: "parrafo",
        texto: `Cuando vas a mandarle un Zelle a ${SOCIEDAD.nombre}, tu banco te enseña el máximo que te deja mandarle HOY a ese destinatario. Ahora mismo, para una cuenta que nos paga por primera vez, ese máximo ronda los mil dólares.`,
      },
      {
        tipo: "parrafo",
        texto:
          "No es un límite que ponga Mercatren. Es de tu banco, y lo decide él en cada envío. Chase, por ejemplo, lo explica con estas palabras en la propia pantalla del pago:",
      },
      {
        tipo: "aviso",
        tono: "neutro",
        titulo: "Lo que dice tu banco",
        texto:
          "«Tu límite de envío de pagos es flexible. A medida que estableces el historial de pagos de Zelle con un nuevo destinatario, tu límite diario para enviarle dinero puede aumentar.»",
      },
      {
        tipo: "parrafo",
        texto:
          "Por eso, cuando una factura pasa del máximo, Mercatren directamente no te ofrece Zelle: sería mandarte a una pantalla donde no vas a poder terminar. Y lo que suele pasar en ese caso es peor que no poder pagar — mandas lo que te dejan, la factura queda a medias, y hay que corregirla a mano.",
      },
      { tipo: "subtitulo", texto: "Qué hacer con una factura grande" },
      {
        tipo: "parrafo",
        texto: `Usa la TRANSFERENCIA BANCARIA (ACH). No tiene ese límite, la mayoría de los bancos no te cobra nada por hacerla, y el dinero llega a la misma cuenta de ${SOCIEDAD.nombre}. En la página de tu cobro te salen los cuatro datos que te pide el banco, cada uno con su botón de copiar.`,
      },
      {
        tipo: "lista",
        puntos: [
          "Transferencia bancaria (ACH): sin ese límite y sin comisión. Es la recomendada para montos altos.",
          "Tarjeta: tampoco tiene ese límite. Se confirma sola, en el momento.",
          "Zelle: para montos por debajo del máximo. Lo confirma una persona, normalmente el mismo día hábil.",
        ],
      },
      {
        tipo: "aviso",
        tono: "ojo",
        titulo: "El número de conciliación",
        texto:
          "Si pagas por transferencia o por Zelle, escribe el número de conciliación que te damos en la página del cobro. Ese número es lo que ata tu transferencia con tu factura: a ti te justifica la salida de tu cuenta y a nosotros la entrada en la nuestra.",
      },
      { tipo: "subtitulo", texto: "¿Y si ya mandé de menos?" },
      {
        tipo: "parrafo",
        texto:
          "No se pierde nada. Registramos exactamente lo que entró y te llega un correo con los dos montos —el de la factura y el que recibimos— y con el enlace para ver el comprobante que subiste, tal como llegó. La factura queda abierta por la diferencia y el comercio se pone en contacto contigo para terminarla.",
      },
      {
        tipo: "boton",
        texto: "Los límites de Zelle en Chase",
        href: "https://www.chase.com/business/support/banking/online-banking/zelle",
        externo: true,
      },
    ],
  },
  {
    slug: "la-portada-abre-con-todas-las-tiendas",
    tipo: "novedad",
    titulo:
      "La portada de Mercatren ahora abre con todas las tiendas: las chicas primero",
    resumen:
      "Cada comercio de Venezuela sale en la primera pantalla con sus productos más nuevos, aunque tenga uno solo. Los productos del catálogo de Estados Unidos se reparten entre medio, de a pocos.",
    fecha: "2026-08-23",
    temas: ["novedades", "portada", "comercios", "venezuela"],
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "Varios comercios nos lo dijeron con razón: la portada arrancaba con un bloque entero de la tienda que más productos tiene, después venía el catálogo de Estados Unidos, y el resto parecía no existir. Una tienda con dos productos —o con uno— nunca salía de primera.",
      },
      {
        tipo: "parrafo",
        texto:
          "Desde hoy la portada abre con un bloque que se llama así, «De todas las tiendas»: los dos productos más nuevos de CADA comercio de Venezuela, uno detrás de otro, y recién después seis productos del catálogo de Estados Unidos. El orden de las tiendas cambia en cada visita, así que una vez abre la de láminas de zinc y otra la de zapatos.",
      },
      {
        tipo: "imagen",
        src: "/blog/la-portada-abre-con-todas-las-tiendas/1-portada-celular.png",
        alt: "La portada de Mercatren en un celular: el bloque «De todas las tiendas» con productos de distintos comercios venezolanos.",
        pie: "En el celular, que es desde donde compra casi todo el mundo.",
      },
      { tipo: "subtitulo", texto: "Qué cambia para un comercio" },
      {
        tipo: "lista",
        puntos: [
          "Da igual si tienes uno o seiscientos productos: tus dos más nuevos salen en la primera pantalla de la portada.",
          "Cada producto que subas entra de inmediato en ese bloque: subir productos te pone delante.",
          "Las bandas por departamento (Ferretería, Ropa, Motos…) siguen la misma regla: en cada una, primero los comercios venezolanos, después el catálogo de Estados Unidos.",
          "Y si tu producto tiene varias fotos, la foto que sale en la lista va rotando entre ellas: se ven todas, no solo la primera.",
        ],
      },
      {
        tipo: "imagen",
        src: "/blog/la-portada-abre-con-todas-las-tiendas/2-portada-escritorio.png",
        alt: "La portada de Mercatren en una computadora, con el bloque «De todas las tiendas».",
        pie: "En la computadora se ven siete por hilera; la regla es la misma.",
      },
      {
        tipo: "aviso",
        tono: "acento",
        titulo: "¿Tienes un comercio?",
        texto:
          "Abre tu tienda, sube tus productos con su ciudad y su dirección, y sales en la portada desde el primer día.",
      },
    ],
    enlaces: [
      { texto: "Ver la portada", href: "/" },
      { texto: "Abrir mi tienda", href: "/vender" },
      { texto: "Todos los comercios", href: "/tiendas" },
    ],
  },
  {
    slug: "productos-similares-y-lo-que-estabas-mirando",
    tipo: "novedad",
    titulo:
      "Productos similares y «Porque estuviste mirando»: la tienda que te sigue el gusto",
    resumen:
      "Al pie de cada producto salen otros parecidos, y si miras dos del mismo tipo, la portada te enseña más de eso. La flecha de volver te deja otra vez en la tienda donde estabas.",
    fecha: "2026-08-23",
    temas: ["novedades", "compradores", "catálogo"],
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "Tres cosas pequeñas que se notan mucho al recorrer el catálogo. La primera: debajo de cada producto ahora hay una fila de «Productos similares» —primero los de la misma categoría, después los del mismo comercio— con un enlace para ver más de esa tienda.",
      },
      {
        tipo: "imagen",
        src: "/blog/productos-similares-y-lo-que-estabas-mirando/1-similares.png",
        alt: "La fila «Productos similares» al pie de la ficha de unos zapatos en Mercatren.",
      },
      {
        tipo: "parrafo",
        texto:
          "La segunda: si abres dos productos del mismo tipo —dos pares de zapatos, dos labiales—, al volver a la portada encuentras una banda que dice «Porque estuviste mirando» con más de eso. Si después te pasas a otra cosa, la banda te sigue. Todo eso queda en tu navegador; no se manda a ningún lado.",
      },
      {
        tipo: "imagen",
        src: "/blog/productos-similares-y-lo-que-estabas-mirando/2-porque-estuviste-mirando.png",
        alt: "La banda «Porque estuviste mirando · Más de Ropa y calzado» en la portada de Mercatren.",
      },
      {
        tipo: "parrafo",
        texto:
          "Y la tercera, que parecía un detalle y no lo era: la flecha de «Volver» arriba de cada producto te devolvía al catálogo entero, y si venías recorriendo una tienda tenías que buscarla otra vez. Ahora vuelve a donde estabas —la tienda, la búsqueda— y, si llegaste desde un enlace de WhatsApp o de Google, te lleva a la tienda del producto.",
      },
    ],
    enlaces: [
      { texto: "Ver el catálogo", href: "/catalogo" },
      { texto: "Cómo funciona Mercatren", href: "/como-funciona" },
    ],
  },
  {
    slug: "cada-producto-dice-donde-lo-reclamas",
    tipo: "novedad",
    titulo:
      "Cada producto dice dónde lo reclamas: la ciudad y la dirección del comercio",
    resumen:
      "Si compras unos zapatos en Tucaní tienes que saber dónde vas a buscarlos. Ahora cada ficha de un comercio venezolano lo dice con claridad, y qué pasa después de pagar.",
    fecha: "2026-08-23",
    temas: ["novedades", "compradores", "entrega", "venezuela"],
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "Nadie compra algo sin saber dónde lo va a recibir. Hasta ahora, un producto sin depósito cargado no decía nada, aunque el comercio sí tuviera su dirección en su ficha. Quien miraba los zapatos no tenía cómo saber que se reclaman en la Vía Panamericana, en Tucaní.",
      },
      {
        tipo: "parrafo",
        texto:
          "Desde hoy, cada producto de un comercio de Venezuela dice dónde se retira —la ciudad y la dirección de la tienda, o su depósito si tiene uno—, y lo que pasa después de pagar: reclamas el producto en esa dirección con tu número de pedido, en un comercio verificado. Si eliges tu ciudad arriba, la ficha te dice además si te queda cerca o lejos.",
      },
      {
        tipo: "imagen",
        src: "/blog/cada-producto-dice-donde-lo-reclamas/1-ficha-campus.png",
        alt: "La ficha de unos zapatos en Mercatren con el bloque «Se retira en Tucaní», la dirección del comercio y la nota de qué pasa después de pagar.",
      },
      { tipo: "subtitulo", texto: "Para el comercio" },
      {
        tipo: "lista",
        puntos: [
          "La ciudad y la dirección que tienes en «Mi tienda» son las que le salen al comprador en cada producto. Revísalas.",
          "Si tienes varios depósitos, cada producto puede llevar el suyo, y ese manda sobre la dirección general.",
          "Sin ciudad, la ficha le dice al comprador que te escriba antes de pagar: mejor que inventarle un lugar.",
        ],
      },
      {
        tipo: "imagen",
        src: "/blog/cada-producto-dice-donde-lo-reclamas/2-tienda-maxium.png",
        alt: "La ficha del comercio MAXIUM en Mercatren, con su ciudad, su botón de WhatsApp y su único producto.",
        pie: "Una tienda con un solo producto, y con todo lo que hace falta para comprárselo.",
      },
    ],
    enlaces: [
      { texto: "Entrega y retiro", href: "/entrega" },
      { texto: "Ir a Mi tienda", href: "/panel/mi-tienda" },
    ],
  },
  {
    slug: "cobra-por-enlace-sin-programar-nada",
    tipo: "novedad",
    titulo:
      "Cobra por enlace sin programar nada: reenvíalo a quien paga, con tarjeta o Zelle",
    resumen:
      "Desde tu panel creas un enlace de pago con el número de tu factura, lo mandas por WhatsApp o por correo a quien va a pagar —aunque esté en Miami— y te entra el cobro. Con flete y manejo aparte si hace falta.",
    fecha: "2026-08-23",
    temas: ["novedades", "comercios", "cobros", "zelle"],
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "El caso más común de todos: alguien compra en tu mostrador y el que pone la tarjeta es su hijo en Estados Unidos. Hasta ahora, el cobro por enlace solo lo tenía el comercio que lo había conectado a su sistema. Ahora lo tienen todos, desde el panel, en «Cobros → Enlaces de cobro».",
      },
      {
        tipo: "imagen",
        src: "/blog/cobra-por-enlace-sin-programar-nada/1-panel-enlaces-de-cobro.png",
        alt: "El formulario «Pedir un cobro» en el panel de Mercatren: comercio, monto, número de factura, correo de quien paga y concepto.",
      },
      {
        tipo: "pasos",
        pasos: [
          {
            titulo: "Escribe cuánto y el número de tu factura",
            texto:
              "Ese número es el que después aparece en tu banco y en el de quien paga; es lo que cuadra las cuentas.",
          },
          {
            titulo: "Pon el correo de quien va a PAGAR",
            texto:
              "No tiene que ser tu cliente. Sale el correo con el enlace, y además puedes copiarlo y mandarlo por WhatsApp.",
          },
          {
            titulo: "Si cobras flete o algún servicio aparte, agrégalo",
            texto:
              "Van en renglones separados —«Flete y transporte», «Manejo y servicios adicionales»— con su explicación, y quien paga los ve desglosados.",
          },
          {
            titulo: "Quien paga elige tarjeta o Zelle",
            texto: `Zelle sale a partir de $200 y va guiado paso a paso, con la cuenta a nombre de ${SOCIEDAD.nombre} y el número que tiene que escribir en la nota.`,
          },
        ],
      },
      {
        tipo: "imagen",
        src: "/blog/cobra-por-enlace-sin-programar-nada/2-pagina-de-pago.png",
        alt: "La página de pago de un cobro por enlace de $620: el comercio, la factura, el concepto y las dos formas de pagar.",
      },
      {
        tipo: "imagen",
        src: "/blog/cobra-por-enlace-sin-programar-nada/3-pagar-por-zelle.png",
        alt: `Los pasos para pagar por Zelle: enviar a la cuenta a nombre de ${SOCIEDAD.nombre} y escribir el número de conciliación en la nota.`,
        pie: "El paso 1 dice a nombre de quién está la cuenta: el banco se lo enseña a quien paga antes de confirmar.",
      },
      { tipo: "subtitulo", texto: "Y lo que pasa después" },
      {
        tipo: "lista",
        puntos: [
          "Si el enlace vence, lo reactivas con el mismo número y el mismo enlace: el correo que ya mandaste vuelve a funcionar.",
          "Si te equivocaste de monto o de cliente, lo cancelas. Uno ya pagado no se cancela: si hay que devolver, está el botón de devolver, a la mano.",
          "Si vuelven a abrir un enlace ya pagado, la página lo dice: «esta factura ya está pagada», con fecha y método.",
          "Si tu negocio tiene su propio sistema, todo esto también se hace desde él: hay una API documentada.",
        ],
      },
    ],
    enlaces: [
      { texto: "Ir a Cobros", href: "/panel/cobros/enlaces" },
      { texto: "Cómo se forma el precio", href: "/vender/comisiones" },
      { texto: "Documentación", href: "/docs" },
    ],
  },
  {
    slug: "busca-en-espanol-el-catalogo-de-estados-unidos",
    tipo: "novedad",
    titulo:
      "Busca en español el catálogo de Estados Unidos: «bicicleta», «caucho», «corneta»",
    resumen:
      "El catálogo que se despacha en Estados Unidos se busca en español, con las palabras de cada país. Noventa y seis resultados para «bicicleta», envío gratis incluido en el precio.",
    fecha: "2026-08-23",
    temas: ["novedades", "catálogo", "estados unidos", "búsqueda"],
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "El catálogo que se entrega en Estados Unidos llegó con sus fichas en inglés, y al buscar «repuestos» no salía nada aunque hubiera repuestos. Ya no: el buscador entiende español —y las palabras de cada país— y encuentra lo mismo aunque la ficha esté en inglés.",
      },
      {
        tipo: "imagen",
        src: "/blog/busca-en-espanol-el-catalogo-de-estados-unidos/1-bicicleta.png",
        alt: "Resultados de buscar «bicicleta» en Mercatren: 96 productos que se despachan en Estados Unidos.",
      },
      {
        tipo: "lista",
        puntos: [
          "«bicicleta» encuentra «bike»; «llanta», «caucho» y «neumático» se valen entre sí; «corneta» encuentra «bocina»; «refacciones» encuentra «repuestos».",
          "Los productos que se despachan en Estados Unidos llevan la banderita en la tarjeta: el envío va dentro del precio y llega en 2 a 5 días.",
          "Los títulos se van traduciendo al español; mientras tanto, la búsqueda ya funciona.",
        ],
      },
      {
        tipo: "aviso",
        tono: "neutro",
        titulo: "¿No encuentras algo?",
        texto:
          "Escríbenos. Si es una palabra que usan en tu país y no en otro, la agregamos al diccionario del buscador.",
      },
    ],
    enlaces: [
      { texto: "Buscar en el catálogo", href: "/catalogo" },
      { texto: "Ayuda", href: "/ayuda" },
    ],
  },
  {
    slug: "el-formulario-fiscal-w8ben-e-se-llena-en-pantalla",
    tipo: "novedad",
    titulo:
      "El formulario fiscal W-8BEN-E se llena en pantalla, en español, en cinco minutos",
    resumen:
      "Un comercio de Venezuela o Colombia no necesita una empresa en Estados Unidos para vender por Mercatren: necesita este formulario. Ya se llena desde el panel y sale el documento firmado.",
    fecha: "2026-08-23",
    temas: ["novedades", "comercios", "fiscal"],
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "El W-8BEN-E es el papel con el que una empresa declara que no es estadounidense. Es lo que le piden a quien cobra desde fuera Google, Facebook o cualquier marketplace; bajarlo en inglés, imprimirlo, firmarlo y escanearlo es justo donde la mayoría abandona.",
      },
      {
        tipo: "parrafo",
        texto:
          "Ahora se llena desde «Mi tienda», en español y con cada campo explicado, y al firmar sale el documento en inglés tal como lo espera quien tiene que leerlo. No se manda a ninguna oficina: se guarda por si alguien lo pide. Sin él, no se pueden pedir retiros; por eso conviene hacerlo el primer día.",
      },
      {
        tipo: "imagen",
        src: "/docs/w8bene/2-formulario.png",
        alt: "El formulario fiscal dentro de «Mi tienda»: nombre legal, país, tipo de empresa, dirección, identificación fiscal y quién firma.",
      },
      {
        tipo: "imagen",
        src: "/docs/w8bene/4-documento.png",
        alt: "El documento W-8BEN-E generado a partir del formulario, listo para imprimir o guardar.",
      },
      {
        tipo: "boton",
        texto: "Ver el tutorial paso a paso",
        href: "/docs/formulario-fiscal-w8ben-e",
      },
    ],
    enlaces: [{ texto: "Ir a Mi tienda", href: "/panel/mi-tienda" }],
  },
  {
    slug: "asi-se-ve-tu-panel-cuando-vendes",
    tipo: "novedad",
    titulo: "Así se ve tu panel cuando vendes: una demostración para recorrer",
    resumen:
      "Una tienda de muestra con un mes de ventas para que veas, antes de abrir la tuya, cómo entran las órdenes, cuánto te queda de cada venta y cómo pides tu dinero.",
    fecha: "2026-08-23",
    temas: ["novedades", "comercios", "panel"],
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "Muchos comercios nos preguntan lo mismo antes de abrir su tienda: «¿y cómo veo yo lo que vendo?». Por eso hicimos una demostración del panel, con una tienda inventada y un mes de ventas inventadas, para recorrerla con calma desde el celular o la computadora.",
      },
      {
        tipo: "imagen",
        src: "/docs/demo-panel/1-tablero.png",
        alt: "El tablero de la tienda de demostración: lo vendido en el mes, la comisión de Mercatren, lo que le quedó y lo disponible para retirar.",
      },
      {
        tipo: "lista",
        puntos: [
          "Órdenes: cada venta con su fecha, su producto, cómo se pagó y en qué paso va.",
          "Cobros: tarjeta, Zelle y enlaces de cobro, cada uno por su lado.",
          "Mi dinero y Retiros: cuánto te quedó de cada venta y cómo lo pides.",
        ],
      },
      {
        tipo: "boton",
        texto: "Abrir la demostración",
        href: "/demo/panel-ventas.html",
      },
    ],
    enlaces: [
      {
        texto: "La guía completa de la demostración",
        href: "/docs/demo-del-panel",
      },
      { texto: "Abrir mi tienda", href: "/vender" },
    ],
  },
  {
    slug: "mercatren-ya-habla-con-los-agentes-de-ia",
    tipo: "novedad",
    titulo:
      "Mercatren ya habla con los agentes de IA: catálogo abierto, servidor MCP y páginas en Markdown",
    resumen:
      "Un asistente de IA puede buscar en el catálogo, leer una ficha o ver un comercio sin pelearse con el HTML: hay un servidor MCP de solo lectura, una API documentada y cada página sale en Markdown si se le pide.",
    fecha: "2026-08-23",
    temas: ["novedades", "agentes", "api", "desarrolladores"],
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "Cada vez más gente le pregunta a un asistente de IA dónde comprar algo. Para que la respuesta incluya a los comercios de Mercatren, el sitio tiene que poder leerse a máquina. Desde hoy puede.",
      },
      {
        tipo: "tabla",
        encabezados: ["Qué", "Dónde", "Para qué"],
        filas: [
          [
            "Servidor MCP (solo lectura)",
            "/datos/mcp",
            "Buscar productos, ver una ficha, listar y ver comercios desde cualquier agente compatible.",
          ],
          [
            "Especificación OpenAPI",
            "/datos/openapi.json",
            "El catálogo público, la búsqueda y la API de socios para cobrar por enlace, documentados.",
          ],
          [
            "Páginas en Markdown",
            "cualquier página pública",
            "Pedirla con Accept: text/markdown devuelve el contenido limpio, sin el HTML.",
          ],
          [
            "Skills",
            "/.well-known/agent-skills/index.json",
            "Instrucciones para comprar en Mercatren y para cobrar por Mercatren desde el sistema de un comercio.",
          ],
          [
            "Catálogo de la API y manifiesto",
            "/.well-known/api-catalog · /.well-known/ai-catalog.json",
            "Para que un agente descubra solo qué hay y cómo se usa.",
          ],
        ],
        nota: "Nada de esto cobra ni escribe: un agente encuentra y recomienda; comprar sigue siendo un acto de la persona, con su cuenta.",
      },
      {
        tipo: "aviso",
        tono: "neutro",
        titulo: "Para quien tiene un sistema",
        texto:
          "Si tu negocio ya tiene su programa de facturación, con la API creas cobros por enlace, consultas si se pagaron y sincronizas tu catálogo. Escríbenos y te damos el acceso.",
      },
    ],
    enlaces: [
      { texto: "Documentación", href: "/docs" },
      { texto: "Cómo funciona Mercatren", href: "/como-funciona" },
    ],
  },
  {
    slug: "demo-del-panel",
    tipo: "documentacion",
    titulo: "Así se ve tu panel cuando vendes: una demostración para recorrer",
    resumen:
      "Una tienda de ejemplo que vendió unos seis mil dólares en el mes. Entra, recorre las ventas, mira cuánto te quedó y pide un retiro de prueba. Es exactamente lo que verías tú.",
    fecha: "2026-08-22",
    temas: ["comercios", "panel", "ventas", "retiros", "demostración"],
    cuerpo: [
      {
        tipo: "aviso",
        tono: "acento",
        titulo: "Es una demostración",
        texto:
          "La tienda, las ventas y los compradores son inventados. Los productos y sus precios sí son reales: salen del catálogo de Estados Unidos de Mercatren. Nada de lo que hagas ahí mueve dinero ni toca una cuenta de verdad.",
      },
      {
        tipo: "parrafo",
        texto:
          "Cuando empiezas a vender por Mercatren, lo primero que quieres saber es cómo vas a ver tu dinero: qué se vendió, qué se te descontó, cuánto tienes disponible y cómo lo sacas. En vez de explicártelo en texto, armamos una tienda de ejemplo con un mes completo de ventas para que lo recorras tú.",
      },
      {
        tipo: "boton",
        texto: "Abrir la demostración",
        href: "/demo/panel-ventas.html",
        externo: true,
      },
      {
        tipo: "imagen",
        src: "/docs/demo-panel/1-tablero.png",
        alt: "El tablero de la tienda de ejemplo: vendido hoy, vendido este mes, comisión de Mercatren y disponible para retirar.",
        pie: "El tablero: lo vendido, lo descontado y lo disponible, de un vistazo.",
      },
      { tipo: "subtitulo", texto: "Qué vas a encontrar" },
      {
        tipo: "pasos",
        pasos: [
          {
            titulo: "Tablero",
            texto:
              "Lo vendido hoy y en el mes, la comisión que se te descontó, lo que tienes disponible y lo que está esperando algo de tu parte.",
          },
          {
            titulo: "Órdenes",
            texto:
              "Cada venta con su comprador, sus productos, cómo se pagó y en qué paso va: comprada, pagada, enviada, entregada, en tu dinero. Toca una para ver el detalle y lo que te quedó de esa venta.",
          },
          {
            titulo: "Cobros",
            texto:
              "Todo el dinero que entró, separado por cómo se pagó: tarjeta, Zelle y los enlaces de cobro que pediste desde tu panel.",
          },
          {
            titulo: "Mi dinero",
            texto:
              "La cuenta completa: lo que pagaron tus compradores, lo que se llevó el procesador de tarjeta, la comisión de Mercatren, lo que te quedó y lo disponible después de lo que ya sacaste.",
          },
          {
            titulo: "Retiros",
            texto:
              "Pide un retiro de prueba: eliges a dónde va, el país decide qué datos bancarios te pide, ves de dónde sale el dinero y el monto queda apartado hasta que el equipo hace la transferencia.",
          },
          {
            titulo: "Mis facturas a Mercatren",
            texto:
              "Por cada venta, Mercatren te compra la mercancía y te emite una orden de compra. Ahí ves contra cuál facturar y cuánto te paga.",
          },
        ],
      },
      {
        tipo: "parrafo",
        texto:
          "Los números cuadran entre sí: lo vendido menos lo descontado da lo que te quedó, y lo que te quedó menos lo que ya sacaste da lo disponible. Si pides un retiro en la demostración, vas a ver cómo se mueve de «disponible» a «pedido, esperando transferencia» en el mismo momento.",
      },
      {
        tipo: "aviso",
        tono: "neutro",
        titulo: "¿Y en tu tienda real?",
        texto:
          "Se ve igual, con tus ventas. Entras a tu panel y encuentras los mismos menús en el mismo orden. Si algo de la demostración no te queda claro, escríbenos y te lo explicamos con tu propia tienda delante.",
      },
    ],
  },
  {
    slug: "formulario-fiscal-w8ben-e",
    tipo: "documentacion",
    titulo:
      "El formulario fiscal (W-8BEN-E): qué es, por qué te lo pedimos y cómo llenarlo en 5 minutos",
    resumen:
      "Si tu empresa está fuera de Estados Unidos y vende por Mercatren, tienes que firmar un W-8BEN-E para poder cobrar. Aquí te decimos dónde está, qué pide y por qué, con capturas del propio panel.",
    fecha: "2026-08-22",
    temas: ["comercios", "cobros", "fiscal", "W-8BEN-E", "retiros"],
    cuerpo: [
      {
        tipo: "aviso",
        tono: "acento",
        titulo: "En una línea",
        texto:
          "Es un papel que dice «mi empresa NO es de Estados Unidos». Se llena una vez, en español, dentro de tu panel, y vale tres años. Sin él no puedes pedir tus retiros.",
      },
      { tipo: "subtitulo", texto: "¿Qué es el W-8BEN-E?" },
      {
        tipo: "parrafo",
        texto:
          "Es un formulario del IRS —la oficina de impuestos de Estados Unidos— con el que una empresa extranjera le declara a quien le paga que no es estadounidense. Lo usan Google, YouTube, Amazon y cualquier plataforma de allá que le paga a gente de fuera. Cuando cobras de una empresa de Estados Unidos, ese papel es lo que le permite pagarte sin retenerte impuestos.",
      },
      {
        tipo: "parrafo",
        texto: `${SOCIEDAD.nombre} está registrada en Michigan, Estados Unidos, y es quien te compra la mercancía. Por eso te lo pide. Es lo mismo que te pediría cualquier cliente estadounidense serio.`,
      },
      { tipo: "subtitulo", texto: "¿Por qué hace falta?" },
      {
        tipo: "lista",
        puntos: [
          "Para que podamos pagarte sin retenerte nada. Sin el formulario, una empresa de Estados Unidos tendría que retener una parte de lo que te paga. Con él, no.",
          "Porque el ingreso por la mercancía que nos vendes es tuyo y de tu país: la mercancía se entrega donde tú estás, así que ese dinero no paga impuestos en Estados Unidos. El formulario es lo que lo deja escrito.",
          "Porque el día que un banco o un contador lo pida, está. No queremos que tu dinero se quede parado por un papel que se pudo haber firmado en cinco minutos.",
        ],
      },
      {
        tipo: "aviso",
        tono: "bien",
        titulo: "Esto NO se manda a ninguna oficina de impuestos",
        texto:
          "Ni al IRS ni a la de tu país. Se guarda en tu ficha de Mercatren, por si algún día alguien lo pide. Tú no estás declarando impuestos en ningún lado al llenarlo.",
      },
      { tipo: "subtitulo", texto: "Dónde está" },
      {
        tipo: "parrafo",
        texto:
          "Entra a tu panel y ve a «Mi tienda». Arriba del todo vas a ver una tarjeta naranja que dice «Formulario fiscal (W-8BEN-E)». Ahí mismo se llena.",
      },
      {
        tipo: "imagen",
        src: "/docs/w8bene/1-mi-tienda.png",
        alt: "La tarjeta del formulario fiscal, arriba de la pantalla Mi tienda del panel de Mercatren",
        pie: "Panel → Mi tienda. La tarjeta naranja de arriba es el formulario.",
      },
      { tipo: "subtitulo", texto: "Cómo llenarlo, paso a paso" },
      {
        tipo: "pasos",
        pasos: [
          {
            titulo: "Abre «Firmar y guardar»",
            texto:
              "Toca esa línea dentro de la tarjeta y se despliega el formulario. Lo primero que lees es el aviso de que esto no se manda al IRS.",
          },
          {
            titulo: "Nombre legal de tu empresa",
            texto:
              "Exactamente como está en tu registro mercantil, con sus siglas: «C.A», «S.A.S», «S.R.L»… Es el nombre que va a salir en el documento.",
          },
          {
            titulo: "País donde está registrada",
            texto:
              "Elígelo de la lista. Si tu empresa está registrada en Estados Unidos, Puerto Rico o alguno de sus territorios, este formulario NO es el tuyo: escríbenos y te pedimos el que te toca (el W-9).",
          },
          {
            titulo: "Tipo de empresa",
            texto:
              "Compañía anónima o sociedad mercantil (la mayoría), sociedad de personas, empresario individual, u otra. Si dudas, la primera.",
          },
          {
            titulo: "Dirección, ciudad, estado y código postal",
            texto:
              "La dirección real donde funciona tu empresa. No vale un apartado postal: el IRS lo rechaza. El estado y el código postal son opcionales — no todos los países los usan.",
          },
          {
            titulo: "Identificación fiscal de tu país",
            texto:
              "Tu RIF, NIT, RUT o el número que uses allá. Es opcional, pero si lo tienes, ponlo: le da más peso al documento.",
          },
          {
            titulo: "Quién firma",
            texto:
              "Tu nombre y tu cargo (gerente, director, representante legal…). Tiene que ser alguien con autoridad para firmar por la empresa.",
          },
          {
            titulo: "Lee la declaración y marca la casilla",
            texto:
              "Es una declaración bajo pena de perjurio: que la información es cierta y que la empresa no es estadounidense. Léela entera antes de marcar. Al guardar, queda registrada la fecha, la hora y desde dónde firmaste — eso es lo que convierte la casilla en una firma válida.",
          },
        ],
      },
      {
        tipo: "imagen",
        src: "/docs/w8bene/2-formulario.png",
        alt: "El formulario fiscal desplegado, con los campos de nombre legal, país, tipo de empresa y dirección",
        pie: "El formulario completo. El país se elige de una lista: no admite Estados Unidos.",
      },
      {
        tipo: "imagen",
        src: "/docs/w8bene/3-firma.png",
        alt: "La declaración jurada y la casilla de firma al final del formulario",
        pie: "La declaración va entera y a la vista. Se lee, se marca la casilla y se guarda.",
      },
      { tipo: "subtitulo", texto: "Qué pasa después" },
      {
        tipo: "parrafo",
        texto:
          "Al guardar, sale el documento oficial ya lleno y firmado, en inglés, como lo exige el IRS, con tu información. Lo puedes ver e imprimir desde «Mi tienda → Ver mi documento». No tienes que mandárselo a nadie.",
      },
      {
        tipo: "imagen",
        src: "/docs/w8bene/4-documento.png",
        alt: "El documento W-8BEN-E generado, en inglés, con los datos de la empresa y la certificación",
        pie: "El documento que sale al firmar. Es el formulario sustituto que acepta el IRS, con tu información.",
      },
      {
        tipo: "tabla",
        encabezados: ["Pregunta", "Respuesta"],
        filas: [
          [
            "¿Cuánto vale?",
            "Tres años: hasta el 31 de diciembre del tercer año después de firmar. Te avisamos 60 días antes de que venza.",
          ],
          [
            "¿Cada cuánto lo lleno?",
            "Una vez cada tres años, o antes si cambia algo de tu empresa (nombre, dirección, país).",
          ],
          ["¿Me cobran por esto?", "No. Es gratis."],
          [
            "¿Puedo cobrar mientras lo lleno?",
            "No: los retiros se frenan hasta que esté al día. Por eso conviene hacerlo el primer día.",
          ],
          [
            "¿Y si mi empresa es de Estados Unidos?",
            "Entonces este no es tu formulario. Escríbenos y te pedimos el W-9.",
          ],
        ],
      },
      {
        tipo: "aviso",
        tono: "ojo",
        titulo: "Si ya lo firmaste y tienes que corregir algo",
        texto:
          "Entra a Mi tienda y toca «Volver a firmar». Se reemplaza el anterior y el plazo de tres años arranca de nuevo desde esa fecha.",
      },
    ],
    enlaces: [
      { texto: "Ir a Mi tienda", href: "/panel/mi-tienda" },
      { texto: "Cómo funciona Mercatren", href: "/como-funciona" },
      {
        texto: "El IVA de tu país: por qué va dentro del precio",
        href: "/docs/impuestos-comercios-fuera-de-estados-unidos",
      },
    ],
  },
  {
    slug: "pagar-por-zelle-te-sale-mas-barato",
    tipo: "novedad",
    titulo: "Ahora ves cuánto te ahorras pagando por Zelle",
    resumen:
      "El total del pedido cambia según cómo pagues, y el checkout ya te enseña la diferencia antes de que confirmes.",
    fecha: "2026-08-07",
    temas: ["novedades", "precios", "zelle", "compradores"],
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "Los precios del catálogo llevan incorporado lo que cobra el procesador de tarjetas. Es correcto cuando pagas con tarjeta, porque ese costo existe de verdad. Pero por Zelle no hay procesador: la transferencia no cuesta nada.",
      },
      {
        tipo: "parrafo",
        texto:
          "Desde hoy el checkout calcula el total según la forma de pago que elijas, y te dice cuánto te ahorras si eliges Zelle. Antes te mostraba siempre el total de tarjeta y el pedido salía más barato después de confirmar; eso ya no pasa.",
      },
      {
        tipo: "tabla",
        encabezados: ["Total con tarjeta", "Total por Zelle", "Te ahorras"],
        filas: [
          ["$105.47", "$103.10", "$2.37"],
          ["$526.08", "$515.47", "$10.61"],
          ["$2,103.37", "$2,061.86", "$41.51"],
        ],
        nota: "Zelle está disponible en compras desde $200. Por debajo de eso, la tarjeta es la vía.",
      },
      {
        tipo: "subtitulo",
        texto: "Y para los comercios, lo que cobras no cambia",
      },
      {
        tipo: "parrafo",
        texto:
          "Tú cobras el precio de tu factura, completo, se pague como se pague. El costo de cobrar por una vía o por otra corre por nuestra cuenta y ya está considerado en el precio que publicamos.",
      },
      {
        tipo: "aviso",
        tono: "ojo",
        titulo: "Corregimos un desajuste",
        texto:
          "Entre el 5 y el 7 de agosto, en las ventas cobradas por Zelle se descontaba un punto porcentual de más al comercio. Ya está corregido y las cuentas vuelven a cuadrar. Si tienes una venta de esos días y quieres revisarla, escríbenos.",
      },
    ],
    enlaces: [{ texto: "Cómo se forma el precio", href: "/vender/comisiones" }],
  },
  {
    slug: "ya-puedes-vender-a-credito",
    tipo: "novedad",
    titulo: "Ya puedes darle crédito a tus clientes de confianza",
    resumen:
      "Los comercios de Mercatren ya pueden dar cupo de compra a sus clientes, controlar los abonos y cobrar cada pago desde su panel.",
    fecha: "2026-08-06",
    temas: ["novedades", "crédito", "comercios"],
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "Desde hoy, un comercio de Mercatren puede darle cupo de compra a sus clientes de confianza. Es algo que muchos ya hacían por su cuenta —con un cuaderno o de memoria— y que ahora queda registrado, al día y con el dinero entrando solo.",
      },
      {
        tipo: "parrafo",
        texto:
          "La idea salió de un distribuidor de repuestos de moto en Venezuela: sus clientes le compran dos mil dólares y le pagan en partes a lo largo del mes. Nos preguntó cómo llevar eso a Mercatren, y esto es la respuesta.",
      },
      { tipo: "subtitulo", texto: "Qué cambia para un comercio" },
      {
        tipo: "lista",
        puntos: [
          "Puede darle un cupo a cada cliente, con su tope y sus días de plazo.",
          "Ve en una sola pantalla quién le debe, cuánto y desde cuándo.",
          "Cada abono que entra se le paga a su cuenta, sin esperar a que el cliente termine.",
          "El cupo se libera a medida que el cliente abona, así que puede seguir vendiéndole.",
        ],
      },
      {
        tipo: "aviso",
        tono: "ojo",
        titulo: "El crédito sigue siendo del comercio",
        texto:
          "Quien decide a quién fiarle, cuánto y a cuántos días es el comercio, y el riesgo de la venta es suyo. Mercatren lleva la cuenta y cobra los abonos, pero no presta dinero ni responde por el pago.",
      },
      {
        tipo: "parrafo",
        texto:
          "Está disponible en el panel, en la sección Créditos. Si tienes un comercio en Mercatren y quieres usarlo, escríbenos y lo activamos.",
      },
    ],
    enlaces: [
      { texto: "Cómo funciona, en detalle", href: "/docs/ventas-a-credito" },
    ],
  },
  {
    slug: "ventas-a-credito",
    tipo: "documentacion",
    titulo: "Ventas a crédito: cómo funciona en Mercatren",
    resumen:
      "Cómo un comercio le da cupo de compra a sus clientes de confianza, controla los abonos y cobra cada pago, sin que Mercatren preste dinero.",
    fecha: "2026-08-06",
    temas: ["crédito", "comercios", "cobros", "cupo"],
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "Muchos comercios venden a crédito: conocen a su cliente, le entregan la mercancía y él paga en partes. Funciona porque el comercio sabe a quién le está fiando. Lo que suele faltar es el control — cuánto lleva abonado cada uno, cuánto falta, quién se atrasó.",
      },
      {
        tipo: "parrafo",
        texto:
          "Mercatren pone ese control. El comercio sigue decidiendo a quién le da crédito y por cuánto; lo que aporta la plataforma es el cupo, el registro de cada abono y el dinero entrando a su cuenta.",
      },
      {
        tipo: "aviso",
        tono: "ojo",
        titulo: "El crédito lo da el comercio, no Mercatren",
        texto: `El comercio decide a quién, cuánto y a cuántos días, y entrega la mercancía bajo su propio acuerdo con su cliente. ${SOCIEDAD.nombre} no presta dinero ni sale de garante: si un cliente no paga, esa cuenta es entre él y su proveedor.`,
      },
      { tipo: "subtitulo", texto: "Cómo entra el dinero" },
      {
        tipo: "parrafo",
        texto:
          "Cada abono del cliente es una compra-venta completa y cerrada. Cuando el cliente abona 300 dólares, Mercatren le compra al comercio 300 dólares de mercancía de su inventario y se los paga. Al siguiente abono, otra compra. Así hasta completar.",
      },
      {
        tipo: "parrafo",
        texto: `Por eso ${SOCIEDAD.nombre} nunca financia nada: sigue comprando y revendiendo mercancía, que es su figura de siempre. Prestar dinero en Estados Unidos exige licencias estatales de prestamista, y este modelo no las necesita porque no presta.`,
      },
      { tipo: "subtitulo", texto: "Paso a paso" },
      {
        tipo: "pasos",
        pasos: [
          {
            titulo: "El comercio acuerda el crédito con su cliente",
            texto:
              "Por fuera de la plataforma, como siempre lo ha hecho: le pide los documentos que considere y decide si le fía y hasta cuánto.",
          },
          {
            titulo: "Le activa el cupo desde su panel",
            texto:
              "En Créditos, con el menú de tres puntos, pone el tope y los días de plazo. Queda registrado quién lo activó y cuándo.",
          },
          {
            titulo: "El cliente compra con su cupo",
            texto:
              "Arma su pedido normal. Solo él ve la opción de pagar con su cupo; ningún otro comprador de esa tienda sabe que ese comercio da crédito.",
          },
          {
            titulo: "El comercio entrega la mercancía",
            texto:
              "Bajo su acuerdo con el cliente. Mercatren registra que el pedido salió, pero la entrega y su condición las maneja el comercio.",
          },
          {
            titulo: "El cliente abona cuando puede",
            texto:
              "Ve exactamente cuánto debe y abona lo que quiera, con su comprobante, como cualquier pago del sitio.",
          },
          {
            titulo: "El dinero entra y el cupo se libera",
            texto:
              "Validado el abono, Mercatren le compra esa parte al comercio y se la paga. El cupo del cliente se libera por ese monto.",
          },
        ],
      },
      { tipo: "subtitulo", texto: "Un ejemplo con números" },
      {
        tipo: "tabla",
        encabezados: [
          "Cuándo",
          "Qué hace el cliente",
          "Entra al comercio",
          "Queda debiendo",
          "Cupo disponible",
        ],
        filas: [
          ["Día 1", "Compra y se lleva la mercancía", "—", "$2.000", "$0"],
          ["Día 1", "Abona $500", "$500", "$1.500", "$500"],
          ["Día 15", "Abona $1.200", "$1.200", "$300", "$1.700"],
          ["Día 27", "Abona $300", "$300", "$0", "$2.000"],
        ],
        nota: "Con un cupo de $2.000 a 30 días. Cada abono libera cupo: el cliente puede volver a comprar sin esperar a saldar todo.",
      },
      { tipo: "subtitulo", texto: "Lo que ve cada uno" },
      {
        tipo: "lista",
        puntos: [
          "El comercio: la lista de sus clientes con crédito, con el cupo de cada uno, lo que debe y lo que le queda disponible.",
          "El cliente: cuánto lleva abonado de su compra, cuánto falta, cuándo vence y la lista de sus abonos con fecha.",
          "Nadie más: un comprador cualquiera de esa tienda no ve que el comercio da crédito.",
        ],
      },
      {
        tipo: "aviso",
        tono: "neutro",
        titulo: "Cómo se activa",
        texto:
          "El cupo se activa desde el menú de tres puntos del cliente, nunca desde un botón suelto. Es una decisión de dinero y no puede dispararse por un clic mal dado; además, cada activación queda firmada con la cuenta que la hizo y la fecha.",
      },
    ],
    enlaces: [
      {
        texto: "Documento completo del modelo (PDF)",
        href: "/docs/mercatren-ventas-a-credito.pdf",
      },
    ],
  },
  {
    slug: "cobrar-por-enlace",
    tipo: "documentacion",
    titulo: "Cobrar por enlace: la guía completa para tu comercio",
    resumen:
      "Cómo creas un enlace de cobro desde tu panel, qué ve quien paga (tarjeta o Zelle desde $200), cómo lo reenvías a quien de verdad paga, y cómo lo devuelves, cancelas o revives.",
    fecha: "2026-08-23",
    temas: ["comercios", "cobros", "zelle", "tarjeta", "enlace de cobro"],
    cuerpo: [
      {
        tipo: "aviso",
        tono: "acento",
        titulo: "En una línea",
        texto:
          "Un enlace de cobro es una página de pago con tu referencia y tu monto. Se la mandas por correo o WhatsApp a quien va a pagar —tu cliente o su familiar en Estados Unidos— y cuando paga, el cobro aparece pagado en tu panel.",
      },
      { tipo: "subtitulo", texto: "Dónde está" },
      {
        tipo: "parrafo",
        texto:
          "En tu panel: Ventas → Cobros → pestaña «Enlaces de cobro». Ahí está el formulario para crear uno y la lista de los que ya creaste, con su estado.",
      },
      {
        tipo: "imagen",
        src: "/blog/cobra-por-enlace-sin-programar-nada/1-panel-enlaces-de-cobro.png",
        alt: "El formulario de «Pedir un cobro» en el panel de Mercatren, con monto, referencia, correo y los cargos de flete y manejo.",
        pie: "Ventas → Cobros → Enlaces de cobro.",
      },
      { tipo: "subtitulo", texto: "Cómo se crea, paso a paso" },
      {
        tipo: "pasos",
        pasos: [
          {
            titulo: "Monto",
            texto:
              "Lo que vale la mercancía, en dólares, con decimales (45.90).",
          },
          {
            titulo: "Referencia",
            texto:
              "El número de TU factura. Es lo que va a aparecer en la conciliación y en el extracto de quien paga.",
          },
          {
            titulo: "Correo de quien paga",
            texto:
              "Puede ser tu cliente o la persona que paga por él. A ese correo le llega el enlace.",
          },
          {
            titulo: "Flete y manejo (opcional)",
            texto:
              "Dos renglones aparte, cada uno con su explicación: el transporte y el manejo (carga, subida a un piso, embalaje). Así la factura no dice que la mercancía costó más de lo que costó.",
          },
          {
            titulo: "Días de vigencia",
            texto:
              "Siete por defecto, hasta quince. Si vence, lo revives con la misma referencia y el mismo enlace.",
          },
          {
            titulo: "Crear",
            texto:
              "El correo sale solo. Además ves el enlace en pantalla para copiarlo y mandarlo por WhatsApp.",
          },
        ],
      },
      { tipo: "subtitulo", texto: "Qué ve quien paga" },
      {
        tipo: "parrafo",
        texto:
          "Una página con el desglose (mercancía, flete, manejo), tu nombre y dos formas de pagar: tarjeta, o Zelle cuando el monto es de $200 en adelante. Con Zelle se le pide que escriba el número de conciliación en la nota de la transferencia: ese número le justifica la salida de su cuenta y a nosotros la entrada en la nuestra.",
      },
      {
        tipo: "imagen",
        src: "/blog/cobra-por-enlace-sin-programar-nada/2-pagina-de-pago.png",
        alt: "La página de pago de un enlace de cobro con el desglose de mercancía, flete y manejo, y los métodos de pago.",
        pie: "La página que recibe quien paga.",
      },
      {
        tipo: "imagen",
        src: "/blog/cobra-por-enlace-sin-programar-nada/3-pagar-por-zelle.png",
        alt: `Los tres pasos para pagar por Zelle: la cuenta a nombre de ${SOCIEDAD.nombre}, el número de conciliación y la captura del comprobante.`,
        pie: "Pagar por Zelle: tres pasos en hilo.",
      },
      { tipo: "subtitulo", texto: "Reenviar, devolver, cancelar, revivir" },
      {
        tipo: "lista",
        puntos: [
          "Reenviar: el botón «Reenviar» manda el mismo enlace otra vez, con la misma referencia. No se crea otro cobro.",
          "Devolver: solo lo pagado con tarjeta, desde el desplegable del cobro, con motivo obligatorio. Un Zelle no tiene marcha atrás: se devuelve con una transferencia nueva hecha por una persona.",
          "Cancelar: un cobro abierto o vencido se apaga y deja de ser pagable. Uno pagado no se cancela.",
          "Revivir: un cobro vencido se reactiva conservando referencia y enlace; el correo que ya mandaste vuelve a funcionar.",
        ],
      },
      {
        tipo: "aviso",
        tono: "neutro",
        titulo: "¿Tu sistema hace las facturas?",
        texto:
          "Puede crear los cobros solo, sin tocar el panel: la API de socios recibe monto, referencia y correo y devuelve el enlace. Está descrita en la especificación OpenAPI y en la guía para desarrolladores.",
      },
    ],
    enlaces: [
      { texto: "API y agentes de IA", href: "/docs/api-y-agentes-de-ia" },
      { texto: "Cómo se forma el precio", href: "/vender/comisiones" },
    ],
  },
  {
    slug: "api-y-agentes-de-ia",
    tipo: "documentacion",
    titulo: "API y agentes de IA: cómo conectarse a Mercatren",
    resumen:
      "Lo que está abierto sin credenciales (catálogo, búsqueda, Markdown, servidor MCP), lo que lleva token de tienda (cobros por enlace y sincronización de catálogo) y cómo se pide el acceso.",
    fecha: "2026-08-23",
    temas: ["desarrolladores", "api", "agentes", "mcp", "openapi"],
    cuerpo: [
      {
        tipo: "aviso",
        tono: "acento",
        titulo: "En una línea",
        texto:
          "Leer el catálogo es público. Cobrar y sincronizar catálogos lleva un token de tienda que entrega el equipo. No hay servidor OAuth, y no se publica uno que no existe.",
      },
      { tipo: "subtitulo", texto: "Lo público" },
      {
        tipo: "tabla",
        encabezados: ["Qué", "Dónde", "Para qué"],
        filas: [
          [
            "Catálogo por tandas",
            "GET /datos/catalogo?pagina=1&todas=1",
            "Los productos publicados, 24 por tanda; con q= busca por palabras (con sinónimos).",
          ],
          [
            "Sugerencias",
            "GET /datos/buscar?q=",
            "Productos y comercios que calzan mientras se escribe.",
          ],
          [
            "Servidor MCP",
            "POST /datos/mcp",
            "JSON-RPC 2.0, Streamable HTTP: buscar_productos, ver_producto, listar_tiendas, ver_tienda.",
          ],
          [
            "Markdown para agentes",
            "cualquier página con Accept: text/markdown",
            "La ficha, la tienda, el artículo o la portada en Markdown, con x-markdown-tokens.",
          ],
          ["Salud", "GET /datos/salud", "ok y si la base contesta."],
          [
            "OpenAPI 3.1",
            "/datos/openapi.json",
            "La especificación de todo lo anterior y de la API de socios.",
          ],
        ],
      },
      { tipo: "subtitulo", texto: "Cómo se descubre" },
      {
        tipo: "lista",
        puntos: [
          "/.well-known/api-catalog — el catálogo de la API (RFC 9727).",
          "/.well-known/mcp/server-card.json — la tarjeta del servidor MCP.",
          "/.well-known/agent-skills/index.json — los skills: «comprar en Mercatren» y «cobrar por Mercatren», con su SHA-256.",
          "/.well-known/ai-catalog.json — el manifiesto ARD.",
          "/auth.md y /.well-known/oauth-protected-resource — cómo se consigue acceso y qué recurso está protegido.",
          "/llms.txt — el resumen para asistentes.",
        ],
      },
      { tipo: "subtitulo", texto: "Probar el MCP en treinta segundos" },
      {
        tipo: "parrafo",
        texto:
          'Manda un POST a /datos/mcp con {"jsonrpc":"2.0","id":1,"method":"tools/list"} y recibes las cuatro herramientas. Después {"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"buscar_productos","arguments":{"consulta":"bicicleta"}}} y recibes los resultados con título, precio, comercio y enlace.',
      },
      { tipo: "subtitulo", texto: "La API de socios (con token)" },
      {
        tipo: "parrafo",
        texto: `Con Authorization: Bearer <token de la tienda>, un sistema crea cobros por enlace (POST /datos/socios/cobro), consulta su estado (GET /datos/socios/cobro?referencia=), los reactiva y los cancela, empuja su catálogo (POST /datos/socios/productos) y lee lo que cambió aquí (GET /datos/socios/cambios?desde=). El token lo entrega el equipo al vincular la tienda: escribe a ${CORREO_CONTACTO} con el nombre de la tienda y para qué lo quieres. Una plataforma socia obtiene el token de cada tienda con su llave en POST /datos/socios/vincular.`,
      },
      {
        tipo: "aviso",
        tono: "ojo",
        titulo: "Guárdalo bien",
        texto: `El token va en el servidor, nunca en el navegador ni en un repositorio público. Para rotarlo o revocarlo, escribe a ${CORREO_CONTACTO}.`,
      },
    ],
    enlaces: [
      { texto: "OpenAPI 3.1", href: "/datos/openapi.json" },
      { texto: "auth.md", href: "/auth.md" },
      { texto: "Cobrar por enlace: la guía", href: "/docs/cobrar-por-enlace" },
    ],
  },

  {
    slug: "impuestos-comercios-fuera-de-estados-unidos",
    tipo: "documentacion",
    titulo:
      "Impuestos fuera de Estados Unidos: el IVA va dentro del precio y el formulario fiscal se firma una vez",
    resumen:
      "Si tu empresa está en Venezuela, Colombia o cualquier país fuera de Estados Unidos, esto es lo que tienes que saber: quién le vende a quién, por qué el IVA va dentro de tu precio, cómo lo desglosas cuando recibes el dinero y qué papel firmas para poder cobrar. Con capturas del panel.",
    fecha: "2026-09-03",
    temas: ["comercios", "fiscal", "IVA", "W-8BEN-E", "cobros", "retiros"],
    cuerpo: [
      {
        tipo: "aviso",
        tono: "acento",
        titulo: "En una línea",
        texto: `${SOCIEDAD.nombre} es una empresa de Estados Unidos que te COMPRA la mercancía y te paga en dólares. Los impuestos de tu país —el IVA— son tuyos: van DENTRO del precio que escribes, y los desglosas allá cuando recibes el dinero. Mercatren no los agrega, no los cobra aparte y no los declara por ti.`,
      },
      {
        tipo: "subtitulo",
        texto: "Quién le vende a quién (y por qué importa para el IVA)",
      },
      {
        tipo: "parrafo",
        texto: `Cada venta en Mercatren son dos operaciones, no una. El comprador en Estados Unidos le paga a ${SOCIEDAD.nombre} el precio publicado. ${SOCIEDAD.nombre} te compra a ti esa mercancía —te emite una orden de compra a su nombre— y tú la entregas a la persona designada en tu país. Tú le facturas a ${SOCIEDAD.nombre}, no a quien retira.`,
      },
      {
        tipo: "lista",
        puntos: [
          `Tu cliente, en los papeles, es ${SOCIEDAD.nombre}: una empresa de ${SOCIEDAD.estado}, Estados Unidos.`,
          "La factura al comprador la emite Mercatren bajo las leyes de Estados Unidos. Ahí tu IVA no existe: no se puede poner como un renglón, y por eso no hay —ni va a haber— un botón de «cobrar IVA».",
          "Lo que tú declaras en tu país es TU venta a Mercatren, por el monto exacto de cada orden de compra.",
        ],
      },
      { tipo: "subtitulo", texto: "Por qué el IVA va dentro del precio" },
      {
        tipo: "parrafo",
        texto:
          "En tu panel, el precio que escribes en cada producto es «lo que quieres recibir». El sistema le suma su ajuste y publica el total; a ti te llega exactamente lo que escribiste. Si tu país te exige IVA sobre lo que vendes, ese IVA tiene que estar dentro de ese número: es la única forma de que te llegue.",
      },
      {
        tipo: "imagen",
        src: "/docs/impuestos/1-precio.png",
        alt: "La casilla del precio en el formulario de producto del panel de Mercatren, con la ayuda que dice que el precio va con los impuestos del país ya dentro",
        pie: "Panel → Mis productos → el precio. Lo que escribes aquí es lo que te pagamos, con tus impuestos ya dentro.",
      },
      {
        tipo: "aviso",
        tono: "ojo",
        titulo: "No lo cobres dos veces",
        texto:
          "No le pidas al comprador que pague el IVA aparte, ni nos pidas que lo sumemos al final: el precio ya lo trae. Y no lo subas tú por encima del ajuste del sistema, que también ya está dentro.",
      },
      {
        tipo: "tabla",
        encabezados: [
          "Lo que escribes como precio",
          "Lo que te pagamos",
          "Cómo lo desglosa tu contador (con IVA del 16 %)",
        ],
        filas: [
          ["$116.00", "$116.00", "Base $100.00 + IVA $16.00"],
          ["$100.00", "$100.00", "Base $86.21 + IVA $13.79"],
        ],
        nota: "El 16 % es la tasa general de Venezuela hoy; la que te aplica a ti la confirma tu contador. La cuenta es la misma con cualquier tasa.",
      },
      {
        tipo: "subtitulo",
        texto: "Cómo desglosarlo cuando te llega el dinero",
      },
      {
        tipo: "pasos",
        pasos: [
          {
            titulo: "Abre la orden de compra de cada venta",
            texto: `Panel → Dinero → «Mis facturas a Mercatren». Ahí está, venta por venta, el monto exacto que ${SOCIEDAD.nombre} te compra. Ese es el número que se declara.`,
          },
          {
            titulo: "Emítele tu factura a Mercatren por ese monto",
            texto: `Con los datos fiscales de tu empresa —los mismos que cargaste en «Mi tienda»— y a nombre de ${SOCIEDAD.nombre}. El desglose base + IVA lo hace tu contador con la tasa que te aplique.`,
          },
          {
            titulo: "Pide tu retiro cuando quieras",
            texto:
              "Lo que recibes en el banco es ese mismo dinero. Si tu contador pide el detalle, en Órdenes y en Cobros hay un botón para descargar tus ventas en Excel.",
          },
        ],
      },
      {
        tipo: "imagen",
        src: "/docs/impuestos/2-datos-empresa.png",
        alt: "La tarjeta de datos de la empresa en Mi tienda: razón social, identificación fiscal, correo y dirección",
        pie: "Panel → Mi tienda → Datos de la empresa. De aquí salen tus datos en cada orden de compra.",
      },
      {
        tipo: "subtitulo",
        texto:
          "El formulario fiscal de Estados Unidos (W-8BEN-E): se firma una vez",
      },
      {
        tipo: "parrafo",
        texto: `Estás recibiendo dinero de una empresa de Estados Unidos. Sin ese formulario, ${SOCIEDAD.nombre} tendría que retener una parte de lo que te paga; con él, te paga completo. Y como la mercancía se entrega en tu país, ese ingreso no paga impuestos en Estados Unidos: el formulario es lo que lo deja escrito. Se llena en español, dentro de tu panel, y vale tres años. Sin él no puedes pedir tus retiros.`,
      },
      {
        tipo: "imagen",
        src: "/docs/w8bene/1-mi-tienda.png",
        alt: "La tarjeta del formulario fiscal, arriba de la pantalla Mi tienda del panel de Mercatren",
        pie: "Panel → Mi tienda. La tarjeta naranja de arriba es el formulario.",
      },
      {
        tipo: "imagen",
        src: "/docs/w8bene/4-documento.png",
        alt: "El documento W-8BEN-E ya firmado, tal como queda guardado en la ficha del comercio",
        pie: "Así queda guardado, con fecha y firma. No se manda a ninguna oficina de impuestos.",
      },
      {
        tipo: "boton",
        texto: "Cómo llenar el W-8BEN-E paso a paso",
        href: "/docs/formulario-fiscal-w8ben-e",
      },
      {
        tipo: "aviso",
        tono: "bien",
        titulo: "Ese formulario NO es una declaración de impuestos",
        texto:
          "No va al IRS ni a la oficina de impuestos de tu país. Se guarda en tu ficha de Mercatren por si un banco o un contador lo pide. Tú no estás declarando nada en Estados Unidos al firmarlo.",
      },
      {
        tipo: "subtitulo",
        texto: "En resumen: qué haces tú y qué hacemos nosotros",
      },
      {
        tipo: "tabla",
        encabezados: ["Qué", "Quién"],
        filas: [
          [
            "Poner el precio de cada producto con tus impuestos ya dentro",
            "Tú",
          ],
          [
            "Cobrarle al comprador en Estados Unidos y emitirle su factura",
            "Mercatren",
          ],
          [
            `Comprarte la mercancía, con orden de compra a nombre de ${SOCIEDAD.nombre}`,
            "Mercatren",
          ],
          [
            "Facturarle a Mercatren y declarar tu venta en tu país",
            "Tú, con tu contador",
          ],
          ["Firmar el W-8BEN-E", "Tú, una vez cada tres años"],
          [
            "Sumar, cobrar aparte o declarar el IVA de tu país",
            "Nadie: no existe en Mercatren",
          ],
        ],
      },
      {
        tipo: "aviso",
        tono: "neutro",
        titulo: "Esto explica cómo funciona Mercatren, no es asesoría fiscal",
        texto:
          "Cómo se declara en tu país lo decide tu contador con tus papeles. Si tiene dudas sobre el modelo, mándale esta página o escríbenos.",
      },
    ],
  },
];
