import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { PantallaPin } from "@/components/secciones/pantalla-pin";
import { SubidorMovil } from "@/components/secciones/subidor-movil";
import { getDb } from "@/lib/db";
import { seccionesVideo } from "@/lib/db/schema";
import { tienePase } from "@/lib/secciones/acciones";

export const dynamic = "force-dynamic";

/**
 * LA HERRAMIENTA QUE ES UN ENLACE (24 ago 2026).
 *
 * `/subir/<llave>` se abre en el celular y **es** la aplicación de subida de
 * una sección: sin cuenta, sin login, sin panel. Se manda por WhatsApp y
 * funciona.
 *
 * ══ LAS DOS CAPAS ══
 *
 * 1. **La llave** del enlace: 24 bytes al azar. Quien la tiene, llega.
 * 2. **El PIN de cuatro dígitos**, comprobado en el SERVIDOR y con límite de
 *    intentos. Se recuerda en ese teléfono treinta días, porque subir quince
 *    videos tecleando el PIN cada vez es un castigo, no una herramienta.
 *
 * ══ NUNCA SE INDEXA, Y NO ES UN DETALLE ══
 *
 * Si Google guardara una de estas direcciones, la llave dejaría de ser un
 * secreto para siempre.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function PaginaSubir({
  params,
}: {
  params: Promise<{ locale: string; llave: string }>;
}) {
  const { locale, llave } = await params;
  setRequestLocale(locale);

  const [seccion] = await getDb()
    .select({
      nombreEs: seccionesVideo.nombreEs,
      nombreEn: seccionesVideo.nombreEn,
      descripcionEs: seccionesVideo.descripcionEs,
      descripcionEn: seccionesVideo.descripcionEn,
      estado: seccionesVideo.estado,
    })
    .from(seccionesVideo)
    .where(eq(seccionesVideo.llaveSubida, llave))
    .limit(1);

  /* Una llave que no existe da 404, igual que cualquier dirección inventada:
     un «esa sección no existe» convertiría el enlace en un detector de llaves
     válidas. */
  if (!seccion) notFound();

  const idioma = locale === "en" ? "en" : "es";
  const nombre =
    (idioma === "en" ? seccion.nombreEn : null)?.trim() || seccion.nombreEs;
  const descripcion =
    ((idioma === "en" ? seccion.descripcionEn : null)?.trim() ||
      seccion.descripcionEs?.trim()) ??
    null;

  if (!(await tienePase(llave))) {
    return <PantallaPin llave={llave} nombre={nombre} />;
  }

  return (
    <SubidorMovil llave={llave} nombre={nombre} descripcion={descripcion} />
  );
}
