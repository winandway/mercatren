import type { Documento } from "./tipos";

/**
 * El modelo de negocio de Mercatren, en publico.
 *
 * V1 — LA PRIMERA VERSION REAL (5 ago 2026). Lo publicado antes era un demo
 * escrito sin revision profesional y NO cuenta en el historial: el versionado
 * arranca aqui, con el texto revisado por el abogado y el contable. Si el
 * abogado actualiza una clausula, sube a V2 con su fecha, y de ahi en
 * adelante se lleva historial.
 *
 * REESTRUCTURACION LEGAL (agosto de 2026). La version anterior describia
 * a Mercatren como un agente que cobraba y liquidaba dinero por cuenta de
 * terceros. Esa redaccion coincide, palabra por palabra, con la definicion
 * regulatoria de money transmission en Estados Unidos, y era la causa por la
 * que procesadores y bancos cierran cuentas.
 *
 * El modelo real siempre fue otro: compra y reventa de mercancia por cuenta
 * propia. Windoce, LLC compra al proveedor a nombre propio y revende al
 * comprador estadounidense. La correccion es de redaccion y de documentacion
 * contractual, no de operacion.
 *
 * Vocabulario PROHIBIDO en este archivo y en todo el sitio: cobrar por cuenta
 * de, liquidar, liquidacion, custodia, saldo, fondos, billetera, comision
 * sobre el pago, agente, mandato, pagador, beneficiario, instruccion de pago.
 * Ver el prompt de reestructuracion legal para la tabla completa.
 */
export const MODELO_ES: Documento = {
  titulo:
    "Comercio electrónico transfronterizo con compra y reventa en Estados Unidos",
  subtitulo:
    "Qué vende Mercatren y a quién, cómo se documenta cada operación, por qué la estructura es una compraventa de mercancía y qué evidencia queda en cada paso.",
  resumen:
    "Mercatren es una tienda en línea operada por Windoce, LLC. El comprador en Estados Unidos adquiere un producto del catálogo y designa la dirección donde debe entregarse. Windoce, LLC compra esa mercancía al proveedor a nombre propio y la revende al comprador. El precio publicado es el precio final e incluye nuestro margen comercial.",
  version: "V1",
  actualizado: "5 de agosto de 2026",

  entradilla: [
    "Mercatren es una tienda en línea operada por Windoce, LLC, sociedad registrada en Delaware, Estados Unidos. Un comprador en Estados Unidos elige un producto del catálogo, paga el precio publicado desde un banco estadounidense y designa la dirección donde debe entregarse. Windoce, LLC compra esa mercancía al proveedor a nombre propio, con factura emitida a su nombre, y la revende al comprador, con factura de venta a nombre de este.",
    "No recibimos ni administramos dinero de terceros. Cada transacción es una compraventa de mercancía entre el comprador y Windoce, LLC. El ingreso de la operación es el precio de venta de un producto propio; el egreso es el costo de la mercancía vendida. El producto se entrega físicamente en la dirección designada: en ningún caso se entrega dinero.",
  ],

  cifras: [
    {
      valor: "2",
      texto:
        "facturas por operación: la de compra al proveedor y la de venta al comprador",
    },
    {
      valor: "100 %",
      texto: "de los pagos aceptados provienen de bancos de Estados Unidos",
    },
    {
      valor: "0",
      texto:
        "cuentas, saldos de usuario o dinero de terceros bajo nuestra administración",
    },
    { valor: "5 años", texto: "de conservación de registros por operación" },
  ],

  ideasClave: [
    {
      titulo: "Uno",
      texto:
        "La estructura es una compraventa. Windoce, LLC compra la mercancía como principal y la revende como principal. La propiedad del producto pasa del proveedor a Windoce, LLC y de Windoce, LLC al comprador.",
    },
    {
      titulo: "Dos",
      texto:
        "El dinero que entra es ingreso propio por la venta de un producto, no dinero de un tercero. El dinero que sale es costo de mercancía vendida, no un pago por cuenta de nadie.",
    },
    {
      titulo: "Tres",
      texto:
        "El comprador de registro es la persona en Estados Unidos. La persona en la dirección de entrega recibe un producto físico, exactamente igual que cuando alguien compra un regalo en línea y lo hace enviar a otra dirección.",
    },
  ],

  indiceTitulo: "Cómo leer este documento",

  secciones: [
    /* ---------------------------------------------------------------- */
    {
      id: "resumen-ejecutivo",
      numero: "1",
      titulo: "Resumen ejecutivo: qué vende Mercatren y a quién",
      etiqueta: "posicionamiento",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Mercatren vende productos físicos a compradores residentes en Estados Unidos. Opera como una tienda en línea con catálogo, carrito, pago y factura, y es un servicio de Windoce, LLC (Delaware, Estados Unidos).",
        },
        {
          tipo: "parrafo",
          texto:
            "Lo que distingue al servicio es dónde se entrega. Muchos compradores en Estados Unidos quieren adquirir un producto y hacerlo llegar a una dirección en otro país: material de construcción para una obra familiar, repuestos, electrodomésticos. Mercatren publica catálogos de proveedores con presencia en esos destinos, vende el producto al comprador estadounidense y hace que se entregue en la dirección que él designa.",
        },
        {
          tipo: "dosColumnas",
          izquierda: {
            titulo: "Lo que sí somos",
            tono: "bien",
            puntos: [
              "Una tienda en línea que vende mercancía por cuenta propia.",
              "Comprador de esa mercancía frente al proveedor, con factura a nombre de Windoce, LLC.",
              "Vendedor frente al comprador estadounidense, con factura de venta a su nombre.",
              "Responsables del precio publicado, que es el precio final de venta.",
            ],
          },
          derecha: {
            titulo: "Lo que no somos",
            tono: "ojo",
            puntos: [
              "No somos una entidad financiera y no ofrecemos cuentas.",
              "No mantenemos dinero de terceros ni administramos dinero ajeno.",
              "No entregamos dinero a nadie: entregamos productos.",
              "No actuamos como representantes de ninguna de las partes.",
              "No hacemos cambio de divisas ni operamos con moneda distinta del dólar estadounidense.",
            ],
          },
        },
        {
          tipo: "aviso",
          tono: "acento",
          titulo: "La frase que resume la estructura",
          parrafos: [
            "Mercatren compra la mercancía a nombre propio y la revende al comprador en Estados Unidos. El precio publicado es el precio final de venta e incluye nuestro margen comercial.",
          ],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    {
      id: "estructura-contractual",
      numero: "2",
      titulo: "Estructura contractual",
      etiqueta: "quién contrata con quién",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Cada operación son dos contratos de compraventa consecutivos, no un encargo. Windoce, LLC es parte de los dos, y en los dos actúa como principal: compra para sí y vende lo suyo.",
        },
        {
          tipo: "tabla",
          encabezados: ["Parte", "Quién es", "Qué contrata"],
          filas: [
            [
              "A · Comprador",
              "Persona en Estados Unidos",
              "Compra un producto a Windoce, LLC y paga el precio publicado desde un banco estadounidense. Designa la dirección de entrega y responde por su exactitud. Recibe factura de venta a su nombre.",
            ],
            [
              "B · Windoce, LLC",
              "Sociedad registrada en Delaware, Estados Unidos. Opera la marca Mercatren",
              "Compra la mercancía al proveedor a nombre propio y la revende al comprador. Fija y publica el precio final de venta. Emite la factura de venta y conserva la factura de compra. Asume el riesgo comercial de la operación.",
            ],
            [
              "C · Proveedor",
              "Comercio que publica su catálogo en Mercatren",
              "Vende la mercancía a Windoce, LLC y le emite factura a su nombre. Despacha el producto a la dirección designada en la orden. Cobra el precio de la mercancía vendida contra su factura.",
            ],
            [
              "— · Dirección de entrega",
              "Domicilio designado por el comprador",
              "No es parte del contrato. Es el lugar donde debe entregarse el producto. Quien lo recibe firma la entrega de una mercancía; no recibe dinero en ninguna forma.",
            ],
          ],
        },
        {
          tipo: "subtitulo",
          texto: "El flujo documental de una operación",
        },
        {
          tipo: "fases",
          fases: [
            {
              titulo: "1. Orden de compra",
              ocurre:
                "El comprador confirma su pedido y paga el precio publicado.",
              evidencia: [
                "Orden con número correlativo, productos, precio unitario y total",
                "Dirección de entrega designada por el comprador",
                "Identificación del comprador y confirmación de que el pago proviene de un banco de Estados Unidos",
              ],
            },
            {
              titulo: "2. Factura del proveedor a Windoce, LLC",
              ocurre:
                "Windoce, LLC compra la mercancía al proveedor a nombre propio.",
              evidencia: [
                "Factura emitida por el proveedor a nombre de Windoce, LLC",
                "Detalle de la mercancía y precio de compra",
                "Referencia a la orden que la origina",
              ],
            },
            {
              titulo: "3. Factura de venta al comprador",
              ocurre:
                "Windoce, LLC revende la mercancía al comprador estadounidense.",
              evidencia: [
                "Factura de venta emitida por Windoce, LLC a nombre del comprador",
                "Precio final de venta, el mismo que estaba publicado",
                "Vinculación con la orden y con la factura de compra",
              ],
            },
            {
              titulo: "4. Comprobante de entrega",
              ocurre:
                "El producto se entrega en la dirección designada por el comprador.",
              evidencia: [
                "Constancia de entrega con fecha",
                "Identificación de quien recibe la mercancía",
                "Cierre de la orden en el sistema",
              ],
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "Por qué importa que las dos facturas existan",
          parrafos: [
            "Sin la factura de compra a nombre de Windoce, LLC, la figura de reventa no se sostiene ante una auditoría: quedaría una entrada de dinero sin una compra que la respalde. Con las dos facturas, cada operación se lee como lo que es — una mercancía comprada y revendida — y el margen comercial aparece como diferencia entre dos precios, no como un porcentaje retenido sobre dinero ajeno.",
          ],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    {
      id: "el-ciclo",
      numero: "3",
      titulo: "La operación completa, en un mapa",
      etiqueta: "diagrama principal",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Este es el diagrama central del documento. A la izquierda, dentro de Estados Unidos, ocurre toda la operación comercial: la venta al comprador y la compra al proveedor. A la derecha, lo único que se mueve es el producto.",
        },
        { tipo: "figuraCiclo" },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "Las dos puntas son compraventas",
          parrafos: [
            "El comprador no entrega dinero para que llegue a alguien: paga el precio de un producto que compró. Windoce, LLC no aplica ese dinero a la cuenta de un tercero: compra con recursos propios la mercancía que ya vendió. Son dos compraventas encadenadas, y cada una queda documentada con su factura.",
          ],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    {
      id: "los-movimientos",
      numero: "4",
      titulo: "La operación paso a paso",
      etiqueta: "proceso",
      bloques: [
        {
          tipo: "pasos",
          pasos: [
            {
              numero: "1",
              etiqueta: "Comprador · Estados Unidos",
              titulo: "El comprador elige el producto y confirma su pedido",
              parrafos: [
                "El comprador entra al catálogo de Mercatren, elige uno o varios productos y confirma el pedido. El sistema vuelve a leer de la base el precio y la disponibilidad de cada producto en ese momento: el precio que se cobra es el precio publicado, no el que traiga guardado el navegador.",
              ],
            },
            {
              numero: "2",
              etiqueta: "Comprador → Windoce, LLC · Estados Unidos",
              titulo:
                "Paga el precio publicado desde un banco de Estados Unidos",
              parrafos: [
                "El comprador paga el precio final de venta. Solo se aceptan pagos originados en bancos de Estados Unidos, y esa comprobación se hace antes de dar la orden por buena. Ese importe es ingreso propio de Windoce, LLC desde el momento de la venta.",
              ],
            },
            {
              numero: "3",
              etiqueta: "Comprador · en el pedido",
              titulo: "Designa la dirección de entrega",
              parrafos: [
                "El comprador indica el domicilio donde debe entregarse el producto y responde por su exactitud. Esa dirección es un dato de la orden, igual que en cualquier compra en línea que se envía a un destinatario distinto de quien paga.",
              ],
            },
            {
              numero: "4",
              etiqueta: "Windoce, LLC → Proveedor",
              titulo: "Windoce, LLC compra la mercancía a nombre propio",
              parrafos: [
                "Con la venta cerrada, Windoce, LLC compra al proveedor la mercancía vendida. El proveedor emite factura a nombre de Windoce, LLC. Esa compra es costo de la mercancía vendida, y se paga contra factura a cuentas bancarias de Estados Unidos.",
              ],
            },
            {
              numero: "5",
              etiqueta: "Proveedor → Dirección designada",
              titulo: "El proveedor despacha el producto",
              parrafos: [
                "El proveedor entrega la mercancía en la dirección designada en la orden. Queda constancia de la entrega con fecha y con la identificación de quien la recibe. Lo que se entrega es un producto físico: en ningún caso se entrega dinero.",
              ],
            },
            {
              numero: "6",
              etiqueta: "Windoce, LLC → Comprador",
              titulo: "Se emite la factura de venta y se cierra la orden",
              parrafos: [
                "Windoce, LLC emite al comprador la factura de venta del producto y cierra la orden. Al final quedan, unidas por el número de orden, la factura de compra a nombre de Windoce, LLC, la factura de venta al comprador y el comprobante de entrega.",
              ],
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "Sobre el proveedor del piloto",
          parrafos: [
            "El comercio con el que operamos hoy es una empresa independiente, con sus propios dueños y su propio inventario. No es una filial ni un negocio nuestro: es un proveedor que nos vende mercancía y nos factura a nombre de Windoce, LLC. Es el primero, y en el futuro habrá más.",
          ],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    {
      id: "encuadre-regulatorio",
      numero: "5",
      titulo: "Encuadre regulatorio",
      etiqueta: "por qué no es money transmission",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "La pregunta que hace cualquier banco o procesador al leer un servicio transfronterizo es si la operación constituye money transmission. Este apartado la responde de frente y con el criterio descriptivo, no con una afirmación de que exista una determinación oficial a favor de la empresa.",
        },
        {
          tipo: "aviso",
          tono: "acento",
          titulo: "El criterio, y por qué la estructura no encaja en él",
          parrafos: [
            "Money transmission describe, en lo esencial, recibir dinero de una persona para transmitirlo o aplicarlo a favor de otra. Los dos elementos tienen que estar presentes: que el dinero recibido sea de un tercero, y que se transmita o aplique en beneficio de otro.",
            "En esta estructura no está ninguno de los dos. El dinero que Mercatren recibe es el precio de un producto que vendió: es ingreso propio de Windoce, LLC desde el momento de la venta, no dinero de un tercero. Y el dinero que sale es el precio de una mercancía que Windoce, LLC compró para sí, con factura a su nombre: es costo de mercancía vendida, no un pago hecho a favor de otro.",
            "Lo que ocurre entre las dos puntas es una transferencia de propiedad de bienes: el producto pasa del proveedor a Windoce, LLC y de Windoce, LLC al comprador. La ganancia es la diferencia entre dos precios de una compraventa.",
          ],
        },
        {
          tipo: "tabla",
          encabezados: [
            "Elemento",
            "En una transmisión de dinero",
            "En esta estructura",
          ],
          filas: [
            [
              "Origen del dinero recibido",
              "Es de un tercero; el operador solo lo tiene en tránsito",
              "Es el precio de venta de un producto propio, ingreso de Windoce, LLC",
            ],
            [
              "Destino del dinero que sale",
              "Se entrega o aplica en beneficio de otra persona",
              "Paga una mercancía comprada por Windoce, LLC, con factura a su nombre",
            ],
            [
              "Objeto del contrato",
              "El movimiento del dinero en sí mismo",
              "La compraventa de un bien, con transferencia de propiedad",
            ],
            [
              "Qué recibe el destinatario",
              "Dinero",
              "Un producto físico. Nunca dinero, en ninguna forma",
            ],
            [
              "Ingreso del operador",
              "Un cargo sobre el importe movido",
              "El margen comercial incluido en el precio de venta",
            ],
          ],
          nota: "Este cuadro describe el criterio de forma general y sirve para situar la estructura. No sustituye la revisión de un abogado de servicios financieros en Estados Unidos.",
        },
        { tipo: "figuraFrontera" },
        {
          tipo: "aviso",
          tono: "ojo",
          titulo: "Lo que este documento no afirma",
          parrafos: [
            "Este apartado describe la estructura de la operación y el criterio general aplicable. No afirma que exista una determinación, opinión o autorización de ninguna autoridad a favor de Windoce, LLC, ni sustituye asesoramiento legal.",
          ],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    {
      id: "controles",
      numero: "6",
      titulo: "Controles de cumplimiento",
      etiqueta: "qué se verifica",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Los controles se ejecutan antes de dar una orden por buena y quedan registrados con ella. No son una declaración de intenciones: cada uno deja evidencia recuperable.",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Identidad del comprador",
              texto:
                "Comprar exige una cuenta con correo verificado. La orden queda unida a esa cuenta y a los datos con los que se abrió.",
            },
            {
              titulo: "Origen del pago",
              texto:
                "Solo se aceptan pagos originados en bancos de Estados Unidos. Los pagos con tarjeta se procesan con un procesador registrado; los pagos por transferencia se comprueban contra el extracto antes de dar la orden por pagada.",
            },
            {
              titulo: "Revisión humana de cada comprobante",
              texto:
                "Ningún pago por transferencia se da por bueno de forma automática. Una persona del equipo comprueba el importe y la fecha contra el banco antes de aprobarlo, y el rechazo obliga a escribir el motivo.",
            },
            {
              titulo: "Separación de funciones",
              texto:
                "Quien vende no aprueba sus propios cobros. El proveedor no tiene permiso para aprobar los pagos de sus propias órdenes.",
            },
            {
              titulo: "Productos prohibidos",
              texto:
                "No se publican ni se venden armas, munición ni explosivos; medicamentos, sustancias controladas ni productos de uso restringido; material sujeto a controles de exportación; animales vivos; divisas, metales monetarios, tarjetas de regalo, criptoactivos ni instrumentos financieros; ni bienes de procedencia ilícita o que infrinjan derechos de terceros.",
            },
            {
              titulo: "Destinos y personas sujetos a sanciones",
              texto:
                "No se acepta una orden cuya dirección de entrega o cuyo comprador corresponda a personas o destinos sujetos a sanciones de Estados Unidos.",
            },
            {
              titulo: "Conservación de registros",
              texto:
                "Cada operación conserva sus documentos durante cinco años: orden, factura de compra, factura de venta, comprobante del pago recibido y constancia de entrega.",
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "Qué hace el sistema y qué hace una persona",
          parrafos: [
            "El sistema impide lo que se puede impedir por regla: comprar sin cuenta, pagar con un método no admitido o vender sin existencias. Lo que exige criterio — comprobar un pago contra el banco, revisar una dirección de entrega dudosa — lo hace una persona identificada, y su decisión queda registrada con su nombre y la fecha.",
          ],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    {
      id: "trazabilidad",
      numero: "7",
      titulo: "Trazabilidad: qué evidencia queda por transacción",
      etiqueta: "evidencia",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Cualquier operación se puede reconstruir entera partiendo de su número de orden. Esto es lo que queda guardado, y es lo que se entrega si un banco, un auditor o un procesador lo pide.",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "La orden",
              texto:
                "Número correlativo y legible, fecha y hora, cuenta del comprador, productos con su precio unitario, total y dirección de entrega designada.",
            },
            {
              titulo: "El pago recibido",
              texto:
                "Método, fecha, importe y comprobante. En los pagos por transferencia, además, la captura aportada por el comprador y el nombre de quien la aprobó.",
            },
            {
              titulo: "La factura de compra",
              texto:
                "Documento emitido por el proveedor a nombre de Windoce, LLC, con el detalle de la mercancía y su precio de compra, unido al número de orden.",
            },
            {
              titulo: "La factura de venta",
              texto:
                "Documento emitido por Windoce, LLC al comprador, con el precio final de venta, unido al mismo número de orden.",
            },
            {
              titulo: "La entrega",
              texto:
                "Constancia con fecha e identificación de quien recibió la mercancía en la dirección designada.",
            },
            {
              titulo: "El rastro de decisiones",
              texto:
                "Quién aprobó o rechazó qué, cuándo y con qué motivo. Las aprobaciones no son anónimas.",
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "acento",
          titulo: "La prueba de que la estructura es real",
          parrafos: [
            "Una estructura de reventa se demuestra con documentos, no con redacción. Si por cada entrada de dinero existe una factura de compra a nombre de Windoce, LLC y una factura de venta al comprador, la operación es lo que este documento dice que es. Si esas facturas faltan, ninguna redacción la sostiene.",
          ],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    {
      id: "crecimiento",
      numero: "8",
      titulo: "Plan de crecimiento",
      etiqueta: "hacia dónde va",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "El servicio está en fase inicial, con un proveedor y un catálogo. El crecimiento es de catálogo y de cobertura, y no cambia la estructura descrita en este documento: cada proveedor nuevo es un proveedor más al que se le compra mercancía con factura a nombre de Windoce, LLC.",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Más proveedores, mismo contrato",
              texto:
                "Cada comercio que publica su catálogo firma el mismo acuerdo de compraventa: nos vende mercancía y nos factura. No se firman acuerdos de representación con ninguno.",
            },
            {
              titulo: "Más ciudades de entrega",
              texto:
                "La cobertura crece por ciudad, según dónde tenga presencia cada proveedor. El comprador ve antes de pagar en qué ciudad se entrega cada producto.",
            },
            {
              titulo: "Más categorías",
              texto:
                "El catálogo abre departamentos a medida que llegan proveedores de cada rubro, dentro de la política de productos prohibidos.",
            },
            {
              titulo: "Pago con tarjeta como método principal",
              texto:
                "El pago con tarjeta procesado por un procesador registrado es el método principal del servicio, por trazabilidad y por comodidad para el comprador.",
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "Lo que no está en el plan",
          parrafos: [
            "No está previsto ofrecer cuentas, mantener dinero de terceros, entregar dinero en ningún destino ni operar con moneda distinta del dólar estadounidense. Si algo de eso llegara a plantearse, sería un servicio distinto, con su propia estructura y su propio encuadre, y no se lanzaría sin la revisión legal correspondiente.",
          ],
        },
      ],
    },

    /* ---------------------------------------------------------------- */
    {
      id: "resumen-final",
      numero: "9",
      titulo: "Resumen final en una página",
      etiqueta: "para llevar",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Si de todo el documento hubiera que quedarse con una página, es esta.",
        },
        { tipo: "figuraResumen" },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "En una frase",
          parrafos: [
            "No recibimos ni administramos dinero de terceros. Cada transacción es una compraventa de mercancía entre el comprador y Windoce, LLC: compramos el producto a nombre propio, lo revendemos al comprador en Estados Unidos y lo entregamos en la dirección que él designa.",
          ],
        },
      ],
    },
  ],

  figuras: {
    ciclo: {
      titulo: "Figura 1",
      eeuu: "Dentro de Estados Unidos",
      venezuela: "Dirección de entrega designada",
      comprador: {
        rol: "A",
        nombre: "Comprador",
        detalle:
          "Persona en Estados Unidos. Compra el producto y designa dónde se entrega",
      },
      mercatren: {
        rol: "B",
        nombre: "Windoce, LLC · Mercatren",
        detalle:
          "Vende el producto al comprador y compra la mercancía al proveedor, a nombre propio",
      },
      proveedor: {
        rol: "C",
        nombre: "Proveedor",
        detalle: "Vende la mercancía a Windoce, LLC y le factura a su nombre",
      },
      comercio: {
        rol: "C",
        nombre: "Despacho del proveedor",
        detalle: "Entrega el producto en la dirección de la orden",
      },
      consumidor: {
        rol: "—",
        nombre: "Quien recibe",
        detalle: "Recibe un producto físico. Nunca dinero",
      },
      paga: "Paga el precio publicado del producto",
      compra: "Compra la mercancía · factura a nombre de Windoce, LLC",
      pide: "El producto sale del inventario del proveedor",
      entrega: "Entrega del producto y constancia con fecha",
      orden: "Viaja la orden: qué producto y a qué dirección",
      enlace: "Vuelve la constancia de entrega, unida al número de orden",
      fuera:
        "Toda la operación comercial —la venta al comprador y la compra al proveedor— ocurre dentro de Estados Unidos, entre partes con cuentas en bancos estadounidenses.",
      pie: "Dos compraventas encadenadas. A la izquierda el circuito comercial completo; a la derecha, únicamente el producto y su constancia de entrega.",
    },

    frontera: {
      noTitulo: "La figura que este modelo NO tiene",
      noTexto:
        "Recibir dinero de una persona para entregárselo a otra. Eso describe money transmission, y no es lo que ocurre aquí.",
      noCajas: [
        "Alguien entrega dinero",
        "Un operador lo tiene en tránsito",
        "Otra persona recibe dinero",
      ],
      noNota:
        "Aquí el dinero es de un tercero y el destinatario recibe dinero. Ninguna de las dos cosas pasa en Mercatren.",
      siTitulo: "La estructura real: compraventa de mercancía",
      siTexto:
        "Dos compraventas con factura, cerradas dentro de Estados Unidos. Lo único que cruza la frontera es el producto.",
      siCajas: ["Comprador en EE. UU.", "Windoce, LLC", "Proveedor"],
      cruzaCajas: ["Producto en camino", "Dirección de entrega"],
      circuito: "Circuito comercial completo dentro de Estados Unidos",
      frontera: "← la raya de puntos es la frontera",
      consecuencia:
        "El dinero que entra es el precio de venta de un producto propio y el que sale es el costo de la mercancía comprada, con factura a nombre de Windoce, LLC. Del otro lado de la frontera no se mueve dinero: se entrega un producto.",
    },

    resumen: {
      pasos: [
        {
          titulo: "Compra",
          detalle:
            "El comprador en Estados Unidos adquiere un producto y paga el precio publicado desde un banco estadounidense.",
        },
        {
          titulo: "Adquisición",
          detalle:
            "Windoce, LLC compra esa mercancía al proveedor a nombre propio, con factura a su nombre.",
        },
        {
          titulo: "Entrega",
          detalle:
            "El proveedor entrega el producto en la dirección designada por el comprador, con constancia de la entrega.",
        },
        {
          titulo: "Factura",
          detalle:
            "Windoce, LLC emite la factura de venta al comprador y cierra la orden con toda su documentación.",
        },
      ],
      banda: "Compraventa de mercancía, con dos facturas por operación",
      sinDinero: "En ningún punto se entrega dinero a nadie",
      afirmaciones: [
        "El dinero recibido es ingreso propio de Windoce, LLC por la venta de un producto.",
        "El dinero pagado al proveedor es costo de la mercancía vendida, con factura a nombre de Windoce, LLC.",
        "La propiedad del producto pasa del proveedor a Windoce, LLC y de Windoce, LLC al comprador.",
        "Quien recibe en la dirección designada recibe un producto físico, nunca dinero.",
        "El precio publicado es el precio final e incluye el margen comercial.",
        "Solo se aceptan pagos originados en bancos de Estados Unidos.",
      ],
    },
  },

  preguntasTitulo: "Las tres preguntas de siempre",
  preguntas: [
    {
      pregunta: "¿Sale dinero del país?",
      respuesta:
        "No. El comprador paga en Estados Unidos y la mercancía se paga contra factura a cuentas bancarias de Estados Unidos. Ninguna institución financiera extranjera participa en la operación.",
    },
    {
      pregunta: "¿De quién es el dinero?",
      respuesta:
        "De Windoce, LLC, desde el momento de la venta. Es el precio de un producto vendido, no dinero de un tercero bajo nuestra administración.",
    },
    {
      pregunta: "¿Qué recibe la persona en la dirección de entrega?",
      respuesta: "Un producto físico. Nunca dinero, en ninguna forma.",
    },
  ],

  aviso:
    "Este documento describe la estructura y la operación del servicio. No constituye asesoramiento legal, contable ni fiscal, y no afirma que exista determinación alguna de una autoridad a favor de Windoce, LLC. Mercatren es un servicio operado por Windoce, LLC (Delaware, Estados Unidos).",
};
