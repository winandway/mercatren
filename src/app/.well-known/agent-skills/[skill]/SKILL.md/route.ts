import { origenDe, preflight, respuestaTexto } from "@/lib/agentes/origen";
import { buscarSkill, textoDeSkill } from "@/lib/agentes/skills";

/** Un SKILL.md concreto. Lo que no existe es 404, no un skill vacío. */
export async function GET(
  peticion: Request,
  { params }: { params: Promise<{ skill: string }> },
) {
  const { skill } = await params;
  const encontrado = buscarSkill(skill);
  if (!encontrado) return new Response("No existe ese skill.", { status: 404 });
  return respuestaTexto(textoDeSkill(encontrado, origenDe(peticion)));
}
export function OPTIONS() {
  return preflight();
}
