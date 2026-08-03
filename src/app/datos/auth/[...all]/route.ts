import { getAuth } from "@/lib/auth";

/**
 * Punto de entrada del login (registro, entrada, salida, sesion).
 *
 * Va en /datos/auth y no en /api/auth porque en YaDominios Cloud el prefijo
 * /api lo capturan los archivos estaticos.
 */

export async function GET(request: Request) {
  return (await getAuth()).handler(request);
}

export async function POST(request: Request) {
  return (await getAuth()).handler(request);
}
