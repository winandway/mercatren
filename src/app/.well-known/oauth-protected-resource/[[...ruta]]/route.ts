import { recursoProtegido } from "@/lib/agentes/descubrimiento";
import { origenDe, preflight, respuestaJson } from "@/lib/agentes/origen";

/**
 * RFC 9728: metadatos del recurso protegido. Sin ruta, el documento general
 * (la API de socios); con ruta (`/.well-known/oauth-protected-resource/en`,
 * que es como lo pide un cliente cuyo recurso es `https://mercatren.com/en`),
 * el mismo documento con ese recurso. Medido el 23 ago 2026: el medidor pedía
 * la variante con ruta y encontraba un 404.
 */
export async function GET(
  peticion: Request,
  { params }: { params: Promise<{ ruta?: string[] }> },
) {
  const { ruta } = await params;
  const base = origenDe(peticion);
  const doc = recursoProtegido(base);
  const recurso = ruta?.length
    ? `${base}/${ruta.map(encodeURIComponent).join("/")}`
    : doc.resource;
  return respuestaJson({ ...doc, resource: recurso });
}
export function OPTIONS() {
  return preflight();
}
