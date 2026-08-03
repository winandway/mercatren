import type { Documento } from "./tipos";

/**
 * El modelo de negocio de Mercatren, en publico.
 *
 * Es la version comercial del documento operativo: explica el ciclo, por donde
 * entra y sale cada dolar y por que la operacion no es un envio de remesas.
 * Los apartados de encuadre regulatorio, controles internos y plan de
 * crecimiento no se publican aqui; van en el PDF completo, que se entrega a
 * bancos y socios bajo pedido.
 */
export const MODELO_ES: Documento = {
  titulo: "Comercio electrónico transfronterizo con liquidación doméstica",
  subtitulo:
    "Cómo funciona el ciclo, por dónde entra y sale cada dólar, qué evidencia queda en cada paso y por qué la operación no constituye envío de remesas.",
  resumen:
    "Mercatren es un servicio de compras internacionales por cuenta ajena: un comercio fuera de Estados Unidos publica sus productos, alguien en Estados Unidos los compra y nosotros cobramos y liquidamos ese pago dentro de Estados Unidos. Cobramos 3 % por la gestión.",
  version: "V2",
  actualizado: "3 de agosto de 2026",

  entradilla: [
    "Mercatren es un servicio de compras internacionales por cuenta ajena. Un comercio en Venezuela publica sus productos en nuestra plataforma; una persona en Estados Unidos compra esos productos y designa a quién se entregan; nosotros cobramos ese pago dentro de Estados Unidos y lo aplicamos, siguiendo instrucción escrita del comercio, al pago de su proveedor mayorista, también en Estados Unidos. Cobramos 3 % por la gestión.",
  ],

  cifras: [
    {
      valor: "0 US$",
      texto: "sale de Estados Unidos en cualquier punto del ciclo",
    },
    {
      valor: "3 %",
      texto: "comisión sobre el valor de la orden; es todo nuestro ingreso",
    },
    {
      valor: "1",
      texto: "cliente comercial activo hoy; el modelo está en fase piloto",
    },
    { valor: "5 años", texto: "de conservación de registros por operación" },
  ],

  ideasClave: [
    {
      titulo: "Uno",
      texto:
        "No es un envío lineal de dinero de A hacia B: es un ciclo cerrado que se retroalimenta. El pago de hoy repone el inventario que genera la venta de mañana.",
    },
    {
      titulo: "Dos",
      texto:
        "Todo el circuito de dinero ocurre dentro de Estados Unidos, y nada de lo que Mercatren mueve cruza la frontera. El abastecimiento del comercio lo resuelve su proveedor a través de su propia sucursal local, sin intervención nuestra.",
    },
    {
      titulo: "Tres",
      texto:
        "El comercio no es nuestro. Es un cliente independiente que nos contrata como agente de compras y de cobro, igual que contrataría a un despachante o a una casilla de envíos.",
    },
  ],

  indiceTitulo: "Cómo leer este documento",

  secciones: [
    {
      id: "que-es",
      numero: "1",
      titulo: "Qué es Mercatren y con qué no debe confundirse",
      etiqueta: "posicionamiento",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "La forma más corta de decirlo: somos un agente de compras transnacional con plataforma propia. El modelo se parece al de un personal shopper o al de un despachante de aduanas, pero opera como comercio electrónico y a escala de software.",
        },
        {
          tipo: "parrafo",
          texto:
            "Existe un vacío concreto que este modelo llena. Un comercio venezolano tiene clientes cuyo poder de compra está en Estados Unidos, y tiene proveedores a los que debe pagar en Estados Unidos. Hoy resuelve esas dos puntas por separado y de forma artesanal: el cliente busca cómo hacer llegar el pago, y el comercio busca cómo juntar dólares para su proveedor. Mercatren conecta las dos puntas en una sola operación documentada y las convierte en una compra.",
        },
        {
          tipo: "dosColumnas",
          izquierda: {
            titulo: "Lo que sí somos",
            tono: "bien",
            puntos: [
              "Operador de una plataforma de comercio electrónico.",
              "Agente de cobro designado por el comercio vendedor.",
              "Gestor administrativo de compras internacionales.",
              "Proveedor de software y de conciliación documental.",
            ],
          },
          derecha: {
            titulo: "Lo que no somos",
            tono: "ojo",
            puntos: [
              "No enviamos remesas ni dinero entre particulares.",
              "No hacemos cambio de divisas ni operamos con bolívares.",
              "No compramos mercancía para revenderla: no somos dueños de inventario.",
              "No captamos depósitos ni pagamos rendimientos.",
              "No transportamos, importamos, despachamos ni financiamos ningún movimiento de mercancía.",
            ],
          },
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "Sobre el comercio piloto",
          parrafos: [
            "La ferretería con la que operamos hoy es una empresa venezolana independiente, con sus propios dueños, su propio inventario y su propia relación comercial con el proveedor. No es una filial, ni una empresa vinculada, ni un negocio nuestro. Nosotros no fijamos sus precios, no somos dueños de lo que vende y no participamos en su entrega. Es nuestro primer cliente comercial, y en el futuro habrá más.",
          ],
        },
      ],
    },

    {
      id: "quien-es-quien",
      numero: "2",
      titulo: "Quién es quién en la operación",
      etiqueta: "participantes",
      bloques: [
        {
          tipo: "tabla",
          encabezados: ["Parte", "Quién es", "Qué hace y qué no hace"],
          filas: [
            [
              "A · Cliente",
              "Comercio en Venezuela. Empresa independiente",
              "Es nuestro cliente comercial. Publica y administra su propio catálogo en la plataforma, fija sus precios, atiende al consumidor y hace la entrega física dentro de Venezuela. Mantiene por su cuenta una línea de crédito con su proveedor mayorista. Nos designa por escrito como su agente de cobro.",
            ],
            [
              "B · Nosotros",
              "Mercatren, servicio operado por Windoce LLC. Sociedad registrada en Estados Unidos",
              "Opera la plataforma, verifica y acepta las órdenes, recibe los pagos en Estados Unidos, concilia cada depósito contra su orden, emite la documentación, cobra su comisión del 3 % y ejecuta la liquidación al proveedor autorizado siguiendo instrucción escrita del cliente A. No es dueña de mercancía ni asume el riesgo comercial de la venta.",
            ],
            [
              "C · Proveedor",
              "Mayorista en Estados Unidos. Empresa estadounidense",
              "Es el proveedor de A y su acreedor comercial. Le vende mercancía y le otorga crédito. Recibe de nosotros pagos que se aplican a facturas concretas y preexistentes entre él y A. En este caso tiene sucursal propia en Venezuela, y el abastecimiento de A es un asunto interno suyo en el que Mercatren no interviene.",
            ],
            [
              "D · Pagador",
              "Comprador en Estados Unidos. Persona residente en EE. UU.",
              "Compra los productos y designa a quién se entregan en Venezuela, normalmente un familiar. Jurídicamente es un comprador de bienes, no un remitente de fondos: paga un precio de compra contra una orden identificada, no transfiere dinero a una persona.",
            ],
            [
              "— · Beneficiario",
              "Consumidor final en Venezuela",
              "Elige el producto en el mostrador o en el catálogo y lo recibe. No recibe dinero en ningún momento ni interviene en el pago.",
            ],
          ],
        },
        {
          tipo: "aviso",
          tono: "acento",
          titulo: "La distinción que sostiene todo el modelo",
          parrafos: [
            "En una remesa hay un remitente que entrega dinero y un beneficiario que lo recibe. Aquí no existe ninguno de los dos: hay un comprador que paga un precio y un destinatario que recibe un producto. Nadie en Venezuela recibe fondos en ningún momento del ciclo.",
          ],
        },
      ],
    },

    {
      id: "el-ciclo",
      numero: "3",
      titulo: "El ciclo completo, en un mapa",
      etiqueta: "diagrama principal",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Este es el diagrama central del documento. Conviene leerlo como un circuito que gira, no como una cadena que termina: el paso 7 alimenta al paso 1 del ciclo siguiente.",
        },
        { tipo: "figuraCiclo" },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "Por qué es un ciclo y no un envío",
          parrafos: [
            "El pago del paso 4 no termina en el paso 6. Al quedar su cuenta al día, el comercio conserva su línea de crédito y puede seguir vendiendo, y esa venta origina la próxima orden. Cada vuelta del ciclo aumenta su capacidad comercial. Por eso la métrica que importa no es cuántos pagos procesamos, sino cuántas veces gira el ciclo por comercio y por mes.",
          ],
        },
      ],
    },

    {
      id: "los-siete-movimientos",
      numero: "4",
      titulo: "Los siete movimientos, uno por uno",
      etiqueta: "proceso",
      bloques: [
        {
          tipo: "pasos",
          pasos: [
            {
              numero: "1",
              etiqueta: "Consumidor final → Comercio · dentro de Venezuela",
              titulo: "El consumidor elige el producto y lo aparta",
              parrafos: [
                "Un cliente llega al mostrador o al catálogo en línea del comercio y pide uno o varios productos. El comercio cotiza en dólares y aparta la mercancía. Mercatren todavía no ha intervenido.",
              ],
            },
            {
              numero: "2",
              etiqueta: "Comercio → Mercatren · información",
              titulo: "El comercio registra la orden en la plataforma",
              parrafos: [
                "El comercio carga la orden con los productos, las cantidades y el monto cerrado en dólares. El sistema genera un número de orden único, con sello de tiempo, y emite un enlace de pago asociado exclusivamente a esa orden.",
                "Aquí no se mueve dinero. Solo se crea el registro que después tendrá que calzar, dólar por dólar, con el depósito recibido.",
              ],
            },
            {
              numero: "3",
              etiqueta: "Consumidor → Pagador en EE. UU. · información",
              titulo: "El enlace llega a quien va a pagar",
              parrafos: [
                "El consumidor comparte el enlace con su familiar o allegado en Estados Unidos, que es quien realiza la compra. El enlace muestra qué se está comprando, a qué comercio, por cuánto y quién lo recibirá.",
                "Esta transparencia es deliberada: el pagador no está enviando dinero a una persona, está comprando bienes identificados a un comercio identificado.",
              ],
            },
            {
              numero: "4",
              etiqueta: "Pagador → Mercatren · dinero, dentro de EE. UU.",
              titulo:
                "El pagador liquida la orden y nosotros verificamos y aceptamos",
              parrafos: [
                "El pago se recibe por Zelle en la cuenta bancaria de Mercatren en Estados Unidos. El apartado 7 explica por qué Zelle y no tarjeta.",
                "Este es el punto de control del modelo. Nada se acepta automáticamente: verificamos la identidad del pagador, contrastamos su nombre contra listas de sanciones, comprobamos que el monto recibido calce exactamente con la orden y revisamos que no haya patrones de fraccionamiento. Solo entonces la orden pasa a estado aceptado. Si algo no cuadra, se rechaza y se devuelve, y queda registrado el motivo.",
              ],
            },
            {
              numero: "5",
              etiqueta: "Mercatren → Comercio → Consumidor",
              titulo: "Confirmado el pago, el comercio entrega",
              parrafos: [
                "La plataforma notifica al comercio que la orden está pagada y aceptada. El comercio entrega el producto al consumidor en Venezuela y registra la entrega en el sistema.",
                "Conviene subrayar el orden: la entrega ocurre aquí, no al final. Los pasos 6 y 7 corren después y por un carril distinto. Confundir ambos carriles es lo que hace que el modelo parezca un envío de dinero cuando no lo es.",
              ],
            },
            {
              numero: "6",
              etiqueta:
                "Mercatren → Proveedor mayorista · dinero, dentro de EE. UU.",
              titulo: "Liquidación consolidada al proveedor autorizado",
              parrafos: [
                "Los cobros se acumulan en el saldo del comercio. Cuando el comercio lo instruye por escrito, identificando las facturas concretas que quiere abonar, ejecutamos una transferencia consolidada a su proveedor en Estados Unidos.",
                "Consolidar no es una preferencia estética: reduce costos de transferencia, produce una conciliación limpia entre lotes de órdenes y pagos, y evita el patrón de cientos de micropagos que cualquier área de cumplimiento bancario mira con recelo. Cada transferencia se aplica a facturas comerciales preexistentes entre el proveedor y el comercio.",
              ],
            },
            {
              numero: "7",
              etiqueta: "Proveedor → Comercio · fuera del alcance de Mercatren",
              titulo: "El crédito queda vigente y el inventario se repone",
              parrafos: [
                "Con su cuenta al día, el comercio mantiene su línea de crédito y sigue abasteciéndose. En este caso el proveedor tiene sucursal propia en Venezuela, de modo que el suministro es un asunto interno entre el proveedor y su cliente.",
                "Mercatren no transporta, no importa, no despacha, no financia el transporte y no controla ese movimiento. Nuestra intervención termina cuando la liquidación queda ejecutada y documentada en Estados Unidos.",
              ],
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "Los dos carriles del proceso",
          parrafos: [
            "Los pasos 1 a 5 son el carril comercial: pedido, compra, pago, entrega. Ocurren en horas. El paso 6 es el carril de liquidación: agrupa muchas órdenes y ocurre en días o semanas. El paso 7 no es nuestro, es el abastecimiento que el proveedor resuelve con su cliente. Confundir estos tres carriles es lo que hace que el modelo parezca un envío de dinero cuando no lo es.",
          ],
        },
      ],
    },

    {
      id: "que-cruza-la-frontera",
      numero: "5",
      titulo: "Qué cruza la frontera y qué no",
      etiqueta: "diagrama comparativo",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Esta es la comparación que responde de una vez la pregunta que abre cualquier revisión de cumplimiento. En una remesa el dinero cruza la frontera. Aquí no cruza nada de lo que nosotros movemos.",
        },
        { tipo: "figuraFrontera" },
        {
          tipo: "tabla",
          encabezados: ["Dimensión", "Envío de remesas", "Mercatren"],
          filas: [
            [
              "Qué se contrata",
              "Transferencia de fondos",
              "Compra de productos identificados",
            ],
            [
              "Quién recibe",
              "Una persona, en efectivo o en cuenta",
              "Un proveedor mayorista, contra facturas",
            ],
            ["Dónde termina el dinero", "Venezuela", "Estados Unidos"],
            [
              "Conversión de divisa",
              "Sí, es parte del servicio",
              "Ninguna; todo el ciclo es en dólares",
            ],
            ["Qué recibe el beneficiario", "Dinero", "Un producto físico"],
            [
              "Base documental",
              "Orden de envío",
              "Orden de compra, factura y comprobante de aplicación",
            ],
            [
              "Quién mueve la mercancía",
              "No hay mercancía",
              "El proveedor, por su cuenta. Mercatren no interviene",
            ],
            [
              "Si la operación se anula",
              "Se devuelve dinero",
              "Se devuelve el precio de una compra no ejecutada",
            ],
          ],
        },
      ],
    },

    {
      id: "evidencia",
      numero: "6",
      titulo: "Ciclo de vida de una orden y su evidencia",
      etiqueta: "trazabilidad",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Cada orden atraviesa cuatro fases y en cada una queda un rastro documental específico. Un revisor debe poder tomar cualquier depósito del extracto bancario y reconstruir hacia atrás qué se compró, quién pagó, a qué comercio y adónde fue aplicado el dinero.",
        },
        {
          tipo: "fases",
          fases: [
            {
              titulo: "Fase 1 · Origen de la orden",
              ocurre:
                "El comercio carga el producto y el precio. Se crea la orden con número único y monto en dólares cerrado.",
              evidencia: [
                "Contrato marco con el comercio",
                "Verificación del comercio y de sus dueños",
                "Ficha del producto",
                "Orden con folio y sello de tiempo",
                "Contraste del comercio contra listas de sanciones",
              ],
            },
            {
              titulo: "Fase 2 · Cobro y verificación",
              ocurre:
                "El pagador en EE. UU. liquida la orden. Mercatren identifica al pagador y valida que el monto calce con la orden.",
              evidencia: [
                "Comprobante del pago",
                "Identidad del pagador",
                "Contraste del pagador contra listas de sanciones",
                "Registro de aceptación o de rechazo, con motivo",
                "Términos aceptados por el pagador",
              ],
            },
            {
              titulo: "Fase 3 · Conciliación",
              ocurre:
                "Cada depósito se cruza contra su orden. Se separa la comisión del 3 % y se agrupa el saldo por liquidar.",
              evidencia: [
                "Extracto bancario",
                "Conciliación orden ↔ abono",
                "Factura de Mercatren por la comisión del 3 %",
                "Estado de cuenta del comercio",
                "Libro contable del período",
              ],
            },
            {
              titulo: "Fase 4 · Liquidación",
              ocurre:
                "Con instrucción escrita del comercio, se paga al proveedor autorizado un consolidado que cubre un lote de órdenes.",
              evidencia: [
                "Instrucción de pago del comercio",
                "Facturas del proveedor",
                "Contraste del proveedor contra listas de sanciones",
                "Comprobante de la transferencia",
                "Acuse de aplicación del proveedor",
              ],
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "acento",
          titulo: "Regla de oro",
          parrafos: [
            "Ninguna orden avanza de fase sin su evidencia completa. Una orden sin pagador identificado o sin instrucción escrita del comercio no se liquida.",
          ],
        },
        { tipo: "subtitulo", texto: "Cómo se reconstruye una operación" },
        {
          tipo: "parrafo",
          texto:
            "La prueba práctica de un expediente bien construido es la trazabilidad en ambos sentidos:",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Del depósito hacia atrás",
              texto:
                "un abono en el extracto lleva al comprobante de pago, de ahí al número de orden, de ahí al catálogo del comercio y al detalle de productos, y de ahí a la identidad verificada del pagador.",
            },
            {
              titulo: "De la transferencia hacia atrás",
              texto:
                "un pago al proveedor lleva a la instrucción escrita del comercio, de ahí a las facturas concretas que abona, y de ahí al lote de órdenes cuyos cobros lo financiaron.",
            },
            {
              titulo: "Del ingreso hacia la contabilidad",
              texto:
                "nuestra factura de comisión del 3 % es el único ingreso reconocido. El resto es saldo de terceros en tránsito, y así figura en los libros.",
            },
          ],
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "Punto contable que conviene fijar desde el inicio",
          parrafos: [
            "El ingreso de Mercatren es la comisión, no el valor bruto de las órdenes. Registrar el volumen transaccionado como ingreso propio inflaría artificialmente los estados financieros y, más importante, sugeriría que somos dueños de esos fondos. No lo somos: son saldos de nuestros clientes comerciales.",
          ],
        },
      ],
    },

    {
      id: "por-que-zelle",
      numero: "7",
      titulo: "Por qué cobramos por Zelle y no con tarjeta",
      etiqueta: "decisión de cobro",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Esta pregunta aparece siempre y merece una respuesta con números, no con adjetivos. La respuesta corta: con una comisión del 3 %, la tarjeta se lleva prácticamente todo el margen, y además reintroduce un riesgo de reversión que en este modelo no se puede absorber.",
        },
        {
          tipo: "tabla",
          encabezados: [
            "Método",
            "Costo sobre US$ 1.000",
            "Acreditación",
            "¿Reversible?",
            "Veredicto",
          ],
          filas: [
            ["Zelle", "US$ 0,00", "Minutos", "No", "Elegido"],
            [
              "ACH del banco",
              "≈ US$ 0,50",
              "2 a 3 días",
              "Sí, hasta 60 días",
              "Reserva",
            ],
            [
              "ACH vía Stripe",
              "US$ 5,00",
              "2 a 3 días",
              "Sí, hasta 60 días",
              "Reserva",
            ],
            [
              "Tarjeta doméstica",
              "US$ 29,30",
              "2 días al payout",
              "Sí, contracargo",
              "Descartado",
            ],
            ["Wire doméstico", "US$ 25 – 40", "Mismo día", "No", "Inviable"],
            [
              "Tarjeta extranjera",
              "US$ 44,30",
              "2 días al payout",
              "Sí, contracargo",
              "Pérdida",
            ],
          ],
          nota: "Costo de cobro sobre una orden de US$ 1.000, frente a una comisión bruta de US$ 30. Tarifas de Stripe según fuentes públicas de 2026: 2,9 % + US$ 0,30 para tarjeta doméstica, con recargo de 1,5 % para tarjeta emitida fuera de EE. UU.; ACH al 0,8 % con tope de US$ 5. Wire doméstico según tarifario de la banca minorista.",
        },
        {
          tipo: "subtitulo",
          texto: "Las tres razones, en orden de importancia",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Primera: el margen no aguanta",
              texto:
                "Sobre una orden de US$ 1.000 la comisión bruta es de US$ 30. Una tarjeta doméstica cuesta US$ 29,30. Queda un margen de setenta centavos por orden, antes de cualquier otro gasto. Con tarjeta emitida fuera de Estados Unidos el costo sube a unos US$ 44,30 y la orden se procesa a pérdida. Y este efecto empeora con el ticket alto, que es exactamente el perfil de una ferretería: un pedido de tres mil dólares en materiales paga casi noventa dólares de comisión de tarjeta.",
            },
            {
              titulo:
                "Segunda: el contracargo es un riesgo que no se puede cubrir",
              texto:
                "En este modelo la mercancía se entrega en Venezuela. Si semanas después llega un contracargo, el producto ya no existe como garantía y no hay forma de recuperarlo. Un solo contracargo perdido sobre una orden de US$ 1.000 significa perder el importe más las tarifas de disputa, del orden de US$ 1.030. Con un margen de US$ 0,70 por orden con tarjeta, haría falta procesar más de mil cuatrocientas órdenes para reponer ese único incidente. Zelle, en cambio, no admite reversión: una vez acreditado, el pago es definitivo.",
            },
            {
              titulo: "Tercera: las alternativas intermedias no resuelven",
              texto:
                "ACH es barato pero tarda dos o tres días y, sobre todo, admite devolución. Cuando el pago viene de una cuenta de consumidor, la ventana para reclamar una transacción como no autorizada llega a los sesenta días calendario, mucho después de que el producto se haya entregado. El wire doméstico es inmediato e irreversible, pero cuesta entre veinticinco y cuarenta dólares que paga el propio comprador, lo cual lo vuelve inviable para compras al menudeo.",
            },
          ],
        },
        { tipo: "subtitulo", texto: "Lo que hay que vigilar de Zelle" },
        {
          tipo: "parrafo",
          texto:
            "Sería deshonesto presentar a Zelle sin sus límites. Son tres y conviene tenerlos escritos:",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Techos por transacción y por período",
              texto:
                "Los bancos fijan límites propios para cuentas de empresa y no siempre los publican. Hay que negociarlos con el banco y confirmarlos por escrito antes de escalar el volumen.",
            },
            {
              titulo: "Presión regulatoria en curso",
              texto:
                "La demanda federal contra el operador de Zelle fue desestimada de forma definitiva en marzo de 2025, pero la acción de la Fiscalía General de Nueva York sigue viva y en 2026 el tribunal rechazó desestimarla. De prosperar, podría introducir obligaciones de reembolso por transferencias inducidas. No hay cambios de política implementados a la fecha, pero es un riesgo a monitorear.",
            },
            {
              titulo: "Es un riel de consumidor",
              texto:
                "Zelle resuelve bien la fase piloto. El destino natural al escalar son los rieles instantáneos de empresa —RTP y FedNow—, que son irrevocables, liquidan en segundos las veinticuatro horas, admiten importes de hasta diez millones de dólares por operación y tienen costo interbancario de céntimos. Conviene plantearle esta ruta al banco desde la primera conversación.",
            },
          ],
        },
      ],
    },

    {
      id: "economia",
      numero: "8",
      titulo: "La economía de una orden",
      etiqueta: "márgenes",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "El ingreso es uno solo: la comisión del 3 % sobre el valor de la orden. Todo lo demás que pasa por la cuenta es saldo de terceros.",
        },
        {
          tipo: "aviso",
          tono: "neutro",
          titulo: "Base de los números",
          parrafos: [
            "Las cifras de esta sección usan un ticket de referencia de US$ 1.000 y un lote de veinte órdenes por liquidación. Son supuestos ilustrativos, no datos observados. Deben sustituirse por el ticket medio y la frecuencia reales del piloto en cuanto haya tres meses de operación.",
          ],
        },
        {
          tipo: "tabla",
          encabezados: ["Concepto", "Con Zelle", "Con tarjeta", "Comentario"],
          filas: [
            [
              "Valor de la orden",
              "US$ 1.000,00",
              "US$ 1.000,00",
              "No es ingreso nuestro",
            ],
            [
              "Comisión bruta (3 %)",
              "US$ 30,00",
              "US$ 30,00",
              "Único ingreso reconocido",
            ],
            ["Costo de cobro", "US$ 0,00", "− US$ 29,30", "Tarjeta doméstica"],
            [
              "Costo de liquidación",
              "− US$ 1,25",
              "− US$ 1,25",
              "Un wire de US$ 25 repartido entre 20 órdenes",
            ],
            [
              "Margen bruto por orden",
              "US$ 28,75",
              "− US$ 0,55",
              "Antes de plataforma y personal",
            ],
            ["Margen sobre la comisión", "96 %", "negativo", ""],
          ],
        },
        { tipo: "subtitulo", texto: "Qué hay que medir en el piloto" },
        {
          tipo: "parrafo",
          texto:
            "Para presentar el modelo con datos y no con proyecciones, estas son las cinco métricas que el sistema registra desde la primera orden:",
        },
        {
          tipo: "lista",
          puntos: [
            {
              titulo: "Ticket medio por orden",
              texto:
                "determina si el 3 % es sostenible o hay que escalonar la comisión por tramos.",
            },
            {
              titulo: "Vueltas del ciclo por comercio y por mes",
              texto:
                "es la verdadera medida de tracción: un comercio que gira ocho veces vale más que ocho comercios que giran una vez.",
            },
            {
              titulo: "Días entre cobro y liquidación",
              texto:
                "es lo que un banco mira para entender cuánto saldo de terceros se mantiene en la cuenta.",
            },
            {
              titulo: "Tasa de rechazo en verificación",
              texto: "demuestra que el control existe y funciona.",
            },
            {
              titulo: "Pagadores recurrentes por comercio",
              texto:
                "indica si el modelo genera hábito o depende de compras aisladas.",
            },
          ],
        },
      ],
    },

    {
      id: "resumen-final",
      numero: "9",
      titulo: "Resumen final en una página",
      etiqueta: "repaso de cierre",
      bloques: [
        {
          tipo: "parrafo",
          texto:
            "Si alguien solo lee una sección de este documento, que sea esta. Es el modelo completo, sin tecnicismos.",
        },
        { tipo: "figuraResumen" },
        {
          tipo: "aviso",
          tono: "bien",
          titulo: "La frase que resume todo",
          parrafos: [
            "Un comercio venezolano nos contrata para cobrarle a sus compradores en Estados Unidos y para pagar, con ese mismo dinero y siguiendo su instrucción escrita, las facturas que ese comercio tiene con su proveedor estadounidense. Cobramos 3 % por hacerlo. El dinero no sale del país, el beneficiario recibe un producto y no una transferencia, y cada operación queda documentada de punta a punta.",
          ],
        },
      ],
    },
  ],

  figuras: {
    ciclo: {
      titulo: "Ciclo completo de una orden",
      eeuu: "Estados Unidos",
      venezuela: "Venezuela",
      pagador: {
        rol: "D · Pagador",
        nombre: "Familiar o allegado en EE. UU.",
        detalle: "Compra los productos. No envía dinero.",
      },
      mercatren: {
        rol: "B · Operador de la plataforma",
        nombre: "Mercatren",
        detalle:
          "Agente de compras y de cobro del comercio. Registra, verifica, concilia y liquida. Cobra 3 % de comisión por la gestión.",
      },
      proveedor: {
        rol: "C · Proveedor autorizado",
        nombre: "Mayorista en EE. UU.",
        detalle:
          "Acreedor comercial del comercio. Recibe los fondos. Tiene sucursal propia en Venezuela.",
      },
      comercio: {
        rol: "A · Cliente piloto",
        nombre: "Comercio en Venezuela",
        detalle:
          "Empresa independiente. No es de Mercatren. Se abastece de la sucursal local del proveedor.",
      },
      consumidor: {
        rol: "Consumidor final",
        nombre: "Cliente en Venezuela",
        detalle: "Elige el producto y lo recibe.",
      },
      paga: "Paga la orden por Zelle · irrevocable · costo cero · dinero dentro de EE. UU.",
      liquida:
        "Liquida al proveedor · pago consolidado y trazable · dinero dentro de EE. UU.",
      pide: "Pide y aparta el producto",
      entrega: "Entrega el producto al confirmarse el pago",
      enlace: "Comparte el enlace de la orden",
      orden: "Orden registrada y pago confirmado",
      fuera:
        "Fuera del alcance de Mercatren: el proveedor abastece al comercio desde su propia sucursal local. No transportamos, no importamos, no despachamos y no financiamos ningún movimiento de mercancía.",
      pie: "La columna izquierda es Estados Unidos y la derecha es Venezuela. Las líneas gruesas son movimientos de dinero y todas ocurren dentro de Estados Unidos.",
    },
    frontera: {
      remesaTitulo: "Lo que no hacemos · envío de remesas",
      remesaTexto:
        "El dinero cruza la frontera y termina en manos de una persona. Eso es transmisión de fondos.",
      remesaCajas: ["Remitente", "Operador", "Beneficiario"],
      remesaCruza: "el dinero cruza la frontera",
      nuestroTitulo:
        "Lo que sí hacemos · compra de productos con liquidación doméstica",
      nuestroTexto:
        "El dinero entra y sale dentro de EE. UU. Nada de lo que Mercatren mueve atraviesa la frontera.",
      nuestrasCajas: [
        "Pagador",
        "Mercatren",
        "Proveedor",
        "Sucursal del proveedor",
        "Comercio",
        "Consumidor",
      ],
      circuito: "dinero: circuito cerrado dentro de EE. UU.",
      frontera: "EE. UU. · Venezuela",
      consecuencia:
        "Ninguna transferencia sale de Estados Unidos, ningún beneficiario recibe efectivo y no hay conversión de divisas.",
    },
    resumen: {
      pasos: [
        {
          titulo: "Alguien en EE. UU. compra productos",
          detalle: "y dice a quién se los entregan",
        },
        {
          titulo: "Mercatren cobra en Estados Unidos",
          detalle: "verifica, acepta y registra",
        },
        {
          titulo: "Paga al proveedor en Estados Unidos",
          detalle: "contra facturas del cliente",
        },
        {
          titulo: "El comercio entrega en Venezuela",
          detalle: "un producto, nunca dinero",
        },
      ],
      banda: "Todo el dinero ocurre aquí, dentro de Estados Unidos",
      sinDinero: "Aquí no hay dinero",
      afirmaciones: [
        "Nadie en Venezuela recibe dinero en ningún momento. Recibe un producto físico.",
        "Ninguna transferencia sale de Estados Unidos. No hay cambio de divisas.",
        "El comercio es un cliente independiente. Nos designó por escrito como su agente de cobro.",
        "Desde que cobramos, los fondos son del comercio. Los aplicamos donde él nos instruye por escrito.",
        "Nuestro ingreso es solo la comisión del 3 %. El resto es saldo de terceros y así figura en la contabilidad.",
        "Cada orden deja expediente completo: quién compró, qué compró, quién pagó y adónde fue aplicado.",
      ],
    },
  },

  preguntasTitulo: "Si el revisor solo tiene tres preguntas",
  preguntas: [
    {
      pregunta: "¿Sale dinero del país?",
      respuesta:
        "No. Se recibe en una cuenta estadounidense y se paga a una empresa estadounidense. Ninguna entidad financiera venezolana participa en el circuito.",
    },
    {
      pregunta: "¿De quién es el dinero?",
      respuesta:
        "Del comercio vendedor, desde el instante del cobro. Mercatren lo custodia y lo aplica según instrucción escrita. Nuestro ingreso es solo la comisión.",
    },
    {
      pregunta: "¿Qué recibe la persona en Venezuela?",
      respuesta:
        "Un producto físico, entregado por el comercio. Nunca dinero, en ninguna forma.",
    },
  ],

  aviso:
    "Este documento describe un modelo operativo. No constituye asesoramiento legal, contable ni fiscal. Las referencias normativas y las cifras de costos de cobro proceden de fuentes públicas consultadas el 3 de agosto de 2026 y deben verificarse antes de tomar decisiones. La versión completa, que incluye la estructura contractual, el encuadre regulatorio, los controles de cumplimiento y el plan de crecimiento, se entrega a bancos, auditores y socios bajo pedido.",
};
