import { crearLimite } from "@/lib/soporte/casos";
import { revisarAdjuntos, nombreLimpio, tipoDe } from "@/lib/soporte/adjuntos";

/**
 * POST /upload/ayuda/<codigo> — la persona escribe en su caso, con hasta 3
 * capturas (1 nov 2026). Va por `/upload` y no por una acción del servidor
 * porque tres capturas de 10 MB pasan del límite de las acciones. El código
 * del caso (secreto) es el permiso; 20 envíos por minuto por dirección.
 *
 * Responde `{ ok }` o `{ ok: false, motivo }`. El formulario no borra lo
 * escrito hasta ver el `ok`.
 */
export const dynamic = "force-dynamic";

const limite = crearLimite(20, 60_000);

export async function POST(
  peticion: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params;
  if (!/^[A-Za-z0-9_-]{16,40}$/.test(codigo)) {
    return Response.json({ ok: false, motivo: "noExiste" }, { status: 404 });
  }
  const ip = peticion.headers.get("cf-connecting-ip") ?? "desconocida";
  if (!limite(ip))
    return Response.json({ ok: false, motivo: "esperar" }, { status: 429 });

  let formulario: FormData;
  try {
    formulario = await peticion.formData();
  } catch {
    return Response.json({ ok: false, motivo: "datos" }, { status: 400 });
  }
  const texto = String(formulario.get("texto") ?? "")
    .trim()
    .slice(0, 4000);
  const archivos = formulario
    .getAll("adjuntos")
    .filter((a): a is File => a instanceof File && a.size > 0);

  if (!texto && archivos.length === 0) {
    return Response.json({ ok: false, motivo: "datos" }, { status: 400 });
  }
  const problema = revisarAdjuntos(archivos);
  if (problema)
    return Response.json({ ok: false, motivo: problema }, { status: 400 });

  try {
    const { mensajeDelCliente } = await import("@/lib/soporte/casos-consultas");
    const guardado = await mensajeDelCliente(
      codigo,
      texto,
      await Promise.all(
        archivos.map(async (a) => ({
          nombre: nombreLimpio(a.name),
          tipo: tipoDe(a.name, a.type)!,
          datos: await a.arrayBuffer(),
        })),
      ),
    );
    return guardado
      ? Response.json({ ok: true })
      : Response.json({ ok: false, motivo: "noExiste" }, { status: 404 });
  } catch (fallo) {
    console.error("[ayuda] no se pudo guardar el mensaje con capturas:", fallo);
    try {
      const { registrarError } = await import("@/lib/errores/registro");
      await registrarError("ayuda/escribir", fallo);
    } catch {
      /* nada */
    }
    return Response.json({ ok: false, motivo: "base" }, { status: 500 });
  }
}
