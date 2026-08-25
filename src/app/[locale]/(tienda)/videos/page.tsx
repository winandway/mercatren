import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { TarjetaVideo } from "@/components/videos/tarjeta-video";
import { mercadoDeLaPeticion } from "@/lib/mercado/repositorio";
import { nuevaSemilla } from "@/lib/catalogo/semilla";
import { rutaCanonica, SITIO } from "@/lib/sitio";
import { videosParaHileras } from "@/lib/videos/consultas";
import { personalizarVideos } from "@/lib/videos/personalizar";
import { resumenSocialDe } from "@/lib/videos/social";
import { seccionesPublicadas } from "@/lib/secciones/consultas";
import { Link } from "@/i18n/navigation";

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

  /* Las secciones de Mercatren, arriba: son contenido nuestro y con nombre
     propio, no un video más de un comercio. Si no hay ninguna, no se dibuja
     nada — una fila de secciones vacía se lee como que algo se rompió. */
  const secciones = await seccionesPublicadas(
    await mercadoDeLaPeticion(),
    idioma,
  ).catch(() => []);

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-riel-900 sm:text-3xl">
        {t("pagina.titulo")}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tinta-suave">
        {t("pagina.entradilla")}
      </p>

      {secciones.length > 0 ? (
        <ul className="mt-6 flex flex-wrap gap-2">
          {secciones.map((sec) => (
            <li key={sec.id}>
              <Link
                href={`/seccion/${sec.slug}`}
                className="text-carga-700 inline-flex items-center gap-2 rounded-full border border-carga-500/30 bg-carga-500/5 px-4 py-2 text-sm font-bold hover:bg-carga-500/10"
              >
                {sec.nombre}
                <span className="text-xs font-semibold text-tinta-suave tabular-nums">
                  {sec.cuantosVideos}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

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
