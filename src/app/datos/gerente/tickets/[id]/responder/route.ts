import { revisarPuerta } from "@/lib/soporte/puerta-gerente";
import { esquemaRespuestaGerente } from "@/lib/soporte/casos";

/**
 * POST /datos/gerente/tickets/<id>/responder — el gerente contesta un caso:
 * queda el mensaje, el caso pasa a respondido (o cerrado) y se le avisa a la
 * persona por correo. Mercatren no tiene avisos dentro de la app, así que
 * `aviso` es siempre «sin_app». Ver `lib/soporte/puerta-gerente.ts`.
 */
export const dynamic = "force-dynamic";

export async function POST(
  peticion: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const cerrada = await revisarPuerta(peticion);
  if (cerrada) return cerrada;

  const cuerpo = await peticion.json().catch(() => null);
  const revisado = esquemaRespuestaGerente.safeParse(cuerpo);
  if (!revisado.success) {
    return Response.json(
      {
        error: "Datos inválidos.",
        campos: revisado.error.issues.map((i) => i.path.join(".")),
      },
      { status: 400 },
    );
  }
  const d = revisado.data;
  const { id } = await params;

  const { respuestaDeSoporte } = await import("@/lib/soporte/casos-consultas");
  const caso = await respuestaDeSoporte(id, d).catch((fallo: unknown) => {
    console.error("[gerente] no se pudo guardar la respuesta:", fallo);
    return undefined;
  });
  if (caso === undefined) {
    return Response.json(
      { error: "No se pudo guardar la respuesta." },
      { status: 500 },
    );
  }
  if (caso === null)
    return Response.json({ error: "Ese caso no existe." }, { status: 404 });

  /* El correo a la persona, con la respuesta y el enlace a su chat. Si falla,
     la respuesta ya quedó guardada: se dice y queda en el historial de fallos. */
  let correo: "ok" | "error" = "error";
  try {
    const { correoCasoRespondido } = await import("@/lib/correo/correos");
    const r = await correoCasoRespondido(
      { email: caso.email, name: caso.nombre, idioma: caso.idioma },
      { numero: caso.numero, codigo: caso.codigo, texto: d.texto },
    );
    correo = r.enviado ? "ok" : "error";
    if (!r.enviado)
      throw new Error(`correo del caso ${caso.numero}: ${r.motivo}`);
  } catch (fallo) {
    try {
      const { registrarError } = await import("@/lib/errores/registro");
      await registrarError("gerente/responder", fallo);
    } catch {
      /* nada */
    }
  }

  return Response.json({
    ok: true,
    numero: caso.numero,
    plantilla: d.plantilla ?? null,
    aviso: "sin_app",
    correo,
  });
}
