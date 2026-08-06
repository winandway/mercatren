import { CORREO_CONTACTO } from "./direcciones";

/**
 * La plantilla visual de todos los correos del sistema.
 *
 * Esta escrita a la antigua — tablas y estilos en linea — a proposito: los
 * programas de correo (Gmail, Outlook, el iPhone) no cargan hojas de estilo
 * ni entienden el CSS moderno. Lo que aqui parece anticuado es lo unico que
 * se ve bien en todos lados.
 *
 * La marca: encabezado azul riel con el nombre, boton naranja carga, pie
 * sobrio con el buzon real de contacto.
 */

const AZUL = "#10263A";
const NARANJA = "#FF6B1A";
const TINTA = "#10263A";
const TINTA_SUAVE = "#566573";
const BORDE = "#e3e6e6";
const FONDO = "#f4f5f6";

export type PiezasCorreo = {
  /** El asunto del mensaje. */
  asunto: string;
  /** Texto corto que muestran Gmail y compania junto al asunto. */
  previo: string;
  /** "Hola, Maria" — ya armado en el idioma del destinatario. */
  saludo: string;
  titulo: string;
  parrafos: string[];
  /** Tabla de datos (numero de pedido, monto…), opcional. */
  datos?: { etiqueta: string; valor: string }[];
  /** Recuadro resaltado (un motivo de rechazo, un aviso), opcional. */
  resaltado?: { texto: string; tono: "bien" | "ojo" | "neutro" };
  boton?: { texto: string; url: string };
  /** Parrafos que van despues del boton, opcional. */
  parrafosFinales?: string[];
  /** Linea legal del pie ("Recibes este correo porque…"). */
  motivo: string;
  /** "Este buzon solo envia avisos; escribenos a …". */
  contacto: string;
};

function escapar(texto: string) {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

const TONOS_RESALTADO = {
  bien: { fondo: "#e8f5ee", borde: "#0f7a4a" },
  ojo: { fondo: "#fdecea", borde: "#c0392b" },
  neutro: { fondo: "#f4f5f6", borde: "#94a3ad" },
} as const;

/** Arma el HTML completo del correo. */
export function armarHtml(p: PiezasCorreo): string {
  const parrafos = p.parrafos
    .map(
      (t) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${TINTA};">${escapar(t)}</p>`,
    )
    .join("");

  /**
   * LAS FILAS DE DATOS. Un monto cabe en una línea; una dirección de retiro,
   * no — lleva el comercio, el depósito, la calle y qué se recoge ahí.
   *
   * Por eso hay dos formas de fila. La corta va a la derecha en negrita, como
   * siempre. La LARGA (la que trae saltos de línea) ocupa las dos columnas,
   * alineada a la izquierda y respetando sus renglones: apretada contra el
   * borde derecho se leía como un solo párrafo pegado, y ahí la persona
   * pierde justo el dato que fue a buscar — la calle.
   *
   * `white-space:pre-line` no basta en todos los clientes de correo, así que
   * los saltos se convierten en `<br>` de verdad, después de escapar.
   */
  const datos = p.datos?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;border:1px solid ${BORDE};border-radius:8px;border-collapse:separate;overflow:hidden;">
        ${p.datos
          .map((d, i) => {
            const arriba = i ? `border-top:1px solid ${BORDE};` : "";
            const valor = escapar(d.valor).replaceAll("\n", "<br>");

            if (d.valor.includes("\n")) {
              return `<tr>
          <td colspan="2" style="padding:10px 14px;background:#fafbfb;${arriba}">
            <div style="font-size:13px;color:${TINTA_SUAVE};margin-bottom:3px;">${escapar(d.etiqueta)}</div>
            <div style="font-size:14px;font-weight:bold;color:${TINTA};line-height:1.5;">${valor}</div>
          </td>
        </tr>`;
            }

            return `<tr>
          <td style="padding:10px 14px;font-size:13px;color:${TINTA_SUAVE};background:#fafbfb;${arriba}white-space:nowrap;">${escapar(d.etiqueta)}</td>
          <td style="padding:10px 14px;font-size:14px;font-weight:bold;color:${TINTA};background:#fafbfb;${arriba}text-align:right;">${valor}</td>
        </tr>`;
          })
          .join("")}
      </table>`
    : "";

  const resaltado = p.resaltado
    ? `<div style="margin:6px 0 18px;padding:12px 16px;background:${TONOS_RESALTADO[p.resaltado.tono].fondo};border-left:4px solid ${TONOS_RESALTADO[p.resaltado.tono].borde};border-radius:0 8px 8px 0;font-size:14px;line-height:1.55;color:${TINTA};">${escapar(p.resaltado.texto)}</div>`
    : "";

  const boton = p.boton
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;">
        <tr><td style="border-radius:8px;background:${NARANJA};">
          <a href="${p.boton.url}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:bold;color:#0a1826;text-decoration:none;">${escapar(p.boton.texto)}</a>
        </td></tr>
      </table>`
    : "";

  const finales = (p.parrafosFinales ?? [])
    .map(
      (t) =>
        `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:${TINTA_SUAVE};">${escapar(t)}</p>`,
    )
    .join("");

  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:${FONDO};">
  <div style="display:none;max-height:0;overflow:hidden;">${escapar(p.previo)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${FONDO};">
    <tr><td align="center" style="padding:28px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr><td style="background:${AZUL};border-radius:12px 12px 0 0;padding:22px 32px;">
          <span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;letter-spacing:4px;color:#ffffff;">MERCATREN</span>
          <span style="display:inline-block;margin-left:8px;width:22px;height:4px;background:${NARANJA};border-radius:2px;"></span>
        </td></tr>

        <tr><td style="background:#ffffff;padding:32px;font-family:Arial,Helvetica,sans-serif;">
          <p style="margin:0 0 6px;font-size:14px;color:${TINTA_SUAVE};">${escapar(p.saludo)}</p>
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${TINTA};">${escapar(p.titulo)}</h1>
          ${parrafos}
          ${datos}
          ${resaltado}
          ${boton}
          ${finales}
        </td></tr>

        <tr><td style="background:#ffffff;border-top:1px solid ${BORDE};border-radius:0 0 12px 12px;padding:20px 32px;font-family:Arial,Helvetica,sans-serif;">
          <p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:${TINTA_SUAVE};">${escapar(p.contacto)} <a href="mailto:${CORREO_CONTACTO}" style="color:${AZUL};font-weight:bold;">${CORREO_CONTACTO}</a></p>
          <p style="margin:0;font-size:12px;line-height:1.6;color:${TINTA_SUAVE};">${escapar(p.motivo)}</p>
          <p style="margin:10px 0 0;font-size:11px;color:#94a3ad;">Mercatren · Windoce, LLC</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** La version en texto plano del mismo mensaje. */
export function armarTexto(p: PiezasCorreo): string {
  const lineas = [
    p.saludo,
    "",
    p.titulo.toUpperCase(),
    "",
    ...p.parrafos,
    ...(p.datos?.map((d) => `${d.etiqueta}: ${d.valor}`) ?? []),
    ...(p.resaltado ? ["", p.resaltado.texto] : []),
    ...(p.boton ? ["", `${p.boton.texto}: ${p.boton.url}`] : []),
    ...(p.parrafosFinales ?? []),
    "",
    `${p.contacto} ${CORREO_CONTACTO}`,
    p.motivo,
    "Mercatren · Windoce, LLC",
  ];
  return lineas.join("\n");
}
