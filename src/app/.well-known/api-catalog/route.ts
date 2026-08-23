import { catalogoDeApi } from "@/lib/agentes/descubrimiento";
import { origenDe, preflight, respuestaJson } from "@/lib/agentes/origen";

/** RFC 9727: el catálogo de la API, en application/linkset+json. */
export function GET(peticion: Request) {
  return respuestaJson(
    catalogoDeApi(origenDe(peticion)),
    "application/linkset+json; charset=utf-8",
  );
}
export function OPTIONS() {
  return preflight();
}
