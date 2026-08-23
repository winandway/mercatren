import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { FormularioBanner } from "@/components/panel/banners/formulario-banner";
import { Link } from "@/i18n/navigation";
import { esSoporteDeVerdad, exigirEquipoInterno } from "@/lib/autorizacion";
import { tiendasParaBanner } from "@/lib/banners/consultas";
import { MERCADOS } from "@/lib/mercado/mercados";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("panel.banners.formulario");
  return { title: t("tituloNuevo") };
}

export default async function PaginaNuevoBanner({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await exigirEquipoInterno();
  if (!(await esSoporteDeVerdad())) notFound();
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
        {t("tituloNuevo")}
      </h1>
      <FormularioBanner
        banner={null}
        tiendas={tiendas}
        mercados={MERCADOS.map((m) => ({ codigo: m.codigo, nombre: m.nombre }))}
      />
    </div>
  );
}
