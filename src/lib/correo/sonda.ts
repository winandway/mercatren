import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Sonda del envío de correos.
 *
 * El servicio rechaza el mensaje con un único código —
 * `invalid_request_schema` — sin decir qué campo no le gusta, y la guía que
 * teníamos no coincide con la documentación. En vez de seguir probando a
 * ciegas un despliegue por intento, esto prueba las formas posibles de una
 * sola vez y dice cuál acepta.
 *
 * Se para en la primera que funciona, así que manda un solo correo de verdad.
 * Vive aparte del envío normal: es una herramienta de diagnóstico del equipo,
 * no parte del camino de los avisos.
 */

const CUENTA = "4d9e131f2c18bc10ac4700d689d5556c";
const ENVIO = `https://api.cloudflare.com/client/v4/accounts/${CUENTA}/email/sending/send`;

type Intento = { nombre: string; cuerpo: Record<string, unknown> };

function intentos(de: string, a: string, responder: string): Intento[] {
  const base = {
    subject: "Prueba de envío de Mercatren",
    text: "Si estás leyendo esto, el envío de correos de Mercatren ya funciona.",
    html: "<p>Si estás leyendo esto, el envío de correos de Mercatren ya funciona.</p>",
  };

  return [
    {
      nombre: "mínimo (solo texto)",
      cuerpo: { to: a, from: de, subject: base.subject, text: base.text },
    },
    { nombre: "texto + html", cuerpo: { to: a, from: de, ...base } },
    {
      nombre: "con replyTo",
      cuerpo: { to: a, from: de, replyTo: responder, ...base },
    },
    { nombre: "destinatario en lista", cuerpo: { to: [a], from: de, ...base } },
    {
      nombre: "objetos {email}",
      cuerpo: { to: { email: a }, from: { email: de }, ...base },
    },
    {
      nombre: "objetos en lista",
      cuerpo: { to: [{ email: a }], from: { email: de }, ...base },
    },
    {
      nombre: "objetos {address}",
      cuerpo: { to: [{ address: a }], from: { address: de }, ...base },
    },
  ];
}

export type ResultadoSonda = {
  funciona: string | null;
  detalle: { forma: string; estado: number; respuesta: string }[];
};

export async function sondearEnvio(
  a: string,
  responder: string,
): Promise<ResultadoSonda> {
  const { env } = getCloudflareContext();
  const token = env.CLOUDFLARE_EMAIL_TOKEN;

  if (!token) return { funciona: null, detalle: [] };

  // El buzón remitente, sin nombre visible: se prueba lo mínimo primero.
  const de = (env.CORREO_REMITENTE || "avisos@mercatren.com")
    .replace(/^.*<|>.*$/g, "")
    .trim();

  const detalle: ResultadoSonda["detalle"] = [];

  for (const { nombre, cuerpo } of intentos(de, a, responder)) {
    try {
      const respuesta = await fetch(ENVIO, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(cuerpo),
      });

      const texto = (await respuesta.text()).slice(0, 220);
      detalle.push({
        forma: nombre,
        estado: respuesta.status,
        respuesta: texto,
      });

      if (respuesta.ok && texto.includes('"success":true')) {
        return { funciona: nombre, detalle };
      }
    } catch (e) {
      detalle.push({
        forma: nombre,
        estado: 0,
        respuesta: e instanceof Error ? e.message : "fallo de red",
      });
    }
  }

  return { funciona: null, detalle };
}
