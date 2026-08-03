import { getTranslations, setRequestLocale } from "next-intl/server";

import { FormularioEntrar } from "@/components/cuenta/formulario-entrar";

export const dynamic = "force-dynamic";

export default async function PaginaEntrar({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("entrar");

  return (
    <section className="mx-auto w-full max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
      <p className="mt-1 text-sm text-tinta-suave">{t("subtitulo")}</p>
      <FormularioEntrar />
    </section>
  );
}
