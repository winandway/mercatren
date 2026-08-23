import { catalogoArd } from "@/lib/agentes/descubrimiento";
import { origenDe, preflight, respuestaJson } from "@/lib/agentes/origen";

/** ARD (Agentic Resource Discovery): qué hay aquí para un agente. */
export function GET(peticion: Request) {
  return respuestaJson(catalogoArd(origenDe(peticion)));
}
export function OPTIONS() {
  return preflight();
}
