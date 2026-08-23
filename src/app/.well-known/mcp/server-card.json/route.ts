import { tarjetaMcp } from "@/lib/agentes/descubrimiento";
import { origenDe, preflight, respuestaJson } from "@/lib/agentes/origen";

/** SEP-1649: la tarjeta del servidor MCP. */
export function GET(peticion: Request) {
  return respuestaJson(tarjetaMcp(origenDe(peticion)));
}
export function OPTIONS() {
  return preflight();
}
