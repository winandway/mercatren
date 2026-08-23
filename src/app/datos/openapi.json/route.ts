import { openapiDeMercatren } from "@/lib/agentes/openapi";
import { origenDe, preflight, respuestaJson } from "@/lib/agentes/origen";

export const dynamic = "force-dynamic";

/** La especificación OpenAPI 3.1 de lo que se puede llamar. */
export function GET(peticion: Request) {
  return respuestaJson(
    openapiDeMercatren(origenDe(peticion)),
    "application/vnd.oai.openapi+json;version=3.1; charset=utf-8",
  );
}
export function OPTIONS() {
  return preflight();
}
