import { getAuth } from "@/lib/auth";
import { comprobarEscudo } from "@/lib/escudo";

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

/** El pase viaja en una cabecera, no en el cuerpo. */
export const CABECERA_ESCUDO = "x-escudo";

export async function GET(request: Request) {
  return (await getAuth()).handler(request);
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

  return (await getAuth()).handler(request);
}
