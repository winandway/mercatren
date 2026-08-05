import "server-only";

import { getTranslations } from "next-intl/server";

import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { SITIO } from "@/lib/sitio";

import { CORREO_CONTACTO } from "./direcciones";
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
};

/** 3. Pedido creado: gracias por su compra + el paso que falta. */
export async function correoGraciasCompra(
  d: Destinatario,
  pedido: DatosPedido,
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
      {
        etiqueta: t("comun.total"),
        valor: formatearPrecio(pedido.totalCentavos, idioma),
      },
    ],
    resaltado: { texto: t("graciasCompra.siguiente"), tono: "neutro" },
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
 * (mercatren@windoce.com). Va en español fijo — es interno del equipo.
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
    a: CORREO_CONTACTO,
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
