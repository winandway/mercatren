import "server-only";

import { obtenerUsuario } from "@/lib/autorizacion";
import { ordenarPorAfinidad } from "@/lib/recomendar/ordenar";
import { senalesDe, videosQueLeGustaron } from "@/lib/recomendar/senales";
import type { VideoPublico } from "@/lib/videos/reglas";

/**
 * LAS HILERAS DE VIDEOS, ORDENADAS PARA QUIEN YA ENTRÓ (24 ago 2026).
 *
 * Lo pidió el dueño con la lógica de las redes delante: si un cliente le dio
 * su corazón a un video, ese comercio le interesa — y lo suyo es que esos
 * videos le salgan de primeros. «Justamente en ese detalle están las ventas.»
 *
 * ══ CÓMO FUNCIONA, EN ORDEN ══
 *
 *  1. La lista llega de la caché del borde, IGUAL para todos. La
 *     personalización va DESPUÉS y en memoria: meter al usuario en la llave
 *     de la caché la volvería inútil.
 *  2. Sin sesión no se toca nada: se devuelve tal cual.
 *  3. Con sesión: primero los videos a los que YA les dio corazón, luego los
 *     de sus tiendas afines (compró o dio corazón), intercalados con el resto
 *     — nunca más de dos afines seguidos, para que los comercios nuevos sigan
 *     saliendo. Reordena, no filtra.
 *  4. Si algo falla, la hilera de siempre. Esto jamás puede tumbar ni
 *     enlentecer la portada.
 */
export async function personalizarVideos(
  videos: VideoPublico[],
): Promise<VideoPublico[]> {
  if (videos.length < 3) return videos;
  try {
    const usuario = await obtenerUsuario();
    if (!usuario) return videos;

    const [senales, conCorazon] = await Promise.all([
      senalesDe(usuario.id),
      videosQueLeGustaron(
        usuario.id,
        videos.map((v) => v.id),
      ),
    ]);

    return ordenarPorAfinidad(videos, senales, (v) => ({
      tiendaId: v.tiendaId,
      leGusto: conCorazon.has(v.id),
    }));
  } catch {
    return videos;
  }
}
