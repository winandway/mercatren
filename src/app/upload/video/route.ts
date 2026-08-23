import { subirVideoDeTienda } from "@/lib/videos/acciones";

export const dynamic = "force-dynamic";

/**
 * LA PUERTA DE SUBIDA DE VIDEOS.
 *
 * Existe aparte de la acción de servidor por una razón concreta: **la barra de
 * avance**. Una acción de servidor no informa del progreso, y un video de 80
 * MB por la conexión de Venezuela son varios minutos — sin barra, la persona
 * cree que se colgó y vuelve a intentar. `XMLHttpRequest` contra esta ruta sí
 * da el progreso.
 *
 * Los permisos, el tope de tres minutos y el guardado son exactamente los
 * mismos: se llama a la acción, no se duplica nada.
 */
export async function POST(peticion: Request) {
  try {
    const formulario = await peticion.formData();
    const r = await subirVideoDeTienda(formulario);
    return Response.json(r, { status: r.ok ? 200 : 400 });
  } catch (e) {
    console.error("[upload/video] no se pudo procesar:", e);
    return Response.json(
      {
        ok: false,
        mensaje: e instanceof Error ? e.message : "No se pudo subir el video.",
      },
      { status: 500 },
    );
  }
}
