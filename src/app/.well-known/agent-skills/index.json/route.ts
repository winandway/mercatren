import { origenDe, preflight, respuestaJson } from "@/lib/agentes/origen";
import { indiceDeSkills } from "@/lib/agentes/skills";

/** Agent Skills Discovery RFC v0.2.0: el índice, con el SHA-256 de cada skill. */
export async function GET(peticion: Request) {
  return respuestaJson(await indiceDeSkills(origenDe(peticion)));
}
export function OPTIONS() {
  return preflight();
}
