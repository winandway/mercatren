import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ListaCarrito } from "@/components/carrito/lista-carrito";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "carrito" });
  return { title: t("titulo"), robots: { index: false, follow: false } };
}

export default async function PaginaCarrito({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("carrito");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{t("titulo")}</h1>
      <ListaCarrito />
    </div>
  );
}
