import { getAuth } from "@/lib/auth";
import { comprobarEscudo } from "@/lib/escudo";
import {
  anotarFallo,
  dejaIntentar,
  ipDe,
  olvidarFallos,
} from "@/lib/seguridad/limite";

/**
 * Punto de entrada del login (registro, entrada, salida, sesion).
 *
 * Va en /datos/auth y no en /api/auth porque en YaDominios Cloud el prefijo
 * /api lo capturan los archivos estaticos.
 */

/**
 * Las puertas donde alguien puede probar contrasenas a lo bruto. Son las
 * unicas que exigen el pase del escudo; salir o leer la sesion no.
 */
const PUERTAS_PROTEGIDAS = ["/sign-in/email", "/sign-up/email"];

/**
 * DONDE ADEMAS SE CUENTAN LOS INTENTOS.
 *
 * Entrar y restablecer la contrasena. Las dos son puertas de fuerza bruta, y la
 * segunda ademas MANDA UN CORREO: sin limite, cualquiera llena el buzon de otra
 * persona y de paso nos gasta el cupo de envios.
 *
 * Registrarse NO entra: ahi no hay ninguna contrasena que adivinar, y contar
 * intentos solo serviria para impedirle abrir cuenta a seis personas de la
 * misma oficina. Contra el alta masiva de cuentas ya esta Turnstile.
 */
const PUERTAS_CON_LIMITE = ["/sign-in/email", "/forget-password"];

/** El pase viaja en una cabecera, no en el cuerpo. */
export const CABECERA_ESCUDO = "x-escudo";

export async function GET(request: Request) {
  return (await getAuth()).handler(request);
}

/**
 * El correo que viene en el cuerpo, si lo hay.
 *
 * Se lee de una COPIA de la peticion: el cuerpo se puede leer una sola vez y el
 * original tiene que llegarle intacto a Better Auth. Si no se puede leer, se
 * sigue sin el: el limite por direccion se aplica igual.
 */
async function correoDelCuerpo(request: Request): Promise<string | null> {
  try {
    const cuerpo = (await request.clone().json()) as { email?: unknown };
    return typeof cuerpo.email === "string" ? cuerpo.email : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const { pathname } = new URL(request.url);

  if (PUERTAS_PROTEGIDAS.some((puerta) => pathname.endsWith(puerta))) {
    /**
     * EL ESCUDO SE COMPRUEBA AQUI, ANTES DE MIRAR LA CONTRASENA.
     *
     * El recuadro del navegador solo pide el pase; cualquiera puede saltarselo
     * y hablarle directo a esta direccion. Por eso la comprobacion de verdad
     * vive en el servidor, y va primero: si el pase no sirve, ni siquiera se
     * consulta la base. Asi un programa que prueba miles de contrasenas no
     * llega nunca a tocarla.
     *
     * El pase va en una cabecera y no en el cuerpo, para que la peticion
     * llegue a Better Auth exactamente como el la espera.
     */
    const escudo = await comprobarEscudo(
      request.headers.get(CABECERA_ESCUDO),
      request.headers.get("cf-connecting-ip") ??
        request.headers.get("x-forwarded-for"),
    );

    if (!escudo.ok) {
      return Response.json(
        {
          message: "No se pudo comprobar que eres una persona.",
          code: "ESCUDO",
        },
        { status: 403 },
      );
    }
  }

  const conLimite = PUERTAS_CON_LIMITE.some((puerta) =>
    pathname.endsWith(puerta),
  );

  if (!conLimite) return (await getAuth()).handler(request);

  /**
   * EL LIMITE DE INTENTOS, TAMBIEN ANTES DE MIRAR LA CONTRASENA.
   *
   * El escudo frena robots; esto frena a alguien decidido, que pide el pase una
   * vez y despues manda contrasenas tan rapido como aguante el servidor. Hasta
   * el 12 ago 2026 no habia ninguno, y detras de esta puerta esta el panel
   * donde un comercio ve su dinero.
   */
  const correo = await correoDelCuerpo(request);
  const ip = ipDe(request);

  const permiso = await dejaIntentar(correo, ip);
  if (!permiso.permitido) {
    return Response.json(
      {
        message: `Demasiados intentos. Vuelve a probar en ${Math.ceil(permiso.esperaSegundos / 60)} minutos.`,
        code: "DEMASIADOS_INTENTOS",
      },
      {
        status: 429,
        /* Lo que mira un cliente automatico para saber cuando reintentar. */
        headers: { "Retry-After": String(permiso.esperaSegundos) },
      },
    );
  }

  const respuesta = await (await getAuth()).handler(request);

  /**
   * SOLO SE CUENTAN LOS FALLOS, Y AL ACERTAR SE BORRA EL CONTADOR.
   *
   * Contar tambien los aciertos dejaria fuera a una ferreteria donde entran
   * seis personas desde la misma conexion.
   *
   * `forget-password` responde 200 SIEMPRE, exista o no el correo —es la regla
   * de la pantalla, para que nadie averigue quien tiene cuenta aqui—, asi que
   * ahi el 200 no significa acierto: se cuenta igual, que es justo lo que
   * evita que alguien llene el buzon de otro.
   */
  const entroBien = respuesta.ok && pathname.endsWith("/sign-in/email");

  if (entroBien) {
    await olvidarFallos(correo);
  } else {
    await anotarFallo(correo, ip);
  }

  return respuesta;
}
