import { enlacesDeLaApp } from "@/lib/app-android/enlaces";

/**
 * Digital Asset Links: le dice a Android que la app com.mercatren.app es de
 * este sitio, para abrirlo a pantalla completa. Ver `lib/app-android/enlaces.ts`.
 */
export function GET() {
  return Response.json(enlacesDeLaApp(), {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
