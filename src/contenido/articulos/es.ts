import type { Articulo } from "./tipos";

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
        texto:
          "El comercio decide a quién, cuánto y a cuántos días, y entrega la mercancía bajo su propio acuerdo con su cliente. Windoce, LLC no presta dinero ni sale de garante: si un cliente no paga, esa cuenta es entre él y su proveedor.",
      },
      { tipo: "subtitulo", texto: "Cómo entra el dinero" },
      {
        tipo: "parrafo",
        texto:
          "Cada abono del cliente es una compra-venta completa y cerrada. Cuando el cliente abona 300 dólares, Mercatren le compra al comercio 300 dólares de mercancía de su inventario y se los paga. Al siguiente abono, otra compra. Así hasta completar.",
      },
      {
        tipo: "parrafo",
        texto:
          "Por eso Windoce, LLC nunca financia nada: sigue comprando y revendiendo mercancía, que es su figura de siempre. Prestar dinero en Estados Unidos exige licencias estatales de prestamista, y este modelo no las necesita porque no presta.",
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
