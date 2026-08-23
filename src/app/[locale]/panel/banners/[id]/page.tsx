import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { FormularioBanner } from "@/components/panel/banners/formulario-banner";
import { Link } from "@/i18n/navigation";
import { esSoporteDeVerdad, exigirEquipoInterno } from "@/lib/autorizacion";
import { obtenerBanner, tiendasParaBanner } from "@/lib/banners/consultas";
import { direccionImagen } from "@/lib/catalogo/consultas";
import { MERCADOS } from "@/lib/mercado/mercados";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("panel.banners.formulario");
  return { title: t("tituloEditar") };
}

function aFecha(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

export default async function PaginaEditarBanner({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await exigirEquipoInterno();
  if (!(await esSoporteDeVerdad())) notFound();
  const banner = await obtenerBanner(id);
  if (!banner) notFound();
  const t = await getTranslations("panel.banners.formulario");
  const tiendas = await tiendasParaBanner();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/panel/banners"
        className="text-sm font-medium text-tinta-suave hover:text-riel-900"
      >
        ← {t("volver")}
      </Link>
      <h1 className="mt-3 mb-6 text-2xl font-bold tracking-tight">
        {t("tituloEditar")}
      </h1>
      <FormularioBanner
        banner={{
          id: banner.id,
          tituloEs: banner.tituloEs,
          tituloEn: banner.tituloEn,
          textoEs: banner.textoEs,
          textoEn: banner.textoEn,
          botonEs: banner.botonEs,
          botonEn: banner.botonEn,
          imagenUrl: direccionImagen({ url: null, clave: banner.imagenClave }),
          enlace: banner.enlace,
          ubicacion: banner.ubicacion,
          tiendaId: banner.tiendaId,
          cadaCuantos: banner.cadaCuantos,
          orden: banner.orden,
          activo: banner.activo,
          desde: aFecha(banner.desde),
          hasta: aFecha(banner.hasta),
          mercado: banner.mercado,
        }}
        tiendas={tiendas}
        mercados={MERCADOS.map((m) => ({ codigo: m.codigo, nombre: m.nombre }))}
      />
    </div>
  );
}
