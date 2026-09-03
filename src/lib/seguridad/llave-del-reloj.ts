import "server-only";

/**
 * LA LLAVE CON LA QUE EL RELOJ DE GITHUB LE HABLA AL SITIO.
 *
 * La usan `/datos/sincronizar` y `/datos/vigilante`. Se compara en tiempo
 * constante (comparar con `===` filtra la llave letra a letra por el tiempo
 * que tarda), y a quien no la trae se le contesta 404: ni se le confirma que
 * la puerta existe. Sin llave cargada, 503 y no se hace nada.
 */
export function igualesEnTiempoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) {
    diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diferencia === 0;
}

export function autorizadoPorLlave(
  peticion: Request,
  llave: string | undefined,
): "sin_llave" | "no" | "si" {
  const esperada = llave?.trim();
  if (!esperada) return "sin_llave";
  const enviada = (peticion.headers.get("authorization") ?? "").replace(
    /^Bearer\s+/i,
    "",
  );
  return enviada && igualesEnTiempoConstante(enviada, esperada) ? "si" : "no";
}
