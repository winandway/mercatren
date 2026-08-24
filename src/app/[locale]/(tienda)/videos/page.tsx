import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { TarjetaVideo } from "@/components/videos/tarjeta-video";
import { mercadoDeLaPeticion } from "@/lib/mercado/repositorio";
import { nuevaSemilla } from "@/lib/catalogo/semilla";
import { rutaCanonica, SITIO } from "@/lib/sitio";
import { videosParaHileras } from "@/lib/videos/consultas";
import { personalizarVideos } from "@/lib/videos/personalizar";
import { resumenSocialDe } from "@/lib/videos/social";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "videos" });
  return {
    title: t("pagina.titulo"),
    description: t("pagina.entradilla"),
    alternates: rutaCanonica("/videos", locale),
    openGraph: {
      type: "website",
      title: `${t("pagina.titulo")} · ${SITIO.nombre}`,
      description: t("pagina.entradilla"),
      url: `${SITIO.url}/${locale}/videos`,
      siteName: SITIO.nombre,
    },
  };
}

/** Todos los Shorts, en parrilla. La puerta de «Ver todos» de las hileras. */
export default async function PaginaVideos({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("videos");
  const idioma = locale === "en" ? "en" : "es";
  const videosSinOrdenar = await videosParaHileras(
    await mercadoDeLaPeticion(),
    idioma,
    nuevaSemilla(),
    60,
  );
  const videos = await personalizarVideos(videosSinOrdenar);
  /* Los corazones de cada uno, en una sola consulta. Si falla, la parrilla se
     dibuja igual sin números. */
  const social = await resumenSocialDe(
    videos.map((v) => v.id),
    null,
  ).catch(() => new Map());

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-riel-900 sm:text-3xl">
        {t("pagina.titulo")}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tinta-suave">
        {t("pagina.entradilla")}
      </p>

      {videos.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-borde px-6 py-16 text-center text-sm text-tinta-suave">
          {t("pagina.vacio")}
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {videos.map((v) => (
            <li key={v.id} className="[&>a]:w-full">
              <TarjetaVideo
                video={v}
                corazones={social.get(v.id)?.corazones ?? 0}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
