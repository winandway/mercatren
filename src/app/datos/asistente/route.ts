import {
  agenteConfigurado,
  mandarMensaje,
  reiniciarConversacion,
  traerHistorial,
} from "@/lib/asistente/cliente";
import { idDeConversacion } from "@/lib/asistente/sesion";
import { esEquipoInterno, obtenerUsuario } from "@/lib/autorizacion";

/**
 * LA PUERTA DEL ASISTENTE, DEL LADO DE ESTE SITIO.
 *
 * El navegador habla SOLO con esta ruta. Aquí se le pega el token del agente,
 * que vive en las variables del servidor, y se devuelve únicamente lo que hay
 * que enseñar en pantalla. El token no sale nunca de aquí.
 *
 * ══ VA EN /datos Y NO EN /api ══
 *
 * Regla 1 del proyecto: en YaDominios Cloud el prefijo `/api` lo capturan los
 * archivos estáticos antes de llegar al código. El prompt pedía
 * `/asistente/mensaje`; aquí eso es `/datos/asistente`.
 *
 * ══ SOLO EL EQUIPO INTERNO, Y NO ES UN DETALLE ══
 *
 * El token del agente identifica a la EMPRESA, no a quien lo usa: cualquiera
 * que llegue a esta ruta le habla al agente como si fuera Mercatren, con lo que
 * eso permite preguntar y hacer. Un comercio con sesión no puede pasar por
 * aquí — vería y movería cosas de toda la operación, no de la suya.
 *
 * Es la misma comprobación que protege el resto del panel, y va en el SERVIDOR:
 * esconder el enlace no protege una dirección que se puede escribir a mano.
 */

/** Quién pregunta y con qué conversación. Null si no le toca. */
async function quienPregunta() {
  const usuario = await obtenerUsuario();
  if (!usuario) return null;
  if (!(await esEquipoInterno())) return null;

  const id = idDeConversacion(usuario.id);
  return id ? { id } : null;
}

function noAutorizado() {
  return Response.json({ motivo: "sin_permiso" }, { status: 403 });
}

export async function GET() {
  const quien = await quienPregunta();
  if (!quien) return noAutorizado();
  if (!agenteConfigurado()) {
    return Response.json({ motivo: "sin_token" }, { status: 503 });
  }

  const r = await traerHistorial(quien.id);
  return r.ok
    ? Response.json(r.datos)
    : Response.json({ motivo: r.motivo, detalle: r.detalle }, { status: 502 });
}

export async function POST(peticion: Request) {
  const quien = await quienPregunta();
  if (!quien) return noAutorizado();
  if (!agenteConfigurado()) {
    return Response.json({ motivo: "sin_token" }, { status: 503 });
  }

  let cuerpo: { mensaje?: unknown; reiniciar?: unknown };
  try {
    cuerpo = (await peticion.json()) as typeof cuerpo;
  } catch {
    return Response.json({ motivo: "cuerpo_invalido" }, { status: 400 });
  }

  if (cuerpo.reiniciar === true) {
    const r = await reiniciarConversacion(quien.id);
    return r.ok
      ? Response.json({ ok: true })
      : Response.json({ motivo: r.motivo }, { status: 502 });
  }

  /* El mensaje se comprueba aquí: un cuerpo vacío gasta una llamada al agente
     para nada, y uno enorme la rechaza él con un error que no dice qué pasó. */
  const mensaje =
    typeof cuerpo.mensaje === "string" ? cuerpo.mensaje.trim() : "";
  if (!mensaje)
    return Response.json({ motivo: "mensaje_vacio" }, { status: 400 });
  if (mensaje.length > 4000) {
    return Response.json({ motivo: "mensaje_largo" }, { status: 400 });
  }

  const r = await mandarMensaje(quien.id, mensaje);

  if (!r.ok) {
    return Response.json(
      {
        motivo: r.motivo,
        detalle: r.detalle,
        esperaSegundos: r.esperaSegundos,
      },
      {
        status: r.motivo === "demasiadas_peticiones" ? 429 : 502,
        headers: r.esperaSegundos
          ? { "retry-after": String(r.esperaSegundos) }
          : undefined,
      },
    );
  }

  return Response.json(r.datos);
}
