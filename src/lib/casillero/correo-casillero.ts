import "server-only";

import { lineasDeEtiqueta } from "@/lib/casillero/bodega";
import { enviarCorreo } from "@/lib/correo/enviar";
import { armarHtml, armarTexto } from "@/lib/correo/plantilla";

/**
 * ══ LA DIRECCIÓN VIAJA POR CORREO, NO EN LA RESPUESTA ══
 *
 * Corregido el 9 sep 2026, tras una revisión de seguridad. La primera
 * versión del widget devolvía el código y la dirección en el mismo momento,
 * **y eso era un agujero grave**: cualquiera podía escribir el correo de
 * otra persona y llevarse SU código de casillero, que es lo único que hace
 * falta para mandar cajas a su nombre o para reclamar las suyas.
 *
 * Ahora el widget contesta siempre lo mismo —«te mandamos un correo»— y el
 * dato viaja al buzón, que es la única prueba de que quien lo pidió es el
 * dueño de esa dirección. Es la misma regla que ya rige la recuperación de
 * contraseña de este proyecto: **la pantalla nunca dice si el correo
 * existe**.
 */
export async function mandarDireccionPorCorreo(opciones: {
  a: string;
  nombreLegal: string;
  codigo: string;
  dominio: string;
}) {
  const lineas = lineasDeEtiqueta(opciones.nombreLegal, opciones.codigo, "es");
  const piezas = {
    asunto: `Tu casillero en Miami: ${opciones.codigo}`,
    previo: "Tu dirección para comprar en Estados Unidos",
    saludo: `Hola, ${opciones.nombreLegal.split(" ")[0] ?? ""}`,
    titulo: "Tu casillero está listo",
    parrafos: [
      "Esta es tu dirección en Miami. Cópiala campo por campo cuando pagues en la tienda: si pegas todo junto, las tiendas la cortan y tu paquete llega sin tu número.",
      "Tu número de casillero va SIEMPRE, pegado a tu nombre y otra vez en la línea 2. Sin él no sabemos de quién es la caja.",
    ],
    datos: lineas.map((l) => ({ etiqueta: l.campo, valor: l.valor })),
    resaltado: {
      texto:
        "No compartas esta dirección: lleva tu número dentro, y lo que llegue con él entra en tu casillero y respondes por ello.",
      tono: "ojo" as const,
    },
    boton: {
      texto: "Ver mi casillero",
      url: `https://${opciones.dominio}/es/casillero/mi-casillero`,
    },
    motivo: "Recibes este correo porque pediste un casillero en Mercatren.",
    contacto: "Este buzón solo envía avisos; escríbenos a",
  };
  return enviarCorreo({
    a: opciones.a,
    asunto: piezas.asunto,
    html: armarHtml(piezas),
    texto: armarTexto(piezas),
  });
}

/**
 * Cuando alguien pide un casillero con un correo que YA tiene cuenta.
 *
 * No se le crea nada ni se le toca la cuenta: se le avisa al dueño, que es
 * quien tiene que decidir. Si fue él, entra y lo ve; si no fue él, se
 * entera de que alguien usó su correo.
 */
export async function avisarQueYaTieneCuenta(opciones: {
  a: string;
  dominio: string;
}) {
  const piezas = {
    asunto: "Sobre tu casillero de Mercatren",
    previo: "Alguien pidió un casillero con tu correo",
    saludo: "Hola",
    titulo: "Ya tienes cuenta en Mercatren",
    parrafos: [
      "Alguien pidió crear un casillero con este correo. Como ya tienes cuenta, no creamos nada nuevo: entra con tu cuenta y allí ves —o creas— tu casillero, con tu dirección de Miami.",
      "Si no fuiste tú, no tienes que hacer nada. Nadie ha visto tus datos ni tu dirección.",
    ],
    boton: {
      texto: "Entrar a mi cuenta",
      url: `https://${opciones.dominio}/es/casillero`,
    },
    motivo:
      "Recibes este correo porque alguien pidió un casillero con esta dirección.",
    contacto: "Este buzón solo envía avisos; escríbenos a",
  };
  return enviarCorreo({
    a: opciones.a,
    asunto: piezas.asunto,
    html: armarHtml(piezas),
    texto: armarTexto(piezas),
  });
}
