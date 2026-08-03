import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import { FormularioRegistro } from "@/components/cuenta/formulario-registro";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "entrar" });
  // Una pantalla de alta no aporta nada en un buscador.
  return {
    title: t("tituloRegistro"),
    robots: { index: false, follow: false },
  };
}

/** Alta de cuenta. Hace falta para comprar y para seguir un pedido. */
export default async function PaginaRegistro({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // La clave publica del escudo anti-robots. Si no esta cargada, el
  // componente no dibuja nada y la entrada funciona como siempre.
  const { env } = getCloudflareContext();
  const claveEscudo = env.TURNSTILE_CLAVE_SITIO;
  const t = await getTranslations("entrar");

  return (
    <section className="mx-auto w-full max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">
        {t("tituloRegistro")}
      </h1>
      <p className="mt-1 text-sm text-tinta-suave">{t("subtituloRegistro")}</p>
      <FormularioRegistro claveEscudo={claveEscudo} />
    </section>
  );
}
