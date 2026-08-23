import { authMd } from "@/lib/agentes/descubrimiento";
import { origenDe, preflight, respuestaTexto } from "@/lib/agentes/origen";

/** auth.md: cómo se consigue acceso, en palabras normales y sin inventar un OAuth que no hay. */
export function GET(peticion: Request) {
  return respuestaTexto(authMd(origenDe(peticion)));
}
export function OPTIONS() {
  return preflight();
}
