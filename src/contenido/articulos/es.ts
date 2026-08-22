import type { Articulo } from "./tipos";
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
];
