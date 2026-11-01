import { revisarPuerta } from "@/lib/soporte/puerta-gerente";

/**
 * GET /datos/gerente/tickets?estado=abiertos|todos — los casos de ayuda para
 * el gerente de correo, con su chat. Sin correo, llave del chat, pagos ni
 * direcciones. Ver `lib/soporte/puerta-gerente.ts`.
 */
export const dynamic = "force-dynamic";

export async function GET(peticion: Request) {
  const cerrada = await revisarPuerta(peticion);
  if (cerrada) return cerrada;
  const soloAbiertos =
    new URL(peticion.url).searchParams.get("estado") !== "todos";
  try {
    const { ticketsParaGerente } =
      await import("@/lib/soporte/casos-consultas");
    return Response.json({ tickets: await ticketsParaGerente(soloAbiertos) });
  } catch (fallo) {
    console.error("[gerente] no se pudieron leer los casos:", fallo);
    return Response.json(
      { error: "No se pudieron leer los casos." },
      { status: 500 },
    );
  }
}
