import { ShoppingBag } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SeccionEnPreparacion } from "@/components/panel/seccion-en-preparacion";

export const dynamic = "force-dynamic";

export default async function Pagina({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("panel.menu");

  return <SeccionEnPreparacion titulo={t("ordenes")} Icono={ShoppingBag} />;
}
