import { Clapperboard, Eye, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AccionesVideo } from "@/components/panel/videos/acciones-video";
import { AligerarVideo } from "@/components/panel/videos/aligerar-video";
import { ReproductorVideo } from "@/components/panel/videos/reproductor-video";
import { SubirVideo } from "@/components/panel/videos/subir-video";
import { Link } from "@/i18n/navigation";
import { obtenerAlcance } from "@/lib/autorizacion";
import { direccionImagen } from "@/lib/catalogo/consultas";
import { fechaCorta } from "@/lib/fechas";
import { RUTA_MEDIA } from "@/lib/rutas";
import { duracionCorta } from "@/lib/videos/reglas";
import { videosDelPanel } from "@/lib/videos/consultas";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("panel.videos");
  return { title: t("titulo") };
}

/**
 * MIS VIDEOS: subir uno nuevo arriba y la lista de los publicados debajo.
 *
 * La tienda sale del alcance de la sesión. Si la cuenta no tiene comercio —el
 * equipo mirando sin elegir tienda— se dice, en vez de enseñar un formulario
 * que va a fallar al enviar.
 */
export default async function PaginaVideosDelPanel({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("panel.videos");
  const alcance = await obtenerAlcance().catch(() => null);
  const tiendaId = alcance?.tipo === "tienda" ? alcance.tiendaId : null;
  const videos = tiendaId ? await videosDelPanel(tiendaId).catch(() => []) : [];

  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.08em] text-carga-600 uppercase">
          <Clapperboard className="h-4 w-4" aria-hidden />
          {t("etiqueta")}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {t("titulo")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tinta-suave">
          {t("entradilla")}
        </p>
      </header>

      {tiendaId ? (
        <section className="mt-6">
          <SubirVideo />
        </section>
      ) : (
        <p className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("sinTienda")}
        </p>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-bold">{t("misVideos")}</h2>
        {videos.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-borde px-6 py-12 text-center text-sm text-tinta-suave">
            {t("vacio")}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {videos.map((v) => {
              const portada = direccionImagen({
                url: null,
                clave: v.portadaClave,
              });
              return (
                <li
                  key={v.id}
                  className="flex items-start gap-4 rounded-xl border border-borde bg-white p-3"
                >
                  {/* Se toca la miniatura y el video se abre en grande, con
                      sonido y con los controles del navegador: es la única
                      forma de saber cuál es cuál entre videos parecidos. */}
                  <ReproductorVideo
                    url={`${RUTA_MEDIA}/${v.clave}`}
                    portadaUrl={portada}
                    titulo={v.tituloEs}
                    duracionSegundos={v.duracionSegundos}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-riel-900">{v.tituloEs}</p>
                    <p className="mt-0.5 text-sm text-tinta-suave">
                      {duracionCorta(v.duracionSegundos)} ·{" "}
                      {(v.pesoBytes / 1024 / 1024).toFixed(1)} MB ·{" "}
                      {v.creadoEn
                        ? fechaCorta(v.creadoEn.toISOString(), locale)
                        : ""}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                      <span className="inline-flex items-center gap-1 text-tinta-suave">
                        <Eye className="h-4 w-4" aria-hidden />
                        {t("vistas", { n: v.vistas })}
                      </span>
                      <Link
                        href={`/video/${v.slug}`}
                        className="inline-flex items-center gap-1 font-semibold text-carga-600 hover:underline"
                      >
                        {t("verPublicado")}
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                      {v.estado !== "publicado" ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                          {t(`estados.${v.estado}`)}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <AligerarVideo
                    videoId={v.id}
                    url={`${RUTA_MEDIA}/${v.clave}`}
                    pesoBytes={v.pesoBytes}
                    duracionSegundos={v.duracionSegundos}
                  />
                  <AccionesVideo
                    id={v.id}
                    titulo={v.tituloEs}
                    tituloEn={v.tituloEn}
                    descripcion={v.descripcionEs}
                    oculto={v.estado !== "publicado"}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
