import { paisDelAltaValido } from "@/lib/cuenta/pais-del-alta";

/**
 * LO QUE ALGUIEN PUEDE CAMBIAR DE SU PROPIA CUENTA (5 nov 2026).
 *
 * Better Auth deja que la sesión actualice su nombre, su foto y los campos
 * extra marcados como editables (`paisEntrega`, `idioma`, `telefono`; el rol
 * NO, está cerrado con `input: false`). Hasta hoy nadie lo usaba, y la puerta
 * aceptaba cualquier texto: un país que ningún muro reconoce, un nombre de
 * mil letras o un enlace como foto. Con «Mis datos» en la app esa puerta pasa
 * a usarse, así que se cierra antes, aquí, para la web y para la app.
 *
 * Devuelve el código del primer problema, o `null` si todo está bien. Lo que
 * no viene en el cuerpo no se mira: cada cambio manda solo lo suyo.
 */
export type ProblemaDeCambio =
  | "NOMBRE_NO_VALIDO"
  | "PAIS_NO_VALIDO"
  | "IDIOMA_NO_VALIDO"
  | "TELEFONO_NO_VALIDO"
  | "IMAGEN_NO_VALIDA";

export const NOMBRE_MINIMO = 2;
export const NOMBRE_MAXIMO = 100;

export function problemaDelCambio(cuerpo: unknown): ProblemaDeCambio | null {
  if (!cuerpo || typeof cuerpo !== "object") return null;
  const c = cuerpo as Record<string, unknown>;

  if ("name" in c) {
    const nombre = typeof c.name === "string" ? c.name.trim() : "";
    if (nombre.length < NOMBRE_MINIMO || nombre.length > NOMBRE_MAXIMO)
      return "NOMBRE_NO_VALIDO";
  }
  if ("paisEntrega" in c && !paisDelAltaValido(c.paisEntrega))
    return "PAIS_NO_VALIDO";
  if ("idioma" in c && c.idioma !== "es" && c.idioma !== "en")
    return "IDIOMA_NO_VALIDO";
  if (
    "telefono" in c &&
    c.telefono !== null &&
    (typeof c.telefono !== "string" ||
      c.telefono.length > 30 ||
      !/^[+\d\s().-]*$/.test(c.telefono))
  )
    return "TELEFONO_NO_VALIDO";
  /* La foto de perfil no se usa en ningún lado: no se acepta un enlace. */
  if ("image" in c && c.image !== null && c.image !== undefined)
    return "IMAGEN_NO_VALIDA";
  return null;
}
