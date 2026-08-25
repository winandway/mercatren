import { asc, desc, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  PanelSecciones,
  type SeccionDelPanel,
} from "@/components/panel/secciones/panel-secciones";
import { esSoporteDeVerdad } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { seccionesVideo, videosDeSeccion } from "@/lib/db/schema";
import { SITIO } from "@/lib/sitio";

export const dynamic = "force-dynamic";

/**
 * PANEL → SECCIONES DE VIDEO.
 *
 * Solo rol soporte y con `esSoporteDeVerdad()`: una sección es un canal de
 * Mercatren, y quien mira el panel de un comercio con el disfraz de «ver su
 * panel» no crea canales nuestros ni ve las llaves de sus enlaces.
 */
export default async function PaginaSecciones({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await esSoporteDeVerdad().catch(() => false)))
    redirect(`/${locale}/panel`);

  const t = await getTranslations("panel.secciones");
  const db = getDb();
  const filas = await db
    .select({
      id: seccionesVideo.id,
      slug: seccionesVideo.slug,
      nombreEs: seccionesVideo.nombreEs,
      llaveSubida: seccionesVideo.llaveSubida,
    })
    .from(seccionesVideo)
    .orderBy(asc(seccionesVideo.orden), desc(seccionesVideo.creadoEn));

  /* Cuántos videos tiene cada una, en una sola consulta. */
  const cuenta = new Map<string, number>();
  if (filas.length > 0) {
    const puentes = await db
      .select({ seccionId: videosDeSeccion.seccionId })
      .from(videosDeSeccion)
      .where(
        inArray(
          videosDeSeccion.seccionId,
          filas.map((f) => f.id),
        ),
      );
    for (const p of puentes) {
      cuenta.set(p.seccionId, (cuenta.get(p.seccionId) ?? 0) + 1);
    }
  }

  const secciones: SeccionDelPanel[] = filas.map((f) => ({
    id: f.id,
    slug: f.slug,
    nombre: f.nombreEs,
    llaveSubida: f.llaveSubida,
    cuantosVideos: cuenta.get(f.id) ?? 0,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold tracking-tight">{t("titulo")}</h1>
      <PanelSecciones secciones={secciones} base={SITIO.url} />
    </div>
  );
}
