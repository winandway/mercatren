import "server-only";

import { getTranslations } from "next-intl/server";

import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { SITIO } from "@/lib/sitio";

import { CORREO_CONTACTO, CORREO_EQUIPO } from "./direcciones";
import { enviarCorreo } from "./enviar";
import { armarHtml, armarTexto, type PiezasCorreo } from "./plantilla";

/**
 * Los correos que manda el sistema, uno por momento del negocio.
 *
 * Cada funcion arma el mensaje en el idioma del destinatario (el que guardo
 * en su cuenta, no el de quien dispara la accion: un validador que trabaja
 * en espanol puede aprobarle el pago a un cliente que compro en ingles).
 *
 * Ninguna de estas funciones lanza error: avisar es importante, pero nunca
 * mas importante que la operacion que avisa.
 */

type Destinatario = {
  email: string;
  name?: string | null;
  idioma?: string | null;
};

function idiomaDe(d: Destinatario): Idioma {
  return d.idioma === "en" ? "en" : "es";
}

function urlDe(idioma: Idioma, ruta: string) {
  return `${SITIO.url}/${idioma}${ruta}`;
}

/** Piezas comunes: saludo y pie, ya traducidos. */
async function base(d: Destinatario) {
  const idioma = idiomaDe(d);
  const t = await getTranslations({ locale: idioma, namespace: "correos" });

  return {
    idioma,
    t,
    saludo: d.name?.trim()
      ? t("comun.hola", { nombre: d.name.trim().split(" ")[0] })
      : t("comun.holaSinNombre"),
    motivo: t("comun.motivo"),
    contacto: t("comun.contacto"),
  };
}

async function enviar(d: Destinatario, piezas: PiezasCorreo) {
  return enviarCorreo({
    a: d.email,
    asunto: piezas.asunto,
    html: armarHtml(piezas),
    texto: armarTexto(piezas),
  });
}

/** 1. Al crear la cuenta. */
export async function correoBienvenida(d: Destinatario) {
  const { idioma, t, saludo, motivo, contacto } = await base(d);

  return enviar(d, {
    asunto: t("bienvenida.asunto"),
    previo: t("bienvenida.previo"),
    saludo,
    titulo: t("bienvenida.titulo"),
    parrafos: t.raw("bienvenida.parrafos") as string[],
    boton: { texto: t("bienvenida.boton"), url: urlDe(idioma, "") },
    motivo,
    contacto,
  });
}

/** 2. Restablecer la contrasena. La URL la genera Better Auth. */
export async function correoRestablecerClave(d: Destinatario, url: string) {
  const { t, saludo, motivo, contacto } = await base(d);

  return enviar(d, {
    asunto: t("restablecer.asunto"),
    previo: t("restablecer.previo"),
    saludo,
    titulo: t("restablecer.titulo"),
    parrafos: t.raw("restablecer.parrafos") as string[],
    boton: { texto: t("restablecer.boton"), url },
    resaltado: { texto: t("restablecer.aviso"), tono: "neutro" },
    motivo,
    contacto,
  });
}

type DatosPedido = {
  numero: string;
  totalCentavos: number;
  /** Lo que se cobró de envío. Cero o ausente = se retira en el local. */
  envioCentavos?: number;
};

/**
 * 3. Pedido creado: gracias por su compra + el paso que falta + dónde se
 * retira.
 *
 * Los puntos de retiro son opcionales: si el comercio todavía no cargó su
 * depósito, el correo sale igual sin esa fila. Un aviso sin dirección sigue
 * sirviendo; uno que no sale porque faltaba un dato, no.
 */
export async function correoGraciasCompra(
  d: Destinatario,
  pedido: DatosPedido,
  puntos: string[] = [],
) {
  const { idioma, t, saludo, motivo, contacto } = await base(d);

  return enviar(d, {
    asunto: t("graciasCompra.asunto", { numero: pedido.numero }),
    previo: t("graciasCompra.previo"),
    saludo,
    titulo: t("graciasCompra.titulo"),
    parrafos: t.raw("graciasCompra.parrafos") as string[],
    datos: [
      { etiqueta: t("comun.pedido"), valor: pedido.numero },
      /* EL ENVÍO, EN SU PROPIO RENGLÓN. Sin esto el correo enseña un total
         más alto que la suma de los productos y nadie sabe por qué. */
      ...(pedido.envioCentavos && pedido.envioCentavos > 0
        ? [
            {
              etiqueta: t("comun.envio"),
              valor: formatearPrecio(pedido.envioCentavos, idioma),
            },
          ]
        : []),
      {
        etiqueta: t("comun.total"),
        valor: formatearPrecio(pedido.totalCentavos, idioma),
      },
      ...puntos.map((p, i) => ({
        etiqueta:
          puntos.length > 1
            ? `${t("pedidoListo.dondeRetirar")} ${i + 1}`
            : t("pedidoListo.dondeRetirar"),
        valor: p,
      })),
    ],
    /* QUÉ PASA DESPUÉS, según cómo lo vaya a recibir. Antes decía siempre
       "haz el pago por Zelle y sube la captura"; a quien pidió envío le
       faltaba lo que más pregunta, que es quién se lo lleva y cuándo. */
    resaltado: {
      texto:
        pedido.envioCentavos && pedido.envioCentavos > 0
          ? t("graciasCompra.siguienteEnvio")
          : t("graciasCompra.siguiente"),
      tono: "neutro",
    },
    boton: {
      texto: t("graciasCompra.boton"),
      url: urlDe(idioma, `/pedido/${pedido.numero}`),
    },
    motivo,
    contacto,
  });
}

/** 4. Captura subida: esta en la cola de validacion. */
export async function correoComprobanteRecibido(
  d: Destinatario,
  pedido: DatosPedido,
) {
  const { idioma, t, saludo, motivo, contacto } = await base(d);

  return enviar(d, {
    asunto: t("comprobanteRecibido.asunto", { numero: pedido.numero }),
    previo: t("comprobanteRecibido.previo"),
    saludo,
    titulo: t("comprobanteRecibido.titulo"),
    parrafos: t.raw("comprobanteRecibido.parrafos") as string[],
    datos: [
      { etiqueta: t("comun.pedido"), valor: pedido.numero },
      {
        etiqueta: t("comun.monto"),
        valor: formatearPrecio(pedido.totalCentavos, idioma),
      },
    ],
    boton: {
      texto: t("comprobanteRecibido.boton"),
      url: urlDe(idioma, `/pedido/${pedido.numero}`),
    },
    motivo,
    contacto,
  });
}

/**
 * 4b. EL ENLACE DE COBRO que pide un comercio desde su propio sistema.
 *
 * Este correo es el corazón de la integración: la cajera toca un botón y esto
 * sale solo, en ese mismo segundo. Quien lo recibe puede no ser el cliente
 * —muchas veces es su hijo o su socio en Estados Unidos, a quien le
 * reenviaron el correo—, así que **tiene que explicarse solo**: de qué
 * comercio es, qué se está pagando y cuánto.
 */
export async function correoEnlaceDeCobro(
  d: Destinatario,
  cobro: {
    comercio: string;
    referencia: string;
    montoCentavos: number;
    url: string;
  },
) {
  const { idioma, t, saludo, motivo, contacto } = await base(d);

  return enviar(d, {
    asunto: t("enlaceDeCobro.asunto", { comercio: cobro.comercio }),
    previo: t("enlaceDeCobro.previo", {
      monto: formatearPrecio(cobro.montoCentavos, idioma),
    }),
    saludo,
    titulo: t("enlaceDeCobro.titulo", { comercio: cobro.comercio }),
    parrafos: t.raw("enlaceDeCobro.parrafos") as string[],
    datos: [
      { etiqueta: t("enlaceDeCobro.comercio"), valor: cobro.comercio },
      { etiqueta: t("enlaceDeCobro.referencia"), valor: cobro.referencia },
      {
        etiqueta: t("comun.monto"),
        valor: formatearPrecio(cobro.montoCentavos, idioma),
      },
    ],
    boton: { texto: t("enlaceDeCobro.boton"), url: cobro.url },
    motivo,
    contacto,
  });
}

/** 5. El validador aprobo: su compra fue aprobada. */
export async function correoCompraAprobada(
  d: Destinatario,
  pedido: DatosPedido,
) {
  const { idioma, t, saludo, motivo, contacto } = await base(d);

  return enviar(d, {
    asunto: t("compraAprobada.asunto", { numero: pedido.numero }),
    previo: t("compraAprobada.previo"),
    saludo,
    titulo: t("compraAprobada.titulo"),
    parrafos: t.raw("compraAprobada.parrafos") as string[],
    datos: [
      { etiqueta: t("comun.pedido"), valor: pedido.numero },
      /* EL ENVÍO, EN SU PROPIO RENGLÓN. Sin esto el correo enseña un total
         más alto que la suma de los productos y nadie sabe por qué. */
      ...(pedido.envioCentavos && pedido.envioCentavos > 0
        ? [
            {
              etiqueta: t("comun.envio"),
              valor: formatearPrecio(pedido.envioCentavos, idioma),
            },
          ]
        : []),
      {
        etiqueta: t("comun.total"),
        valor: formatearPrecio(pedido.totalCentavos, idioma),
      },
    ],
    boton: {
      texto: t("compraAprobada.boton"),
      url: urlDe(idioma, `/pedido/${pedido.numero}`),
    },
    motivo,
    contacto,
  });
}

/** 6. El validador rechazo: motivo + como resolverlo. */
export async function correoPagoRechazado(
  d: Destinatario,
  pedido: DatosPedido,
  motivoRechazo: string,
) {
  const { idioma, t, saludo, motivo, contacto } = await base(d);

  return enviar(d, {
    asunto: t("pagoRechazado.asunto", { numero: pedido.numero }),
    previo: t("pagoRechazado.previo"),
    saludo,
    titulo: t("pagoRechazado.titulo"),
    parrafos: t.raw("pagoRechazado.parrafos") as string[],
    resaltado: {
      texto: t("pagoRechazado.motivo", { motivo: motivoRechazo }),
      tono: "ojo",
    },
    boton: {
      texto: t("pagoRechazado.boton"),
      url: urlDe(idioma, `/pedido/${pedido.numero}`),
    },
    parrafosFinales: t.raw("pagoRechazado.despues") as string[],
    motivo,
    contacto,
  });
}

/** 7. Al comercio: una venta suya quedo acreditada en su billetera. */
export async function correoVentaAcreditada(
  d: Destinatario,
  venta: { montoCentavos: number; referencia?: string | null },
) {
  const { idioma, t, saludo, motivo, contacto } = await base(d);
  const monto = formatearPrecio(venta.montoCentavos, idioma);

  return enviar(d, {
    asunto: t("ventaAcreditada.asunto", { monto }),
    previo: t("ventaAcreditada.previo"),
    saludo,
    titulo: t("ventaAcreditada.titulo"),
    parrafos: t.raw("ventaAcreditada.parrafos") as string[],
    datos: [
      { etiqueta: t("comun.monto"), valor: monto },
      ...(venta.referencia
        ? [{ etiqueta: t("comun.pedido"), valor: venta.referencia }]
        : []),
    ],
    boton: {
      texto: t("ventaAcreditada.boton"),
      url: urlDe(idioma, "/panel/billetera"),
    },
    motivo,
    contacto,
  });
}

/** 8. Al comercio, cuando el equipo aprueba su tienda: ya puede vender. */
export async function correoComercioAprobado(
  d: Destinatario,
  tienda: { nombre: string },
) {
  const { idioma, t, saludo, motivo, contacto } = await base(d);

  return enviar(d, {
    asunto: t("comercioAprobado.asunto", { tienda: tienda.nombre }),
    previo: t("comercioAprobado.previo"),
    saludo,
    titulo: t("comercioAprobado.titulo"),
    parrafos: [
      t("comercioAprobado.parrafo1", { tienda: tienda.nombre }),
      t("comercioAprobado.parrafo2"),
    ],
    boton: { texto: t("comercioAprobado.boton"), url: urlDe(idioma, "/panel") },
    motivo,
    contacto,
  });
}

/**
 * 9. AL EQUIPO DE MERCATREN, cuando algo espera su acción.
 *
 * Un comercio nuevo por aprobar o un comprobante por validar no pueden
 * depender de que alguien entre al panel a mirar: se avisan al buzón real
 * (CORREO_EQUIPO). Va en español fijo — es interno del equipo.
 */
export async function correoAvisoAlEquipo(aviso: {
  asunto: string;
  lineas: string[];
  url: string;
  boton: string;
}) {
  const piezas: PiezasCorreo = {
    asunto: aviso.asunto,
    previo: aviso.lineas[0] ?? aviso.asunto,
    saludo: "Hola, equipo:",
    titulo: aviso.asunto,
    parrafos: aviso.lineas,
    boton: { texto: aviso.boton, url: aviso.url },
    motivo: "Aviso interno del sistema de Mercatren.",
    contacto: "",
  };

  return enviarCorreo({
    /* Al buzón que el equipo lee todos los días, no al público: de estos
       avisos depende que alguien mire la cola y que a un comercio le llegue su
       dinero. */
    a: CORREO_EQUIPO,
    asunto: piezas.asunto,
    html: armarHtml(piezas),
    texto: armarTexto(piezas),
  });
}

/** 9a. Al equipo: un comercio nuevo espera aprobación. */
export async function correoAvisoComercioNuevo(d: {
  nombre: string;
  razonSocial: string;
  correoContacto: string;
  telefono: string;
  ciudad: string;
  paisOrigen: string;
}) {
  return correoAvisoAlEquipo({
    asunto: `Comercio nuevo por aprobar: ${d.nombre}`,
    lineas: [
      `${d.nombre} (${d.razonSocial}) acaba de registrarse y espera aprobación.`,
      `Contacto: ${d.correoContacto} · ${d.telefono} · ${d.ciudad}, ${d.paisOrigen}.`,
    ],
    url: "https://mercatren.com/es/panel/usuarios",
    boton: "Revisar y aprobar",
  });
}

/**
 * 9a-bis. Al equipo: alguien acaba de crear una cuenta.
 *
 * Va aparte del aviso de comercio nuevo, y hace falta: ese solo salta cuando
 * dan de alta la tienda. Entre que una persona se registra y da de alta su
 * comercio pueden pasar días, y en todo ese tiempo era invisible para nosotros
 * — aunque estuviera dentro del panel chocándose con fallos.
 *
 * Pasó de verdad: un comercio estuvo una tarde entera sin poder cargar
 * productos y nos enteramos porque escribió por WhatsApp.
 */
export async function correoAvisoCuentaNueva(d: {
  email: string;
  name: string;
}) {
  return correoAvisoAlEquipo({
    asunto: `Cuenta nueva: ${d.name}`,
    lineas: [
      `${d.name} acaba de crear una cuenta en Mercatren.`,
      `Correo: ${d.email}`,
      "Todavía no ha dado de alta ningún comercio. Si es un vendedor, hasta que no lo haga no puede cargar productos.",
    ],
    url: "https://mercatren.com/es/panel/usuarios",
    boton: "Ver los usuarios",
  });
}

/** 9b. Al equipo: un comprobante entró a la cola de validación. */
export async function correoAvisoComprobante(numero: string) {
  return correoAvisoAlEquipo({
    asunto: `Comprobante por validar · ${numero}`,
    lineas: [
      `Entró un comprobante del pedido ${numero} y espera validación contra el banco.`,
    ],
    url: "https://mercatren.com/es/panel/validacion",
    boton: "Ir a la cola de validación",
  });
}

/* ========================================================================== *
 *  LOS COBROS DEL COMERCIO
 *
 *  El dinero que sale del banco lo mueve una persona, no el sistema. Por eso
 *  hay tres avisos y no uno: al equipo cuando entra una solicitud (si nadie
 *  mira el panel, nadie transfiere), y al comercio cuando se hizo o cuando no
 *  se pudo. Un comercio esperando una transferencia sin noticias termina
 *  llamando por teléfono, que es exactamente lo que estos correos evitan.
 * ========================================================================== */

/** 10. Al equipo: un comercio pidió cobrar lo suyo. */
export async function correoAvisoRetiroSolicitado(d: {
  comercio: string;
  montoCentavos: number;
  forma: string;
}) {
  const t = await getTranslations({ locale: "es", namespace: "correos" });
  const monto = formatearPrecio(d.montoCentavos, "es");

  return correoAvisoAlEquipo({
    asunto: t("retiroSolicitado.asunto", { monto, comercio: d.comercio }),
    lineas: [
      t("retiroSolicitado.lineaMonto", { monto, comercio: d.comercio }),
      t("retiroSolicitado.lineaForma", { forma: d.forma }),
    ],
    url: "https://mercatren.com/es/panel/retiros",
    boton: t("retiroSolicitado.boton"),
  });
}

/** 11. Al comercio: la transferencia ya salió del banco. */
export async function correoRetiroPagado(
  d: Destinatario,
  retiro: { montoCentavos: number; referencia?: string | null },
) {
  const { idioma, t, saludo, motivo, contacto } = await base(d);
  const monto = formatearPrecio(retiro.montoCentavos, idioma);

  return enviar(d, {
    asunto: t("retiroPagado.asunto", { monto }),
    previo: t("retiroPagado.previo"),
    saludo,
    titulo: t("retiroPagado.titulo"),
    parrafos: t.raw("retiroPagado.parrafos") as string[],
    datos: [
      { etiqueta: t("comun.monto"), valor: monto },
      // La referencia del banco es lo que permite rastrear la transferencia
      // si no aparece. Si el equipo no la anotó, no se inventa una fila.
      ...(retiro.referencia
        ? [{ etiqueta: t("comun.referencia"), valor: retiro.referencia }]
        : []),
    ],
    resaltado: { texto: t("retiroPagado.aviso"), tono: "neutro" },
    boton: {
      texto: t("retiroPagado.boton"),
      url: urlDe(idioma, "/panel/billetera"),
    },
    motivo,
    contacto,
  });
}

/** 12. Al comercio: no se pudo transferir, con el motivo. */
export async function correoRetiroRechazado(
  d: Destinatario,
  retiro: { montoCentavos: number },
  motivoRechazo: string,
) {
  const { idioma, t, saludo, motivo, contacto } = await base(d);
  const monto = formatearPrecio(retiro.montoCentavos, idioma);

  return enviar(d, {
    asunto: t("retiroRechazado.asunto", { monto }),
    previo: t("retiroRechazado.previo"),
    saludo,
    titulo: t("retiroRechazado.titulo"),
    parrafos: t.raw("retiroRechazado.parrafos") as string[],
    resaltado: {
      texto: t("retiroRechazado.motivo", { motivo: motivoRechazo }),
      tono: "ojo",
    },
    boton: {
      texto: t("retiroRechazado.boton"),
      url: urlDe(idioma, "/panel/retiros"),
    },
    parrafosFinales: t.raw("retiroRechazado.despues") as string[],
    motivo,
    contacto,
  });
}

/* ========================================================================== *
 *  EL PEDIDO DESPUÉS DEL PAGO
 *
 *  Mercatren no envía: se retira. El correo que más importa de todos es el
 *  que dice DÓNDE ir a buscar la mercancía — sin él, la persona que pagó
 *  desde Estados Unidos tiene que entrar al sitio a averiguarlo, o llamar al
 *  comercio.
 * ========================================================================== */

/** 13. Al cliente: su pedido está listo para retirar, y dónde. */
export async function correoPedidoListo(
  d: Destinatario,
  pedido: DatosPedido,
  puntos: string[],
) {
  const { idioma, t, saludo, motivo, contacto } = await base(d);

  return enviar(d, {
    asunto: t("pedidoListo.asunto", { numero: pedido.numero }),
    previo: t("pedidoListo.previo"),
    saludo,
    titulo: t("pedidoListo.titulo"),
    parrafos: [
      ...(t.raw("pedidoListo.parrafos") as string[]),
      // Un pedido que sale de dos depósitos son dos viajes. Decirlo antes de
      // la lista evita que la persona lea solo el primero y se vaya.
      ...(puntos.length > 1 ? [t("pedidoListo.variosPuntos")] : []),
    ],
    datos: [
      { etiqueta: t("comun.pedido"), valor: pedido.numero },
      ...(puntos.length > 0
        ? puntos.map((p, i) => ({
            etiqueta:
              puntos.length > 1
                ? `${t("pedidoListo.dondeRetirar")} ${i + 1}`
                : t("pedidoListo.dondeRetirar"),
            valor: p,
          }))
        : // Sin depósito cargado no se inventa una dirección: se dice que el
          // comercio la dará. Mandar a alguien a un sitio equivocado es peor
          // que no mandarlo.
          [
            {
              etiqueta: t("pedidoListo.dondeRetirar"),
              valor: t("pedidoListo.sinDireccion"),
            },
          ]),
    ],
    resaltado: { texto: t("pedidoListo.llevaCedula"), tono: "neutro" },
    boton: {
      texto: t("pedidoListo.boton"),
      url: urlDe(idioma, `/pedido/${pedido.numero}`),
    },
    motivo,
    contacto,
  });
}

/** 14. Al cliente: constancia de que se entregó. */
export async function correoPedidoEntregado(
  d: Destinatario,
  pedido: DatosPedido,
) {
  const { idioma, t, saludo, motivo, contacto } = await base(d);

  return enviar(d, {
    asunto: t("pedidoEntregado.asunto", { numero: pedido.numero }),
    previo: t("pedidoEntregado.previo"),
    saludo,
    titulo: t("pedidoEntregado.titulo"),
    parrafos: t.raw("pedidoEntregado.parrafos") as string[],
    datos: [
      { etiqueta: t("comun.pedido"), valor: pedido.numero },
      /* EL ENVÍO, EN SU PROPIO RENGLÓN. Sin esto el correo enseña un total
         más alto que la suma de los productos y nadie sabe por qué. */
      ...(pedido.envioCentavos && pedido.envioCentavos > 0
        ? [
            {
              etiqueta: t("comun.envio"),
              valor: formatearPrecio(pedido.envioCentavos, idioma),
            },
          ]
        : []),
      {
        etiqueta: t("comun.total"),
        valor: formatearPrecio(pedido.totalCentavos, idioma),
      },
    ],
    resaltado: { texto: t("pedidoEntregado.aviso"), tono: "bien" },
    boton: {
      texto: t("pedidoEntregado.boton"),
      url: urlDe(idioma, `/pedido/${pedido.numero}`),
    },
    motivo,
    contacto,
  });
}

/** 15. Al comercio: una venta le dejó un producto en cero. */
export async function correoProductoAgotado(
  d: Destinatario,
  producto: { titulo: string },
) {
  const { idioma, t, saludo, motivo, contacto } = await base(d);

  return enviar(d, {
    asunto: t("productoAgotado.asunto", { producto: producto.titulo }),
    previo: t("productoAgotado.previo"),
    saludo,
    titulo: t("productoAgotado.titulo"),
    parrafos: t.raw("productoAgotado.parrafos") as string[],
    datos: [{ etiqueta: t("comun.producto"), valor: producto.titulo }],
    resaltado: { texto: t("productoAgotado.queHacer"), tono: "ojo" },
    boton: {
      texto: t("productoAgotado.boton"),
      url: urlDe(idioma, "/panel/productos"),
    },
    motivo,
    contacto,
  });
}

/**
 * 13. Le cambiaron el correo a una cuenta.
 *
 * Va a las DOS direcciones: a la nueva para que sepa que ya es la suya —y de
 * paso comprueba que recibe—, y a la anterior porque si el cambio no lo pidió
 * nadie, ese aviso es la única forma de enterarse.
 */
export async function correoCambioDeCorreo(d: {
  nombre: string;
  correoNuevo: string;
  correoAnterior: string;
  quienLoCambio: string;
}) {
  const piezas: PiezasCorreo = {
    asunto: "Tu correo de acceso a Mercatren cambió",
    previo: `Ahora entras con ${d.correoNuevo}.`,
    saludo: `Hola, ${d.nombre}:`,
    titulo: "Tu correo de acceso cambió",
    /* Texto plano: `armarHtml` escapa los párrafos, así que una etiqueta
       aquí saldría escrita tal cual en el correo. */
    parrafos: [
      "A partir de ahora entras a Mercatren con este correo, y tu contraseña es la misma de siempre.",
      `El cambio lo hizo ${d.quienLoCambio}, del equipo de Mercatren, a petición tuya.`,
      "Si no lo pediste, escríbenos ahora mismo.",
    ],
    resaltado: { tono: "neutro", texto: d.correoNuevo },
    motivo: "Te escribimos porque cambió el correo de acceso de tu cuenta.",
    contacto: "¿Alguna duda?",
  };

  /* A las dos, en envíos separados: si una rebota, la otra sale igual. */
  return Promise.allSettled([
    enviarCorreo({
      a: d.correoNuevo,
      asunto: piezas.asunto,
      html: armarHtml(piezas),
      texto: armarTexto(piezas),
    }),
    enviarCorreo({
      a: d.correoAnterior,
      asunto: piezas.asunto,
      html: armarHtml(piezas),
      texto: armarTexto(piezas),
    }),
  ]);
}
