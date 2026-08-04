import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PedirEnlaceClave } from "@/components/cuenta/pedir-enlace-clave";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "clave" });
  // Una pantalla de cuenta no aporta nada en un buscador.
  return { title: t("titulo"), robots: { index: false, follow: false } };
}

/**
 * "Olvidé mi contraseña".
 *
 * Sin esta pantalla, quien perdía su clave se quedaba fuera para siempre y
 * tenía que llamar por teléfono. El correo que manda el enlace ya existía
 * desde el principio; lo que faltaba era el sitio donde pedirlo.
 */
export default async function PaginaOlvideMiClave({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("clave");

  return (
    <section className="mx-auto w-full max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
      <p className="mt-1 mb-6 text-sm text-tinta-suave">{t("texto")}</p>
      <PedirEnlaceClave />
    </section>
  );
}
