import type { ClaveDeTexto } from "./textos";

/**
 * Las reglas del formulario de cuentas, puras (las prueba el sitio en
 * `tests/unit/app-movil-cuentas.test.ts`). Son las mismas de la web: contraseña
 * de al menos 10 letras y un correo bien escrito. La palabra final la tiene el
 * servidor; esto solo evita mandar algo que de seguro se rechaza.
 */
export const LARGO_MINIMO_CLAVE = 10;

export type DatosAlta = { nombre: string; correo: string; clave: string };
export type DatosEntrada = { correo: string; clave: string };

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function correoBienEscrito(correo: string): boolean {
  return CORREO.test(correo.trim());
}

/** Lo primero que falta, para decirlo junto al botón; null si está todo. */
export function faltaEnAlta(d: DatosAlta): ClaveDeTexto | null {
  if (!d.nombre.trim()) return "faltaNombre";
  if (!correoBienEscrito(d.correo)) return "faltaCorreo";
  if (d.clave.length < LARGO_MINIMO_CLAVE) return "claveCorta";
  return null;
}

export function faltaEnEntrada(d: DatosEntrada): ClaveDeTexto | null {
  if (!correoBienEscrito(d.correo)) return "faltaCorreo";
  if (!d.clave) return "faltaClave";
  return null;
}

/**
 * Lo que respondió el servidor, en palabras para la persona y en su idioma.
 * Nunca se dice si un correo tiene cuenta al ENTRAR (solo «correo o contraseña
 * no coinciden»); al CREAR la cuenta sí, porque si no la persona no sabe que
 * tiene que entrar en vez de registrarse.
 */
export function mensajeDeError(
  codigo: string | undefined,
  estado?: number,
): ClaveDeTexto {
  switch (codigo) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "errorCredenciales";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "errorYaExiste";
    case "PASSWORD_TOO_SHORT":
      return "claveCorta";
    case "INVALID_EMAIL":
    case "CORREO_NO_VALIDO":
      return "errorCorreoNoSirve";
    case "ESCUDO":
      return "errorEscudo";
    case "DEMASIADOS_INTENTOS":
      return "errorDemasiados";
    default:
      return estado === 429 ? "errorDemasiados" : "errorGeneral";
  }
}
