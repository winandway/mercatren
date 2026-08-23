import { recursoProtegido } from "@/lib/agentes/descubrimiento";
import { origenDe, preflight, respuestaJson } from "@/lib/agentes/origen";

/** RFC 9728: metadatos del recurso protegido (la API de socios). */
export function GET(peticion: Request) {
  return respuestaJson(recursoProtegido(origenDe(peticion)));
}
export function OPTIONS() {
  return preflight();
}
