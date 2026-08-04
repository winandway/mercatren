import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { PonerClaveNueva } from "@/components/cuenta/poner-clave-nueva";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "clave" });
  return { title: t("nuevaTitulo"), robots: { index: false, follow: false } };
}

/**
 * A donde lleva el enlace del correo: poner la contraseña nueva.
 *
 * El pase viene en la dirección, así que el formulario lee los parámetros de
 * búsqueda y por eso va dentro de un Suspense.
 */
export default async function PaginaNuevaClave({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("clave");

  return (
    <section className="mx-auto w-full max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">{t("nuevaTitulo")}</h1>
      <p className="mt-1 mb-6 text-sm text-tinta-suave">{t("nuevaTexto")}</p>
      <Suspense>
        <PonerClaveNueva />
      </Suspense>
    </section>
  );
}
